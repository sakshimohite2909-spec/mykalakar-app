import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { CATEGORY_GROUP_OPTIONS } from "@/constants/artistSystem";

import { useI18n } from "@/i18n/I18nProvider";

const LOCAL_CUSTOM_CATS_KEY = "mykalakar_custom_categories";

function getLocalCustomCategories(): any[] {
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOM_CATS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const BROWSE_EVENTS = [
  {
    title: "Varkari Sampraday",
    subtitle: "Kirtan, Bhajan & Pravachan",
    image: "https://images.pexels.com/photos/34193177/pexels-photo-34193177.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    link: "/events/Varkari%20Sampraday",
  },
  {
    title: "Wedding",
    subtitle: "Venues, Makeup & Catering",
    image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
    link: "/events/Wedding",
  },
  {
    title: "Birthday",
    subtitle: "Magicians, Decorators & DJs",
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80",
    link: "/events/Birthday",
  },
  {
    title: "Corporate Event",
    subtitle: "Stage, AV & Keynote Hosts",
    image: "https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    link: "/events/Corporate%20Event",
  },
  {
    title: "Cultural Event",
    subtitle: "Folk Artists & Traditional Acts",
    image: "https://images.pexels.com/photos/17264037/pexels-photo-17264037.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    link: "/events/Cultural%20Event",
  },
  {
    title: "Religious Event",
    subtitle: "Pandits, Katha & Spiritual Bhajans",
    image: "https://images.unsplash.com/photo-1608613304899-ea8098577e38?auto=format&fit=crop&w=800&q=80",
    link: "/events/Religious%20Event",
  },
  {
    title: "College Event",
    subtitle: "Live Rock Bands, Fest Anchors & DJs",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
    link: "/events/College%20Event",
  },
  {
    title: "Festival Event",
    subtitle: "Dhol Tasha Pathak & Fireworks",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
    link: "/events/Festival%20Event",
  },
  {
    title: "Other Events",
    subtitle: "Custom Event Setup & Media",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
    link: "/events/Other%20Events",
  },
];


const CATEGORY_SUBTITLES: Record<string, string> = {
  Photography: "Photos & Cinematic Films",
  Videography: "Wedding Films & Reels",
  Catering: "Multi-cuisine Menus",
  Decoration: "Mandap & Florals",
  Florists: "Fresh Floral Arrangements",
  "Wedding Planner": "Full Coordination",
  "DJ & Music": "Live Entertainment",
  "Band & Baaja": "Traditional Bands",
  "Bridal Makeup": "Bridal Makeovers",
  "Hair Stylists": "Bridal Hair & Styling",
  "Mehendi Artist": "Henna & Mehendi",
  "Bridal Spa": "Pre-wedding Wellness",
  Jewellery: "Gold & Diamond",
  "Bridal Wear": "Lehengas & Sarees",
  Performers: "Live Singers, Bands & Acts",
  "Event Services": "Sound, Stage & AV Setup",
  "Folk & Traditional Arts": "Lavani, Dhol Tasha & Powada",
  "Spiritual & Varkari Sampraday": "Kirtan, Bhajan & Pravachan",
  Wedding: "Venues, Makeup & Catering",
  Birthday: "Magicians, Decorators & DJs",
  "Corporate Event": "Stage, AV & Keynote Hosts",
  "Cultural Event": "Folk Artists & Traditional Acts",
  "Religious Event": "Pandits, Katha & Spiritual Bhajans",
  "College Event": "Live Rock Bands, Fest Anchors & DJs",
  "Festival Event": "Dhol Tasha Pathak & Fireworks",
  "Other Events": "Custom Event Setup & Media",
  Painter: "Portraits, Sketches & Live Art",
};

const DEFAULT_CATEGORY_ICONS: Record<string, string> = {
  Photography: "📷",
  Videography: "📹",
  Catering: "🍽️",
  Decoration: "🌸",
  Florists: "💐",
  "Wedding Planner": "📋",
  "DJ & Music": "🎵",
  "Band & Baaja": "🎺",
  "Bridal Makeup": "💄",
  "Hair Stylists": "💇‍♀️",
  "Mehendi Artist": "🌿",
  "Bridal Spa": "🧖‍♀️",
  Jewellery: "💍",
  "Bridal Wear": "👰",
  Performers: "🎭",
  "Event Services": "🎥",
  "Folk & Traditional Arts": "🥁",
  "Spiritual & Varkari Sampraday": "🚩",
  Wedding: "💍",
  Birthday: "🎂",
  "Corporate Event": "💼",
  "Cultural Event": "🪕",
  "Religious Event": "🕉️",
  "College Event": "🎓",
  "Festival Event": "🎆",
  "Other Events": "🌟",
  Painter: "🎨",
};

const CATEGORY_POD_THEMES: Record<string, { bg: string; text: string; glow: string }> = {
  Painter: { bg: "bg-gradient-to-tr from-amber-100 to-orange-100", text: "text-amber-700", glow: "shadow-amber-500/20" },
  Performers: { bg: "bg-gradient-to-tr from-purple-100 to-pink-100", text: "text-purple-700", glow: "shadow-purple-500/20" },
  "Event Services": { bg: "bg-gradient-to-tr from-sky-100 to-indigo-100", text: "text-sky-700", glow: "shadow-sky-500/20" },
  "Folk & Traditional Arts": { bg: "bg-gradient-to-tr from-rose-100 to-orange-100", text: "text-rose-700", glow: "shadow-rose-500/20" },
  "Spiritual & Varkari Sampraday": { bg: "bg-gradient-to-tr from-amber-100 to-yellow-100", text: "text-amber-800", glow: "shadow-amber-500/25" },
  "Varkari Sampraday": { bg: "bg-gradient-to-tr from-amber-100 to-yellow-100", text: "text-amber-800", glow: "shadow-amber-500/25" },
  Wedding: { bg: "bg-gradient-to-tr from-red-100 to-rose-100", text: "text-red-700", glow: "shadow-red-500/20" },
  Birthday: { bg: "bg-gradient-to-tr from-pink-100 to-fuchsia-100", text: "text-pink-700", glow: "shadow-pink-500/20" },
  "Corporate Event": { bg: "bg-gradient-to-tr from-blue-100 to-slate-100", text: "text-blue-800", glow: "shadow-blue-500/20" },
  "Cultural Event": { bg: "bg-gradient-to-tr from-emerald-100 to-teal-100", text: "text-emerald-700", glow: "shadow-emerald-500/20" },
  "Religious Event": { bg: "bg-gradient-to-tr from-orange-100 to-amber-100", text: "text-orange-800", glow: "shadow-orange-500/20" },
  "College Event": { bg: "bg-gradient-to-tr from-violet-100 to-indigo-100", text: "text-violet-700", glow: "shadow-violet-500/20" },
  "Festival Event": { bg: "bg-gradient-to-tr from-amber-100 to-rose-100", text: "text-amber-700", glow: "shadow-amber-500/20" },
  "Other Events": { bg: "bg-gradient-to-tr from-stone-100 to-amber-50", text: "text-stone-800", glow: "shadow-stone-500/20" },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.25, 0.1, 0.25, 1.0] as [number, number, number, number],
    },
  },
};

export default function BrowseAndPopularCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const q = collection(db, "categories");
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const dbCategories = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const localCustom = getLocalCustomCategories();
        const allDbAndLocal = [...dbCategories];
        localCustom.forEach((lc) => {
          if (!allDbAndLocal.some((c: any) => c.id === lc.id || c.name?.toLowerCase() === lc.name?.toLowerCase())) {
            allDbAndLocal.push(lc);
          }
        });

        const systemNames = new Set(CATEGORY_GROUP_OPTIONS.map((s: any) => s.name?.toLowerCase()));

        const customCats = allDbAndLocal.filter((c: any) => !systemNames.has(c.name?.toLowerCase()));
        const systemDbCats = allDbAndLocal.filter((c: any) => systemNames.has(c.name?.toLowerCase()));

        const combined: any[] = [...customCats];

        CATEGORY_GROUP_OPTIONS.forEach((sysCat: any) => {
          const existingInDb = systemDbCats.find((c: any) => c.name?.toLowerCase() === sysCat.name?.toLowerCase());
          combined.push(existingInDb || sysCat);
        });

        setCategories(combined);
      },
      (error) => {
        console.warn("Home categories subscription warning:", error);
        const localCustom = getLocalCustomCategories();
        const combined = [...localCustom, ...CATEGORY_GROUP_OPTIONS];
        setCategories(combined);
      }
    );
    return () => unsub();
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 30) {
          scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          scrollRef.current.scrollBy({ left: 230, behavior: "smooth" });
        }
      }
    }, 2200);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleScrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -240, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 240, behavior: "smooth" });
    }
  };

  const INITIAL_VISIBLE_COUNT = 7;
  const visibleCategories = isExpanded ? categories : categories.slice(0, INITIAL_VISIBLE_COUNT);
  const displayEvents = [...BROWSE_EVENTS, ...BROWSE_EVENTS, ...BROWSE_EVENTS];

  return (
    <section className="mx-auto w-full max-w-[1240px] px-3 sm:px-4 md:px-6 pt-2 pb-1 overflow-hidden">
      {/* ─── 1. Browse by Event ─── */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-2.5 sm:mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight">
              {t("home.browseByEvent") || "Browse by Event"}
            </h2>
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-ping hidden sm:inline-block" />
          </div>

          <div className="flex items-center gap-3">
            {/* Scroll controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleScrollLeft}
                aria-label="Previous events"
                className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 shadow-xs hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50 transition active:scale-90"
              >
                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <button
                type="button"
                onClick={handleScrollRight}
                aria-label="Next events"
                className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 shadow-xs hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50 transition active:scale-90"
              >
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={scrollRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="flex items-center gap-2 sm:gap-4 md:gap-5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5 snap-x snap-mandatory"
        >
          {displayEvents.map((evt, idx) => {
            return (
              <motion.div
                key={`${evt.title}-${idx}`}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="flex-shrink-0 snap-start py-1"
              >
                <Link
                  to={evt.link}
                  className="group flex flex-col items-center justify-between w-[115px] sm:w-36 md:w-44 text-center cursor-pointer h-full"
                >
                  {/* Circular Image Container with Smooth 2-Layer Ring */}
                  <div className="relative p-[2.5px] sm:p-[3px] rounded-full bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 shadow-xs transition-all duration-500 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-orange-500/25 shrink-0">
                    <div className="relative aspect-square w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-[2px] sm:border-[2.5px] border-white bg-stone-100">
                      <img
                        src={evt.image}
                        alt={evt.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-115"
                        loading="lazy"
                      />
                      {/* Subtle bottom vignette gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent group-hover:from-black/25 transition-all duration-300" />
                    </div>
                  </div>

                  {/* Text Below the Circle */}
                  <div className="mt-2 flex flex-col items-center justify-start h-9 sm:h-12 w-full px-0.5">
                    <h3 className="text-[12px] sm:text-xs font-bold text-stone-800 leading-tight group-hover:text-orange-600 transition-colors text-center line-clamp-1 w-full">
                      {evt.title}
                    </h3>
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] sm:text-[12px] font-semibold text-orange-600 group-hover:text-orange-700">
                      <span>{t("common.explore") || "Explore"}</span>
                      <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ─── 2. Categories Section ─── */}
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-2.5 sm:mb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight">
              {t("home.popularCategories") || "Popular Searches"}
            </h2>
          </div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-4 items-stretch"
        >
          <AnimatePresence>
            {visibleCategories.map((cat: any) => {
              const catName = cat.name || cat.title || "Category";
              const catIcon = cat.icon || DEFAULT_CATEGORY_ICONS[catName] || "✨";
              const catSub =
                CATEGORY_SUBTITLES[catName] ||
                (Array.isArray(cat.subcategories) && cat.subcategories.length > 0
                  ? cat.subcategories.slice(0, 2).join(", ")
                  : t("home.verifiedArtistsVendors") || "Verified Artists & Services");

              const categoryLink = cat.link || `/artists?category=${encodeURIComponent(catName)}`;
              const podTheme = CATEGORY_POD_THEMES[catName] || {
                bg: "bg-gradient-to-tr from-amber-100 to-orange-100",
                text: "text-orange-700",
                glow: "shadow-orange-500/20",
              };

              return (
                <motion.div
                  key={cat.id || catName}
                  variants={cardVariants}
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 450, damping: 22 }}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="h-full flex flex-col"
                >
                  <Link
                    to={categoryLink}
                    className="group flex flex-col items-center justify-between p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-b from-white via-[#FCFAF7] to-[#F8F2E8] border border-[#E4D7C5] border-t-2 border-t-orange-400/70 hover:border-orange-500 hover:border-t-orange-500 shadow-[0_4px_14px_rgba(78,50,26,0.06)] hover:shadow-[0_12px_28px_rgba(249,115,22,0.18)] transition-all duration-300 cursor-pointer h-full min-h-[96px] sm:min-h-[170px] text-center"
                  >
                    <div className={`flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl ${podTheme.bg} ${podTheme.glow} shadow-xs text-xl sm:text-2xl transition-all duration-300 group-hover:scale-115 group-hover:rotate-6 group-hover:shadow-md shrink-0 border border-white/80`}>
                      <span className="transition-transform duration-300 group-hover:scale-110">{catIcon}</span>
                    </div>

                    <div className="mt-1.5 sm:mt-3 flex flex-col items-center justify-center flex-1 w-full">
                      <h3 className="text-xs sm:text-sm font-extrabold text-stone-900 group-hover:text-orange-600 transition-colors leading-tight line-clamp-1 text-center">
                        {catName}
                      </h3>

                      <p className="mt-0.5 text-[10px] sm:text-[11px] font-medium text-stone-500 line-clamp-1 leading-snug text-center">
                        {catSub}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* ─── Show All Categories Pill Button ─── */}
        {categories.length > INITIAL_VISIBLE_COUNT && (
          <div className="mt-2.5 sm:mt-3.5 mb-1 flex justify-center">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1.5 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-stone-100/90 hover:bg-stone-200/80 text-stone-800 font-extrabold text-xs sm:text-sm border border-stone-200/90 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer active:scale-95"
            >
              <span>
                {isExpanded
                  ? t("home.showFewerCategories") || "Show fewer categories"
                  : t("home.showAllCategories", { count: categories.length }) || `Show all ${categories.length} categories`}
              </span>
              {isExpanded ? (
                <ChevronUp className="h-3.5 w-3.5 stroke-[2.5] text-orange-600" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 stroke-[2.5] text-orange-600" />
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
