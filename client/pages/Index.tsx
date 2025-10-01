
import { useEffect, useState } from "react";
import StatCard from "@/components/StatCard";
import EventCard, { EventItem } from "@/components/EventCard";
import { CalendarDays, UsersRound, Layers3 } from "lucide-react";
import { motion } from "framer-motion";
import { db } from "@/services/firebase";
import { collection, getDocs } from "firebase/firestore";
import { doc, updateDoc } from "firebase/firestore";


export default function Index() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());

  // Update 'now' every 10 seconds for near real-time status
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(interval);
  }, []);
  function getLocalDate(dateStr: string, timeStr: string, fallback: string) {
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
  const categorizedEvents = events.map((e) => {
    // Use startTime and endTime for real-time status
    const start = getLocalDate(e.date, e.startTime || e.time, "00:00");
    let end = null;
    if (e.endTime) {
      end = getLocalDate(e.date, e.endTime, "23:59");
    } else if (e.startTime || e.time) {
      // Default: 1 hour after start if no endTime
      const s = getLocalDate(e.date, e.startTime || e.time, "00:00");
      end = s ? new Date(s.getTime() + 60 * 60 * 1000) : null;
    } else {
      end = getLocalDate(e.date, "23:59", "23:59");
    }
    let statusLabel = "Upcoming";
    if (!start || !end) statusLabel = "Upcoming";
    else if (now < start) statusLabel = "Upcoming";
    else if (now >= start && now < end) statusLabel = "Live";
    else if (now >= end) statusLabel = "Expired";
    return { ...e, statusLabel };
  });

  useEffect(() => {
    async function fetchDataAndUpdateStatus() {
      const eventsSnap = await getDocs(collection(db, "events"));
      const eventDocs = eventsSnap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: d.id || doc.id,
          title: d.title || d.name || "Untitled",
          description: d.description || "",
          date: d.date || "",
          time: d.time || "",
          startTime: d.startTime,
          endTime: d.endTime,
          status: d.status || "Active",
        };
      });
      // Compute statusLabel for each event
      const nowDate = new Date();
      for (const e of eventDocs) {
        const start = getLocalDate(e.date, e.startTime || e.time, "00:00");
        let end = null;
        if (e.endTime) {
          end = getLocalDate(e.date, e.endTime, "23:59");
        } else if (e.startTime || e.time) {
          const s = getLocalDate(e.date, e.startTime || e.time, "00:00");
          end = s ? new Date(s.getTime() + 60 * 60 * 1000) : null;
        } else {
          end = getLocalDate(e.date, "23:59", "23:59");
        }
        let statusLabel = "Upcoming";
        if (!start || !end) statusLabel = "Upcoming";
        else if (nowDate < start) statusLabel = "Upcoming";
        else if (nowDate >= start && nowDate < end) statusLabel = "Live";
        else if (nowDate >= end) statusLabel = "Expired";
        // Update status in Firestore if changed
        if (e.status !== statusLabel) {
          const eventRef = doc(db, "events", e.id);
          await updateDoc(eventRef, { status: statusLabel });
        }
      }
      setEvents(eventDocs);
      const teamsSnap = await getDocs(collection(db, "teams"));
      setTeams(teamsSnap.docs.map((doc) => doc.data()));
      const attendeesSnap = await getDocs(collection(db, "members"));
      setAttendees(attendeesSnap.docs.map((doc) => doc.data()));
    }
    fetchDataAndUpdateStatus();
  }, []);

  return (
    <div className="space-y-10 pt-8">
      <section className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 relative">
        <StatCard
          icon={<CalendarDays className="text-white" />}
          label="Total Events"
          value={events.length.toString()}
        />
        <StatCard
          icon={<Layers3 className="text-white" />}
          label="Total Teams"
          value={teams.length.toString()}
        />
        <StatCard
          icon={<UsersRound className="text-white" />}
          label="Total Team Members"
          value={teams.reduce((sum, t) => sum + (t.members?.length || 0), 0).toString()}
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Upcoming & Recent Events</h2>
          <motion.a
            href="/qr-scan"
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold btn-gradient text-white shadow-lg"
          >
            Scan QR to Check-In
          </motion.a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categorizedEvents.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      </section>
    </div>
  );
}
