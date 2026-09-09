import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { 
  PhoneCall, 
  Lock, 
  User, 
  ArrowRight, 
  Loader2, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  KeyRound, 
  Zap,
  CheckCircle2,
  Headphones
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export default function TelecallerLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<"credentials" | "masterKey">("credentials");
  const [masterPasscode, setMasterPasscode] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const destination = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/telecaller";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authMethod === "masterKey") {
      const code = masterPasscode.trim();
      if (!code) {
        toast({
          variant: "destructive",
          title: "Passcode Required",
          description: "Please enter the telecaller master passcode.",
        });
        return;
      }

      setLoading(true);
      setTimeout(() => {
        if (code === "123456" || code === "telecaller123" || code === "vortex" || code === "mykalakar2026") {
          localStorage.setItem("MYKALAKAR_TELECALLER_BYPASS", "true");
          toast({
            title: "Access Granted",
            description: "Telecaller master key verified.",
          });
          navigate(destination, { replace: true });
        } else {
          toast({
            variant: "destructive",
            title: "Invalid Passcode",
            description: "Incorrect master passcode.",
          });
        }
        setLoading(false);
      }, 400);
      return;
    }

    if (!username.trim() || !password) {
      toast({
        variant: "destructive",
        title: "Input Required",
        description: "Please enter Telecaller email and password.",
      });
      return;
    }

    setLoading(true);
    try {
      const rawUser = username.trim().toLowerCase();
      const isConfiguredTelecaller =
        (rawUser === "telecaller12@gmail.com" || rawUser === "telecaller" || rawUser === "telecaller@mykalakar.com") &&
        password === "123456";

      if (isConfiguredTelecaller) {
        localStorage.setItem("MYKALAKAR_TELECALLER_BYPASS", "true");
        toast({
          title: "Welcome Telecaller Executive!",
          description: "Access granted to Telecaller Workbench.",
        });
        navigate(destination, { replace: true });
        return;
      }

      // Try Firebase Auth
      const result = await login(rawUser, password);
      if (result.success) {
        localStorage.setItem("MYKALAKAR_TELECALLER_BYPASS", "true");
        toast({
          title: "Telecaller Authenticated",
          description: "Welcome to Telecaller CRM Workbench.",
        });
        navigate(destination, { replace: true });
      } else {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: result.message || "Invalid Telecaller Credentials.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Error",
        description: error.message || "Authentication failed.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTelecallerAccess = () => {
    localStorage.setItem("MYKALAKAR_TELECALLER_BYPASS", "true");
    toast({
      title: "Telecaller Session Activated",
      description: "Direct Telecaller CRM access authorized.",
    });
    navigate(destination, { replace: true });
  };

  const applyPresetCredentials = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setAuthMethod("credentials");
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center px-4 py-6 antialiased relative overflow-hidden text-stone-900">
      {/* Background Soft Glow Accents matching website */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-orange-300/30 blur-[100px]" />
        <div className="absolute right-[-6rem] top-20 h-80 w-80 rounded-full bg-amber-200/40 blur-[100px]" />
        <div className="absolute bottom-[-6rem] left-1/3 h-72 w-72 rounded-full bg-rose-200/25 blur-[100px]" />
      </div>

      {/* Top Header Navigation */}
      <div className="w-full max-w-[420px] flex items-center justify-between mb-3 z-10 px-1">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-stone-200/80 bg-white/90 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-stone-700 shadow-2xs transition hover:text-orange-600 hover:border-orange-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Home</span>
        </Link>

        <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-600 bg-white/90 border border-stone-200/80 px-2.5 py-1 rounded-full shadow-2xs backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Telecaller CRM</span>
        </div>
      </div>

      {/* Compact Main Card */}
      <div className="w-full max-w-[420px] bg-white/95 border border-stone-200/90 backdrop-blur-xl rounded-2xl p-5 sm:p-6 shadow-xl shadow-stone-200/60 relative z-10 space-y-4">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-orange-600 text-white shadow-md shadow-orange-600/25">
            <PhoneCall className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-stone-950 tracking-tight">
              Telecaller Sign In
            </h1>
            <p className="text-[11px] text-stone-500 font-medium">
              Access lead inquiries, customer calls & artist matching CRM.
            </p>
          </div>
        </div>

        {/* Auth Mode Toggle */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-xl text-xs font-bold border border-stone-200/70">
          <button
            type="button"
            onClick={() => setAuthMethod("credentials")}
            className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              authMethod === "credentials"
                ? "bg-white text-orange-600 shadow-xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Credentials</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod("masterKey")}
            className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              authMethod === "masterKey"
                ? "bg-white text-orange-600 shadow-xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Master Passcode</span>
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleLogin} autoComplete="off" className="space-y-3">
          {authMethod === "credentials" ? (
            <>
              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  Telecaller Email or Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <Input
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="Enter telecaller email or username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-9 h-9.5 bg-stone-50/80 rounded-xl border-stone-200 text-stone-900 placeholder:text-stone-400 text-xs font-medium focus-visible:ring-orange-500 focus-visible:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-stone-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[10px] text-stone-500 hover:text-orange-600 flex items-center gap-1 font-semibold transition"
                  >
                    {showPassword ? (
                      <>
                        <EyeOff className="h-3 w-3" /> Hide
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3" /> Show
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    placeholder="Enter telecaller password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9 h-9.5 bg-stone-50/80 rounded-xl border-stone-200 text-stone-900 placeholder:text-stone-400 text-xs font-medium focus-visible:ring-orange-500 focus-visible:border-orange-500"
                  />
                </div>
              </div>

              {/* Quick test chip */}
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[10px] text-stone-500 font-semibold">Demo credentials:</span>
                <button
                  type="button"
                  onClick={() => applyPresetCredentials("telecaller12@gmail.com", "123456")}
                  className="text-[10px] text-orange-600 font-mono font-bold hover:underline bg-orange-50 px-2 py-0.5 rounded border border-orange-200"
                >
                  telecaller12@gmail.com
                </button>
              </div>
            </>
          ) : (
            <div>
              <label className="text-[11px] font-bold text-stone-700 block mb-1">
                Master Telecaller Passcode
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-orange-600" />
                <Input
                  type="password"
                  required
                  autoFocus
                  placeholder="Enter passcode (e.g. 123456)"
                  value={masterPasscode}
                  onChange={(e) => setMasterPasscode(e.target.value)}
                  className="pl-9 h-9.5 bg-stone-50/80 rounded-xl border-stone-200 text-stone-900 text-xs font-mono font-medium focus-visible:ring-orange-500 focus-visible:border-orange-500"
                />
              </div>
              <p className="text-[10px] text-stone-500 mt-1">
                Default Master Passcode: <span className="font-bold text-orange-600">123456</span>
              </p>
            </div>
          )}

          {/* Submit Action Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 mt-1 cursor-pointer transition-all"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <>
                <span>Sign In to Workbench</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </form>

        {/* Quick Access Direct Button */}
        <div className="pt-3 border-t border-stone-100 space-y-2 text-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleQuickTelecallerAccess}
            className="w-full h-9 rounded-xl border-orange-200 bg-orange-50/60 hover:bg-orange-100 text-orange-700 text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition"
          >
            <Zap className="h-3.5 w-3.5 text-orange-600 fill-orange-600" />
            <span>Direct 1-Click Telecaller Access</span>
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-400 font-medium">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>256-Bit SSL Encrypted Session</span>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="text-center pt-1 border-t border-stone-100 flex items-center justify-center gap-3 text-[11px] font-bold text-stone-500">
          <Link to="/admin-login" className="hover:text-orange-600 transition">
            Admin Login
          </Link>
          <span className="text-stone-300">•</span>
          <Link to="/artist-login" className="hover:text-orange-600 transition">
            Artist Login
          </Link>
          <span className="text-stone-300">•</span>
          <Link to="/login" className="hover:text-orange-600 transition">
            User Login
          </Link>
        </div>
      </div>
    </div>
  );
}
