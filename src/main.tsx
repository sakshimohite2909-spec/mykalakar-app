import { createRoot } from "react-dom/client";
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
