import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-transparent">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-4" />
        <p className="text-xs font-black tracking-[0.2em] text-slate-500 uppercase">Checking admin access...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (userRole !== "admin") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-transparent px-4">
        <div className="max-w-md rounded-2xl border bg-background/80 p-8 text-center shadow-xl backdrop-blur">
          <h1 className="text-2xl font-display font-bold mb-2">Admin access required</h1>
          <p className="text-sm text-muted-foreground">
            Your account is signed in, but it is not linked to an active admin profile.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
