import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Twitter,
  Youtube,
  Heart,
  CheckCircle2,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { STATIC_IMAGES } from "@/services/ImageRegistryService";

const socialLinks = [
  { Icon: Facebook, href: "https://facebook.com", label: "Facebook" },
  { Icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { Icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { Icon: Youtube, href: "https://youtube.com", label: "YouTube" },
] as const;

export default function Footer() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  const footerGroups = [
    {
      title: t("footer.platform"),
      links: [
        { label: t("footer.exploreAll"), path: "/explore" },
        { label: t("footer.findArtists"), path: "/artists" },
        { label: t("footer.browseEvents"), path: "/events" },
        { label: t("footer.registerArtist"), path: "/register?role=artist" },
      ],
    },
    {
      title: t("footer.support"),
      links: [
        { label: t("nav.myProfile"), path: "/profile" },
        { label: t("footer.artistLogin"), path: "/login" },
        { label: t("nav.search"), path: "/search" },
      ],
    },
  ];

  return (
    <footer className="site-footer relative overflow-hidden pt-10 pb-8">
      <div className="container mx-auto max-w-[1240px] px-4">
        {/* Top Trust & Value Props Bar */}
        <div className="border-b border-stone-200/70 pb-8 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center md:text-left">
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-sm transition hover:shadow-md hover:border-orange-200">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h5 className="text-xs font-black uppercase tracking-wider text-stone-900">Verified Performers</h5>
                <p className="text-xs font-medium text-stone-500">Authentic Maharashtrian & Indian artists</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-sm transition hover:shadow-md hover:border-orange-200">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h5 className="text-xs font-black uppercase tracking-wider text-stone-900">Direct Event Booking</h5>
                <p className="text-xs font-medium text-stone-500">Transparent briefs with zero brokerage</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-sm transition hover:shadow-md hover:border-orange-200">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white shadow-sm">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <h5 className="text-xs font-black uppercase tracking-wider text-stone-900">26+ Years Cultural Legacy</h5>
                <p className="text-xs font-medium text-stone-500">Celebrating traditional arts & heritage</p>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-luxury-grid">
          {/* Brand Column */}
          <div className="footer-luxury-brand">
            <Link to="/" className="footer-brand-lockup inline-block transition-transform duration-200 hover:scale-[1.02]">
              <img src={STATIC_IMAGES.logo} alt={t("brand.name")} className="h-11 md:h-12 w-auto object-contain" />
            </Link>
            <p className="text-stone-600 text-sm leading-relaxed">
              {t("footer.description")}
            </p>
            
            {/* Quick Contact Badge */}
            <div className="flex flex-col gap-1.5 text-xs text-stone-500 font-semibold my-1">
              <a href="tel:+919876543210" className="inline-flex items-center gap-2 text-orange-600 font-extrabold hover:underline">
                <Phone className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                Helpline: +91 98765 43210
              </a>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                Pune, Maharashtra, India
              </span>
              <span className="inline-flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                support@mykalakar.com
              </span>
            </div>

            {/* Social Links */}
            <div className="footer-social-row mt-2">
              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Nav Groups */}
          {footerGroups.map((group) => (
            <nav key={group.title} className="footer-link-group" aria-label={group.title}>
              <h4 className="text-sm font-black uppercase tracking-wider text-stone-900">{group.title}</h4>
              {group.links.map((link) => (
                <Link
                  key={link.label}
                  to={link.path}
                  className="text-sm font-semibold text-stone-600 transition-colors hover:text-orange-600"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}

          {/* Newsletter Column */}
          <div className="footer-newsletter">
            <h4 className="text-sm font-black uppercase tracking-wider text-stone-900">{t("footer.stayConnected")}</h4>
            <p className="text-xs text-stone-600 leading-relaxed">{t("footer.newsletterText")}</p>
            
            <form onSubmit={handleSubscribe} className="mt-2 space-y-2">
              <div className="relative">
                <label className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2.5 shadow-sm focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20">
                  <Mail className="h-4 w-4 text-stone-400 shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("footer.emailPlaceholder")}
                    required
                    className="w-full text-xs font-medium text-stone-900 placeholder-stone-400 focus:outline-none bg-transparent"
                  />
                </label>
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-md transition-all hover:from-orange-700 hover:to-orange-800 hover:shadow-lg active:scale-[0.98]"
              >
                <span>{t("footer.join")}</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>

            {subscribed && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Thank you! You are subscribed.
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-stone-200 text-xs text-stone-500">
          <p className="font-medium text-center md:text-left">{t("footer.copyright", { year: new Date().getFullYear() })}</p>
          
          <div className="flex items-center gap-1 font-semibold text-stone-600">
            <span>Made with</span>
            <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500 inline" />
            <span>for Indian Art & Culture</span>
          </div>

          <div className="flex items-center gap-4 font-semibold">
            <Link to="/" className="hover:text-orange-600 transition-colors">{t("footer.privacy")}</Link>
            <span className="text-stone-300">•</span>
            <Link to="/" className="hover:text-orange-600 transition-colors">{t("footer.terms")}</Link>
            <span className="text-stone-300">•</span>
            <Link to="/" className="hover:text-orange-600 transition-colors">{t("footer.accessibility")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

