import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  ChevronRight,
  Heart,
  CheckCircle2,
  SlidersHorizontal,
  UserPlus,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NewRequirementModal from "@/components/NewRequirementModal";
import {
  getSubcategoriesForCategory,
  getCategoriesForEvent,
  CATEGORY_GROUP_OPTIONS,
  extractArtistServices,
  matchesArtistCity,
} from "@/constants/artistSystem";
import { SearchableCityDropdown } from "@/components/search/SearchableCityDropdown";
import { getActiveArtistsPage, clearDataCache } from "@/services/dataService";
import { resolveArtistProfilePhoto } from "@/services/dataNormalizer";
import { imageRegistry } from "@/services/ImageRegistryService";
import { useI18n } from "@/i18n/I18nProvider";
import { getArtLabel } from "@/lib/artLabels";

// Accurate Category Images Map covering all event types and categories
const CATEGORY_CIRCULAR_IMAGES: Record<string, string> = {
  // ─── VARKARI & SPIRITUAL ───
  "spiritual speakers": "/cultural/varkari-vocalist.png",
  "vocal artists": "/assets/curated/tanpura-singer-1.jpg",
  "instrumental artists": "/assets/curated/tabla-hands.jpg",
  "organizations": "/cultural/zanj-temple.png",
  "warkari sanstha": "/cultural/zanj-temple.png",
  "event services": "/assets/static/category-event-services.webp",
  "pooja pandits": "https://images.unsplash.com/photo-1608613304899-ea8098577e38?auto=format&fit=crop&w=400&q=80",
  "pandit / priest": "https://images.unsplash.com/photo-1608613304899-ea8098577e38?auto=format&fit=crop&w=400&q=80",

  // ─── WEDDING & RECEPTION ───
  "venues": "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=400&q=80",
  "marriage hall": "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=400&q=80",
  "banquet hall": "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=400&q=80",
  "bridal & groom services": "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=400&q=80",
  "bridal makeup": "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=400&q=80",
  "photography & videography": "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=400&q=80",
  "photography": "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=400&q=80",
  "entertainment": "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=400&q=80",
  "catering": "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=400&q=80",
  "catering & hospitality": "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=400&q=80",
  "decoration": "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80",
  "decor & setup": "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80",
  "event setup": "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=400&q=80",
  "transportation": "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=400&q=80",
  "wedding essentials": "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=400&q=80",
  "shopping": "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80",
  "invitations & gifts": "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=400&q=80",

  // ─── FOLK, CULTURAL & FESTIVALS ───
  "folk artists": "/assets/curated/dhol-passion.jpg",
  "traditional dance": "/cultural/dhol-pathak-performer.png",
  "dhol tasha": "/assets/curated/dhol-passion.jpg",
  "dhol-tasha pathak": "/assets/curated/dhol-passion.jpg",
  "anchors & hosts": "https://images.unsplash.com/photo-1560439514-4e9645039924?auto=format&fit=crop&w=400&q=80",
  "anchors / hosts": "https://images.unsplash.com/photo-1560439514-4e9645039924?auto=format&fit=crop&w=400&q=80",
  "magicians": "https://images.unsplash.com/photo-1515250499692-7104b2a4c28f?auto=format&fit=crop&w=400&q=80",
  "djs": "https://images.unsplash.com/photo-1516873240891-4bf014598ab4?auto=format&fit=crop&w=400&q=80",
  "live bands": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80",
  "balloon decorators": "https://images.unsplash.com/photo-1530103862676-de88924083a2?auto=format&fit=crop&w=400&q=80",
};

export function getCategoryCircleImage(catName: string, existingImg?: string): string {
  const norm = catName.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
  const rawKey = catName.toLowerCase().trim();

  // Direct exact match
  if (CATEGORY_CIRCULAR_IMAGES[rawKey]) return CATEGORY_CIRCULAR_IMAGES[rawKey];
  if (CATEGORY_CIRCULAR_IMAGES[norm]) return CATEGORY_CIRCULAR_IMAGES[norm];

  // Fuzzy match in dictionary
  const match = Object.entries(CATEGORY_CIRCULAR_IMAGES).find(([k]) => {
    const kNorm = k.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
    return norm.includes(kNorm) || kNorm.includes(norm);
  });
  if (match) return match[1];

  if (existingImg && (existingImg.startsWith("/") || existingImg.startsWith("http"))) return existingImg;

  return "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=400&q=80";
}

const isServiceCategory = (cat: string) =>
  /services|venues|decoration|catering|hospitality|transportation|setup|sound|mandap|stage|photo/i.test(cat || "");
const isOrganizationCategory = (cat: string) =>
  /organization|sanstha|troupe|academy/i.test(cat || "");

const getHeroSubtitle = (categoryName: string, t: (k: string) => string) => {
  if (isServiceCategory(categoryName)) {
    return t("category.heroSubtitleService") || `Find and book verified professional ${categoryName.toLowerCase()} for your events and programs.`;
  }
  if (isOrganizationCategory(categoryName)) {
    return t("category.heroSubtitleOrg") || `Explore verified devotional and cultural organizations for your events.`;
  }
  return `Find and book verified professional ${categoryName.toLowerCase()} for your events and programs.`;
};

interface ArtistCardData {
  id: string;
  name: string;
  isVerified: boolean;
  rating: number;
  reviewsCount: number;
  location: string;
  experience: string;
  languages: string;
  startingPrice: string;
  image: string;
  subCategory: string;
  categoryGroup?: string;
  servicesList?: string[];
}

export default function CategoryLevel2Page() {
  const { eventName, categoryName } = useParams<{ eventName: string; categoryName: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useI18n();

  const decodedEvent = eventName ? decodeURIComponent(eventName) : "Varkari Sampraday";
  const decodedCategory = categoryName ? decodeURIComponent(categoryName) : "Spiritual Speakers";

  // URL state synchronization
  const initialSubcategory = searchParams.get("subcategory") || searchParams.get("subCategory") || "All";
  const initialCity = searchParams.get("location") || searchParams.get("city") || "All Cities";

  const [activeSubcategory, setActiveSubcategory] = useState<string>(initialSubcategory);
  const [selectedCity, setSelectedCity] = useState<string>(initialCity);
  const [selectedSort, setSelectedSort] = useState("Recommended");
  const [selectedPrice, setSelectedPrice] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [briefModalOpen, setBriefModalOpen] = useState(false);

  useEffect(() => {
    const locParam = searchParams.get("location") || searchParams.get("city");
    if (locParam) {
      setSelectedCity(locParam);
    } else {
      setSelectedCity("All Cities");
    }
  }, [searchParams]);

  const [realArtists, setRealArtists] = useState<ArtistCardData[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic subcategories from database / master system
  const masterSubcategories = useMemo(() => {
    return getSubcategoriesForCategory(decodedEvent, decodedCategory);
  }, [decodedEvent, decodedCategory]);

  // Sibling categories within the current event for navigation
  const siblingCategories = useMemo(() => {
    const categories = getCategoriesForEvent(decodedEvent);
    if (categories && categories.length > 0) return categories;
    return CATEGORY_GROUP_OPTIONS.map((c: any) => ({
      id: c.id,
      name: c.name,
      icon: c.icon || "✨",
      eventType: decodedEvent,
      subcategories: c.subcategories,
    }));
  }, [decodedEvent]);

  // Fetch real artists from database
  useEffect(() => {
    let isMounted = true;
    clearDataCache();
    getActiveArtistsPage(50)
      .then((res) => {
        if (!isMounted) return;
        if (res.items && res.items.length > 0) {
          const mapped: ArtistCardData[] = res.items.map((item: any) => {
            const extracted = extractArtistServices(item);
            const servicesList = Array.from(new Set(extracted.map((s) => s.subcategory || s.artForm).filter(Boolean)));
            const subCat = servicesList[0] || item.subCategory || item.subcategory || item.artForm || item.category || "Artist";
            const uploadedImage = resolveArtistProfilePhoto(item);
            const fallbackImage = imageRegistry.getUniqueImage({
              category: subCat,
              type: "artist",
              key: item.uid || item.id || item.displayName || item.name || "artist-card",
            });

            const rawExp = item.experience || item.yearsOfExperience || item.exp;
            const expText = rawExp ? `${rawExp}+ Years Experience` : "10+ Years Experience";
            const langs = Array.isArray(item.languages) && item.languages.length > 0
              ? item.languages.join(", ")
              : item.language || (decodedEvent === "Varkari Sampraday" ? "Marathi, Hindi" : "Marathi, Hindi, English");

            return {
              id: item.uid || item.id || String(Math.random()),
              name: item.displayName || item.name || item.stageName || item.artistName || "Professional Artist",
              isVerified: item.isVerified !== false,
              rating: item.rating ? Number(item.rating) : 4.9,
              reviewsCount: item.reviewsCount ? Number(item.reviewsCount) : 28,
              location: item.city || item.location || "Maharashtra",
              experience: expText,
              languages: langs,
              startingPrice: item.startingPrice
                ? String(item.startingPrice)
                : item.minPrice
                ? String(item.minPrice)
                : item.soloPrice
                ? String(item.soloPrice)
                : "15,000",
              image: uploadedImage || fallbackImage,
              subCategory: subCat,
              categoryGroup: item.categoryGroup || item.category || item.group || "",
              servicesList: servicesList.length ? servicesList : [subCat],
            };
          });
          setRealArtists(mapped);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Failed to fetch active artists:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [decodedEvent]);

  // Sync state when URL search params change
  useEffect(() => {
    const subParam = searchParams.get("subcategory") || searchParams.get("subCategory");
    if (subParam) {
      setActiveSubcategory(subParam);
    }
    const locParam = searchParams.get("location") || searchParams.get("city");
    if (locParam) {
      setSelectedCity(locParam);
    }
  }, [searchParams]);

  // Subcategory Chip Click Handler
  const handleSubcategorySelect = (subName: string) => {
    setActiveSubcategory(subName);
    const newParams = new URLSearchParams(searchParams);
    if (subName === "All") {
      newParams.delete("subcategory");
      newParams.delete("subCategory");
    } else {
      newParams.set("subcategory", subName);
    }
    setSearchParams(newParams, { replace: true });
  };

  // Filtered artists calculation
  const displayedArtists = useMemo(() => {
    let list = [...realArtists];

    // Filter by Subcategory tab
    if (activeSubcategory && activeSubcategory !== "All") {
      const subLower = activeSubcategory.toLowerCase();
      list = list.filter((a) => {
        const subs = a.servicesList && a.servicesList.length ? a.servicesList : [a.subCategory];
        return subs.some((s) => s.toLowerCase().includes(subLower));
      });
    } else {
      // If "All", include artists matching any subcategory in this category group
      const masterSet = new Set(masterSubcategories.map((s) => s.toLowerCase()));
      const catLower = decodedCategory.toLowerCase();
      list = list.filter((a) => {
        const subs = a.servicesList && a.servicesList.length ? a.servicesList : [a.subCategory];
        const artistGroup = (a.categoryGroup || "").toLowerCase();
        return subs.some((s) => masterSet.has(s.toLowerCase()) || s.toLowerCase().includes(catLower)) || artistGroup.includes(catLower);
      });
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.subCategory.toLowerCase().includes(q) ||
          a.location.toLowerCase().includes(q)
      );
    }

    // Filter by City/Location
    if (selectedCity && selectedCity !== "All Cities") {
      list = list.filter((a) => matchesArtistCity(a, selectedCity));
    }

    // Price Filter
    if (selectedPrice === "Under20k") {
      list = list.filter((a) => parseInt(a.startingPrice.replace(/\D/g, ""), 10) < 20000);
    } else if (selectedPrice === "20kTo30k") {
      list = list.filter((a) => {
        const price = parseInt(a.startingPrice.replace(/\D/g, ""), 10);
        return price >= 20000 && price <= 30000;
      });
    } else if (selectedPrice === "Above30k") {
      list = list.filter((a) => parseInt(a.startingPrice.replace(/\D/g, ""), 10) > 30000);
    }

    // Sort Order
    if (selectedSort === "Rating") {
      list.sort((a, b) => b.rating - a.rating);
    } else if (selectedSort === "PriceLow") {
      list.sort((a, b) => parseInt(a.startingPrice.replace(/\D/g, ""), 10) - parseInt(b.startingPrice.replace(/\D/g, ""), 10));
    } else if (selectedSort === "PriceHigh") {
      list.sort((a, b) => parseInt(b.startingPrice.replace(/\D/g, ""), 10) - parseInt(a.startingPrice.replace(/\D/g, ""), 10));
    }

    return list;
  }, [
    realArtists,
    activeSubcategory,
    masterSubcategories,
    decodedCategory,
    searchQuery,
    selectedCity,
    selectedPrice,
    selectedSort,
  ]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-stone-50/60 flex flex-col font-sans antialiased pt-20">
      <Navbar />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* ─── 1. Single-Line Breadcrumb & Global Search ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-stone-200/80 mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 overflow-x-auto whitespace-nowrap scrollbar-none">
            <Link to="/" className="hover:text-stone-900 transition-colors shrink-0">
              Home
            </Link>
            <span className="shrink-0 text-stone-400">&gt;</span>
            <Link
              to={`/events/${encodeURIComponent(decodedEvent)}`}
              className="hover:text-stone-900 transition-colors shrink-0"
            >
              {decodedEvent}
            </Link>
            <span className="shrink-0 text-stone-400">&gt;</span>
            <span className="text-orange-600 font-extrabold shrink-0">{decodedCategory}</span>
          </div>

          {/* Quick Search Input */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artists, categories..."
              className="w-full h-9 pl-4 pr-9 rounded-full bg-white border border-stone-200/90 text-xs font-medium text-stone-800 placeholder-stone-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-stone-400 pointer-events-none" />
          </div>
        </div>

        {/* ─── 2. MAIN LAYOUT: Sidebar (Circular Image Cards) + Main Content ─── */}
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[300px_1fr] gap-6 lg:gap-8 items-start">
          {/* ─── LEFT COLUMN: CATEGORY SIDEBAR ─── */}
          <aside className="w-full space-y-4">
            {/* Sidebar Card */}
            <div className="bg-white rounded-3xl border border-stone-200/80 p-4 sm:p-5 shadow-sm">
              <h2 className="text-xs font-black text-stone-800 uppercase tracking-wider mb-4 px-1">
                Explore Categories
              </h2>

              {/* Category Circular Cards List */}
              <div className="space-y-2.5">
                {siblingCategories.map((cat: any) => {
                  const catName = typeof cat === "string" ? cat : cat.name;
                  const isActive = catName.toLowerCase() === decodedCategory.toLowerCase();
                  const circleImage = getCategoryCircleImage(catName, cat.image);

                  return (
                    <button
                      key={catName}
                      type="button"
                      onClick={() =>
                        navigate(
                          `/events/${encodeURIComponent(decodedEvent)}/${encodeURIComponent(catName)}`
                        )
                      }
                      className={`w-full text-left p-2.5 sm:p-3 rounded-2xl transition-all duration-200 flex items-center gap-3.5 group cursor-pointer ${
                        isActive
                          ? "bg-orange-50/90 text-orange-600 font-extrabold shadow-xs ring-1 ring-orange-200/80"
                          : "bg-white hover:bg-stone-50 text-stone-800 font-bold hover:text-orange-600"
                      }`}
                    >
                      {/* Circular Image with Orange Ring */}
                      <div
                        className={`relative h-14 w-14 sm:h-16 sm:w-16 rounded-full overflow-hidden shrink-0 transition-all duration-300 ${
                          isActive
                            ? "ring-2 ring-orange-500 border-2 border-white shadow-sm"
                            : "border border-orange-200/70 group-hover:ring-2 group-hover:ring-orange-300"
                        }`}
                      >
                        <img
                          src={circleImage}
                          alt=""
                          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          loading="eager"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.src = "/assets/static/category-spiritual-varkari-sampraday.webp";
                          }}
                        />
                      </div>

                      {/* Category Label & Chevron */}
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
                        <span
                          className={`text-xs sm:text-sm font-extrabold leading-tight truncate ${
                            isActive
                              ? "text-orange-600"
                              : "text-stone-900 group-hover:text-orange-600"
                          }`}
                        >
                          {getArtLabel(t, catName)}
                        </span>
                        <ChevronRight
                          className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                            isActive ? "text-orange-600" : "text-stone-400"
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Promo Box: "Are you an artist?" */}
            <div className="p-5 rounded-3xl bg-gradient-to-b from-orange-50/90 to-amber-50/60 border border-orange-200/70 text-center space-y-3 shadow-xs">
              <div className="h-11 w-11 mx-auto rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-2xs font-bold">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-stone-900">Are you an artist?</h4>
                <p className="text-xs text-stone-600 font-medium mt-1 leading-relaxed">
                  Join MyKalakar and get more opportunities.
                </p>
              </div>
              <Link
                to="/artist-register"
                className="inline-flex w-full items-center justify-center py-2.5 px-4 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-black text-xs shadow-md shadow-orange-600/20 transition-all duration-200"
              >
                Register Now
              </Link>
            </div>
          </aside>

          {/* ─── RIGHT COLUMN: SUBCATEGORY PILLS, FILTERS & ARTIST CARDS ─── */}
          <section className="min-w-0 space-y-4">

            {/* ─── 2. Subcategory Filter Chips (Horizontal Pill Buttons) ─── */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
              {/* "All" Filter Chip */}
              <button
                type="button"
                onClick={() => handleSubcategorySelect("All")}
                className={`h-9 px-5 rounded-full text-xs font-black transition-all duration-200 shrink-0 cursor-pointer flex items-center justify-center ${
                  activeSubcategory === "All"
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/20 scale-[1.02]"
                    : "bg-white border border-stone-200/90 text-stone-700 hover:bg-stone-100 hover:border-stone-300 shadow-2xs"
                }`}
              >
                All
              </button>

              {/* Dynamic Subcategory Chips */}
              {masterSubcategories.map((subName) => {
                const isSelected = activeSubcategory.toLowerCase() === subName.toLowerCase();
                return (
                  <button
                    key={subName}
                    type="button"
                    onClick={() => handleSubcategorySelect(subName)}
                    className={`h-9 px-4 rounded-full text-xs font-black transition-all duration-200 shrink-0 cursor-pointer flex items-center justify-center ${
                      isSelected
                        ? "bg-orange-600 text-white shadow-md shadow-orange-600/20 scale-[1.02]"
                        : "bg-white border border-stone-200/90 text-stone-700 hover:bg-stone-100 hover:border-stone-300 shadow-2xs"
                    }`}
                  >
                    {getArtLabel(t, subName)}
                  </button>
                );
              })}
            </div>

            {/* ─── 3. Filter Controls Row ─── */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Location Dropdown */}
                <SearchableCityDropdown
                  selectedCity={selectedCity}
                  onSelectCity={setSelectedCity}
                  availableArtists={realArtists}
                />

                {/* Sort Selector */}
                <div className="relative inline-flex items-center rounded-full bg-white border border-stone-200 px-3.5 py-1.5 text-xs font-bold text-stone-700 shadow-2xs">
                  <span className="text-stone-400 font-normal mr-1">Sort by:</span>
                  <select
                    value={selectedSort}
                    onChange={(e) => setSelectedSort(e.target.value)}
                    className="bg-transparent border-none outline-none cursor-pointer pr-1 font-extrabold text-stone-900"
                  >
                    <option value="Recommended">Recommended</option>
                    <option value="Rating">Rating: High to Low</option>
                    <option value="PriceLow">Price: Low to High</option>
                    <option value="PriceHigh">Price: High to Low</option>
                  </select>
                </div>

                {/* Price Filter Selector */}
                <div className="relative inline-flex items-center rounded-full bg-white border border-stone-200 px-3.5 py-1.5 text-xs font-bold text-stone-700 shadow-2xs">
                  <span className="text-stone-400 font-normal mr-1">Price:</span>
                  <select
                    value={selectedPrice}
                    onChange={(e) => setSelectedPrice(e.target.value)}
                    className="bg-transparent border-none outline-none cursor-pointer pr-1 font-extrabold text-stone-900"
                  >
                    <option value="All">All</option>
                    <option value="Under20k">Under ₹20,000</option>
                    <option value="20kTo30k">₹20,000 - ₹30,000</option>
                    <option value="Above30k">Above ₹30,000</option>
                  </select>
                </div>
              </div>

              {/* Filters Button */}
              <button
                type="button"
                onClick={() => setBriefModalOpen(true)}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-orange-500/80 bg-white hover:bg-orange-50 text-stone-800 hover:text-orange-600 text-xs font-black shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-orange-600" /> Filters
              </button>
            </div>

            {/* ─── 4. Section Heading Count ─── */}
            <div className="flex items-center justify-between pt-1">
              <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                {getArtLabel(t, decodedCategory)} near you{" "}
                <span className="text-stone-400 font-bold ml-1">({displayedArtists.length})</span>
              </h2>
            </div>

            {/* ─── 5. Empty State ─── */}
            {displayedArtists.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-3xl border border-stone-200 p-6 shadow-xs">
                <div className="h-14 w-14 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 mb-3">
                  <MapPin className="h-6 w-6 stroke-[1.75]" />
                </div>
                <h3 className="text-base font-extrabold text-stone-900 mb-1">
                  No artists found for selected filters
                </h3>
                <p className="text-xs font-medium text-stone-500 max-w-sm mb-4">
                  {selectedCity !== "All Cities"
                    ? "Try choosing 'All Cities' to view all available verified artists."
                    : "Try selecting 'All' in subcategories or explore other categories."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCity("All Cities");
                    setActiveSubcategory("All");
                    setSelectedPrice("All");
                  }}
                  className="px-5 py-2.5 rounded-full bg-orange-600 text-white font-black text-xs shadow-md shadow-orange-600/20 hover:bg-orange-700 transition"
                >
                  Reset All Filters
                </button>
              </div>
            )}

            {/* ─── 6. ARTIST CARDS GRID (Exact 4-Column Card Design from Reference) ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {displayedArtists.map((artist) => {
                const isFav = favorites.has(artist.id);

                return (
                  <div
                    key={artist.id}
                    onClick={() => navigate(`/artist/${artist.id}`)}
                    className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-3xl bg-white border border-stone-200/80 shadow-xs hover:shadow-lg hover:border-orange-300 transition-all duration-300 cursor-pointer text-center"
                  >
                    {/* Favorite Heart Button (Top Right) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(artist.id);
                      }}
                      className="absolute top-3.5 right-3.5 p-1 rounded-full text-stone-400 hover:text-rose-500 transition cursor-pointer z-10"
                      aria-label="Add to favorites"
                    >
                      <Heart
                        className={`h-4 w-4 sm:h-5 sm:w-5 stroke-[1.75] transition-colors ${
                          isFav ? "fill-rose-500 text-rose-500" : "text-stone-400 hover:text-stone-600"
                        }`}
                      />
                    </button>

                    {/* Circular Artist Avatar (Center Top) */}
                    <div className="flex flex-col items-center">
                      <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-stone-100 ring-4 ring-stone-50 shadow-xs mb-3 shrink-0 border border-stone-200/60">
                        <img
                          src={artist.image}
                          alt={artist.name}
                          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget;
                            const fallback = imageRegistry.getUniqueImage({
                              category: artist.subCategory || "Performers",
                              type: "artist",
                              key: artist.id,
                            });
                            if (target.src !== fallback) {
                              target.src = fallback;
                            }
                          }}
                        />
                      </div>

                      {/* Verified Badge */}
                      <div className="flex items-center justify-center gap-1 text-[11px] font-black text-emerald-600 mb-1">
                        <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-500 text-white" />
                        <span>Verified</span>
                      </div>

                      {/* Artist Name */}
                      <h3 className="text-sm sm:text-base font-black text-stone-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                        {artist.name}
                      </h3>

                      {/* Experience */}
                      <p className="text-xs font-semibold text-stone-500 mt-0.5">
                        {artist.experience}
                      </p>

                      {/* Languages */}
                      <p className="text-xs font-medium text-stone-500 mt-0.5 line-clamp-1">
                        {artist.languages}
                      </p>
                    </div>

                    {/* Pricing & View Profile Action */}
                    <div className="mt-3.5 pt-3 border-t border-stone-100 flex flex-col items-center">
                      <p className="text-xs font-medium text-stone-600">
                        Starting from{" "}
                        <strong className="font-black text-stone-950 text-xs sm:text-sm">
                          ₹{artist.startingPrice}
                        </strong>
                      </p>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/artist/${artist.id}`);
                        }}
                        className="w-full mt-3 py-2 px-4 rounded-xl border border-orange-500/80 bg-white hover:bg-orange-500 text-orange-600 hover:text-white font-black text-xs transition-all duration-200 shadow-2xs cursor-pointer"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <Footer />

      <NewRequirementModal
        open={briefModalOpen}
        onClose={() => setBriefModalOpen(false)}
      />
    </div>
  );
}

