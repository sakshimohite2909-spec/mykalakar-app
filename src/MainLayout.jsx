import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Leva } from "leva";
import { Loader2 } from "lucide-react";
import MobileBottomNav from "@/components/MobileBottomNav";
import ScrollToTop from "@/components/ScrollToTop";
import { useI18n } from "@/i18n/I18nProvider";

const AUTH_PATHS = [
  "/register",
  "/artist-register",
  "/admin-register",
  "/user-register",
  "/login",
  "/artist-login",
  "/admin-login",
  "/user-login",
];

function PageLoader() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-transparent">
      <div className="rounded-lg border border-white/60 bg-white/45 px-5 py-4 shadow-sm backdrop-blur-2xl">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-700" />
      </div>
    </div>
  );
}

export default function MainLayout() {
  const location = useLocation();
  const { t } = useI18n();
  const isAuthPage = AUTH_PATHS.includes(location.pathname);
  const isAntiGravityPage = location.pathname === "/antigravity";
  const showBottomNav =
    !isAuthPage &&
    !isAntiGravityPage &&
    !location.pathname.startsWith("/admin") &&
    !location.pathname.startsWith("/artist/dashboard");

  return (
    <>
      <ScrollToTop />
      <Leva hidden={!isAntiGravityPage} />
      <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden bg-[#FDFBF7]" aria-hidden="true">
        <div className="absolute -left-32 top-8 h-80 w-80 rounded-full bg-purple-300/45 blur-[120px]" />
        <div className="absolute right-[-9rem] top-28 h-96 w-96 rounded-full bg-cyan-300/40 blur-[120px]" />
        <div className="absolute bottom-[-10rem] left-1/3 h-[28rem] w-[28rem] rounded-full bg-fuchsia-300/35 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.74),rgba(253,251,247,0.88))]" />
      </div>

      <a
        href="#app-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-black focus:text-[#1E1B4B]"
      >
        {t("common.skipToContent")}
      </a>

      <div id="app-content" className="relative z-10 min-h-screen overflow-x-hidden text-[#1F2937]">
        <Suspense fallback={<PageLoader />}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.main
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="min-h-screen"
            >
              <Outlet />
            </motion.main>
          </AnimatePresence>
        </Suspense>
      </div>

      {showBottomNav ? <MobileBottomNav /> : null}
    </>
  );
}
