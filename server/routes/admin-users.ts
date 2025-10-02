// Utility: Remove orphaned UIDs from a team's members array
import { Request, Response } from "express";
export const cleanTeamMembers: RequestHandler = async (req: Request, res: Response) => {
  const check = requireAdminConfigured();
  if (!check.ok) return res.status(501).json({ error: check.message });
  const { db } = check;
  const { teamName } = req.body;
  if (!teamName) return res.status(400).json({ error: "teamName required" });
  const teamRef = db.collection("teams").doc(teamName);
  const teamSnap = await teamRef.get();
  if (!teamSnap.exists) return res.status(404).json({ error: "Team not found" });
  const teamData = teamSnap.data();
  let members: string[] = Array.isArray(teamData.members) ? teamData.members : [];
  // Fetch all users
  const usersSnap = await db.collection("users").get();
  const validUids = new Set();
  usersSnap.forEach(doc => {
    const data = doc.data();
    // Consider valid only if name and email are present and non-empty
    if (typeof data.name === "string" && data.name.trim() && typeof data.email === "string" && data.email.trim()) {
      validUids.add(doc.id);
    }
  });
  const cleanedMembers = members.filter(uid => validUids.has(uid));
  if (cleanedMembers.length !== members.length) {
    await teamRef.set({ members: cleanedMembers, updatedAt: Date.now() }, { merge: true });
    return res.json({ ok: true, removed: members.length - cleanedMembers.length, cleanedMembers });
  } else {
    return res.json({ ok: true, removed: 0, cleanedMembers });
  }
};
import { RequestHandler } from "express";
import { getAdminAuth, getAdminDb } from "../firebase-admin";
import admin from "firebase-admin";

// Middleware-like helper to check admin is configured
function requireAdminConfigured() {
  const auth = getAdminAuth();
  const db = getAdminDb();
  if (!auth || !db) return { ok: false as const, message: "Server missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT env with the service account JSON." };
  return { ok: true as const, auth, db };
}

export const registerMember: RequestHandler = async (req, res) => {
  const check = requireAdminConfigured();
  if (!check.ok) return res.status(501).json({ error: check.message });
  const { auth, db } = check;

  const { name, className, rollNo, teamName, position, role: reqRole, uniqueId, password, email, year, phone } = req.body as {
    name: string;
    className?: string;
    rollNo?: string;
    teamName?: string;
    position?: string; // free-form position label
    role?: "admin" | "leader" | "member"; // auth role
    uniqueId?: string;
    password?: string;
    email?: string;
    year?: string;
    phone?: string;
  };

  if (!name) return res.status(400).json({ error: "name is required" });

  const id = (uniqueId && String(uniqueId).trim()) || generateId();
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password is required and must be at least 6 characters." });
  }
  const pwd = String(password);
  // Use provided email for login if available, otherwise fallback to uniqueId-based email alias
  const loginEmail = email && email.trim().length > 0 ? email.trim() : `${id}@attendance.local`;

  // Determine admin eligibility
  let isCoreAdmin = false;
  if (
    teamName &&
    typeof teamName === "string" &&
    ["core team", "core", "coreteam"].includes(teamName.trim().toLowerCase()) &&
    position &&
    typeof position === "string" &&
    ["head", "executive"].includes(position.trim().toLowerCase())
  ) {
    isCoreAdmin = true;
  }
  // Final role to assign
  const finalRole = isCoreAdmin ? "admin" : (reqRole || "member");

  try {
    const userRecord = await auth.createUser({ email: loginEmail, password: pwd, displayName: name });
    if (finalRole === "admin") {
      await auth.setCustomUserClaims(userRecord.uid, { role: "admin" });
      // Mark claims update in Firestore for frontend polling
      await db.collection("users").doc(userRecord.uid).set({ claimsUpdatedAt: Date.now() }, { merge: true });
    }

    await db.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      name,
      className: className || null,
      rollNo: rollNo || null,
      teamName: teamName || null,
      role: finalRole,
      position: position || null,
      uniqueId: id,
      email: email || null,
      year: year || null,
      phone: phone || null,
      joinDate: Date.now(),
      createdAt: Date.now(),
    });

    if (teamName) {
      // Ensure team exists and add member UID if not present
      const teamRef = db.collection("teams").doc(teamName);
      const teamSnap = await teamRef.get();
      let members: string[] = [];
      if (teamSnap.exists) {
        const data = teamSnap.data();
        members = Array.isArray(data.members) ? data.members : [];
        if (!members.includes(userRecord.uid)) {
          members.push(userRecord.uid);
        }
      } else {
        members = [userRecord.uid];
      }
      await teamRef.set(
        {
          id: teamName,
          name: teamName,
          members,
          updatedAt: Date.now(),
          createdAt: teamSnap.exists ? teamSnap.data().createdAt : admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    res.json({ uid: userRecord.uid, uniqueId: id, password: pwd, message: "Member registered successfully" });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to register member" });
  }
};

export const updateUserRoleTeam: RequestHandler = async (req, res) => {
  const check = requireAdminConfigured();
  if (!check.ok) return res.status(501).json({ error: check.message });
  const { auth, db } = check;

  const { uid: bodyUid, email, role: reqRole, teamName, uniqueId, newPassword, position } = req.body as { uid?: string; email?: string; role?: string; teamName?: string; uniqueId?: string; newPassword?: string; position?: string };
  try {
    let uid = bodyUid;
    if (!uid && email) {
      const user = await auth.getUserByEmail(email);
      uid = user.uid;
    }
    if (!uid) return res.status(400).json({ error: "uid or email required" });

    // fetch current profile for team move
    const userRef = db.collection("users").doc(uid);
    const snap = await userRef.get();
    const current = snap.exists ? snap.data() as any : {};

    const updates: Record<string, any> = {};
    if (typeof teamName !== "undefined") updates.teamName = teamName;
    if (typeof uniqueId !== "undefined") updates.uniqueId = uniqueId;
    if (typeof position !== "undefined") updates.position = position;
    // Determine admin eligibility
    let isCoreAdmin = false;
    if (
      teamName &&
      typeof teamName === "string" &&
      ["core team", "core", "coreteam"].includes(teamName.trim().toLowerCase()) &&
      position &&
      typeof position === "string" &&
      ["head", "executive"].includes(position.trim().toLowerCase())
    ) {
      isCoreAdmin = true;
    }
    // Final role to assign
    const finalRole = isCoreAdmin ? "admin" : (reqRole || current.role || "member");
    updates.role = finalRole;
    if (Object.keys(updates).length) await userRef.set(updates, { merge: true });

    // Set custom claims if role changed or admin eligibility changed
    if (finalRole === "admin") {
      await auth.setCustomUserClaims(uid, { role: "admin" });
      await userRef.set({ claimsUpdatedAt: Date.now() }, { merge: true });
    } else {
      await auth.setCustomUserClaims(uid, { role: null });
      await userRef.set({ claimsUpdatedAt: Date.now() }, { merge: true });
    }

    if (newPassword && newPassword.length >= 6) {
      await auth.updateUser(uid, { password: newPassword });
    }

    // handle team membership move
    if (typeof teamName !== "undefined") {
      // Remove from old team (if changed)
      const removeFrom = current?.teamName;
      if (removeFrom && removeFrom !== teamName) {
        // Sync old team members array (UIDs only)
        const oldMembersSnap = await db.collection("users").where("teamName", "==", removeFrom).get();
        const oldMemberUids = oldMembersSnap.docs.map(doc => doc.data().uid).filter(Boolean);
        await db.collection("teams").doc(removeFrom).set({
          id: removeFrom,
          name: removeFrom,
          members: oldMemberUids,
          updatedAt: Date.now(),
        }, { merge: true });
      }
      // Sync new team members array (UIDs only)
      if (teamName) {
        const newMembersSnap = await db.collection("users").where("teamName", "==", teamName).get();
        const newMemberUids = newMembersSnap.docs.map(doc => doc.data().uid).filter(Boolean);
        await db.collection("teams").doc(teamName).set({
          id: teamName,
          name: teamName,
          members: newMemberUids,
          updatedAt: Date.now(),
        }, { merge: true });
      }
    }

    res.json({ ok: true, uid });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to update" });
  }
};

function generateId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/1/I
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `PA-${out}`;
}

function generatePassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@$%&*";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
