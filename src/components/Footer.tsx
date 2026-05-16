import { Link } from "react-router-dom";
import { Facebook, Instagram, Mail, Sparkles, Twitter, Youtube } from "lucide-react";

const footerGroups = [
  {
    title: "Platform",
    links: [
      { label: "Explore All", path: "/explore" },
      { label: "Find Artists", path: "/artists" },
      { label: "Browse Events", path: "/events" },
      { label: "Register as Artist", path: "/artist-register" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "My Profile", path: "/profile" },
      { label: "Artist Login", path: "/artist-login" },
      { label: "Admin Login", path: "/admin-login" },
      { label: "Search", path: "/search" },
    ],
  },
];

const socialLinks = [
  { Icon: Facebook, href: "https://facebook.com", label: "Facebook" },
  { Icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { Icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { Icon: Youtube, href: "https://youtube.com", label: "YouTube" },
] as const;

export default function Footer() {
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
                MyKalakar
              </Link>
              <p>
                Premium artist discovery and event booking for cultural teams, performers, and organizers across India.
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
              <h4>Stay Connected</h4>
              <p>Receive curated artist showcases, new event briefs, and product updates.</p>
              <form onSubmit={(event) => event.preventDefault()}>
                <label>
                  <Mail className="h-4 w-4" />
                  <input type="email" placeholder="Email address" required />
                </label>
                <button type="submit">Join MyKalakar</button>
              </form>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <p>Copyright {new Date().getFullYear()} MyKalakar India. All rights reserved.</p>
            <div>
              <Link to="/">Privacy</Link>
              <Link to="/">Terms</Link>
              <Link to="/">Accessibility</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
