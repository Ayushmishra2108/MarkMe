import { RequestHandler } from "express";
const { getAdminAuth, getAdminDb } = require("../firebase-admin");

export const seedFirstAdmin: RequestHandler = async (req, res) => {
  const auth = getAdminAuth();
  const db = getAdminDb();
  if (!auth || !db) return res.status(501).json({ error: "Server missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT env." });

  const { email, password, name } = req.body as { email: string; password: string; name?: string };
  if (!email || !password) return res.status(400).json({ error: "email and password are required" });

  try {
    // Allow only if there is no admin in Firestore users collection
    const snap = await db.collection("users").where("role", "==", "admin").limit(1).get();
    if (!snap.empty) return res.status(409).json({ error: "Admin already exists" });

    const userRecord = await auth.createUser({ email, password, displayName: name || email.split("@")[0] });
    await auth.setCustomUserClaims(userRecord.uid, { role: "admin" });
    await db.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      name: name || email.split("@")[0],
      role: "admin",
      uniqueId: null,
      teamName: null,
      createdAt: Date.now(),
      email,
    });
    res.json({ ok: true, uid: userRecord.uid });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to seed admin" });
  }
};
