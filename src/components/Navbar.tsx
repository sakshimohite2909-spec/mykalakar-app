import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Eye,
  Globe2,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Music2,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  UserCircle,
  UsersRound,
  X,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { languageToLocale, type Language, useI18n } from "@/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SmartImage } from "@/components/SmartImage";
import { STATIC_IMAGES, imageRegistry } from "@/services/ImageRegistryService";
import { getInitials } from "@/services/dataNormalizer";
import { getUsableImageUrl } from "@/utils/fallbackImages";

import { EVENT_CATEGORY_HIERARCHY } from "@/constants/artistSystem";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentUser, artistData, userProfile, userRole, isAdmin, isTelecaller, logout } = useAuth();
  const { language, languages, setLanguage, t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 14);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const profileValue = (key: string) => {
    const value = userProfile?.[key];
    return typeof value === "string" ? value : "";
  };

  const artistMedia = typeof artistData?.media === "object" && artistData.media !== null
    ? artistData.media as Record<string, unknown>
    : null;
  const artistPhoto = typeof artistMedia?.profilePhoto === "string"
    ? artistMedia.profilePhoto
    : typeof artistData?.profilePhoto === "string"
      ? artistData.profilePhoto
      : "";
  const fallbackArtistPhoto = artistData
    ? imageRegistry.getUniqueImage({
        category: (artistData.subcategory as string) || (artistData.artForm as string) || (artistData.category as string) || "Performers",
        type: "artist",
        key: artistData.uid || artistData.id || artistData.name || "navbar-artist",
      })
    : "";
  const profilePhoto = getUsableImageUrl(artistPhoto || profileValue("profilePhoto")) || fallbackArtistPhoto;
  const displayName =
    artistData?.name ||
    profileValue("name") ||
    profileValue("username") ||
    currentUser?.email?.split("@")[0] ||
    "User";
  const firstName = displayName.split(" ")[0] || "User";
  const canViewArtistProfile = Boolean(
    artistData && (artistData.status === "active" || artistData.status === "approved"),
  );
  const dashboardPath = userRole === "artist" ? "/artist/dashboard" : "/profile";
  const dashboardLabel = userRole === "artist" ? t("nav.artistDashboard") : t("nav.myProfile");
  const showDashboardLink = dashboardPath !== "/profile";

  const navLinks = useMemo(
    () => [
      { label: t("nav.home") || "Home", href: "/", icon: Home },
      { label: t("nav.artists"), href: "/artists", icon: UsersRound },
      { label: t("nav.events"), href: "/events", icon: CalendarDays },
    ],
    [t],
  );

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    if (href === "/artists") return location.pathname.startsWith("/artists") || location.pathname.startsWith("/artist/") || location.pathname.startsWith("/search") || location.pathname.startsWith("/explore");
    if (href === "/events") return location.pathname.startsWith("/events") || location.pathname.startsWith("/event") || location.pathname.startsWith("/location");
    if (href.includes("#")) return location.pathname === "/" && location.hash === href.slice(href.indexOf("#"));
    return location.pathname === href;
  };


  return (
    <header className="site-header fixed top-0 inset-x-0 w-full h-20 flex items-center justify-between z-40 bg-white/70 backdrop-blur-md px-3 md:px-4">
      <div className="site-nav-shell mx-auto flex w-full max-w-[1200px] items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {location.pathname !== "/" && (
            <button
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-stone-700 shadow-sm transition hover:bg-stone-50 hover:text-orange-600"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <Link to="/" className="brand-lockup flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/35">
            <img 
              src={STATIC_IMAGES.logo} 
              alt="MyKalakar" 
              className="h-10 md:h-12 w-auto object-contain transition-transform duration-200 hover:scale-[1.02]"
              style={{ imageRendering: "auto" }}
            />
          </Link>
        </div>

        <nav className="mx-auto hidden items-center gap-1 lg:flex">
          {navLinks.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              to={href}
              className={`nav-underline group inline-flex min-h-10 items-center gap-2 rounded-full px-3 py-2 text-sm font-bold drop-shadow-md transition ${
                isActive(href) ? "text-orange-700" : "text-stone-600 hover:text-stone-950"
              }`}
            >
              <Icon className="h-4 w-4 text-orange-600/80" />
              {label}
            </Link>
          ))}

          {/* Categories Dropdown (WeddingBazaar Style) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="group inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold text-stone-600 hover:text-stone-950 transition drop-shadow-md"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Categories</span>
                <ChevronDown className="h-3.5 w-3.5 text-stone-400 group-hover:text-stone-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-80 max-h-[460px] overflow-y-auto rounded-2xl border-orange-100/80 bg-white/95 p-2 shadow-2xl backdrop-blur-xl">
              {Object.entries(EVENT_CATEGORY_HIERARCHY).map(([eventName, eventData]) => (
                <div key={eventName} className="mb-2.5 last:mb-0 border-b border-stone-100 pb-2 last:border-b-0 last:pb-0">
                  <div
                    onClick={() => navigate(`/artists?category=${encodeURIComponent(eventName)}`)}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-black uppercase tracking-wider text-orange-600 hover:bg-orange-50 rounded-xl cursor-pointer"
                  >
                    <span>{eventData.icon}</span>
                    <span>{eventName}</span>
                  </div>
                  <div className="pl-3 pr-2 py-0.5 space-y-1">
                    {Object.entries(eventData.groups).map(([groupName, groupData]) => (
                      <div key={groupName} className="text-xs">
                        <span className="font-bold text-stone-800 flex items-center gap-1 py-0.5">
                          <span className="text-xs">{groupData.icon}</span>
                          <span>{groupName}</span>
                        </span>
                        <div className="flex flex-wrap gap-1 pl-2.5 pt-0.5 pb-1">
                          {groupData.subcategories.slice(0, 5).map((sub) => (
                            <Link
                              key={sub}
                              to={`/artists?subCategory=${encodeURIComponent(sub)}`}
                              className="text-[11px] font-medium text-stone-500 hover:text-orange-600 hover:underline"
                            >
                              {sub} •
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex min-h-10 items-center gap-2 rounded-full border border-stone-200 bg-white py-1 pl-1 pr-3 text-stone-800 shadow-sm transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/35"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-600 text-xs font-extrabold text-white">
                    {profilePhoto ? <SmartImage src={profilePhoto} alt={displayName} showSkeleton={false} aspectRatio="aspect-auto" containerClassName="h-full w-full rounded-full" /> : getInitials(displayName)}
                  </span>
                  <span className="hidden text-left xl:block">
                    <span className="block text-[11px] font-semibold leading-3 text-stone-500">{t("nav.welcome")}</span>
                    <span className="block text-sm font-extrabold leading-4 text-stone-950">{firstName}</span>
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl border-orange-100/80 bg-[#fffaf2]/95 p-2 shadow-xl backdrop-blur-xl">
                <DropdownMenuItem className="cursor-pointer rounded-xl py-2.5 font-semibold" onClick={() => navigate("/profile")}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  {t("nav.myProfile")}
                </DropdownMenuItem>
                {canViewArtistProfile ? (
                  <DropdownMenuItem className="cursor-pointer rounded-xl py-2.5 font-semibold" onClick={() => navigate(`/artist/${artistData!.uid || artistData!.id}`)}>
                    <Eye className="mr-2 h-4 w-4" />
                    {t("nav.viewPublicPage")}
                  </DropdownMenuItem>
                ) : null}
                {isAdmin && (
                  <DropdownMenuItem className="cursor-pointer rounded-xl py-2.5 font-semibold" onClick={() => navigate("/admin")}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    {t("nav.adminConsole") || "Admin Console"}
                  </DropdownMenuItem>
                )}
                {(isTelecaller || isAdmin) && (
                  <DropdownMenuItem className="cursor-pointer rounded-xl py-2.5 font-semibold text-orange-600 focus:text-orange-600" onClick={() => navigate("/telecaller")}>
                    <PhoneCall className="mr-2 h-4 w-4 text-orange-600" />
                    Telecaller Console
                  </DropdownMenuItem>
                )}
                {showDashboardLink ? (
                  <DropdownMenuItem className="cursor-pointer rounded-xl py-2.5 font-semibold" onClick={() => navigate(dashboardPath)}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {dashboardLabel}
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem className="cursor-pointer rounded-xl py-2.5 font-semibold text-red-600 focus:text-red-600" onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login" className="inline-flex min-h-10 items-center rounded-full px-4 text-sm font-bold text-stone-700 transition hover:bg-white/70">
                {t("nav.login")}
              </Link>
              <Link to="/register?role=artist" className="btn-glass-primary inline-flex min-h-10 items-center rounded-full px-5 text-sm">
                <Sparkles className="h-4 w-4" />
                {t("nav.joinArtist")}
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="nav-icon-button ml-auto md:hidden"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label={t("nav.menu")}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {mobileOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-stone-950/5 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
        ) : null}

        {mobileOpen ? (
          <div className="absolute left-3 right-3 top-[calc(100%+0.5rem)] z-50 grid gap-2 rounded-2xl border border-orange-100/70 bg-[#fffaf2]/95 p-2 shadow-xl backdrop-blur-xl md:hidden">
            <div className="grid gap-1">
              {navLinks.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  to={href}
                  className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-stone-700 transition hover:bg-white/75"
                >
                  <Icon className="h-4 w-4 text-orange-600" />
                  {label}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher compact />
              {currentUser ? (
              <Link to="/profile" className="mobile-menu-action flex min-h-11 flex-1 items-center justify-center rounded-xl bg-orange-600 px-4 text-sm font-bold text-white"> {/* ADDED FOR i18n */}
                  {t("nav.myProfile")}
                </Link>
              ) : (
                <>
                  <Link to="/login" className="mobile-menu-action flex min-h-11 flex-1 items-center justify-center rounded-xl bg-white px-4 text-sm font-bold text-stone-700"> {/* ADDED FOR i18n */}
                    {t("nav.login")}
                  </Link>
                  <Link to="/register?role=artist" className="mobile-menu-action flex min-h-11 flex-1 items-center justify-center rounded-xl bg-orange-600 px-4 text-sm font-bold text-white"> {/* ADDED FOR i18n */}
                    {t("nav.joinArtist")}
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
