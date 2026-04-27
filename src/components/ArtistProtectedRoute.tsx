import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireApproval?: boolean;
}

export default function ArtistProtectedRoute({ children, requireApproval = true }: ProtectedRouteProps) {
    const { currentUser, artistData, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <div className="text-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground text-sm">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    // Not logged in → redirect to login
    if (!currentUser) {
        return <Navigate to="/artist-login" replace />;
    }

    // Logged in but no artist data found
    if (!artistData) {
        return <Navigate to="/artist-login" replace />;
    }

    // Needs approval but not approved yet
    if (requireApproval && artistData.status !== "approved") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <div className="text-center space-y-4 max-w-md mx-auto p-8">
                    {artistData.status === "pending" ? (
                        <>
                            <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
                                <span className="text-4xl">⏳</span>
                            </div>
                            <h1 className="text-2xl font-display font-bold">Application Under Review</h1>
                            <p className="text-muted-foreground">
                                Your registration is being reviewed by our team. You'll be able to access your dashboard once approved.
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                                <span className="text-4xl">❌</span>
                            </div>
                            <h1 className="text-2xl font-display font-bold">Application Rejected</h1>
                            <p className="text-muted-foreground">
                                Unfortunately your registration was not approved. Please contact support for more details.
                            </p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
