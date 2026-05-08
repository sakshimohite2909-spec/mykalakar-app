import { Navigate, useLocation, Link } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, isAdmin, loading } = useAuth();
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-transparent px-4">
        <div className="max-w-md rounded-2xl border bg-background/80 p-8 text-center shadow-xl backdrop-blur space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-display font-bold">Access Denied</h1>
          <p className="text-sm text-muted-foreground">
            This area requires an active admin role in Firebase.
          </p>
          <Link to="/">
            <Button className="gradient-bg border-0 text-primary-foreground font-semibold">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
