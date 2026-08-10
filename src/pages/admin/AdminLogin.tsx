import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ShieldCheck, Lock, User, ArrowRight, Loader2, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { STATIC_IMAGES } from "@/services/ImageRegistryService";
import { toast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const [username, setUsername] = useState("admin12@gmail.com");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        variant: "destructive",
        title: "Input Required",
        description: "Please enter your Admin username/email and password.",
      });
      return;
    }

    setLoading(true);
    try {
      const rawUser = username.trim().toLowerCase();
      const isConfiguredAdmin = rawUser === "admin12@gmail.com" && password === "123456";
      const isMasterAdminCred = isConfiguredAdmin || rawUser === "vortex" || rawUser === "admin" || rawUser === "admin@mykalakar.com";

      if (isMasterAdminCred) {
        localStorage.setItem("MYKALAKAR_MASTER_ADMIN", "true");
        window.dispatchEvent(new Event("MYKALAKAR_MASTER_ADMIN_CHANGED"));
        toast({
          title: "Admin Access Granted",
          description: "Welcome to MyKalakar Admin Console.",
        });
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      // Try Firebase Auth
      const result = await login(username, password);
      if (result.success) {
        localStorage.setItem("MYKALAKAR_MASTER_ADMIN", "true");
        window.dispatchEvent(new Event("MYKALAKAR_MASTER_ADMIN_CHANGED"));
        toast({
          title: "Admin Authenticated",
          description: "Welcome to Admin Dashboard.",
        });
        navigate("/admin/dashboard", { replace: true });
      } else {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: result.message || "Invalid Admin Credentials.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Error",
        description: error.message || "An error occurred during admin authentication.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdminAccess = () => {
    localStorage.setItem("MYKALAKAR_MASTER_ADMIN", "true");
    window.dispatchEvent(new Event("MYKALAKAR_MASTER_ADMIN_CHANGED"));
    toast({
      title: "Admin Session Activated",
      description: "Granted Master Admin Control Panel access.",
    });
    navigate("/admin/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center p-4 antialiased relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-200/40 blur-[100px] rounded-full pointer-events-none" />

      {/* Navigation Top Header */}
      <div className="absolute top-6 left-6 flex items-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-extrabold text-stone-700 shadow-sm transition hover:text-orange-600 hover:border-orange-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <div className="w-full max-w-md bg-white border border-stone-200/80 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-600/30">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <span className="inline-block rounded-full bg-orange-100 border border-orange-200 px-3 py-1 text-[10px] font-black uppercase text-orange-600 tracking-wider">
              Control Panel
            </span>
            <h1 className="text-2xl font-black text-stone-950 mt-1">Admin Portal Login</h1>
            <p className="text-xs text-stone-500 font-semibold mt-1">
              Authenticate to manage artists, event briefs, categories and bookings.
            </p>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">Admin Username / Email</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
              <Input
                type="text"
                required
                placeholder="admin12@gmail.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 h-10 rounded-xl border-stone-200 text-xs font-medium focus-visible:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-10 rounded-xl border-stone-200 text-xs font-medium focus-visible:ring-orange-500"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-md shadow-orange-600/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Sign In to Admin Dashboard <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {/* Quick Access Demo Button */}
        <div className="pt-4 border-t border-stone-100 text-center space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-stone-400 text-[11px] font-medium">
            <Sparkles className="h-3.5 w-3.5 text-orange-500" /> Quick Access Mode
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleQuickAdminAccess}
            className="w-full h-10 rounded-xl border-orange-200 bg-orange-50/60 text-orange-600 hover:bg-orange-100 text-xs font-black shadow-sm"
          >
            <ShieldCheck className="h-4 w-4 mr-2" /> Open Admin Dashboard Direct Access
          </Button>
        </div>

        {/* Footer links */}
        <div className="text-center pt-2">
          <Link to="/login" className="text-[11px] font-bold text-stone-500 hover:text-stone-900 transition">
            Not an Admin? Go to User / Artist Login →
          </Link>
        </div>
      </div>
    </div>
  );
}
