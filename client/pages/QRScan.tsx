import { useState } from "react";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCallback } from "react";
import { doc, getDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/services/firebase";
import { collection, addDoc } from "firebase/firestore";
import QRCodeScanner from "@/components/QRCodeScanner";
import { Button } from "@/components/ui/button";

export default function QRScan() {
  const [result, setResult] = useState<string | null>(null);
  const [showAttendeeForm, setShowAttendeeForm] = useState(false);
  // Show attendee form automatically if guest QR scanned
  // Only validate QR code at scan/submit, not after form is open
  useEffect(() => {
    if (result && result.startsWith("guest")) {
      // Validate QR timestamp only once
      const parts = result.split("|");
      const qrMinute = parseInt(parts[2], 10);
      const nowMinute = Math.floor(Date.now() / 60000);
      if (qrMinute !== nowMinute) {
        setMessage("QR code expired. Please scan or paste the latest QR.");
        setResult(null);
        setShowAttendeeForm(false);
        return;
      }
      // Mark that QR was validated, so form can be filled at any pace
      setShowAttendeeForm(true);
    }
    // eslint-disable-next-line
  }, [result]);
  const [attendeeForm, setAttendeeForm] = useState({ name: "", class: "", year: "", rollNo: "", email: "" });
  const { user } = useAuth();
  const [message, setMessage] = useState<string>("");

  // Handle team QR scan logic in effect
  // Optionally, trigger a refresh callback after marking attendance
  const refreshTeams = (window as any).refreshTeams as (() => void) | undefined;

  useEffect(() => {
    async function markTeamAttendance() {
      if (!result) return;
      const parts = result.split("|");
      if (parts[0] === "team") {
        // Validate QR timestamp
        const qrMinute = parseInt(parts[2], 10);
        const nowMinute = Math.floor(Date.now() / 60000);
        // Accept QR if within ±1 minute window
        if (Math.abs(qrMinute - nowMinute) > 1) {
          setMessage("QR code expired. Please scan the latest QR.");
          setResult(null);
          return;
        }
        // Capture entry time at scan/submit
        const entryDate = new Date();
        const entryDateStr = entryDate.toISOString().slice(0, 10);
        const entryTimeStr = entryDate.toLocaleTimeString();
        if (user && user.role !== "guest") {
          // Fetch extra profile info for class and rollNo
          let className = "";
          let rollNo = "";
          let name = user.email;
          let uniqueId = user.uniqueId || "";
          let teamName = "";
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              className = data.className || data.class || "";
              rollNo = data.rollNo || data.roll || "";
              name = data.displayName || data.name || user.email;
              uniqueId = data.uniqueId || uniqueId;
              teamName = data.teamName || data.team || "";
            }
          } catch {}
          // Prevent duplicate attendance for same event and uniqueId
          const teamAttendanceRef = collection(db, "team_attendance");
          const q = query(teamAttendanceRef, 
            where("eventId", "==", String(parts[1])),
            where("uniqueId", "==", uniqueId)
          );
          const existing = await getDocs(q);
          if (!existing.empty) {
            setMessage("You have already marked attendance for this event.");
            setResult(null);
            return;
          }
          await addDoc(teamAttendanceRef, {
            eventId: String(parts[1]),
            uniqueId,
            name,
            class: className,
            rollNo,
            teamName,
            entryDate: entryDateStr,
            entryTime: entryTimeStr,
          });
          setMessage("Attendance marked for team member!");
          setResult(null);
          // Trigger team/member data refresh if available
          if (typeof refreshTeams === "function") {
            refreshTeams();
          }
        } else {
          setMessage("Please login as a team member to mark attendance.");
        }
      }
    }
    markTeamAttendance();
    // eslint-disable-next-line
  }, [result, user]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <section>
        <h2 className="text-2xl font-extrabold tracking-tight">QR Scanner</h2>
        <p className="text-sm text-muted-foreground mt-1">High-contrast live preview. Manual entry supported.</p>
        <div className="mt-4 card-glass p-4">
          <QRCodeScanner onResult={(v) => setResult(v)} />
  {/* Show attendee form after guest QR scan or submit */}
        {showAttendeeForm && (
          <>
            <h3 className="text-lg font-semibold">Attendee Details</h3>
            <form className="mt-4 space-y-3" onSubmit={async e => {
              e.preventDefault();
              // Do NOT re-validate QR timestamp here; allow check-in at any time after initial scan
              const parts = result?.split("|") ?? [];
              if (parts[0] === "guest") {
                await addDoc(collection(db, "members"), {
                  eventId: parts[1],
                  name: attendeeForm.name,
                  class: attendeeForm.class,
                  year: attendeeForm.year,
                  rollNo: attendeeForm.rollNo,
                  email: attendeeForm.email,
                  entryDate: new Date().toISOString().slice(0, 10),
                  entryTime: new Date().toLocaleTimeString(),
                });
                setMessage("Attendance marked for attendee!");
                setShowAttendeeForm(false);
                setAttendeeForm({ name: "", class: "", year: "", rollNo: "", email: "" });
                setResult(null);
              }
            }}>
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <input className="mt-1 w-full rounded-xl border bg-background/80 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" value={attendeeForm.name} onChange={e => setAttendeeForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="text-sm font-medium">Class</label>
                <input className="mt-1 w-full rounded-xl border bg-background/80 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" value={attendeeForm.class} onChange={e => setAttendeeForm(f => ({ ...f, class: e.target.value }))} required />
              </div>
              <div>
                <label className="text-sm font-medium">Year</label>
                <input className="mt-1 w-full rounded-xl border bg-background/80 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" value={attendeeForm.year} onChange={e => setAttendeeForm(f => ({ ...f, year: e.target.value }))} required />
              </div>
              <div>
                <label className="text-sm font-medium">Roll No.</label>
                <input className="mt-1 w-full rounded-xl border bg-background/80 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" value={attendeeForm.rollNo} onChange={e => setAttendeeForm(f => ({ ...f, rollNo: e.target.value }))} required />
              </div>
              <div>
                <label className="text-sm font-medium">Email ID</label>
                <input className="mt-1 w-full rounded-xl border bg-background/80 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" value={attendeeForm.email} onChange={e => setAttendeeForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="pt-2 flex gap-2">
                <Button type="submit" className="rounded-xl">Check-In</Button>
                <Button type="button" variant="secondary" className="rounded-xl" onClick={() => {
                  setShowAttendeeForm(false);
                  setAttendeeForm({ name: "", class: "", year: "", rollNo: "", email: "" });
                  setResult(null);
                }}>Reset</Button>
              </div>
            </form>
          </>
        )}
        </div>
      </section>
      <section className="card-glass p-6">
        {/* Only show attendee form for guest QR */}
        {/* Show attendee form only after guest QR submit */}
        {message && <div className="mt-4 text-green-600 font-semibold">{message}</div>}
      </section>
    </div>
  );
}
