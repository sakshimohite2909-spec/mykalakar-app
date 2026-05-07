import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
};

Object.entries(firebaseConfig).forEach(([key, value]) => {
  if (!value && key !== "measurementId") {
    console.warn(`Firebase config warning: ${key} is missing. Check your .env file.`);
  }
});

import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const analytics =
  typeof window !== "undefined" && firebaseConfig.measurementId ? getAnalytics(app) : null;
const auth = getAuth(app);
void setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn("Firebase auth persistence warning:", error);
});

// Use initializeFirestore with long polling to bypass aggressive adblockers (ERR_BLOCKED_BY_CLIENT)
// and enable local cache for offline/fallback capabilities
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  experimentalForceLongPolling: true,
});

const storage = getStorage(app);

export { app, analytics, auth, db, storage };
