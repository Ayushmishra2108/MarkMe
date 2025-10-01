import admin from "firebase-admin";

function init() {
  const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!svc) {
    console.error("[FIREBASE_ADMIN] Missing FIREBASE_SERVICE_ACCOUNT env variable");
    return null as any;
  }
  try {
    if (admin.apps.length === 0) {
      let parsed;
      try {
        parsed = JSON.parse(svc);
      } catch (err) {
        console.error("[FIREBASE_ADMIN] Failed to parse FIREBASE_SERVICE_ACCOUNT:", err, svc);
        throw err;
      }
      admin.initializeApp({
        credential: admin.credential.cert(parsed),
        projectId: parsed.project_id,
      });
      console.log("[FIREBASE_ADMIN] Initialized Firebase Admin SDK");
    }
    return admin.app();
  } catch (err) {
    console.error("[FIREBASE_ADMIN] Error initializing Firebase Admin:", err);
    return null as any;
  }
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
