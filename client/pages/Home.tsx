import { motion, AnimatePresence } from "framer-motion";
import { ScanLine } from "lucide-react";
import EventCard, { EventItem } from "@/components/EventCard";
import { useEffect, useState } from "react";


export default function Home() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [now, setNow] = useState(new Date());

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

  useEffect(() => {
    async function fetchPastEvents() {
      try {
        const res = await fetch("/api/events/past");
        const data = await res.json();
        if (Array.isArray(data.events)) {
          // Map backend Event to EventItem for UI
          setEvents(
            data.events.map((e: any) => ({
              id: e.id,
              title: e.name,
              description: e.description || "",
              date: e.startAt ? e.startAt.slice(0, 10) : "",
              time: e.startAt ? e.startAt.slice(11, 16) : "",
              startTime: e.startAt ? e.startAt.slice(11, 16) : "",
              endTime: e.endAt ? e.endAt.slice(11, 16) : undefined,
              status: e.status || "Active",
            }))
          );
        }
      } catch (e) {
        setEvents([]);
      }
    }
    fetchPastEvents();
  }, []);

  const categorizedEvents = events
    .map((e) => {
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
      else if (now < start) statusLabel = "Upcoming";
      else if (now >= start && now < end) statusLabel = "Live";
      else if (now >= end) statusLabel = "Expired";
      return { ...e, statusLabel, start, end };
    })
    .sort((a, b) => {
      // Upcoming first, then Live, then Expired
      const order = { Live: 0, Upcoming: 1, Expired: 2 };
      if (order[a.statusLabel] !== order[b.statusLabel]) {
        return order[a.statusLabel] - order[b.statusLabel];
      }
      // Then by date descending (most recent first)
      return (b.start?.getTime() || 0) - (a.start?.getTime() || 0);
    });

  return (
    <div className="relative min-h-[60vh] flex flex-col items-center justify-center py-12 px-2">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="flex flex-col items-center justify-center text-center mb-10"
      >
        {/* Removed Welcome to MarkMe heading for cleaner look */}
        <motion.a
          href="/qr-scan"
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-lg font-semibold btn-gradient text-white shadow-xl hover:scale-105 transition-transform"
        >
          <ScanLine className="size-5" />
          Scan QR to Check-In
        </motion.a>
      </motion.div>

      <section className="w-full max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">Upcoming & Recent Events</h2>
        <AnimatePresence>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categorizedEvents.length === 0 ? (
              <motion.div
                key="no-events"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-full text-center text-muted-foreground py-12"
              >
                No events found.
              </motion.div>
            ) : (
              categorizedEvents.map((e) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
                >
                  <EventCard event={e} />
                </motion.div>
              ))
            )}
          </div>
        </AnimatePresence>
      </section>
    </div>
  );
}
