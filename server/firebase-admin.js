const admin = require("firebase-admin");

function init() {
  const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!svc) {
    return null;
  }
  if (admin.apps.length === 0) {
    const parsed = JSON.parse(svc);
    admin.initializeApp({
      credential: admin.credential.cert(parsed),
      projectId: parsed.project_id,
    });
  }
  return admin.app();
}

function getAdminAuth() {
  const a = init();
  if (!a) return null;
  return admin.auth(a);
}

function getAdminDb() {
  const a = init();
  if (!a) return null;
  return admin.firestore(a);
}

module.exports = { getAdminAuth, getAdminDb };
