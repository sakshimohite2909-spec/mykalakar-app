import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/system-overrides.css";
import "./styles/luxury-light-redesign.css";

createRoot(document.getElementById("root")!).render(<App />);
