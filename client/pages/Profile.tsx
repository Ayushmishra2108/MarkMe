

  // (Removed duplicate function definitions)

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { auth, db } from "@/services/firebase";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";



export default function Profile() {
  const { user } = useAuth();


  // All hooks must be called unconditionally, before any return
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);


  useEffect(() => {
    if (!user) {
      setEvents([]);
      setAttendance([]);
      return;
    }
    async function fetchEventsAndAttendance() {
      try {
        const eventsSnap = await getDocs(collection(db, "events"));
        setEvents(eventsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        let userAttendance: any[] = [];
        // Defensive: Only query if uniqueId or email exists
        if (user.uniqueId || user.email) {
          // Team attendance
          if (user.uniqueId) {
            const teamSnap = await getDocs(query(collection(db, "team_attendance"), where("uniqueId", "==", user.uniqueId)));
            userAttendance = userAttendance.concat(teamSnap.docs.map(d => ({ ...d.data(), type: "team" })));
          }
          // Guest attendance
          if (user.email) {
            const guestSnap = await getDocs(query(collection(db, "members"), where("email", "==", user.email)));
            userAttendance = userAttendance.concat(guestSnap.docs.map(d => ({ ...d.data(), type: "guest" })));
          }
        }
        setAttendance(userAttendance);
      } catch (err) {
        setAttendance([]);
        // Optionally, set an error state here if you want to show a message
      }
    }
    fetchEventsAndAttendance();
  }, [user]);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      setLoading(true);
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      setProfile(snap.exists() ? snap.data() : null);
      setLoading(false);
    }
    fetchProfile();
  }, [user]);



  // Functions must be declared after hooks
  function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (next !== confirm) { setMsg("Passwords do not match"); return; }
    setShowConfirm(true);
  }

  async function doChangePassword() {
    setMsg(null);
    try {
      const email = user.email || `${user.uniqueId}@attendance.local`;
      const cred = EmailAuthProvider.credential(email!, current);
      await reauthenticateWithCredential(auth.currentUser!, cred);
      await updatePassword(auth.currentUser!, next);
      setMsg("Password updated");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (e: any) {
      setMsg(e?.message || "Failed to update password");
    }
    setShowConfirm(false);
  }


  if (!user) return <div className="card-glass p-6">Please sign in.</div>;

  return (
    <div className="mx-auto max-w-md">
      <div className="card-glass p-6 mb-6 eventcard-animated-border">
        <h2 className="text-3xl font-extrabold text-gradient mb-1 animate-gradient-x bg-gradient-to-r from-blue-500 via-cyan-500 to-fuchsia-500 bg-clip-text text-transparent drop-shadow text-center">Profile</h2>
        <div className="flex flex-col items-center mb-6 mt-2">
          {/* Profile Image or Initials */}
          {profile?.photoURL ? (
            <img
              src={profile.photoURL}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg mb-2"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-app-gradient flex items-center justify-center text-4xl font-bold text-white shadow-lg mb-2">
              {((profile?.name || profile?.displayName || user.email || "?").split(" ").map(n => n[0]).join("") || "?").slice(0,2)}
            </div>
          )}
          <div className="text-xl font-semibold text-zinc-900 dark:text-white mt-1">
            {profile?.name || profile?.displayName || user.email || "Unnamed"}
          </div>
        </div>
        {loading ? (
          <div className="text-muted-foreground">Loading profile...</div>
        ) : profile ? (
          <div className="mb-4 space-y-1">
            {[
              { label: "Email ID", key: "email" },
              { label: "Phone No.", key: "phone" },
              { label: "Class", key: "class" },
              { label: "Roll No.", key: "rollNo" },
              { label: "Year", key: "year" },
              { label: "Team", key: "teamName" },
              { label: "Position", key: "position" },
              { label: "Unique Id", key: "uniqueId" },
            ].map(({ label, key }) => (
              profile[key] ? (
                <div key={key} className="flex justify-between text-sm">
                  <span className="font-medium">{label}</span>
                  <span className="text-right break-all">{String(profile[key])}</span>
                </div>
              ) : null
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground mb-4">No profile details found.</div>
        )}
      </div>
      {/* Attendance Section: Only show if not admin */}
      {user?.role !== "admin" && (
        <div className="card-glass p-6 mb-6 eventcard-animated-border">
          <h3 className="text-2xl font-extrabold text-gradient mb-4 animate-gradient-x bg-gradient-to-r from-blue-500 via-cyan-500 to-fuchsia-500 bg-clip-text text-transparent drop-shadow text-center">Your Attendance</h3>
          {events.length === 0 ? (
            <div className="text-muted-foreground text-center">No events found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm rounded-xl overflow-hidden shadow-md">
                <thead>
                  <tr className="bg-app-gradient text-white">
                    <th className="px-4 py-2 border-b font-semibold">Event</th>
                    <th className="px-4 py-2 border-b font-semibold">Status</th>
                    <th className="px-4 py-2 border-b font-semibold">Entry Time</th>
                    <th className="px-4 py-2 border-b font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(ev => {
                    const att = attendance.find(a => a.eventId === ev.id);
                    return (
                      <tr key={ev.id} className="even:bg-white/60 dark:even:bg-zinc-900/40">
                        <td className="px-4 py-2 border-b">{ev.title}</td>
                        <td className="px-4 py-2 border-b font-semibold">
                          {att ? <span className="text-green-700">Present</span> : <span className="text-red-600">Absent</span>}
                        </td>
                        <td className="px-4 py-2 border-b">{att ? (att.entryTime || att.entryDate || "-") : "-"}</td>
                        <td className="px-4 py-2 border-b">{att ? (att.entryDate || "-") : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      <div className="card-glass p-6 eventcard-animated-border">
        <h3 className="text-2xl font-extrabold text-gradient mb-4 animate-gradient-x bg-gradient-to-r from-blue-500 via-cyan-500 to-fuchsia-500 bg-clip-text text-transparent drop-shadow text-center">Change Password</h3>
        <form onSubmit={changePassword} className="space-y-5">
          <div>
            <label className="text-sm font-medium">Current Password</label>
            <div className="relative mt-1">
              <input
                type={showCurrent ? "text" : "password"}
                className="w-full rounded-xl border bg-background/80 px-4 py-3 pr-10 text-base shadow focus:ring-2 focus:ring-brand-start"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                tabIndex={-1}
                onClick={() => setShowCurrent((v) => !v)}
              >
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">New Password</label>
            <div className="relative mt-1">
              <input
                type={showNext ? "text" : "password"}
                className="w-full rounded-xl border bg-background/80 px-4 py-3 pr-10 text-base shadow focus:ring-2 focus:ring-brand-start"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                tabIndex={-1}
                onClick={() => setShowNext((v) => !v)}
              >
                {showNext ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Confirm New Password</label>
            <div className="relative mt-1">
              <input
                type={showConfirmPw ? "text" : "password"}
                className="w-full rounded-xl border bg-background/80 px-4 py-3 pr-10 text-base shadow focus:ring-2 focus:ring-brand-start"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                tabIndex={-1}
                onClick={() => setShowConfirmPw((v) => !v)}
              >
                {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {msg && <p className="text-sm text-foreground/70">{msg}</p>}
          <Button type="submit" className="w-full mt-2 btn-gradient text-white shadow-lg hover:scale-[1.02] transition-transform">Change Password</Button>
        </form>
      </div>
      </div>
  );
}
