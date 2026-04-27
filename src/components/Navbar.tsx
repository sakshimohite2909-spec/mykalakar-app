import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X, ChevronDown, Sparkles as SparklesIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentUser, artistData, logout } = useAuth();
  const navRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!navRef.current) return;
    const tween = gsap.to(navRef.current, { y: "+=3", duration: 4, ease: "sine.inOut", yoyo: true, repeat: -1 });
    return () => tween.kill();
  }, []);

  const navLinks = [
    { label: "Home",     path: "/" },
    { label: "Artists",  path: "/artists" },
    { label: "Events",   path: "/events" },
  ];

  const isActive = (path: string) => {
    const cur = location.pathname;
    if (path === "/") return cur === "/";
    if (path === "/artists") return (cur.startsWith("/artist") && !cur.includes("login") && !cur.includes("register")) || cur.startsWith("/search");
    if (path === "/events") return cur.startsWith("/event") || cur.startsWith("/location");
    return cur.startsWith(path);
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-[100] px-4 pt-4 md:px-8 pointer-events-none">
      <div
        ref={navRef}
        className="pointer-events-auto relative mx-auto flex max-w-6xl items-center gap-4 rounded-full px-5 py-3 transition-all duration-500"
        style={scrolled ? {
          background: "rgba(255, 255, 255, 0.4)",
          border: "1px solid rgba(255, 255, 255, 0.5)",
          backdropFilter: "blur(24px) saturate(160%)",
          WebkitBackdropFilter: "blur(24px) saturate(160%)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.05)",
        } : { background: "transparent" }}
      >
        {/* Tangerine glow line top */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 rounded-full"
          style={{ background: "linear-gradient(90deg, transparent, rgba(232,93,4,0.50), rgba(0,122,159,0.40), transparent)" }}
        />

        {/* Brand */}
        <Link to="/" className="relative z-10 flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform">
            <SparklesIcon className="w-4 h-4 text-foreground" />
          </div>
          <span className="font-display text-xl font-black text-[#1A1A1A] tracking-wider">
            My<span className="gradient-text-primary">Kalakar</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="relative z-10 hidden lg:flex items-center gap-8 ml-8 mr-auto">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${isActive(link.path) ? "text-orange-600" : "text-slate-500 hover:text-orange-600"}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="relative z-10 ml-auto flex items-center gap-2">
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 rounded-full pl-2 pr-3 py-1.5 cursor-pointer transition-all"
                  style={{ background: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,138,48,0.20)", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-foreground text-xs font-black overflow-hidden shrink-0"
                    style={{ background: "linear-gradient(135deg, #E85D04, #007A9F)", boxShadow: "0 0 12px rgba(232,93,4,0.40)" }}>
                    {artistData?.profilePhoto ? (
                      <img src={artistData.profilePhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{artistData?.name?.[0] || currentUser.email?.[0]?.toUpperCase() || "U"}</span>
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-[9px] font-bold uppercase tracking-wider leading-none" style={{ color: "#475569" }}>Welcome</p>
                    <p className="text-xs font-black leading-none mt-0.5" style={{ color: "#1A1A1A" }}>
                      {artistData?.name?.split(" ")[0] || currentUser.email?.split("@")[0] || "User"}
                    </p>
                  </div>
                  <ChevronDown className="w-3 h-3 ml-1" style={{ color: "#475569" }} />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-2xl shadow-2xl mt-2 p-2"
                style={{ background: "rgba(255,246,237,0.95)", border: "1px solid rgba(255,138,48,0.20)", backdropFilter: "blur(24px)" }}>
                <DropdownMenuItem
                  className="rounded-xl cursor-pointer font-bold transition-colors text-sm py-2.5 hover:bg-orange-100"
                  style={{ color: "#1A1A1A" }}
                  onClick={() => navigate(artistData ? `/artist/${artistData.id}` : "/")}
                >
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-xl cursor-pointer font-bold transition-colors text-sm py-2.5 hover:bg-orange-100"
                  style={{ color: "#1A1A1A" }}
                  onClick={() => navigate("/artist/dashboard")}
                >
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-xl cursor-pointer font-bold transition-colors mt-1 text-sm py-2.5 hover:bg-red-50"
                  style={{ color: "#E11D48" }}
                  onClick={() => logout()}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link
                to="/register"
                className="hidden sm:block rounded-full px-5 py-2 text-[11px] font-black uppercase tracking-widest transition-all"
                style={{ color: "#1A1A1A", border: "1px solid rgba(255,138,48,0.25)", background: "rgba(255,255,255,0.60)", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}
              >
                Register
              </Link>
              <Link
                to="/login"
                className="rounded-full px-5 py-2 text-[11px] font-black uppercase tracking-widest text-[#FFFFFF] transition-all hover:scale-105 active:scale-95"
                style={{ background: "linear-gradient(135deg, #E85D04, #007A9F)", boxShadow: "0 4px 16px rgba(232,93,4,0.40)" }}
              >
                Login
              </Link>
            </>
          )}

          {/* Mobile toggle */}
          <button
            className="lg:hidden rounded-full p-2.5 transition-all text-[#1A1A1A]"
            style={{ border: "1px solid rgba(255,138,48,0.25)", background: "rgba(255,255,255,0.70)" }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="pointer-events-auto mx-auto mt-2 max-w-6xl rounded-3xl px-4 py-4 flex flex-col gap-2 shadow-xl shadow-orange-900/5"
          style={{ background: "rgba(255,246,237,0.95)", border: "1px solid rgba(255,138,48,0.15)", backdropFilter: "blur(24px)" }}>
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className={`rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all ${isActive(link.path) ? "text-orange-600 bg-orange-50" : "text-slate-500"}`}
            >
              {link.label}
            </Link>
          ))}
          {!currentUser && (
            <Link
              to="/register"
              className="rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider text-center transition-all bg-white"
              style={{ color: "#1A1A1A", border: "1px solid rgba(255,138,48,0.25)", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}
            >
              Register
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
