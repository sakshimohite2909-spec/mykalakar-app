import { type ComponentType, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  AtSign,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Music,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type AuthRole = "admin" | "artist" | "user";

const roleTabs: Array<{ id: AuthRole; label: string; icon: ComponentType<{ className?: string }>; color: string }> = [
  { id: "admin", label: "Admin", icon: Building2, color: "from-orange-500 via-amber-400 to-rose-500" },
  { id: "artist", label: "Artist", icon: Sparkles, color: "from-orange-500 to-amber-400" },
  { id: "user", label: "User", icon: User, color: "from-rose-500 to-amber-400" },
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

function useRoleFromQuery(defaultRole: AuthRole = "user") {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const roleParam = searchParams.get("role");
  const pathRole: AuthRole | null = location.pathname.includes("admin")
    ? "admin"
    : location.pathname.includes("artist")
    ? "artist"
    : location.pathname.includes("user")
    ? "user"
    : null;
  const activeRole: AuthRole = roleParam === "admin" || roleParam === "artist" || roleParam === "user" ? roleParam : pathRole ?? defaultRole;

  const setActiveRole = (role: AuthRole) => {
    setSearchParams({ role }, { replace: true });
  };

  return [activeRole, setActiveRole] as const;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-semibold text-red-500">{message}</p>;
}

function RoleTabs({
  activeRole,
  onChange,
}: {
  activeRole: AuthRole;
  onChange: (role: AuthRole) => void;
}) {
  return (
    <div className="glass-card mb-6 grid grid-cols-3 gap-1.5 rounded-2xl p-1.5">
      {roleTabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
              activeRole === tab.id
                ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default function ArtistLogin() {
  const [activeRole, setActiveRole] = useRoleFromQuery("user");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingRole, setLoadingRole] = useState<AuthRole | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = location.state?.from?.pathname || "/artists";

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
    setLoadingRole(activeRole);
    try {
      const result = await login(syntheticEmail(values.username), values.password);

      if (!result.success) {
        toast({ variant: "destructive", title: "Login failed", description: result.message });
        return;
      }

      toast({ title: "Welcome back", description: "Redirecting you now." });

      if (activeRole === "artist") {
        navigate("/artist/dashboard");
      } else if (activeRole === "admin") {
        navigate("/admin");
      } else {
        navigate(destination === "/artists" ? "/profile" : destination);
      }
    } finally {
      setLoadingRole(null);
    }
  };

  const activeTab = roleTabs.find((tab) => tab.id === activeRole) ?? roleTabs[2];
  const ActiveIcon = activeTab.icon;

  return (
    <div className="relative z-10 flex min-h-screen w-full flex-col px-4 py-8">
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

      <div className="flex flex-1 items-center justify-center py-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
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

          <RoleTabs activeRole={activeRole} onChange={setActiveRole} />

          <form
            onSubmit={handleSubmit(submitLogin)}
            className="glass-panel rounded-3xl border border-white/50 bg-white/65 p-7 shadow-[0_20px_70px_rgba(15,23,42,0.12)] backdrop-blur-3xl"
            noValidate
          >
            <div className="mb-6 flex items-center gap-3 border-b border-slate-200/70 pb-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r ${activeTab.color} text-white`}>
                <ActiveIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-[#2E3A47]">
                  {activeRole === "admin" ? "Admin Login" : activeRole === "artist" ? "Artist Login" : "User Login"}
                </h2>
                <p className="text-xs font-semibold text-slate-500">Use your username and password.</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600">
                  {activeRole === "admin" ? <Building2 className="h-4 w-4 text-orange-500" /> : <AtSign className="h-4 w-4 text-orange-500" />}
                  {activeRole === "admin" ? "Admin Username" : "Username"}
                </label>
                <input
                  type="text"
                  {...register("username")}
                  placeholder={activeRole === "admin" ? "admin_username" : "your_username"}
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
                disabled={!isValid || loadingRole === activeRole}
                className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${activeTab.color} text-sm font-black uppercase tracking-widest text-white shadow-lg transition ${
                  !isValid || loadingRole === activeRole ? "cursor-not-allowed opacity-50" : "hover:shadow-xl"
                }`}
              >
                {loadingRole === activeRole ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                Sign In as {activeTab.label}
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
r}
