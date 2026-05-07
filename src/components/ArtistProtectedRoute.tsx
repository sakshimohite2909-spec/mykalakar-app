import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireApproval?: boolean;
}

export default function ArtistProtectedRoute({ children, requireApproval = true }: ProtectedRouteProps) {
  const { currentUser, artistData, applicationStatus, loading, userRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Loading your dashboard...</p>
          <p className="text-xs text-muted-foreground/60">This happens automatically — no refresh needed.</p>
        </div>
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!currentUser) {
    return <Navigate to="/artist-login" replace />;
  }

  // User is not an artist role at all (e.g. customer or admin)
  if (userRole !== "artist") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center space-y-4 max-w-md mx-auto p-8">
          <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
            <span className="text-4xl">ℹ️</span>
          </div>
          <h1 className="text-2xl font-display font-bold">Artist Dashboard</h1>
          <p className="text-muted-foreground">
            This dashboard is for registered artists only. Your account type does not have access to the artist dashboard.
          </p>
          <Link to="/" className="text-primary text-sm underline">← Go to Home</Link>
        </div>
      </div>
    );
  }

  // Logged in but no artist data found at all — shouldn't happen with real-time listeners
  // but handle gracefully
  if (!artistData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Loading artist profile...</p>
        </div>
      </div>
    );
  }

  const isApprovedArtist =
    artistData.status === "approved" ||
    artistData.status === "active" ||
    applicationStatus === "approved" ||
    applicationStatus === "active";

  // Needs approval but not approved yet
  if (requireApproval && !isApprovedArtist) {
    const status = artistData.status ?? applicationStatus ?? "pending";

    if (status === "pending") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-transparent">
          <div className="text-center space-y-4 max-w-md mx-auto p-8">
            <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
              <span className="text-4xl">⏳</span>
            </div>
            <h1 className="text-2xl font-display font-bold">Application Under Review</h1>
            <p className="text-muted-foreground">
              Your registration is being reviewed by our team. You'll be able to access your dashboard once approved.
            </p>
            <p className="text-xs text-muted-foreground/60 bg-secondary/30 px-4 py-2 rounded-xl">
              ✨ This page will <strong>automatically unlock</strong> the moment your application is approved — no refresh needed!
            </p>
            <div className="pt-4 border-t border-border/30">
              <p className="text-xs text-muted-foreground">Submitted as: <strong>{artistData.email || artistData.name}</strong></p>
            </div>
          </div>
        </div>
      );
    }

    if (status === "rejected") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-transparent">
          <div className="text-center space-y-4 max-w-md mx-auto p-8">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <span className="text-4xl">❌</span>
            </div>
            <h1 className="text-2xl font-display font-bold">Application Rejected</h1>
            <p className="text-muted-foreground">
              Unfortunately your registration was not approved. Please contact support for more details.
            </p>
            {artistData.rejectionReason && (
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-left">
                <p className="text-xs font-semibold text-red-600 mb-1">Reason:</p>
                <p className="text-sm text-muted-foreground">{String(artistData.rejectionReason)}</p>
              </div>
            )}
            <Link to="/artist-register" className="text-primary text-sm underline block mt-4">
              Submit a new application →
            </Link>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
