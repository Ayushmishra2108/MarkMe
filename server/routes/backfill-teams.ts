import { getAdminDb } from "../firebase-admin";

async function backfillTeams() {
  const db = getAdminDb();
  if (!db) throw new Error("Firebase Admin not configured");

  // Get all users
  const usersSnap = await db.collection("users").get();
  const users = usersSnap.docs.map(doc => doc.data());

  // Group users by teamName
  const teams: Record<string, any[]> = {};
  for (const user of users) {
    if (!user.teamName) continue;
    if (!teams[user.teamName]) teams[user.teamName] = [];
    teams[user.teamName].push({
      uid: user.uid,
      displayName: user.name,
      position: user.position || null,
      role: user.role || "member",
    });
  }

  // Update each team document
  for (const [teamName, members] of Object.entries(teams)) {
    await db.collection("teams").doc(teamName).set({
      id: teamName,
      name: teamName,
      members,
      updatedAt: Date.now(),
    }, { merge: true });
    console.log(`Backfilled team: ${teamName} with ${members.length} members`);
  }
}

// Run the script if called directly
if (require.main === module) {
  backfillTeams().then(() => {
    console.log("Backfill complete");
    process.exit(0);
  }).catch(e => {
    console.error(e);
    process.exit(1);
  });
}
