import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Camera,
  Sparkles,
  Flower2,
  Building2,
  Utensils,
  Paintbrush,
  Car,
  Mail,
  Gift,
  ShoppingBag,
  Search,
  ShieldCheck,
  UserCheck,
  Briefcase,
  Headphones,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const EVENT_LEVEL1_DATA: Record<
  string,
  {
    title: string;
    subtitle: string;
    heroImage: string;
    categories: Array<{
      name: string;
      servicesCount: string;
      icon: any;
      queryParam: string;
    }>;
  }
> = {
  Wedding: {
    title: "Wedding",
    subtitle: "Plan your dream wedding with the best artists and services.",
    heroImage:
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1200&auto=format&fit=crop",
    categories: [
      { name: "Photography", servicesCount: "24 Services", icon: Camera, queryParam: "Photography" },
      { name: "Entertainment", servicesCount: "18 Services", icon: Sparkles, queryParam: "Performers" },
      { name: "Decoration", servicesCount: "20 Services", icon: Flower2, queryParam: "Decoration" },
      { name: "Venue", servicesCount: "15 Services", icon: Building2, queryParam: "Venue" },
      { name: "Catering", servicesCount: "15 Services", icon: Utensils, queryParam: "Catering" },
      { name: "Makeup", servicesCount: "10 Services", icon: Paintbrush, queryParam: "Makeup" },
      { name: "Transport", servicesCount: "8 Services", icon: Car, queryParam: "Transport" },
      { name: "Invitation", servicesCount: "6 Services", icon: Mail, queryParam: "Invitation" },
      { name: "Essentials", servicesCount: "14 Services", icon: Gift, queryParam: "Essentials" },
      { name: "Shopping", servicesCount: "9 Services", icon: ShoppingBag, queryParam: "Shopping" },
    ],
  },
  "Varkari Sampraday": {
    title: "Varkari Sampraday",
    subtitle: "Connect with authentic Kirtankars, Pravachankars, Bhajani Mandals & Mridangam artists.",
    heroImage:
      "https://images.pexels.com/photos/34193177/pexels-photo-34193177.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
    categories: [
      { name: "Kirtan & Katha", servicesCount: "28 Services", icon: Sparkles, queryParam: "Kirtankar" },
      { name: "Bhajani Mandal", servicesCount: "22 Services", icon: Sparkles, queryParam: "Bhajani Mandal" },
      { name: "Pravachan", servicesCount: "16 Services", icon: Sparkles, queryParam: "Pravachankar" },
      { name: "Mridang & Taal", servicesCount: "19 Services", icon: Sparkles, queryParam: "Mridangamani" },
      { name: "Chopdar & Dindhi", servicesCount: "12 Services", icon: Sparkles, queryParam: "Chopdar" },
      { name: "Sound & Stage", servicesCount: "15 Services", icon: Building2, queryParam: "Sound System" },
      { name: "Decoration", servicesCount: "14 Services", icon: Flower2, queryParam: "Decoration" },
      { name: "Catering (Mahaprasad)", servicesCount: "18 Services", icon: Utensils, queryParam: "Catering" },
      { name: "Transport", servicesCount: "10 Services", icon: Car, queryParam: "Transport" },
      { name: "Photography", servicesCount: "12 Services", icon: Camera, queryParam: "Photography" },
    ],
  },
  Birthday: {
    title: "Birthday",
    subtitle: "Make birthday celebrations unforgettable with magicians, balloon decorators & DJs.",
    heroImage:
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80",
    categories: [
      { name: "Balloon Decor", servicesCount: "30 Services", icon: Flower2, queryParam: "Balloon Decorators" },
      { name: "Magicians", servicesCount: "15 Services", icon: Sparkles, queryParam: "Magicians" },
      { name: "DJs & Music", servicesCount: "25 Services", icon: Sparkles, queryParam: "DJs" },
      { name: "Tattoo & Face Painting", servicesCount: "12 Services", icon: Paintbrush, queryParam: "Tattoo Artist" },
      { name: "Catering & Cakes", servicesCount: "20 Services", icon: Utensils, queryParam: "Catering" },
      { name: "Game Hosts", servicesCount: "10 Services", icon: Sparkles, queryParam: "Anchors / Hosts" },
      { name: "Photography", servicesCount: "18 Services", icon: Camera, queryParam: "Photography" },
      { name: "Mascots & Clowns", servicesCount: "8 Services", icon: Sparkles, queryParam: "Clowns" },
      { name: "Venue", servicesCount: "14 Services", icon: Building2, queryParam: "Venue" },
      { name: "Return Gifts", servicesCount: "11 Services", icon: Gift, queryParam: "Gifts" },
    ],
  },
  "Corporate Event": {
    title: "Corporate Event",
    subtitle: "Hire professional anchors, keynote speakers, AV lighting & stage performers.",
    heroImage:
      "https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
    categories: [
      { name: "Anchors / Hosts", servicesCount: "32 Services", icon: Sparkles, queryParam: "Anchors / Hosts" },
      { name: "AV & LED Screen", servicesCount: "24 Services", icon: Building2, queryParam: "AV Setup" },
      { name: "Stage & Sound", servicesCount: "28 Services", icon: Building2, queryParam: "Sound System" },
      { name: "Keynote Speakers", servicesCount: "15 Services", icon: Sparkles, queryParam: "Speakers" },
      { name: "Live Bands", servicesCount: "20 Services", icon: Sparkles, queryParam: "Bands" },
      { name: "Photography & Video", servicesCount: "26 Services", icon: Camera, queryParam: "Photography" },
      { name: "Catering", servicesCount: "18 Services", icon: Utensils, queryParam: "Catering" },
      { name: "Venue", servicesCount: "16 Services", icon: Building2, queryParam: "Venue" },
      { name: "Event Management", servicesCount: "12 Services", icon: Gift, queryParam: "Event Management" },
      { name: "Gifting & Trophies", servicesCount: "14 Services", icon: Gift, queryParam: "Gifts" },
    ],
  },
  "Cultural Event": {
    title: "Cultural Event",
    subtitle: "Experience vibrant traditional folk arts, Gondhal, Bharud, Lezim & Dhol Tasha Pathak.",
    heroImage:
      "https://images.pexels.com/photos/17264037/pexels-photo-17264037.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
    categories: [
      { name: "Folk Dance & Lezim", servicesCount: "26 Services", icon: Sparkles, queryParam: "Lezim Pathak" },
      { name: "Dhol Tasha Pathak", servicesCount: "20 Services", icon: Sparkles, queryParam: "Dhol-Tasha Pathak" },
      { name: "Gondhal & Bharud", servicesCount: "18 Services", icon: Sparkles, queryParam: "Gondhal" },
      { name: "Shahiri & Powada", servicesCount: "14 Services", icon: Sparkles, queryParam: "Powada" },
      { name: "Traditional Music", servicesCount: "22 Services", icon: Sparkles, queryParam: "Traditional Arts" },
      { name: "Stage & Sound", servicesCount: "16 Services", icon: Building2, queryParam: "Sound System" },
      { name: "Costume & Makeup", servicesCount: "15 Services", icon: Paintbrush, queryParam: "Makeup" },
      { name: "Photography", servicesCount: "19 Services", icon: Camera, queryParam: "Photography" },
      { name: "Decoration", servicesCount: "17 Services", icon: Flower2, queryParam: "Decoration" },
      { name: "Catering", servicesCount: "13 Services", icon: Utensils, queryParam: "Catering" },
    ],
  },
};

export default function EventLevel1Page() {
  const { eventName } = useParams<{ eventName: string }>();
  const navigate = useNavigate();

  const decodedName = eventName ? decodeURIComponent(eventName) : "Wedding";
  const eventData = EVENT_LEVEL1_DATA[decodedName] || EVENT_LEVEL1_DATA["Wedding"];

  return (
    <div className="min-h-screen bg-stone-50/50 flex flex-col font-sans antialiased">
      <Navbar />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between py-2 border-b border-stone-200/60 mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 overflow-x-auto whitespace-nowrap no-scrollbar pr-2">
            <Link to="/" className="hover:text-stone-900 transition-colors shrink-0">
              Home
            </Link>
            <span className="shrink-0">&gt;</span>
            <span className="text-stone-900 font-bold shrink-0">{eventData.title}</span>
          </div>
          <button
            onClick={() => navigate("/search")}
            className="p-1.5 rounded-full hover:bg-stone-200/60 text-stone-500 transition"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        {/* Hero Section Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-stone-950 via-stone-900 to-stone-800 text-white p-6 sm:p-8 md:p-10 mb-8 min-h-[220px] sm:min-h-[240px] flex items-center shadow-lg">
          <div className="relative z-10 max-w-lg">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
              {eventData.title}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-stone-300 font-medium leading-relaxed">
              {eventData.subtitle}
            </p>
          </div>
          {/* Right Image with Fading Mask */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 md:w-5/12 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/60 to-transparent z-10" />
            <img
              src={eventData.heroImage}
              alt={eventData.title}
              className="h-full w-full object-cover object-center"
            />
          </div>
        </div>

        {/* Categories Grid (10 tiles in 5 cols x 2 rows) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-4 md:gap-5 mb-10">
          {eventData.categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.name}
                to={`/events/${encodeURIComponent(eventData.title)}/${encodeURIComponent(cat.name)}`}
                className="group flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:border-orange-400 hover:shadow-md hover:-translate-y-1 transition-all duration-300 text-center min-h-[135px]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600 group-hover:scale-110 transition-transform mb-3">
                  <Icon className="h-5 w-5 stroke-[1.75]" />
                </div>
                <h3 className="text-sm font-extrabold text-stone-900 group-hover:text-orange-600 transition-colors leading-tight">
                  {cat.name}
                </h3>
                <p className="mt-1 text-xs font-semibold text-stone-400">
                  {cat.servicesCount}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Trust Badges Bar */}
        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 md:p-6 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="flex items-center justify-center gap-2 text-stone-800 font-bold text-xs sm:text-sm">
            <ShieldCheck className="h-5 w-5 text-orange-600 shrink-0" />
            <span>Trusted Artists</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-stone-800 font-bold text-xs sm:text-sm">
            <UserCheck className="h-5 w-5 text-orange-600 shrink-0" />
            <span>Verified Profiles</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-stone-800 font-bold text-xs sm:text-sm">
            <Briefcase className="h-5 w-5 text-orange-600 shrink-0" />
            <span>Secure Booking</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-stone-800 font-bold text-xs sm:text-sm">
            <Headphones className="h-5 w-5 text-orange-600 shrink-0" />
            <span>24x7 Support</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
