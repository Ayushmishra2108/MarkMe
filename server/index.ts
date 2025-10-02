import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { registerMember, updateUserRoleTeam } from "./routes/admin-users";
import { seedFirstAdmin } from "./routes/seed-admin";

import { createTeam, listTeams } from "./routes/admin-teams";
import { listPastEvents } from "./routes/list-past-events";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Events API
  app.get("/api/events/past", listPastEvents);

  // Admin management routes
  app.post("/api/admin/users", registerMember);
  app.patch("/api/admin/users", updateUserRoleTeam);
  app.post("/api/admin/seed", seedFirstAdmin);
  app.post("/api/admin/teams", createTeam);
  app.get("/api/admin/teams", listTeams);

  return app;
}
