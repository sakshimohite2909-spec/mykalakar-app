import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { userRole, isAdmin, loading } = useAuth();
  const location = useLocation();

  const isMasterAdmin = localStorage.getItem("MYKALAKAR_MASTER_ADMIN") === "true";
  const hasAdminAccess = isAdmin || isMasterAdmin || userRole === "admin";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117] text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-xs font-semibold text-stone-400">Verifying Admin Access...</p>
        </div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

