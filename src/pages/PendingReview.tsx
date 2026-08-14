import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Home, LogIn, Clock, ShieldCheck, Sparkles } from "lucide-react";

export default function PendingReview() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-[#FDFBF7] via-[#FFFDF9] to-[#FDFBF7]">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-amber-100 bg-white/90 p-6 sm:p-8 shadow-xl shadow-amber-900/5 backdrop-blur-md text-center relative"
      >
        {/* Top Decorative Subtle Orange Glow Accent */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-36 w-64 rounded-full bg-gradient-to-r from-orange-400/20 via-amber-300/30 to-orange-400/20 blur-2xl pointer-events-none" />

        {/* Check Icon with subtle animation */}
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/20 to-orange-500/20 blur-sm"
          />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.15 }}
            className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 ring-4 ring-orange-100"
          >
            <CheckCircle2 className="h-9 w-9 text-white stroke-[2.5]" />
          </motion.div>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50/80 px-4 py-1.5 text-xs font-bold text-amber-800 shadow-sm mb-4">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
          </span>
          <span>Status: Under Review</span>
        </div>

        {/* Heading */}
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#2E3A47] tracking-tight mb-3">
          Profile Submitted Successfully!
        </h1>

        {/* Main Body Text */}
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-4">
          Your artist profile has been submitted successfully.
        </p>
        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-6 bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
          Our team will review your profile and verify the submitted information. Once approved, your artist profile will become visible on MyKalakar.
        </p>

        {/* Optional Helper Note */}
        <div className="mb-8 flex items-start gap-2.5 text-left rounded-xl border border-amber-100/80 bg-amber-50/50 p-3.5 text-xs text-amber-900/90">
          <Clock className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
          <span>
            Profile approval may take some time. You can log in later to check your profile status.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 active:scale-[0.98]"
          >
            <Home className="h-4 w-4 text-slate-500" />
            Back to Home
          </Link>
          <Link
            to="/artist-login"
            className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition-all hover:from-orange-600 hover:to-amber-600 active:scale-[0.98]"
          >
            <LogIn className="h-4 w-4 text-white" />
            Go to Artist Login
          </Link>
        </div>

        {/* Security / Verification Badge Footer */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>MyKalakar Verified Artist Onboarding System</span>
        </div>
      </motion.div>
    </div>
  );
}
