import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { registerMember, updateUserRoleTeam, cleanTeamMembers } from "./routes/admin-users";
import { seedFirstAdmin } from "./routes/seed-admin";
import { createTeam, listTeams } from "./routes/admin-teams";

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

  // Admin management routes
  app.post("/api/admin/users", registerMember);
  app.patch("/api/admin/users", updateUserRoleTeam);
  app.post("/api/admin/seed", seedFirstAdmin);
  app.post("/api/admin/teams", createTeam);
  app.get("/api/admin/teams", listTeams);

  // Utility: Clean orphaned team members
  app.post("/api/admin/teams/clean-members", cleanTeamMembers);

  return app;
}
