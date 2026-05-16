import { Home, Search, Sparkles, UserCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nProvider";

export default function MobileBottomNav() {
  const { currentUser } = useAuth();
  const { t } = useI18n();
  const location = useLocation();

  const itemClass = (active: boolean) =>
    `bottom-nav-item ${active ? "bg-white text-orange-700 shadow-sm" : ""}`;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-orange-100/80 bg-[#fffaf2]/90 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-2 shadow-[0_-10px_28px_rgba(124,45,18,0.12)] backdrop-blur-2xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 items-end gap-1">
        <Link to="/" className={itemClass(location.pathname === "/")}>
          <Home className="h-5 w-5" />
          <span>{t("bottom.home")}</span>
        </Link>
        <Link to="/explore" className={itemClass(location.pathname.startsWith("/explore") || location.pathname.startsWith("/artists") || location.pathname.startsWith("/search"))}>
          <Search className="h-5 w-5" />
          <span>{t("bottom.explore")}</span>
        </Link>
        <Link to="/events" className="bottom-nav-scan" aria-label={t("bottom.postEvent")}>
          <Sparkles className="h-6 w-6" />
          <span>{t("bottom.postEvent")}</span>
        </Link>
        <Link to={currentUser ? "/profile" : "/login"} className={itemClass(location.pathname === "/profile" || location.pathname.includes("login"))}>
          <UserCircle className="h-5 w-5" />
          <span>{currentUser ? t("bottom.profile") : t("bottom.login")}</span>
        </Link>
      </div>
    </nav>
  );
}
