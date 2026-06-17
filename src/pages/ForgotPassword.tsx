import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Loader2,
  Mail,
  Music,
  Send,
} from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";
import { getFirebaseErrorCode } from "@/lib/firebaseSafe";
import { mapAuthCodeToMessage } from "@/lib/AuthExceptionHandler";
import { useI18n } from "@/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-semibold text-red-500">{message}</p>;
}

export default function ForgotPassword() {
  const { t } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    formState: { errors, isValid },
    handleSubmit,
    register,
  } = useForm<ForgotPasswordValues>({
    defaultValues: {
      email: "",
    },
    mode: "onChange",
    resolver: zodResolver(forgotPasswordSchema),
  });

  const submitReset = async (values: ForgotPasswordValues) => {
    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, values.email);
      setSent(true);
      toast({
        title: t("auth.resetEmailSent") || "Reset Link Sent",
        description: t("auth.resetEmailSentDesc") || "Please check your inbox for password reset instructions.",
      });
    } catch (error: any) {
      console.error("Password reset failed:", error);
      const errorCode = getFirebaseErrorCode(error);
      const message = errorCode ? mapAuthCodeToMessage(errorCode) : (error.message || "An unexpected error occurred. Please try again.");
      toast({
        variant: "destructive",
        title: t("auth.resetFailed") || "Failed to Send Reset Email",
        description: message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page relative z-10 flex min-h-screen w-full flex-col justify-center px-4 pt-4 pb-8">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white/70 px-4 py-2 text-sm font-bold text-slate-500 shadow-sm transition hover:text-orange-600"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("auth.backToLogin") || "Back to Login"}
        </Link>
        <LanguageSwitcher compact />
      </div>

      <div className="auth-stage mx-auto grid w-full max-w-6xl items-center justify-center py-8">
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
              {t("auth.resetPasswordTitle") || "Reset Password"}
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {t("auth.resetPasswordSubtitle") || "Recover access to your account"}
            </p>
          </div>

          <div className="glass-panel rounded-3xl border border-white/50 bg-white/65 p-7 shadow-[0_20px_70px_rgba(15,23,42,0.12)] backdrop-blur-3xl">
            {sent ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Mail className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Check Your Inbox</h3>
                <p className="text-sm font-medium leading-relaxed text-slate-600">
                  We have sent password recovery instructions to your registered email address.
                </p>
                <Link
                  to="/login"
                  className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 text-sm font-black uppercase tracking-widest text-white shadow-lg transition hover:shadow-xl"
                >
                  Return to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(submitReset)} noValidate className="space-y-5">
                <div className="mb-4 border-b border-slate-200/70 pb-4">
                  <h2 className="font-display text-xl font-bold text-[#2E3A47]">
                    {t("auth.recoveryDetails") || "Recovery Details"}
                  </h2>
                  <p className="text-xs font-semibold text-slate-500">
                    Enter your email below to receive a reset link.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600">
                    <Mail className="h-4 w-4 text-orange-500" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    {...register("email")}
                    placeholder="e.g. yourname@example.com"
                    className={`input-glass w-full px-4 py-3 text-sm ${errors.email ? "border-red-400 focus:border-red-500" : ""}`}
                  />
                  <FieldError message={errors.email?.message} />
                </div>

                <button
                  type="submit"
                  disabled={!isValid || submitting}
                  className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 text-sm font-black uppercase tracking-widest text-white shadow-lg transition ${
                    !isValid || submitting ? "cursor-not-allowed opacity-50" : "hover:shadow-xl"
                  }`}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send Reset Link
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
