import { RequestHandler } from "express";
const { getAdminDb } = require("../firebase-admin");

export const createTeam: RequestHandler = async (req, res) => {
  const db = getAdminDb();
  if (!db) return res.status(501).json({ error: "Server missing Firebase Admin credentials." });
  const { name, description } = req.body as { name: string; description?: string };
  if (!name || !name.trim()) return res.status(400).json({ error: "name required" });
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  try {
    await db.collection("teams").doc(id).set({ id, name, description: description || null, members: [], createdAt: Date.now(), updatedAt: Date.now() }, { merge: true });
    res.json({ id, name });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to create team" });
  }
};

export const listTeams: RequestHandler = async (_req, res) => {
  const db = getAdminDb();
  if (!db) return res.status(501).json({ error: "Server missing Firebase Admin credentials." });
  try {
    const snap = await db.collection("teams").get();
    const teams = snap.docs.map((d) => d.data());
    res.json({ teams });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to list teams" });
  }
};
