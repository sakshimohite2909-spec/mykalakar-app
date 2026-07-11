import { createRoot } from "react-dom/client";



import App from "./App.tsx";
import "./index.css";
import "./styles/system-overrides.css";
import "./styles/luxury-light-redesign.css";
import "./styles/mobile-responsive.css";

// --- GOOGLE TRANSLATE REACT CRASH PATCH ---
// Prevents Google Translate and other extension DOM mutations from crashing React on route transitions.
if (typeof window !== "undefined") {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return this.appendChild(newNode) as unknown as T;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}
// ------------------------------------------

if (import.meta.env.DEV) {
  void import("@/lib/firebaseDiagnostics")
    .then(({ installFirebaseDiagnostics }) => installFirebaseDiagnostics())
    .catch((error) => console.warn("Firebase diagnostics could not be installed.", error));
}

createRoot(document.getElementById("root")!).render(<App />);
