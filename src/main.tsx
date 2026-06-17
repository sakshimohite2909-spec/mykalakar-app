import { createRoot } from "react-dom/client";

// --- TEMPORARY DIAGNOSTIC CACHE PURGE ---
// Instructs the browser to programmatically nuke corrupted Firebase IndexedDB databases on boot.
(async function clearCorruptedBrowserData() {
  try {
    const dbs = await window.indexedDB.databases();
    dbs.forEach(db => {
      if (db.name && (db.name.includes('firebase') || db.name.includes('firestore'))) {
        window.indexedDB.deleteDatabase(db.name);
        console.log(`🧹 Automatically purged corrupted database: ${db.name}`);
      }
    });
  } catch (e) {
    console.error("Cache purge failed:", e);
  }
})();
// ----------------------------------------

import App from "./App.tsx";
import "./index.css";
import "./styles/system-overrides.css";
import "./styles/luxury-light-redesign.css";
import "./styles/mobile-responsive.css";

if (import.meta.env.DEV) {
  void import("@/lib/firebaseDiagnostics")
    .then(({ installFirebaseDiagnostics }) => installFirebaseDiagnostics())
    .catch((error) => console.warn("Firebase diagnostics could not be installed.", error));
}

createRoot(document.getElementById("root")!).render(<App />);
