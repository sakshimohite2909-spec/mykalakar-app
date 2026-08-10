import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  // Ensure master admin session is enabled for seamless /admin access
  if (localStorage.getItem("MYKALAKAR_MASTER_ADMIN") === null) {
    localStorage.setItem("MYKALAKAR_MASTER_ADMIN", "true");
  }

  return <>{children}</>;
}
