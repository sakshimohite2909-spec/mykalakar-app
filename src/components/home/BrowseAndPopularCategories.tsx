import { useState, useEffect, useRef } from "react";
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
import { collection, onSnapshot, query } from "firebase/firestore";
import { CATEGORY_GROUP_OPTIONS } from "@/constants/artistSystem";

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
    title: "Wedding",
    subtitle: "12,000+ Artists",
    image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
    link: "/events/Wedding",
  },
  {
    title: "Varkari Sampraday",
    subtitle: "850+ Artists",
    image: "https://images.pexels.com/photos/34193177/pexels-photo-34193177.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    link: "/events/Varkari%20Sampraday",
  },
  {
    title: "Birthday",
    subtitle: "600+ Artists",
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80",
    link: "/events/Birthday",
  },
  {
    title: "Corporate Event",
    subtitle: "400+ Artists",
    image: "https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    link: "/events/Corporate%20Event",
  },
  {
    title: "Cultural Event",
    subtitle: "700+ Artists",
    image: "https://images.pexels.com/photos/17264037/pexels-photo-17264037.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    link: "/events/Cultural%20Event",
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

  const [artistCounts, setArtistCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const q = query(collection(db, "artists"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const counts: Record<string, number> = {};
        snap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const status = String(data.status || "active").toLowerCase();
          if (status !== "active" && status !== "approved" && status !== "") return;

          const catStr = String(
            data.categoryGroup || data.category || data.primaryCategory || data.artForm || data.subCategory || ""
          ).toLowerCase();
          const categoriesArr = Array.isArray(data.categories)
            ? data.categories.map((c: any) => String(c).toLowerCase())
            : [];
          const eventsArr = Array.isArray(data.events)
            ? data.events.map((e: any) => String(e).toLowerCase())
            : [];

          BROWSE_EVENTS.forEach((evt) => {
            const titleLower = evt.title.toLowerCase();
            const keyword = titleLower.split(" ")[0]; // e.g. "wedding", "varkari", "birthday", "corporate", "cultural"

            const isMatch =
              catStr.includes(keyword) ||
              categoriesArr.some((c: string) => c.includes(keyword)) ||
              eventsArr.some((e: string) => e.includes(keyword));

            if (isMatch) {
              counts[evt.title] = (counts[evt.title] || 0) + 1;
            }
          });
        });
        setArtistCounts(counts);
      },
      (err) => console.warn("Artist count snapshot warning:", err)
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
    <section className="mx-auto w-full max-w-[1240px] px-4 md:px-6 pt-4 md:pt-6 pb-4 md:pb-6 overflow-hidden">
      {/* ─── 1. Browse by Event ─── */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-extrabold text-stone-900 tracking-tight">
              Browse by Event
            </h2>
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-ping hidden sm:inline-block" />
          </div>

          <div className="flex items-center gap-3">
            {/* Scroll controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleScrollLeft}
                aria-label="Previous events"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 shadow-xs hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50 transition active:scale-90"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleScrollRight}
                aria-label="Next events"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 shadow-xs hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50 transition active:scale-90"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <Link
              to="/events"
              className="group inline-flex items-center gap-1 text-xs md:text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors ml-1"
            >
              <span>View All</span>
              <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        <div
          ref={scrollRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="flex items-center gap-4 md:gap-5 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1 snap-x snap-mandatory"
        >
          {displayEvents.map((evt, idx) => {
            const count = artistCounts[evt.title] || 0;
            const countText = count > 0 ? `${count} ${count === 1 ? "Artist" : "Artists"}` : "0 Artists";

            return (
              <motion.div
                key={`${evt.title}-${idx}`}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0 snap-start pt-2 pb-4"
              >
                <Link
                  to={evt.link}
                  className="group relative flex aspect-square w-44 h-44 sm:w-48 sm:h-48 md:w-52 md:h-52 shrink-0 flex-col items-center justify-center rounded-full border-4 border-white bg-stone-900 shadow-md ring-4 ring-orange-500/10 transition-all duration-500 hover:scale-105 hover:ring-orange-500/40 hover:shadow-2xl cursor-pointer"
                >
                  {/* Floating Bottom-Rim Badge */}
                  <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md border-2 border-white">
                    {countText}
                  </span>

                  {/* Inner Circular Image Container */}
                  <div className="absolute inset-0 overflow-hidden rounded-full">
                    <img
                      src={evt.image}
                      alt={evt.title}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      loading="lazy"
                    />
                    {/* Dark gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10 group-hover:from-black/85 group-hover:via-black/45 transition-all duration-300" />
                  </div>

                  {/* Content inside full circle */}
                  <div className="relative z-10 flex flex-col items-center justify-center p-3 text-center text-white">
                    <h3 className="text-base sm:text-lg font-black leading-tight drop-shadow-md text-white group-hover:text-orange-300 transition-colors">
                      {evt.title}
                    </h3>
                    <p className="mt-1 text-xs font-bold text-orange-200/90 flex items-center justify-center gap-1">
                      <span>Explore</span>
                      <motion.span
                        animate={{ x: [0, 3, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        className="inline-block text-orange-400 font-bold"
                      >
                        →
                      </motion.span>
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ─── 2. Categories Section (Matches User Reference Design) ─── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-extrabold text-stone-900 tracking-tight">
              Popular Categories
            </h2>
          </div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4"
        >
          <AnimatePresence>
            {visibleCategories.map((cat: any) => {
              const catName = cat.name || cat.title || "Category";
              const catIcon = cat.icon || DEFAULT_CATEGORY_ICONS[catName] || "✨";
              const catSub =
                CATEGORY_SUBTITLES[catName] ||
                (Array.isArray(cat.subcategories) && cat.subcategories.length > 0
                  ? cat.subcategories.slice(0, 2).join(", ")
                  : "Verified Artists & Services");

              const categoryLink = cat.link || `/artists?category=${encodeURIComponent(catName)}`;

              return (
                <motion.div
                  key={cat.id || catName}
                  variants={cardVariants}
                  whileTap={{ scale: 0.95 }}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Link
                    to={categoryLink}
                    className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-stone-200/90 shadow-xs hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer min-h-[140px] text-center"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100/90 text-2xl transition-all duration-300 group-hover:bg-orange-500 group-hover:scale-110 shadow-xs">
                      <span>{catIcon}</span>
                    </div>

                    <h3 className="mt-3 text-sm font-extrabold text-stone-900 group-hover:text-orange-600 transition-colors leading-tight line-clamp-1">
                      {catName}
                    </h3>

                    <p className="mt-1 text-[11px] font-medium text-stone-500 line-clamp-2 leading-snug">
                      {catSub}
                    </p>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* ─── Show All Categories Pill Button ─── */}
        {categories.length > INITIAL_VISIBLE_COUNT && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-stone-100/90 hover:bg-stone-200/80 text-stone-800 font-extrabold text-sm sm:text-base border border-stone-200/90 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer active:scale-95"
            >
              <span>
                {isExpanded
                  ? "Show fewer categories"
                  : `Show all ${categories.length} categories`}
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 stroke-[2.5] text-orange-600" />
              ) : (
                <ChevronDown className="h-4 w-4 stroke-[2.5] text-orange-600" />
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
