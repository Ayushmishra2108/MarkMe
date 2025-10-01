// Script to clean up malformed team members arrays in Firestore
// Usage: npx ts-node server/routes/fix-team-members.ts
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Use FIREBASE_SERVICE_ACCOUNT env var
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

if (!serviceAccount) {
  console.error('FIREBASE_SERVICE_ACCOUNT env var not set.');
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function fixTeams() {
  const teamsSnap = await db.collection('teams').get();
  let fixedCount = 0;
  for (const doc of teamsSnap.docs) {
    const data = doc.data();
    let members = Array.isArray(data.members) ? data.members : [];
    // Only keep string UIDs
    const cleaned = members.filter((m) => typeof m === 'string');
    if (members.length !== cleaned.length) {
      await doc.ref.update({ members: cleaned });
      console.log(`Fixed team ${doc.id}: removed malformed members.`);
      fixedCount++;
    }
  }
  if (fixedCount === 0) {
    console.log('No malformed members found.');
  } else {
    console.log(`Fixed ${fixedCount} team(s).`);
  }
}

fixTeams().catch((err) => {
  console.error('Error fixing teams:', err);
  process.exit(1);
});
