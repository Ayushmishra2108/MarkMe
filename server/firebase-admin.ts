import admin from "firebase-admin";

function init() {
  // Try Netlify environment first (service account JSON)
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccount) {
    try {
      const parsed = JSON.parse(serviceAccount);
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.cert(parsed),
          projectId: parsed.project_id,
        });
      }
      return admin.app();
    } catch (error) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", error);
    }
  }

  // Fallback to individual environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  
  if (!projectId || !privateKey || !clientEmail) {
    console.error("Firebase Admin not configured. Missing environment variables.");
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
