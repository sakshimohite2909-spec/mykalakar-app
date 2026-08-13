import { useState } from "react";
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
  CalendarDays,
  PlusCircle,
  Clock,
  Music2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NewRequirementModal from "@/components/NewRequirementModal";
import { getCategoriesForEvent, MAIN_EVENT_CARDS } from "@/constants/artistSystem";

const CATEGORY_ICON_MAP: Record<string, any> = {
  "Spiritual Speakers": Sparkles,
  "Vocal Artists": Music2,
  "Instrumental Artists": Music2,
  "Organizations": Building2,
  "Event Services": Building2,
  "Venues": Building2,
  "Bridal & Groom Services": Paintbrush,
  "Photography & Videography": Camera,
  "Entertainment": Sparkles,
  "Catering": Utensils,
  "Decoration": Flower2,
  "Event Setup": Building2,
  "Transportation": Car,
  "Guest Hospitality": Building2,
  "Invitations": Mail,
  "Wedding Essentials": Gift,
  "Shopping": ShoppingBag,
};

export const EVENT_LEVEL1_DATA: Record<
  string,
  {
    title: string;
    subtitle: string;
    heroImage: string;
  }
> = {
  "Varkari Sampraday": {
    title: "Varkari Sampraday",
    subtitle: "Connect with authentic Kirtankars, Pravachankars, Bhajani Mandals & Mridangam artists.",
    heroImage:
      "https://images.pexels.com/photos/34193177/pexels-photo-34193177.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
  },
  Wedding: {
    title: "Wedding",
    subtitle: "Plan your dream wedding with the best artists and services.",
    heroImage:
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1200&auto=format&fit=crop",
  },
  Birthday: {
    title: "Birthday",
    subtitle: "Make birthday celebrations unforgettable with magicians, balloon decorators & DJs.",
    heroImage:
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80",
  },
  "Corporate Event": {
    title: "Corporate Event",
    subtitle: "Hire professional anchors, keynote speakers, AV lighting & stage performers.",
    heroImage:
      "https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
  },
  "Cultural Event": {
    title: "Cultural Event",
    subtitle: "Experience vibrant traditional folk arts, Gondhal, Bharud, Lezim & Dhol Tasha Pathak.",
    heroImage:
      "https://images.pexels.com/photos/17264037/pexels-photo-17264037.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
  },
  "Religious Event": {
    title: "Religious Event",
    subtitle: "Pooja Pandits, Ram Katha Recitations & Spiritual Bhajans.",
    heroImage:
      "https://images.unsplash.com/photo-1608613304899-ea8098577e38?q=80&w=1200&auto=format&fit=crop",
  },
  "College Event": {
    title: "College Event",
    subtitle: "Rock Bands, Pro DJs, Fest Anchors & Dance Troupe Acts.",
    heroImage:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop",
  },
  "Festival Event": {
    title: "Festival Event",
    subtitle: "Dhol Tasha Pathak, Grand Fireworks & Procession Ensembles.",
    heroImage:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop",
  },
  "Other Events": {
    title: "Other Events",
    subtitle: "Customized Event Setup, Media & Specialty Artist Booking.",
    heroImage:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop",
  },
};

export default function EventLevel1Page() {
  const { eventName } = useParams<{ eventName: string }>();
  const navigate = useNavigate();
  const [showRequirementModal, setShowRequirementModal] = useState(false);

  const decodedName = eventName ? decodeURIComponent(eventName) : "Wedding";
  const cardMeta = MAIN_EVENT_CARDS.find((c) => c.name.toLowerCase() === decodedName.toLowerCase());
  const eventMeta = EVENT_LEVEL1_DATA[decodedName] || {
    title: decodedName,
    subtitle: cardMeta?.description || `Explore top artists and vendors for ${decodedName}.`,
    heroImage: cardMeta?.image || "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1200&auto=format&fit=crop",
  };

  const dynamicCategories = getCategoriesForEvent(decodedName);

  return (
    <div className="min-h-screen bg-stone-50/50 flex flex-col font-sans antialiased pt-20">
      <Navbar />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between py-2 border-b border-stone-200/60 mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 overflow-x-auto whitespace-nowrap no-scrollbar pr-2">
            <Link to="/" className="hover:text-stone-900 transition-colors shrink-0">
              Home
            </Link>
            <span className="shrink-0">&gt;</span>
            <span className="text-stone-900 font-bold shrink-0">{eventMeta.title}</span>
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
              {eventMeta.title}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-stone-300 font-medium leading-relaxed">
              {eventMeta.subtitle}
            </p>
          </div>
          {/* Right Image with Fading Mask */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 md:w-5/12 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/60 to-transparent z-10" />
            <img
              src={eventMeta.heroImage}
              alt={eventMeta.title}
              className="h-full w-full object-cover object-center"
            />
          </div>
        </div>

        {/* Categories Grid or Empty State */}
        {dynamicCategories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4 md:gap-5 mb-10">
            {dynamicCategories.map((cat) => {
              const Icon = CATEGORY_ICON_MAP[cat.name] || Sparkles;
              const subCount = cat.subcategories.length;

              return (
                <Link
                  key={cat.name}
                  to={`/events/${encodeURIComponent(eventMeta.title)}/${encodeURIComponent(cat.name)}`}
                  className="group flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:border-orange-500 hover:shadow-md hover:-translate-y-1 transition-all duration-300 text-center min-h-[135px]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600 group-hover:scale-110 transition-transform mb-3">
                    <Icon className="h-5 w-5 stroke-[1.75]" />
                  </div>
                  <h3 className="text-sm font-extrabold text-stone-900 group-hover:text-orange-600 transition-colors leading-tight">
                    {cat.name}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-stone-400">
                    {subCount} {subCount === 1 ? "Subcategory" : "Subcategories"}
                  </p>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-stone-200/80 bg-white p-8 sm:p-12 text-center shadow-xs mb-10 flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-600 mb-4">
              <Clock className="h-8 w-8 stroke-[1.75]" />
            </div>
            <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Categories coming soon
            </h2>
            <p className="mt-2 text-stone-500 max-w-md text-sm font-medium leading-relaxed">
              Curated categories for <span className="font-bold text-stone-800">{eventMeta.title}</span> are currently being onboarded for Phase 1. Need an artist or service immediately?
            </p>
            <button
              onClick={() => setShowRequirementModal(true)}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Post Requirement</span>
            </button>
          </div>
        )}

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

      {/* Requirement Modal */}
      {showRequirementModal && (
        <NewRequirementModal open={showRequirementModal} onClose={() => setShowRequirementModal(false)} />
      )}

      <Footer />
    </div>
  );
}
