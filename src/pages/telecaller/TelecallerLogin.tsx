import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PhoneCall, ShieldCheck, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { STATIC_IMAGES } from "@/services/ImageRegistryService";
import { toast } from "@/hooks/use-toast";

export default function TelecallerLogin() {
  const [email, setEmail] = useState("telecaller12@gmail.com");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ variant: "destructive", title: "Input Required", description: "Please enter your Telecaller username/email and password." });
      return;
    }

    setLoading(true);
    try {
      const isConfiguredTelecaller = email.trim().toLowerCase() === "telecaller12@gmail.com" && password === "123456";

      if (isConfiguredTelecaller) {
        localStorage.setItem("MYKALAKAR_TELECALLER_BYPASS", "true");
        toast({ title: "Welcome Telecaller Executive!", description: "Logged in as telecaller12@gmail.com" });
        navigate("/telecaller");
        return;
      }

      const result = await login(email, password);
      if (result.success) {
        localStorage.setItem("MYKALAKAR_TELECALLER_BYPASS", "true");
        toast({ title: "Welcome Telecaller!", description: "Access granted to Telecaller Console." });
        navigate("/telecaller");
      } else {
        toast({ variant: "destructive", title: "Authentication Failed", description: result.message || "Invalid credentials." });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Error", description: error.message || "An error occurred during login." });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoBypass = () => {
    localStorage.setItem("MYKALAKAR_TELECALLER_BYPASS", "true");
    toast({ title: "Telecaller Session Activated", description: "Logged in as Telecaller Executive." });
    navigate("/telecaller");
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center p-4 antialiased">
      <div className="w-full max-w-md bg-white border border-stone-200/80 rounded-3xl p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 shadow-sm">
            <PhoneCall className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black text-stone-950">Telecaller Executive Portal</h1>
          <p className="text-xs text-stone-500 font-semibold">Sign in to manage customer inquiries and call artists.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">Telecaller Email / Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
              <Input
                type="email"
                required
                placeholder="telecaller@mykalakar.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-10 rounded-xl border-stone-200 text-xs"
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
                className="pl-10 h-10 rounded-xl border-stone-200 text-xs"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In to Telecaller Workbench <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </form>

        <div className="pt-4 border-t border-stone-100 text-center space-y-3">
          <p className="text-[11px] text-stone-400 font-medium">Testing or Demo Access?</p>
          <Button
            type="button"
            variant="outline"
            onClick={handleDemoBypass}
            className="w-full h-10 rounded-xl border-orange-200 bg-orange-50/50 text-orange-600 hover:bg-orange-100 text-xs font-bold"
          >
            <ShieldCheck className="h-4 w-4 mr-2" /> Enter Telecaller Workbench (Demo Mode)
          </Button>
        </div>
      </div>
    </div>
  );
}
