const { getAdminDb, getAdminAuth } = require("../firebase-admin.cjs");
const fs = require("fs");
const path = require("path");
const errorLogPath = path.join(__dirname, "backfill-errors.log");
const passwordCsvPath = path.join(__dirname, "user-passwords.csv");
const summaryPath = path.join(__dirname, "backfill-summary.log");

async function backfillFirebaseAuth() {
  // Prepare CSV and summary
  fs.writeFileSync(passwordCsvPath, 'uid,email,uniqueId,password,status\n');
  let summary = [];
  const db = getAdminDb();
  const auth = getAdminAuth();
  if (!db || !auth) {
    const msg = "Firebase Admin not configured";
    fs.appendFileSync(errorLogPath, `[${new Date().toISOString()}] ${msg}\n`);
    throw new Error(msg);
  }

  // Get all users from Firestore
  const usersSnap = await db.collection("users").get();
  const users = usersSnap.docs.map(doc => doc.data());

  for (const user of users) {
    // Use email if present, else synthesize from uniqueId
    const email = user.email || (user.uniqueId ? `${user.uniqueId}@attendance.local` : null);
    let status = '';
    let password = user.password;
    if (!email) {
      status = 'skipped: no email/uniqueId';
      summary.push(`${user.uid},${email || ''},${user.uniqueId || ''},,${status}`);
      fs.appendFileSync(passwordCsvPath, `${user.uid},${email || ''},${user.uniqueId || ''},,${status}\n`);
      continue;
    }
    if (!password) {
      password = Buffer.from(email || user.uid).toString('base64').slice(0, 12) + 'Aa1!';
    }
    try {
      // Check if user already exists in Auth
      let existing;
      try {
        existing = await auth.getUserByEmail(email);
      } catch {
        existing = null;
      }
      if (existing) {
        status = 'skipped: already exists';
        summary.push(`${user.uid},${email},${user.uniqueId || ''},,${status}`);
        fs.appendFileSync(passwordCsvPath, `${user.uid},${email},${user.uniqueId || ''},,${status}\n`);
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
      status = 'created';
      summary.push(`${user.uid},${email},${user.uniqueId || ''},${password},${status}`);
      fs.appendFileSync(passwordCsvPath, `${user.uid},${email},${user.uniqueId || ''},${password},${status}\n`);
      console.log(`Created Auth user: ${email} with password: ${password}`);
    } catch (e) {
      status = `error: ${e.message}`;
      summary.push(`${user.uid},${email},${user.uniqueId || ''},${password},${status}`);
      fs.appendFileSync(passwordCsvPath, `${user.uid},${email},${user.uniqueId || ''},${password},${status}\n`);
      const errorMsg = `[${new Date().toISOString()}] Error creating user ${email}: ${e.message}\n`;
      fs.appendFileSync(errorLogPath, errorMsg);
      console.error(`Error creating user ${email}:`, e.message);
    }
  }
  console.log("Backfill to Firebase Auth complete");
  fs.writeFileSync(summaryPath, summary.join('\n'));
}

if (require.main === module) {
  backfillFirebaseAuth().then(() => {
    process.exit(0);
  }).catch(e => {
    const errorMsg = `[${new Date().toISOString()}] Fatal error: ${e.message}\n`;
    fs.appendFileSync(errorLogPath, errorMsg);
    console.error(e);
    process.exit(1);
  });
}
