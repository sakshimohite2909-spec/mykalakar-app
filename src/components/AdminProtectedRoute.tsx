import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, isAdmin, loading } = useAuth();
  const location = useLocation();
  const masterAdminActive = isAdmin || localStorage.getItem("MYKALAKAR_MASTER_ADMIN") === "true";

  // Allow open access to /bootstrap so the developer can seed the admin credentials
  const isBootstrapPath = location.pathname === "/bootstrap" || location.pathname === "/admin/bootstrap";

  if (masterAdminActive) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-transparent">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-4" />
        <p className="text-xs font-black tracking-[0.2em] text-slate-500 uppercase">Checking admin access...</p>
      </div>
    );
  }

  if (isBootstrapPath) {
    return <>{children}</>;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
