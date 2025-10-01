const { getAdminDb, getAdminAuth } = require("../firebase-admin");

async function backfillFirebaseAuth() {
  const db = getAdminDb();
  const auth = getAdminAuth();
  if (!db || !auth) throw new Error("Firebase Admin not configured");

  // Get all users from Firestore
  const usersSnap = await db.collection("users").get();
  const users = usersSnap.docs.map(doc => doc.data());

  for (const user of users) {
    // Use email if present, else synthesize from uniqueId
    const email = user.email || (user.uniqueId ? `${user.uniqueId}@attendance.local` : null);
    if (!email) {
      console.log(`Skipping user with no email or uniqueId: ${user.uid}`);
      continue;
    }
    // Use password from Firestore, else set a default
    const password = user.password || "changeme123";
    try {
      // Check if user already exists in Auth
      let existing;
      try {
        existing = await auth.getUserByEmail(email);
      } catch {
        existing = null;
      }
      if (existing) {
        console.log(`User already exists in Auth: ${email}`);
        continue;
      }
      // Create user in Auth
      await auth.createUser({
        uid: user.uid,
        email,
        password,
        displayName: user.name || user.displayName || email,
      });
      console.log(`Created Auth user: ${email}`);
    } catch (e) {
      console.error(`Error creating user ${email}:`, e.message);
    }
  }
  console.log("Backfill to Firebase Auth complete");
}

if (require.main === module) {
  backfillFirebaseAuth().then(() => {
    process.exit(0);
  }).catch(e => {
    console.error(e);
    process.exit(1);
  });
}
