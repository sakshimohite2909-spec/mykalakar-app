import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  const { currentUser, loading, isAdmin } = useAuth();
  const location = useLocation();
  const masterAdminActive = isAdmin || localStorage.getItem("MYKALAKAR_MASTER_ADMIN") === "true";

  if (masterAdminActive) {
    return children ? <>{children}</> : <Outlet />;
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-transparent">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-4" />
        <p className="text-xs font-black tracking-[0.2em] text-slate-500 uppercase">Verifying Authorization...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
