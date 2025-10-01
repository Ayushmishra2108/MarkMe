import { QRCodeCanvas } from "qrcode.react";
// Helper to format time as h:mm AM/PM
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { db } from "@/services/firebase";
import { doc, getDoc, collection, getDocs, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Helper to format time as h:mm AM/PM
function formatTime(time: string | undefined): string {
  if (!time) return "";
  // Accepts HH:mm or HH:mm:ss
  const [h, m] = time.split(":");
  let hour = parseInt(h, 10);
  const minute = m || "00";
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${ampm}`;
}

import "@/components/eventcard-animated-border.css";
export default function EventDetails() {
  const { user } = useAuth();
  // Helper: get event status label (same as dashboard)
  function getStatusLabel(event: any): string {
    if (!event) return "";
    const now = new Date();
    // Pad times to HH:mm:ss for local comparison
    function padTime(t: string) {
      if (!t) return "00:00:00";
      if (/^\d{2}:\d{2}$/.test(t)) return t + ":00";
      if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
      return "00:00:00";
    }
    // Build local date-times using year, month, day, hour, minute
    function getLocalDate(dateStr: string, timeStr: string, fallback: string) {
      // Accepts 'YYYY-MM-DD' and 'HH:mm' (24hr) or 'HH:mm AM/PM'
      if (!dateStr) return null;
      const [year, month, day] = dateStr.split("-").map(Number);
      let hour = 0, minute = 0;
      let time = timeStr || fallback;
      const ampmMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (ampmMatch) {
        hour = parseInt(ampmMatch[1], 10);
        minute = parseInt(ampmMatch[2], 10);
        const ampm = ampmMatch[3]?.toUpperCase();
        if (ampm === "PM" && hour < 12) hour += 12;
        if (ampm === "AM" && hour === 12) hour = 0;
      }
      return new Date(year, month - 1, day, hour, minute, 0);
    }
    const start = getLocalDate(event.date, event.startTime, "00:00");
    const end = getLocalDate(event.date, event.endTime, "23:59");
    if (!start || !end) return "Upcoming";
    // Debug info (remove after fix)
    // console.log({now, start, end});
    if (now < start) return "Upcoming";
    if (now >= start && now <= end) return "Live";
    if (now > end) return "Expired";
    return "Upcoming";
  }

  // ...existing code...

  // Helper to count team members present
  function getTeamMembersPresent(attendees: any[]): number {
    // If attendee has teamName or team field, count unique team members
    const teamMembers = attendees.filter(a => a.teamName || a.team).map(a => a.uniqueId || a.email);
    return new Set(teamMembers).size;
  }
      // Fetch teams and members logic (normalized structure)

      interface TeamDocNormalized {
        id: string;
        name: string;
        members: string[]; // Array of member UIDs
      }

      interface MemberDoc {
        id: string;
        name: string;
        email: string;
        // Add other member fields as needed
      }

      const [teams, setTeams] = useState<TeamDocNormalized[]>([]);
      const [membersMap, setMembersMap] = useState<Record<string, MemberDoc>>({});

      useEffect(() => {
        // Listen to teams collection
        const unsubTeams = onSnapshot(collection(db, "teams"), async (snapshot) => {
          const teamDocs: TeamDocNormalized[] = [];
          const memberUIDs = new Set<string>();
          snapshot.forEach((doc) => {
            const data = doc.data();
            teamDocs.push({
              id: doc.id,
              name: data.name,
              members: data.members || [],
            });
            (data.members || []).forEach((uid: string) => memberUIDs.add(uid));
          });
          setTeams(teamDocs);

          // Fetch all member docs for UIDs
          if (memberUIDs.size > 0) {
            const memberPromises = Array.from(memberUIDs).map(async (uid) => {
              const memberSnap = await getDoc(doc(db, "members", uid));
              if (memberSnap.exists()) {
                return { id: uid, ...memberSnap.data() } as MemberDoc;
              }
              return null;
            });
            const memberDocs = await Promise.all(memberPromises);
            const map: Record<string, MemberDoc> = {};
            memberDocs.forEach((m) => {
              if (m) map[m.id] = m;
            });
            setMembersMap(map);
          } else {
            setMembersMap({});
          }
        });
        return () => unsubTeams();
      }, []);

  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [teamAttendance, setTeamAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // QR code refresh logic
  const [qrTimestamp, setQrTimestamp] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setQrTimestamp(Date.now());
    }, 60000); // 1 minute
    return () => clearInterval(interval);
  }, []);

  // Get status label before return
  const statusLabel = getStatusLabel(event);

  useEffect(() => {
    if (!eventId) return;
    // Listen for event changes
    const eventRef = doc(db, "events", eventId);
    getDoc(eventRef).then(eventSnap => {
      setEvent(eventSnap.exists() ? eventSnap.data() : null);
    });
    // Real-time listener for attendees (guests)
    const membersRef = collection(db, "members");
    const unsubscribeMembers = onSnapshot(membersRef, (snapshot) => {
      const filtered = snapshot.docs.filter(doc => {
        const d = doc.data();
        return d.eventId === eventId || (d.events && d.events.includes(eventId));
      });
      setAttendees(filtered.map(doc => doc.data()));
      setLoading(false);
    });
    // Real-time listener for team attendance
    const teamAttendanceRef = query(collection(db, "team_attendance"), where("eventId", "==", String(eventId)));
    const unsubscribeTeam = onSnapshot(teamAttendanceRef, (snapshot) => {
      setTeamAttendance(snapshot.docs.map(doc => doc.data()));
    });
    return () => {
      unsubscribeMembers();
      unsubscribeTeam();
    };
  }, [eventId]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!event) return <div className="p-8 text-center text-red-500">Event not found.</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 mt-8 min-h-[60vh] flex flex-col gap-8">
      {/* Top box: Event details and QR codes */}
  <div className="card-glass p-6 flex flex-col items-center justify-center w-full mx-auto max-w-2xl eventcard-animated-border">
        {/* Admin controls: Always show if user is admin, regardless of event status */}
        {user?.role === "admin" && !editMode && (
          <div className="flex gap-2 mb-4">
            <Button variant="outline" onClick={() => { setEditMode(true); setEditForm(event); }}>Edit Event</Button>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>Delete Event</Button>
          </div>
        )}
        {/* Delete confirmation dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Event</DialogTitle>
            </DialogHeader>
            <div>Are you sure you want to delete this event? This action cannot be undone.</div>
            <DialogFooter className="flex gap-2 mt-4">
              <Button variant="destructive" disabled={actionLoading} onClick={async () => {
                setActionLoading(true);
                try {
                  await deleteDoc(doc(db, "events", eventId));
                  setShowDeleteDialog(false);
                  navigate("/", { replace: true });
                } catch (err) {
                  alert("Failed to delete event");
                } finally {
                  setActionLoading(false);
                }
              }}>Delete</Button>
              <Button variant="secondary" onClick={() => setShowDeleteDialog(false)} disabled={actionLoading}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Edit Event Dialog */}
        {editMode && (
          <form className="space-y-4 mb-6" onSubmit={async e => {
            e.preventDefault();
            setActionLoading(true);
            try {
              await updateDoc(doc(db, "events", eventId), {
                title: editForm.title,
                description: editForm.description,
                date: editForm.date,
                startTime: editForm.startTime,
                endTime: editForm.endTime,
                venue: editForm.venue,
              });
              setEvent({ ...event, ...editForm });
              setEditMode(false);
            } catch (err) {
              alert("Failed to update event");
            } finally {
              setActionLoading(false);
            }
          }}>
            <h3 className="text-lg font-bold mb-2">Edit Event</h3>
            <input className="input w-full px-4 py-3 text-base" value={editForm?.title || ""} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} placeholder="Title" required />
            <textarea className="input w-full px-4 py-3 text-base" value={editForm?.description || ""} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" rows={3} />
            <input className="input w-full px-4 py-3 text-base" type="date" value={editForm?.date || ""} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} required />
            <div className="flex gap-2">
              <input className="input w-full px-4 py-3 text-base" type="time" value={editForm?.startTime || ""} onChange={e => setEditForm(f => ({ ...f, startTime: e.target.value }))} required placeholder="Start Time" />
              <input className="input w-full px-4 py-3 text-base" type="time" value={editForm?.endTime || ""} onChange={e => setEditForm(f => ({ ...f, endTime: e.target.value }))} required placeholder="End Time" />
            </div>
            <input className="input w-full px-4 py-3 text-base" value={editForm?.venue || ""} onChange={e => setEditForm(f => ({ ...f, venue: e.target.value }))} placeholder="Venue" />
            <div className="flex gap-2 mt-2">
              <Button type="submit" disabled={actionLoading}>Save</Button>
              <Button type="button" variant="secondary" onClick={() => setEditMode(false)} disabled={actionLoading}>Cancel</Button>
            </div>
          </form>
        )}
        {/* Show QR codes only if event is Live and user is not guest */}
        {statusLabel === "Live" && user && user.role !== "guest" && (
          <div className="mb-6 w-full flex flex-col items-center">
            {user?.role === "admin" && (
              <>
                <h3 className="text-lg font-bold mb-2">Team Member Attendance QR</h3>
                <div className="flex flex-col items-center">
                  <QRCodeCanvas
                    value={`team|${eventId}|${Math.floor(qrTimestamp / 60000)}`}
                    size={192}
                    level="H"
                    includeMargin={true}
                  />
                  <div className="text-xs mt-2 text-muted-foreground">Scan to mark team member present<br/>QR refreshes every minute</div>
                  <div className="text-xs mt-1 text-muted-foreground break-all">QR Value: <span className="font-mono bg-muted px-2 py-1 rounded">{`team|${eventId}|${Math.floor(qrTimestamp / 60000)}`}</span></div>
                </div>
              </>
            )}
            {/* Guest/Other QR always visible for logged in users */}
            <div className="flex flex-col items-center mt-6">
              <QRCodeCanvas
                value={`guest|${eventId}|${Math.floor(qrTimestamp / 60000)}`}
                size={192}
                level="H"
                includeMargin={true}
              />
              <div className="text-xs mt-2 text-muted-foreground">Guest/Other QR<br/>QR refreshes every minute</div>
              <div className="text-xs mt-1 text-muted-foreground break-all">QR Value: <span className="font-mono bg-muted px-2 py-1 rounded">{`guest|${eventId}|${Math.floor(qrTimestamp / 60000)}`}</span></div>
            </div>
          </div>
        )}
        <Button variant="secondary" onClick={() => navigate(-1)} className="mb-4 mt-4">Back to Dashboard</Button>
        <h2 className="text-4xl md:text-5xl font-extrabold mb-2 text-center bg-gradient-to-r from-blue-500 via-cyan-500 to-fuchsia-500 bg-clip-text text-transparent drop-shadow animate-gradient-x">{event.title}</h2>
        <div className="flex flex-wrap items-center justify-center gap-4 mb-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/70 dark:bg-zinc-900/70 shadow text-lg font-semibold text-blue-700 dark:text-cyan-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="font-medium text-xs uppercase tracking-wide text-blue-500 dark:text-cyan-400">Date</span>
            {event.date}
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/70 dark:bg-zinc-900/70 shadow text-lg font-semibold text-fuchsia-700 dark:text-fuchsia-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-fuchsia-400 dark:text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="font-medium text-xs uppercase tracking-wide text-fuchsia-500 dark:text-fuchsia-400">Time</span>
            {formatTime(event.startTime)} - {formatTime(event.endTime)}
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/70 dark:bg-zinc-900/70 shadow text-lg font-semibold text-cyan-700 dark:text-cyan-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10a2 2 0 012-2h2m10-4h-4m0 0V4m0 0V2m0 2a2 2 0 012 2h4a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h4a2 2 0 012-2z" /></svg>
            <span className="font-medium text-xs uppercase tracking-wide text-cyan-500 dark:text-cyan-400">Venue</span>
            {event.venue}
          </div>
        </div>
        <div className="mb-4 text-base whitespace-pre-line text-center text-zinc-700 dark:text-zinc-200 bg-white/60 dark:bg-zinc-900/60 rounded-xl px-4 py-3 shadow-sm">
          <span className="block font-medium text-xs uppercase tracking-wide text-fuchsia-500 dark:text-fuchsia-400 mb-1">Description</span>
          {event.description}
        </div>
      </div>
      {/* Bottom: Two side-by-side boxes for attendance sheets */}
      {user && user.role !== "guest" && (
        <div className="flex flex-col md:flex-row gap-8 w-full">
          {/* Left: Event Attendees */}
          <div className="flex-1 card-glass p-6 eventcard-animated-border">
            <div className="font-semibold mb-2">Total Attendees: {attendees.length}</div>
            {attendees.length > 0 && ["admin","lead","co-lead","Co-lead","Co-Lead","Lead","Admin"].includes(user.role) && (
              <button
                className="mb-2 px-3 py-1 rounded bg-blue-600 text-white text-sm"
                onClick={() => {
                  const csvRows = [
                    ["Name","Class","Year","Roll No.","Email ID"],
                    ...attendees.map(a => [a.name||"",a.className||"",a.year||"",a.rollNo||"",a.email||""])
                  ];
                  const csv = csvRows.map(r => r.map(x => `"${x}"`).join(",")).join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `event-attendance-${eventId}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >Export Event Attendance (CSV)</button>
            )}
            {attendees.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-2">Event Attendance Sheet</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="px-2 py-1 border">Name</th>
                        <th className="px-2 py-1 border">Class</th>
                        <th className="px-2 py-1 border">Year</th>
                        <th className="px-2 py-1 border">Roll No.</th>
                        <th className="px-2 py-1 border">Email ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendees.map(a => (
                        <tr key={a.email || a.rollNo || a.name}>
                          <td className="px-2 py-1 border">{a.name || ""}</td>
                          <td className="px-2 py-1 border">{a.className || a.class || ""}</td>
                          <td className="px-2 py-1 border">{a.year || a.yearName || a.Year || a.batch || ""}</td>
                          <td className="px-2 py-1 border">{a.rollNo || ""}</td>
                          <td className="px-2 py-1 border">{a.email || a.emailId || a.mail || ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          {/* Right: Team Members Attendance */}
          <div className="flex-1 card-glass p-6 eventcard-animated-border">
            <div className="font-semibold mb-2">Total Team Members Present: {teamAttendance.length}</div>
            {teamAttendance.length > 0 && ["admin","lead","co-lead","Co-lead","Co-Lead","Lead","Admin"].includes(user.role) && (
              <button
                className="mb-2 px-3 py-1 rounded bg-green-600 text-white text-sm"
                onClick={() => {
                  const csvRows = [
                    ["Name","Unique ID","Team Name","Date","Time of Entry"],
                    ...teamAttendance.map(a => [a.name||"",a.uniqueId||a.email||"",a.teamName||a.team||"",a.date||a.entryDate||"",a.time||a.entryTime||""])
                  ];
                  const csv = csvRows.map(r => r.map(x => `"${x}"`).join(",")).join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `team-attendance-${eventId}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >Export Team Attendance (CSV)</button>
            )}
            {teamAttendance.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-2">Team Members Attendance Sheet</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="px-2 py-1 border">Name</th>
                        <th className="px-2 py-1 border">Unique ID</th>
                        <th className="px-2 py-1 border">Team Name</th>
                        <th className="px-2 py-1 border">Date</th>
                        <th className="px-2 py-1 border">Time of Entry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamAttendance.map(a => (
                        <tr key={a.uniqueId || a.email}>
                          <td className="px-2 py-1 border">{a.name || ""}</td>
                          <td className="px-2 py-1 border">{a.uniqueId || a.email || ""}</td>
                          <td className="px-2 py-1 border">{a.teamName || a.team || ""}</td>
                          <td className="px-2 py-1 border">{a.date || a.entryDate || ""}</td>
                          <td className="px-2 py-1 border">{a.time || a.entryTime || ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
