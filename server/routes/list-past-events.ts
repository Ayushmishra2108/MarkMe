import { RequestHandler } from "express";
const { getAdminDb } = require("../firebase-admin");
import { Event } from "@shared/api";

/**
 * Returns only events with startAt in the past (legacy events)
 * GET /api/events/past
 */
export const listPastEvents: RequestHandler = async (req, res) => {
  const db = getAdminDb();
  if (!db) return res.status(500).json({ error: "Server missing Firebase Admin credentials" });

  try {
    const now = new Date();
    const eventsSnap = await db.collection("events").get();
    const events: Event[] = [];
    eventsSnap.forEach(doc => {
      const data = doc.data();
      // Defensive: skip if no startAt
      if (!data.startAt) return;
      const startAt = new Date(data.startAt);
      if (startAt < now) {
        events.push({
          id: doc.id,
          name: data.name || data.title || "Untitled",
          description: data.description || "",
          startAt: data.startAt,
          endAt: data.endAt,
          status: data.status || "Active"
        });
      }
    });
    res.json({ events });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch past events", details: String(e) });
  }
};
