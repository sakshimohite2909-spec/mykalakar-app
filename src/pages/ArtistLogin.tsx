import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, Mail, Lock, Loader2, Eye, EyeOff, Building2, User, Sparkles, ArrowLeft } from "lucide-react";

const tabs = [
  { id: "artist", label: "Artist", icon: Sparkles, color: "from-orange-500 to-amber-400" },
  { id: "admin", label: "Admin", icon: Building2, color: "from-slate-600 to-slate-800" },
  { id: "user", label: "User", icon: User, color: "from-pink-500 to-amber-400" },
];

export default function ArtistLogin() {
  const [activeTab, setActiveTab] = useState("user");

  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = location.state?.from?.pathname || "/artists";

  const handleArtistLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ variant: "destructive", title: "Error", description: "Please enter username and password." });
      return;
    }
    setLoading(true);
    const syntheticEmail = `${username.toLowerCase().trim()}@mykalakar.app`;
    const result = await login(syntheticEmail, password);
    if (result.success) {
      toast({ title: "Welcome Back! 🎉", description: "Redirecting to your dashboard..." });
      setTimeout(() => navigate("/artist/dashboard"), 1000);
    } else {
      toast({ variant: "destructive", title: "Login Failed", description: result.message });
    }
    setLoading(false);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate("/admin"); }, 1000);
  };

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ variant: "destructive", title: "Error", description: "Please enter username and password." });
      return;
    }
    setLoading(true);
    const syntheticEmail = `${username.toLowerCase().trim()}@mykalakar.app`;
    const result = await login(syntheticEmail, password);
    if (result.success) {
      navigate(destination);
    } else {
      toast({ variant: "destructive", title: "Login Failed", description: result.message });
    }
    setLoading(false);
  };

  const activeTabData = tabs.find(t => t.id === activeTab)!;

  return (
    <div className="min-h-screen w-full flex flex-col relative overflow-hidden bg-[#f8f9fa] z-10">
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-orange-300/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-amber-300/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-orange-100/30 blur-[90px] animate-pulse" style={{ animationDelay: '4s' }} />
      </div>
      {/* Back link */}
      <div className="relative z-10 p-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-orange-600 transition-colors glass-card rounded-full px-4 py-2">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>

      {/* Centre form */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight">Step Back Into The Collective.</h1>
            <p className="text-sm text-slate-500 mt-2">Sign in to your MyKalakar account</p>
          </div>

          {/* Tab selector */}
          <div className="glass-card rounded-2xl p-1.5 flex gap-1.5 mb-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-foreground shadow-lg`
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="glass-panel rounded-3xl p-8 bg-white/60 backdrop-blur-3xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
            <div className="relative z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  {activeTab === "artist" && (
                    <form onSubmit={handleArtistLogin} className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Username</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text" value={username} onChange={e => setUsername(e.target.value)}
                            placeholder="your_username" required
                            className="input-glass w-full rounded-xl pl-10 pr-4 py-3 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••" required
                            className="input-glass w-full rounded-xl pl-10 pr-11 py-3 text-sm"
                          />
                          <button type="button" onClick={() => setShowPassword(p => !p)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <button type="submit" disabled={loading}
                        className="btn-glass-primary w-full rounded-xl py-4 text-xs font-black uppercase tracking-widest mt-4 flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogIn className="w-4 h-4" /> Sign In as Artist</>}
                      </button>
                    </form>
                  )}

                  {activeTab === "admin" && (
                    <form onSubmit={handleAdminLogin} className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Admin Username</label>
                        <div className="relative">
                          <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text" value={username} onChange={e => setUsername(e.target.value)}
                            placeholder="admin_username" required
                            className="input-glass w-full rounded-xl pl-10 pr-4 py-3 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••" required
                            className="input-glass w-full rounded-xl pl-10 pr-11 py-3 text-sm"
                          />
                          <button type="button" onClick={() => setShowPassword(p => !p)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <button type="submit" disabled={loading}
                        className="w-full rounded-xl py-4 text-xs font-black uppercase tracking-widest mt-4 flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-slate-700 to-slate-900 text-foreground shadow-lg hover:shadow-xl">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Building2 className="w-4 h-4" /> Admin Login</>}
                      </button>
                    </form>
                  )}

                  {activeTab === "user" && (
                    <form onSubmit={handleUserLogin} className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Username</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text" value={username} onChange={e => setUsername(e.target.value)}
                            placeholder="your_username" required
                            className="input-glass w-full rounded-xl pl-10 pr-4 py-3 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••" required
                            className="input-glass w-full rounded-xl pl-10 pr-11 py-3 text-sm"
                          />
                          <button type="button" onClick={() => setShowPassword(p => !p)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <button type="submit" disabled={loading}
                        className="w-full rounded-xl py-4 text-xs font-black uppercase tracking-widest mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-amber-400 text-foreground shadow-lg hover:shadow-xl transition-all">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><User className="w-4 h-4" /> Sign In as User</>}
                      </button>
                    </form>
                  )}
                </motion.div>
              </AnimatePresence>

              <p className="text-center text-xs text-slate-500 mt-6">
                Don't have an account?{" "}
                <Link to="/register" className="font-bold text-orange-500 hover:text-orange-600 transition-colors">
                  Register here →
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
