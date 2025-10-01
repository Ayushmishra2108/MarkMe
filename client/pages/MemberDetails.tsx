import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, collection, getDocs, query, onSnapshot } from "firebase/firestore";
import { deleteDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export default function MemberDetails() {
  const { user } = useAuth();
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [member, setMember] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    async function fetchMember() {
      setLoading(true);
      try {
        // Find the team(s) that include this memberId
        const teamsSnap = await getDocs(query(collection(db, "teams")));
        let foundTeamName = null;
        teamsSnap.docs.forEach((teamDoc) => {
          const team = teamDoc.data();
          if (team.members && team.members.includes(memberId)) {
            foundTeamName = team.name;
          }
        });
        // Fetch member details from users collection
        const ref2 = doc(db, "users", memberId!);
        const snap2 = await getDoc(ref2);
        if (snap2.exists()) {
          setMember({ ...snap2.data(), teamName: foundTeamName });
          setForm({ ...snap2.data(), teamName: foundTeamName });
        } else {
          setError("Member not found.");
        }
      } catch (e) {
        setError("Failed to load member details.");
      } finally {
        setLoading(false);
      }
    }
    fetchMember();
  }, [memberId]);

  async function handleUpdate() {
    if (!memberId) return;
    setLoading(true);
    try {
      // Try updating 'users' collection first
      const ref = doc(db, "users", memberId!);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, form);
        setEditMode(false);
        // Listen for real-time updates after edit
        const unsubscribe = onSnapshot(ref, (docSnap) => {
          if (docSnap.exists()) {
            setMember(docSnap.data());
            setForm(docSnap.data());
          }
        });
        setTimeout(() => unsubscribe(), 3000); // Unsubscribe after 3s
        setLoading(false);
        return;
      }
      // Fallback: update member inside team document
      const teamsSnap = await getDocs(query(collection(db, "teams")));
      let updated = false;
      for (const teamDoc of teamsSnap.docs) {
        const team = teamDoc.data();
        if (team.members) {
          const idx = team.members.findIndex((mem: any) => mem.uid === memberId);
          if (idx !== -1) {
            team.members[idx] = { ...team.members[idx], ...form };
            await updateDoc(teamDoc.ref, { members: team.members });
            setEditMode(false);
            // Listen for real-time updates after edit
            const unsubscribe = onSnapshot(teamDoc.ref, (docSnap) => {
              const updatedTeam = docSnap.data();
              if (updatedTeam && updatedTeam.members) {
                const updatedMember = updatedTeam.members.find((mem: any) => mem.uid === memberId);
                if (updatedMember) {
                  setMember(updatedMember);
                  setForm(updatedMember);
                }
              }
            });
            setTimeout(() => unsubscribe(), 3000); // Unsubscribe after 3s
            updated = true;
            setLoading(false);
            break;
          }
        }
      }
      if (!updated) setError("Failed to update member details.");
    } catch (e) {
      setError("Failed to update member details.");
    } finally {
      setLoading(false);
    }
  }

  async function removeMember() {
    if (!memberId) return;
    setLoading(true);
    try {
  // Remove from 'users' collection
  const ref = doc(db, "users", memberId!);
  await deleteDoc(ref);

      // Remove from team document
      const teamsSnap = await getDocs(query(collection(db, "teams")));
      for (const teamDoc of teamsSnap.docs) {
        const team = teamDoc.data();
        if (team.members) {
          const idx = team.members.findIndex((mem: any) => mem.uid === memberId);
          if (idx !== -1) {
            team.members.splice(idx, 1);
            await updateDoc(teamDoc.ref, { members: team.members });
            break;
          }
        }
      }
      setMember(null);
      setForm({});
      setLoading(false);
      navigate(-1); // Go back after removal
    } catch (e) {
      setError("Failed to remove member.");
      setLoading(false);
    }
  }

  // Compute access based on team and position
  let access = "";
  if (member) {
    if (member.teamName === "Core team" && (member.position === "head" || member.position === "executive" || member.position === "Head" || member.position === "Executive")) {
      access = "Admin";
    } else if (member.position === "Lead" || member.position === "lead") {
      access = "Lead";
    } else if (member.position === "Co-Lead" || member.position === "colead" || member.position === "Co-lead") {
      access = "Co-Lead";
    } else if (member.position === "Member" || member.position === "member") {
      access = "Member";
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-destructive">{error}</div>;
  if (!member) return null;

  return (
    <div className="max-w-xl mx-auto mt-10 card-glass p-8 eventcard-animated-border shadow-lg">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-extrabold text-gradient mb-1 animate-gradient-x bg-gradient-to-r from-blue-500 via-cyan-500 to-fuchsia-500 bg-clip-text text-transparent drop-shadow">Member Details</h2>
        <p className="text-base text-muted-foreground mb-6">View and update member information</p>
        <div className="flex flex-col items-center mb-4">
          {/* Profile Image or Initials */}
          {member.photoURL ? (
            <img
              src={member.photoURL}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg mb-2"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-app-gradient flex items-center justify-center text-4xl font-bold text-white shadow-lg mb-2">
              {((member.name || member.displayName || "?").split(" ").map(n => n[0]).join("") || "?").slice(0,2)}
            </div>
          )}
          <div className="text-xl font-semibold text-zinc-900 dark:text-white mt-1">
            {member.name || member.displayName || "Unnamed"}
          </div>
        </div>
      </div>
      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full flex flex-col items-center">
            <h3 className="text-xl font-bold mb-4">Are you sure?</h3>
            <p className="mb-6 text-center">Do you really want to remove this member? This action cannot be undone.</p>
            <div className="flex gap-4">
              <Button variant="destructive" onClick={async () => { setShowConfirm(false); await removeMember(); }}>Yes, Remove</Button>
              <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
      {!editMode ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <span className="font-medium text-zinc-600 dark:text-zinc-200">Name</span>
            <span className="text-right font-semibold text-lg text-zinc-900 dark:text-white">{member.name || member.displayName || ""}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <span className="font-medium text-zinc-600 dark:text-zinc-200">Email</span>
            <span className="text-right break-all">{member.email || ""}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <span className="font-medium text-zinc-600 dark:text-zinc-200">Phone No.</span>
            <span className="text-right">{member.phone || member.phoneNumber || ""}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <span className="font-medium text-zinc-600 dark:text-zinc-200">Class</span>
            <span className="text-right">{member.className || member.class || ""}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <span className="font-medium text-zinc-600 dark:text-zinc-200">Roll No.</span>
            <span className="text-right">{member.rollNo || member.roll || ""}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <span className="font-medium text-zinc-600 dark:text-zinc-200">Year</span>
            <span className="text-right">{member.year || ""}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <span className="font-medium text-zinc-600 dark:text-zinc-200">Team Name</span>
            <span className="text-right">{member.teamName || ""}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <span className="font-medium text-zinc-600 dark:text-zinc-200">Position</span>
            <span className="text-right">{member.position || member.role || ""}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <span className="font-medium text-zinc-600 dark:text-zinc-200">Unique ID</span>
            <span className="text-right">{member.uniqueId || ""}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <span className="font-medium text-zinc-600 dark:text-zinc-200">Access Provided</span>
            <span className="text-right">{access}</span>
          </div>
          {user?.role === "admin" && (
            <div className="flex gap-2 mt-6">
              <Button onClick={() => setEditMode(true)}>Update Details</Button>
              <Button variant="destructive" onClick={() => setShowConfirm(true)}>Remove Member</Button>
            </div>
          )}
        </div>
      ) : (
        <form className="space-y-4" onSubmit={e => {e.preventDefault();handleUpdate();}}>
          <div className="flex flex-col"><label className="font-semibold mb-1">Name</label><input className="input border border-black rounded px-4 py-3 text-base" value={form.displayName || form.name || ""} onChange={e => setForm((f: any) => ({ ...f, displayName: e.target.value, name: e.target.value }))} placeholder="Full Name" /></div>
          <div className="flex flex-col"><label className="font-semibold mb-1">Email</label><input className="input border border-black rounded px-4 py-3 text-base" value={form.email || ""} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} placeholder="Email" /></div>
          <div className="flex flex-col"><label className="font-semibold mb-1">Phone No.</label><input className="input border border-black rounded px-4 py-3 text-base" value={form.phone || form.phoneNumber || ""} onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value, phoneNumber: e.target.value }))} placeholder="Phone No." /></div>
          <div className="flex flex-col"><label className="font-semibold mb-1">Class</label><input className="input border border-black rounded px-4 py-3 text-base" value={form.class || form.className || ""} onChange={e => setForm((f: any) => ({ ...f, class: e.target.value, className: e.target.value }))} placeholder="Class" /></div>
          <div className="flex flex-col"><label className="font-semibold mb-1">Roll No.</label><input className="input border border-black rounded px-4 py-3 text-base" value={form.rollNo || form.roll || ""} onChange={e => setForm((f: any) => ({ ...f, rollNo: e.target.value, roll: e.target.value }))} placeholder="Roll No." /></div>
          <div className="flex flex-col"><label className="font-semibold mb-1">Year</label><input className="input border border-black rounded px-4 py-3 text-base" value={form.year || ""} onChange={e => setForm((f: any) => ({ ...f, year: e.target.value }))} placeholder="Year" /></div>
          <div className="flex flex-col"><label className="font-semibold mb-1">Team Name</label>
            <select className="input border border-black rounded px-4 py-3 text-base" value={form.teamName || ""} onChange={e => setForm((f: any) => ({ ...f, teamName: e.target.value }))}>
              <option value="" disabled>Select team</option>
              <option value="Core team">Core team</option>
              <option value="Event management team">Event management team</option>
              <option value="Logistics team">Logistics team</option>
              <option value="Photography team">Photography team</option>
              <option value="Videography team">Videography team</option>
              <option value="Design team">Design team</option>
              <option value="Content team">Content team</option>
              <option value="PR and Marketing team">PR and Marketing team</option>
              <option value="Social media team">Social media team</option>
              <option value="Anchors">Anchors</option>
              <option value="Tech Team">Tech Team</option>
            </select>
          </div>
          <div className="flex flex-col"><label className="font-semibold mb-1">Position</label>
            <select className="input border border-black rounded px-4 py-3 text-base" value={form.position || form.role || ""} onChange={e => setForm((f: any) => ({ ...f, position: e.target.value, role: e.target.value }))}>
              <option value="" disabled>Select position</option>
              {form.teamName === "Core team" && <>
                <option value="Head">Head</option>
                <option value="Executive">Executive</option>
                <option value="Cheif marketing officer">Cheif marketing officer</option>
              </>}
              {form.teamName === "Tech Team" && <>
                <option value="Tech-Executive">Tech-Executive</option>
                <option value="Tech-Lead">Tech-Lead</option>
                <option value="Tech-colead">Tech-colead</option>
                <option value="Tech-Member">Tech-Member</option>
              </>}
              {form.teamName && form.teamName !== "Core team" && form.teamName !== "Tech Team" && <>
                <option value="Lead">Lead</option>
                <option value="Co-Lead">Co-Lead</option>
                <option value="Member">Member</option>
              </>}
            </select>
          </div>
          <div className="flex flex-col"><label className="font-semibold mb-1">Custom Unique ID</label><input className="input border border-black rounded px-4 py-3 text-base" value={form.uniqueId || ""} onChange={e => setForm((f: any) => ({ ...f, uniqueId: e.target.value }))} placeholder="Custom Unique ID" /></div>
          <div className="flex flex-col"><label className="font-semibold mb-1">Access Provided</label>
            <select className="input border border-black rounded px-4 py-3 text-base" value={form.access || form.role || ""} onChange={e => setForm((f: any) => ({ ...f, access: e.target.value, role: e.target.value }))}>
              <option value="" disabled>Select access</option>
              <option value="Admin">Admin</option>
              <option value="Lead">Lead</option>
              <option value="Co-Lead">Co-Lead</option>
              <option value="Member">Member</option>
            </select>
          </div>
          <div className="flex gap-2 mt-6">
            <Button type="submit">Save</Button>
            <Button type="button" variant="secondary" onClick={() => setEditMode(false)}>Cancel</Button>
          </div>
        </form>
      )}
    </div>

  );
}
