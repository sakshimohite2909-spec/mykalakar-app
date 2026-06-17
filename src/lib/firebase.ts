import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

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

let app;
try {
  if (!firebaseConfig.apiKey) {
    throw new Error("Missing FIREBASE_API_KEY. Environment variables failed to bind.");
  }
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
} catch (error) {
  console.error("🔥 FATAL FIREBASE INIT ERROR:", error);
  // Provide a dummy app to prevent the entire React tree from violently crashing
  app = initializeApp({ apiKey: "dummy", projectId: "dummy", appId: "dummy" }, "dummy-app");
}
// Initialize App Check with reCAPTCHA v3 for bot mitigation
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY;
const appCheck =
  typeof window !== "undefined" && recaptchaSiteKey
    ? initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      })
    : null;

const analytics =
  typeof window !== "undefined" && firebaseConfig.measurementId ? getAnalytics(app) : null;
const auth = getAuth(app);
void setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn("Firebase auth persistence warning:", error);
});

// Disable local persistence temporarily to force a fresh network request and bypass corrupted caches
const db = getFirestore(app);

const storage = getStorage(app);

export { app, analytics, auth, db, storage, appCheck };
