import { Navigate, useLocation, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, userRole, userProfile, loading } = useAuth();
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
    const isPendingRequest = userRole === "admin_request";
    // User has admin role in users doc but admins collection doc not active yet — run bootstrap
    const needsBootstrap = userProfile?.role === "admin" || isPendingRequest;

    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-transparent px-4">
        <div className="max-w-md rounded-2xl border bg-background/80 p-8 text-center shadow-xl backdrop-blur space-y-4">
          <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto">
            <span className="text-3xl">🔐</span>
          </div>
          <h1 className="text-2xl font-display font-bold">
            {isPendingRequest ? "Admin Access Pending" : "Admin Access Required"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isPendingRequest
              ? "Your admin request has been submitted and is pending approval."
              : "Your account does not have admin privileges."}
          </p>

          {needsBootstrap && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-left space-y-2">
              <p className="text-sm font-semibold text-orange-800">
                ⚡ If your admin request was already approved in Firebase Console:
              </p>
              <p className="text-xs text-orange-700">
                The admins collection document needs to be created. Click below to fix it automatically.
              </p>
              <Link to="/bootstrap">
                <Button className="gradient-bg border-0 text-primary-foreground font-semibold w-full mt-2">
                  🚀 Run Bootstrap Fix → Get Admin Access
                </Button>
              </Link>
            </div>
          )}

          <p className="text-xs text-muted-foreground/60">
            This page will automatically update once your access is granted — no refresh needed.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

