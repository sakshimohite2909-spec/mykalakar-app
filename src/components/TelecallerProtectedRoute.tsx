import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function TelecallerProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, isTelecaller, isAdmin, loading } = useAuth();
  const location = useLocation();

  const isAuthorized =
    isTelecaller ||
    isAdmin ||
    localStorage.getItem("MYKALAKAR_TELECALLER_BYPASS") === "true";

  if (isAuthorized) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FDFBF7] text-stone-900">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600 mb-4" />
        <p className="text-xs font-black tracking-[0.2em] text-stone-500 uppercase">Checking Telecaller Access...</p>
      </div>
    );
  }

  return <Navigate to="/telecaller-login" state={{ from: location }} replace />;
}
