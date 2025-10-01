import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBujVJgG6Do7j6VX8ATYRJI9dOvEFKHpQw",
  authDomain: "attendance-tracker-aa94a.firebaseapp.com",
  projectId: "attendance-tracker-aa94a",
  storageBucket: "attendance-tracker-aa94a.firebasestorage.app",
  messagingSenderId: "260869291248",
  appId: "1:260869291248:web:16b22d4e3793a501f81635",
  measurementId: "G-KMHC9TY6Z8",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Use long-polling and disable fetch streams to avoid proxies/CSP blocking
export const db = (() => {
  try {
    return initializeFirestore(app, { experimentalForceLongPolling: true, useFetchStreams: false } as any);
  } catch {
    return getFirestore(app);
  }
})();
