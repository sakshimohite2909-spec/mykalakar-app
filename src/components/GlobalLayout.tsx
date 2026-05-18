import React, { Suspense } from "react";
import { useLocation } from "react-router-dom";
import { Leva } from "leva";
import MobileBottomNav from "./MobileBottomNav";
import { useI18n } from "@/i18n/I18nProvider";

const AUTH_PATHS = ["/register", "/artist-register", "/admin-register", "/user-register", "/login", "/artist-login", "/admin-login", "/user-login"];

interface GlobalLayoutProps {
  children: React.ReactNode;
}

export default function GlobalLayout({ children }: GlobalLayoutProps) {
  const location = useLocation();
  const { t } = useI18n(); // ADDED FOR i18n
  const isAuthPage = AUTH_PATHS.includes(location.pathname);
  const isAntiGravityPage = location.pathname === "/antigravity";
  const showBottomNav =
    !isAuthPage &&
    !isAntiGravityPage &&
    !location.pathname.startsWith("/admin") &&
    !location.pathname.startsWith("/artist/dashboard");

  return (
    <>
      <Leva hidden={!isAntiGravityPage} />
      <div className="cinematic-backdrop" aria-hidden="true" />
      <div className="light-bg" aria-hidden="true" />

      <a href="#app-content" className="skip-link">{t("common.skipToContent")}</a> {/* ADDED FOR i18n */}
      <div id="app-content" className="cinematic-app relative z-10 min-h-screen overflow-x-hidden">
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center">
              <div className="rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-sm">
                <span className="text-sm font-extrabold text-stone-600">{t("common.loading")}</span> {/* ADDED FOR i18n */}
              </div>
            </div>
          }
        >
          {children}
        </Suspense>
      </div>
      {showBottomNav ? <MobileBottomNav /> : null}
    </>
  );
}
