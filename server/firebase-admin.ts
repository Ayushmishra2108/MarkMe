import admin from "firebase-admin";

function init() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  if (!projectId || !privateKey || !clientEmail) {
    return null as any;
  }
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey,
        clientEmail,
      }),
    });
  }
  return admin.app();
}

export function getAdminAuth() {
  const a = init();
  if (!a) return null;
  return admin.auth(a);
}

export function getAdminDb() {
  const a = init();
  if (!a) return null;
  return admin.firestore(a);
}
