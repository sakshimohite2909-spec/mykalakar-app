import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Twitter, Sparkles, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative mt-0 border-t border-orange-100/60">
      {/* Frosted glass panel */}
      <div className="relative bg-white/50 backdrop-blur-2xl border-t border-white/70 shadow-[0_-8px_32px_rgba(255,107,0,0.04)]">
        {/* Orange gloss highlight at top edge */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/60 to-transparent" />

        <div className="container mx-auto px-6 md:px-12 max-w-7xl py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

            {/* Brand Info */}
            <div className="space-y-6">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-5 w-5 text-foreground" />
                </div>
                <span className="text-[#1A1A1A] font-black text-lg tracking-tight">
                  My<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Kalakar</span>
                  <span className="ml-1 text-[10px] font-bold text-slate-400 tracking-widest uppercase align-middle">PRO</span>
                </span>
              </Link>
              <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs">
                Empowering artists and event organizers through a seamless, premium platform for creative discovery and booking across India.
              </p>
              <div className="flex gap-3 pt-2">
                {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                  <Link
                    key={i}
                    to="#"
                    className="p-2.5 rounded-xl border border-orange-100 bg-orange-50 text-slate-400 hover:text-orange-500 hover:border-orange-300 hover:bg-orange-50 transition-all hover:scale-110 active:scale-95 shadow-sm"
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Platform Links */}
            <div className="space-y-5">
              <h4 className="text-[#1A1A1A] font-black uppercase text-[10px] tracking-[0.25em]">Platform</h4>
              <div className="flex flex-col gap-3.5">
                {[
                  { label: "Find Artists", path: "/search" },
                  { label: "Become an Artist", path: "/register" },
                  { label: "Browse Categories", path: "/search" },
                  { label: "Book Events", path: "/events" },
                ].map(({ label, path }) => (
                  <Link
                    key={label}
                    to={path}
                    className="text-slate-500 hover:text-orange-600 font-semibold text-sm transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-orange-400 transition-colors" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Company Links */}
            <div className="space-y-5">
              <h4 className="text-[#1A1A1A] font-black uppercase text-[10px] tracking-[0.25em]">Company</h4>
              <div className="flex flex-col gap-3.5">
                {["About Us", "Our Goal", "Career Path", "Privacy Policy"].map((label) => (
                  <Link
                    key={label}
                    to="#"
                    className="text-slate-500 hover:text-orange-600 font-semibold text-sm transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-orange-400 transition-colors" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="space-y-5">
              <h4 className="text-orange-500 font-black uppercase text-[10px] tracking-[0.25em]">✦ STAY CONNECTED</h4>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Get exclusive artist showcases and event updates delivered directly to you.
              </p>
              <form className="flex flex-col gap-3 pt-2" onSubmit={(e) => e.preventDefault()}>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-300" />
                  <input
                    type="email"
                    placeholder="Your Email Address"
                    className="input-glass w-full rounded-xl pl-10 pr-4 py-3 text-xs placeholder:text-slate-400 text-[#1A1A1A]"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl py-3 text-[10px] font-black uppercase tracking-widest text-foreground bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Join MyKalakar
                </button>
              </form>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-orange-100/60 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
              © {new Date().getFullYear()} MyKalakar India. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {["Cookies", "Security", "Accessibility"].map((label) => (
                <Link
                  key={label}
                  to="#"
                  className="text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-orange-500 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
