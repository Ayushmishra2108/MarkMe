import { CalendarDays, Clock, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import "./eventcard-animated-border.css";

export type EventStatus = "Active" | "Closed";
export interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date
  time?: string; // HH:mm (legacy)
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  status: EventStatus;
}

export default function EventCard({ event, className }: { event: EventItem; className?: string }) {
  // Always use statusLabel from parent (Index.tsx)
  const statusLabel = (event as any).statusLabel || "";
  let statusColor = "bg-blue-500/15 text-blue-600";
  if (statusLabel === "Expired") statusColor = "bg-rose-500/15 text-rose-600";
  else if (statusLabel === "Live") statusColor = "bg-green-500/15 text-green-600";
  else if (statusLabel === "Upcoming") statusColor = "bg-yellow-500/15 text-yellow-600";

  return (
    <Link to={`/event/${event.id}`} className="block">
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn("card-glass p-5 cursor-pointer eventcard-animated-border", className)}
      >
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold tracking-tight">{event.title}</h3>
          {statusLabel && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                statusColor,
              )}
            >
              <BadgeCheck className={cn("size-3", statusColor.split(" ")[1])} />
              {statusLabel}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
        <div className="mt-4 flex items-center gap-4 text-sm text-foreground/80">
          <div className="inline-flex items-center gap-1">
            <CalendarDays className="size-4 opacity-70" />
            <span>{new Date(event.date).toLocaleDateString()}</span>
          </div>
          <div className="inline-flex items-center gap-1">
            <Clock className="size-4 opacity-70" />
            <span>{event.time}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
