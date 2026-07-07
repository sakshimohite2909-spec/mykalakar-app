import { Link } from "react-router-dom";
import { Facebook, Instagram, Mail, Sparkles, Twitter, Youtube } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

const socialLinks = [
  { Icon: Facebook, href: "https://facebook.com", label: "Facebook" },
  { Icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { Icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { Icon: Youtube, href: "https://youtube.com", label: "YouTube" },
] as const;

export default function Footer() {
  const { t } = useI18n(); // ADDED FOR i18n
  const footerGroups = [ // ADDED FOR i18n
    {
      title: t("footer.platform"),
      links: [
        { label: t("footer.exploreAll"), path: "/explore" },
        { label: t("footer.findArtists"), path: "/artists" },
        { label: t("footer.browseEvents"), path: "/events" },
        { label: t("footer.registerArtist"), path: "/artist-register" },
      ],
    },
    {
      title: t("footer.support"),
      links: [
        { label: t("nav.myProfile"), path: "/profile" },
        { label: t("footer.artistLogin"), path: "/artist-login" },
        { label: t("footer.adminLogin"), path: "/admin-login" },
        { label: t("nav.search"), path: "/search" },
      ],
    },
  ];

  return (
    <footer className="site-footer">
      <div>
        <div className="container">
          <div className="footer-luxury-grid">
            <div className="footer-luxury-brand">
              <Link to="/" className="footer-brand-lockup">
                <span>
                  <Sparkles className="h-5 w-5" />
                </span>
                {t("brand.name")} {/* ADDED FOR i18n */}
              </Link>
              <p>
                {t("footer.description")} {/* ADDED FOR i18n */}
              </p>
              <div className="footer-social-row">
                {socialLinks.map(({ Icon, href, label }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {footerGroups.map((group) => (
              <nav key={group.title} className="footer-link-group" aria-label={group.title}>
                <h4>{group.title}</h4>
                {group.links.map((link) => (
                  <Link key={link.label} to={link.path}>
                    {link.label}
                  </Link>
                ))}
              </nav>
            ))}

            <div className="footer-newsletter">
              <h4>{t("footer.stayConnected")}</h4> {/* ADDED FOR i18n */}
              <p>{t("footer.newsletterText")}</p> {/* ADDED FOR i18n */}
              <form onSubmit={(event) => event.preventDefault()}>
                <label>
                  <Mail className="h-4 w-4" />
                  <input type="email" placeholder={t("footer.emailPlaceholder")} required /> {/* ADDED FOR i18n */}
                </label>
                <button type="submit">{t("footer.join")}</button> {/* ADDED FOR i18n */}
              </form>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <p>{t("footer.copyright", { year: new Date().getFullYear() })}</p> {/* ADDED FOR i18n */}
            <div>
              <Link to="/">{t("footer.privacy")}</Link> {/* ADDED FOR i18n */}
              <Link to="/">{t("footer.terms")}</Link> {/* ADDED FOR i18n */}
              <Link to="/">{t("footer.accessibility")}</Link> {/* ADDED FOR i18n */}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
