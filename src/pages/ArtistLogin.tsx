import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  AtSign,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Music,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { auth, db } from "@/lib/firebase";

type LoginRole = "artist" | "user";

const roleTabs: Array<{ id: LoginRole; label: string; color: string }> = [
  { id: "user", label: "User", color: "from-rose-500 to-amber-400" },
  { id: "artist", label: "Artist", color: "from-orange-500 to-amber-400" },
];

const loginSchema = z.object({
  username: z
    .string()
    .min(4, "Username must be at least 4 characters.")
    .regex(/^[a-z0-9_]*$/, "Username can contain lowercase letters, numbers, and underscores only. No spaces."),
  password: z.string().min(1, "Password is required."),
});

type LoginValues = z.infer<typeof loginSchema>;

function syntheticEmail(username: string) {
  return `${username.toLowerCase().trim()}@mykalakar.app`;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-semibold text-red-500">{message}</p>;
}

async function resolvePostLoginPath(uid: string, fallbackPath: string) {
  const userSnap = await getDoc(doc(db, "users", uid));
  const profile = userSnap.exists() ? userSnap.data() : null;
  const role = profile?.role;

  if (role === "admin") {
    const adminSnap = await getDoc(doc(db, "admins", uid));
    if (adminSnap.exists() && adminSnap.data()?.status === "active") {
      return "/admin";
    }
  }

  if (role === "artist") return "/artist/dashboard";

  return fallbackPath && fallbackPath !== "/login" ? fallbackPath : "/";
}

export default function ArtistLogin() {
  const [activeRole, setActiveRole] = useState<LoginRole>("user");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = location.state?.from?.pathname || "/";

  const {
    control,
    formState: { errors, isValid },
    handleSubmit,
    register,
  } = useForm<LoginValues>({
    defaultValues: {
      username: "",
      password: "",
    },
    mode: "onChange",
    resolver: zodResolver(loginSchema),
  });

  const submitLogin = async (values: LoginValues) => {
    setSubmitting(true);
    try {
      const result = await login(syntheticEmail(values.username), values.password);

      if (!result.success) {
        toast({ variant: "destructive", title: "Login failed", description: result.message });
        return;
      }

      const uid = auth.currentUser?.uid;
      const path = uid ? await resolvePostLoginPath(uid, destination) : destination;

      toast({ title: "Welcome back", description: "Redirecting you now." });
      navigate(path, { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  const activeTab = roleTabs.find((tab) => tab.id === activeRole) ?? roleTabs[0];

  return (
    <div className="auth-page relative z-10 flex min-h-screen w-full flex-col justify-center px-4 pt-4 pb-8">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white/70 px-4 py-2 text-sm font-bold text-slate-500 shadow-sm transition hover:text-orange-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <Link
          to={`/register?role=${activeRole}`}
          className="text-sm font-black text-orange-500 transition hover:text-orange-600"
        >
          Register -&gt;
        </Link>
      </div>

      <div className="auth-stage mx-auto grid w-full max-w-6xl items-center gap-6 py-8 lg:grid-cols-[0.95fr_1fr]">
        <div className="auth-visual-panel hidden min-h-[620px] overflow-hidden rounded-lg border border-white/10 bg-white/[0.055] p-8 shadow-2xl backdrop-blur-2xl lg:flex lg:flex-col lg:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-cyan-100">
              MyKalakar Access
            </span>
            <h2 className="mt-6 max-w-sm text-5xl font-black leading-[0.98] text-white">
              Enter the artist network.
            </h2>
          </div>
          <div className="auth-visual-stack grid gap-3">
            {["Verified talent graph", "Event-ready profiles", "Admin-grade governance"].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/[0.07] p-4 text-sm font-extrabold text-white/82 backdrop-blur-2xl">
                {item}
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md justify-self-center"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl gradient-bg shadow-[0_12px_40px_rgba(232,111,58,0.25)]">
              <Music className="h-7 w-7 text-white" />
            </div>
            <h1 className="font-display text-4xl font-black tracking-tight text-[#1A1A1A]">
              Step Back Into The Collective.
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">Sign in to your MyKalakar account</p>
          </div>

          <div className="glass-card mb-6 grid grid-cols-2 gap-1.5 rounded-2xl p-1.5">
            {roleTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveRole(tab.id)}
                className={`flex min-h-11 items-center justify-center rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                  activeRole === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                    : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form
            onSubmit={handleSubmit(submitLogin)}
            className="glass-panel rounded-3xl border border-white/50 bg-white/65 p-7 shadow-[0_20px_70px_rgba(15,23,42,0.12)] backdrop-blur-3xl"
            noValidate
          >
            <div className="mb-6 flex items-center gap-3 border-b border-slate-200/70 pb-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r ${activeTab.color} text-white`}>
                <LogIn className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-[#2E3A47]">Account Login</h2>
                <p className="text-xs font-semibold text-slate-500">Use your username and password.</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600">
                  <AtSign className="h-4 w-4 text-orange-500" />
                  Username
                </label>
                <input
                  type="text"
                  {...register("username")}
                  placeholder="your_username"
                  className={`input-glass w-full px-4 py-3 pl-4 text-sm ${errors.username ? "border-red-400 focus:border-red-500" : ""}`}
                />
                <FieldError message={errors.username?.message} />
              </div>

              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600">
                      <Lock className="h-4 w-4 text-orange-500" />
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={field.value}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        placeholder="Enter password"
                        className={`input-glass w-full px-4 py-3 pr-11 text-sm ${errors.password ? "border-red-400 focus:border-red-500" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <FieldError message={errors.password?.message} />
                  </div>
                )}
              />

              <button
                type="submit"
                disabled={!isValid || submitting}
                className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${activeTab.color} text-sm font-black uppercase tracking-widest text-white shadow-lg transition ${
                  !isValid || submitting ? "cursor-not-allowed opacity-50" : "hover:shadow-xl"
                }`}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                Sign In
              </button>
            </div>

            <p className="mt-6 text-center text-xs font-semibold text-slate-500">
              Do not have an account?{" "}
              <Link to={`/register?role=${activeRole}`} className="font-black text-orange-500 transition hover:text-orange-600">
                Register here -&gt;
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
