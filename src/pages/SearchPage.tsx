import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  User,
  Youtube,
  Loader2,
  Sparkles,
  X,
  ExternalLink,
  Share2,
  MapPin,
  Phone,
  Star,
  ChevronDown,
  Music,
  Mic,
} from "lucide-react";
import { db, storage } from "@/lib/firebase";
import { collection, query, onSnapshot, where, orderBy } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { gsap } from "gsap";
import { useAuth } from "@/contexts/AuthContext";
import { initialArtists, platformCategories } from "@/data/mockData";

// ─── Helpers ────────────────────────────────────────────────────────────────────
function updateOgMeta(title: string, description: string, image?: string) {
  const setMeta = (property: string, content: string) => {
    let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("property", property);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };
  setMeta("og:title", title);
  setMeta("og:description", description);
  if (image) setMeta("og:image", image);
  document.title = title;
}

function resetOgMeta() {
  updateOgMeta(
    "MyKalakar | Discover & Book Premium Artists in India",
    "Discover and book verified artists for weddings, corporate events & more on MyKalakar.",
    "/mykalakar-logo.png"
  );
}



// ─── Artist Card ───────────────────────────────────────────────────────────────
function PremiumArtistCard({
  artist,
  index,
  onClick,
  highlightCategory,
}: {
  artist: any;
  index: number;
  onClick: () => void;
  highlightCategory?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [resolvedProfilePic, setResolvedProfilePic] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchImage = async () => {
      const picUrl = artist.media?.profilePhoto || artist.profilePhoto;
      if (!picUrl) return;

      if (picUrl.startsWith("http://") || picUrl.startsWith("https://")) {
        // If it contains the firebasestorage domain but isn't a direct downloadUrl, we might need to parse.
        // Usually, getDownloadURL natively returns an https string. So we just use it.
        // Only if they manually stored 'gs://...' we definitely need getDownloadURL.
        setResolvedProfilePic(picUrl);
      } else if (picUrl.startsWith("gs://")) {
        try {
          const storageUrl = await getDownloadURL(ref(storage, picUrl));
          if (isMounted) setResolvedProfilePic(storageUrl);
        } catch (e) {
          console.warn("Failed to resolve gs:// image:", e);
        }
      } else {
        // Assume it's a relative path in Firebase Storage bucket
        try {
          const storageUrl = await getDownloadURL(ref(storage, picUrl));
          if (isMounted) setResolvedProfilePic(storageUrl);
        } catch (e) {
          console.warn("Failed to resolve relative image path:", e);
          if (isMounted) setResolvedProfilePic(picUrl); // Fallback
        }
      }
    };
    fetchImage();
    return () => { isMounted = false; };
  }, [artist.profilePicUrl, artist.profilePhoto]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const rotateX = (((e.clientY - rect.top) / rect.height) - 0.5) * -8;
    const rotateY = (((e.clientX - rect.left) / rect.width) - 0.5) * 8;
    gsap.to(cardRef.current, { rotateX, rotateY, duration: 0.4, ease: "power2.out" });
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, { rotateX: 0, rotateY: 0, duration: 0.8, ease: "power2.out" });
  };

  const youtubeLink = artist.socialLinks?.find((l: any) => l.platform === "youtube")?.url || null;
  const artistName = artist.name || artist.professionalName || "Artist";
  const displayCategory = highlightCategory || artist.category || "";

  return (
    <div
      ref={cardRef}
      onClick={() => navigate(`/artist/${artist.id}`)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="artist-card-animate relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/50 p-6 shadow-[0_8px_32px_rgba(163,221,242,0.10)] backdrop-blur-2xl hover:shadow-[0_16px_48px_rgba(163,221,242,0.20)] hover:border-[rgba(163,221,242,0.50)] group cursor-pointer transition-all duration-300 z-10"
      style={{ transformStyle: "preserve-3d", perspective: "1000px", opacity: 0, transform: "translateY(30px)" }}
    >
      {/* Gloss overlay */}
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/70 to-transparent pointer-events-none opacity-60" />

      {/* "Click to view" hint */}
      <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-amber-500 text-foreground text-[8px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full shadow-md">
          <ExternalLink className="w-2.5 h-2.5" /> View
        </span>
      </div>

      {/* Orange accent top strip */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-[2rem] bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

      <div className="relative z-10 flex flex-col items-center text-center" style={{ transform: "translateZ(20px)" }}>
        {/* Avatar */}
        <div className="relative w-20 h-20 rounded-full border-2 border-orange-200 bg-orange-50 shadow-lg flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-orange-400 transition-all duration-500 overflow-hidden">
          {resolvedProfilePic ? (
            <img
              src={resolvedProfilePic}
              alt={artistName}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="h-8 w-8 text-orange-400" />
          )}
          {/* Online dot */}
          <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white" />
        </div>

        <h3 className="text-lg font-black text-[#1A1A1A] tracking-wider uppercase mb-1 leading-tight">
          {artistName}
        </h3>

        {artist.brandName && (
          <p className="text-[9px] font-bold text-orange-500 tracking-widest uppercase mb-2">
            {artist.brandName}
          </p>
        )}

        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 mb-4 tracking-widest uppercase">
          <span>{artist.age || "--"} YRS</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>{artist.gender || "Any"}</span>
          {artist.state && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <MapPin className="w-2.5 h-2.5 text-orange-400" />
              <span className="text-orange-500">{artist.state}</span>
            </>
          )}
        </div>

        {/* Category badges */}
        <div className="flex flex-col items-center gap-1.5 mb-5 w-full">
          {displayCategory && (
            <span className="w-full max-w-[180px] truncate px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 text-orange-700 text-[10px] font-black uppercase tracking-widest shadow-sm">
              {displayCategory}
            </span>
          )}
          {artist.subcategory && (
            <span className="w-full max-w-[180px] truncate px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-widest">
              {artist.subcategory}
            </span>
          )}
        </div>

        {youtubeLink ? (
          <a
            href={youtubeLink}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="w-full mt-auto flex items-center justify-center gap-2 rounded-xl bg-white/60 border border-red-200 py-2.5 text-[#1A1A1A] font-black tracking-widest text-[10px] uppercase hover:bg-gradient-to-r hover:from-orange-500 hover:to-red-500 hover:text-foreground hover:border-transparent hover:shadow-[0_4px_20px_rgba(239,68,68,0.35)] transition-all duration-300"
          >
            <Youtube className="h-3.5 w-3.5" /> Watch on YouTube
          </a>
        ) : (
          <div className="w-full mt-auto py-2.5 flex items-center justify-center gap-2 text-slate-400 font-bold tracking-widest text-[10px] uppercase border border-dashed border-slate-200 rounded-xl bg-white/30">
            <Music className="w-3 h-3" /> No Media Yet
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Category Section ──────────────────────────────────────────────────────────
function CategorySection({
  categoryName,
  categoryIcon,
  artists,
}: {
  categoryName: string;
  categoryIcon?: string;
  artists: any[];
}) {
  const [collapsed, setCollapsed] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!sectionRef.current || collapsed) return;
    const cards = sectionRef.current.querySelectorAll(".artist-card-animate");
    gsap.killTweensOf(cards);
    gsap.fromTo(
      cards,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, stagger: 0.07, duration: 0.6, ease: "power3.out", clearProps: "all" }
    );
  }, [artists, collapsed]);

  return (
    <motion.section
      className="mb-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md shadow-orange-200">
            <span className="text-lg">{categoryIcon || "🎭"}</span>
          </div>
          <div>
            <h2 className="text-xl font-black text-[#1A1A1A] tracking-tight uppercase">{categoryName}</h2>
            <p className="text-[10px] font-bold text-orange-500 tracking-widest uppercase">
              {artists.length} Artist{artists.length !== 1 ? "s" : ""} Available
            </p>
          </div>
        </div>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-orange-500 transition-colors px-3 py-2 rounded-xl hover:bg-orange-50"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-300 ${collapsed ? "-rotate-90" : ""}`}
          />
          {collapsed ? "Show" : "Hide"}
        </button>
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            ref={sectionRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
          >
            {artists.map((artist, idx) => (
              <PremiumArtistCard
                key={`${artist.id}-${categoryName}-${idx}`}
                artist={artist}
                index={idx}
                onClick={() => {}}
                highlightCategory={categoryName}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Divider */}
      <div className="mt-10 h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent" />
    </motion.section>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SearchPage() {
  const [params] = useSearchParams();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [artists, setArtists] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"category" | "grid">("category");
  const selectedState = params.get("state") || "";
  const selectedDistrict = params.get("district") || "";

  // Read category filter from URL param set by EventRequirements
  useEffect(() => {
    const urlCategory = params.get("category");
    if (urlCategory) setSelectedCategory(urlCategory);
  }, [params]);

  useEffect(() => {
    const artistFilters = [where("status", "==", "active")];
    const qArtists = query(collection(db, "artists"), ...artistFilters);
    const unsubArtists = onSnapshot(qArtists, (snapshot) => {
      const liveArtists = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const sourceArtists = liveArtists.length > 0
        ? liveArtists
        : initialArtists.map((artist, index) => ({
            id: `demo-artist-${index + 1}`,
            uid: `demo-artist-${index + 1}`,
            status: "active",
            categories: [artist.category],
            artsList: [{ category: artist.category, subcategory: artist.subcategory, types: [] }],
            media: {
              profilePhoto: artist.profilePhoto,
              coverPhoto: artist.profilePhoto,
              galleryPhotos: [artist.profilePhoto],
            },
            stats: {
              rating: artist.rating,
              reviews: artist.reviews,
              followers: 0,
              profileViews: 0,
              totalBookings: 0,
            },
            ...artist,
          }));
      const stateMatches = selectedState ? sourceArtists.filter((artist: any) => artist.state === selectedState) : sourceArtists;
      const districtMatches = selectedDistrict ? stateMatches.filter((artist: any) => artist.district === selectedDistrict || artist.city === selectedDistrict) : stateMatches;
      setArtists(districtMatches.length > 0 ? districtMatches : stateMatches.length > 0 ? stateMatches : sourceArtists);
      setLoading(false);
    }, (error) => {
      console.warn("Artists unavailable, using local defaults.", error);
      setArtists(initialArtists.map((artist, index) => ({
        id: `demo-artist-${index + 1}`,
        uid: `demo-artist-${index + 1}`,
        status: "active",
        categories: [artist.category],
        artsList: [{ category: artist.category, subcategory: artist.subcategory, types: [] }],
        media: {
          profilePhoto: artist.profilePhoto,
          coverPhoto: artist.profilePhoto,
          galleryPhotos: [artist.profilePhoto],
        },
        stats: {
          rating: artist.rating,
          reviews: artist.reviews,
          followers: 0,
          profileViews: 0,
          totalBookings: 0,
        },
        ...artist,
      })));
      setLoading(false);
    });
    const qCategories = query(collection(db, "categories"), orderBy("sortOrder"));
    const unsubCategories = onSnapshot(qCategories, (snapshot) => {
      const liveCategories = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCategories(liveCategories.length > 0 ? liveCategories : platformCategories);
    }, (error) => {
      console.warn("Categories unavailable, using local defaults.", error);
      setCategories(platformCategories);
    });
    return () => {
      unsubArtists();
      unsubCategories();
    };
  }, [selectedDistrict, selectedState]);

  // Build a map: categoryName → list of artists who have that category
  // Artists with multiple arts appear under EACH category
  const artistsByCategory = useMemo(() => {
    const map: Record<string, any[]> = {};

    artists.forEach((artist) => {
      const arts: Array<{ category: string; subcategory?: string }> =
        Array.isArray(artist.artsList) && artist.artsList.length > 0
          ? artist.artsList
          : artist.category
          ? [{ category: artist.category, subcategory: artist.subcategory }]
          : [];

      const addedCategories = new Set<string>();
      arts.forEach((art) => {
        const cat = art.category;
        if (!cat || addedCategories.has(cat)) return;
        addedCategories.add(cat);
        if (!map[cat]) map[cat] = [];
        map[cat].push({ ...artist, category: cat, subcategory: art.subcategory || artist.subcategory || "" });
      });
    });

    return map;
  }, [artists]);

  // Flat filtered list for grid mode / search
  const filteredArtists = useMemo(() => {
    let results = artists;

    if (selectedCategory !== "all") {
      results = results.filter((a) => {
        const arts = Array.isArray(a.artsList) && a.artsList.length > 0
          ? a.artsList
          : [{ category: a.category }];
        return arts.some(
          (art: any) => (art.category || "").toLowerCase() === selectedCategory.toLowerCase()
        );
      });
    }

    // Expand artists with multiple categories into separate records
    results = results.flatMap((a) => {
      if (Array.isArray(a.categories) && a.categories.length > 0) {
        return a.categories.map((cat: string) => ({...a, category: cat}));
      }
      return [a];
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (a) =>
          (a.name?.toLowerCase().includes(q)) ||
          (a.professionalName?.toLowerCase().includes(q)) ||
          (a.brandName?.toLowerCase().includes(q)) ||
          (a.category?.toLowerCase().includes(q)) ||
          (a.subcategory?.toLowerCase().includes(q)) ||
          (a.artsList?.some((art: any) => art.category?.toLowerCase().includes(q)))
      );
    }
    return results;
  }, [artists, selectedCategory, searchQuery]);

  // Categories that have at least one artist, preserving DB order
  const activeCategories = useMemo(() => {
    if (selectedCategory !== "all") {
      const cat = categories.find((c) => c.name === selectedCategory);
      const arts = artistsByCategory[selectedCategory] || [];
      if (arts.length === 0) return [];
      return cat ? [{ ...cat, artists: arts }] : [{ name: selectedCategory, artists: arts }];
    }
    return categories
      .map((cat) => ({ ...cat, artists: artistsByCategory[cat.name] || [] }))
      .filter((c) => c.artists.length > 0);
  }, [categories, artistsByCategory, selectedCategory]);

  const showCategoryView =
    viewMode === "category" && !searchQuery.trim();

  // Grid fallback animation
  useLayoutEffect(() => {
    if (!loading && !showCategoryView) {
      gsap.killTweensOf(".artist-card-animate");
      gsap.fromTo(
        ".artist-card-animate",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.7, ease: "power3.out", clearProps: "all" }
      );
    }
  }, [filteredArtists, loading, showCategoryView]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center relative overflow-x-hidden font-sans bg-transparent">
      <Navbar />



      <main className="flex-1 w-full pt-32 pb-24 z-10 relative">
        <div className="container mx-auto px-6 max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-200 bg-orange-50 text-orange-600 backdrop-blur-md shadow-sm text-xs font-black tracking-[0.2em] uppercase mb-6">
              <Sparkles className="h-3 w-3" /> MyKalakar Artist Directory
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[#1A1A1A]">
              DISCOVER <span className="gradient-text-primary">TALENT</span>
            </h1>
            <p className="mt-5 text-slate-500 max-w-2xl font-medium leading-relaxed">
              Explore our exclusive network of premium artists across every category. Click any card to see full details & share their profile.
            </p>
          </motion.div>

          {/* Search & Filter Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "circOut" }}
            className="glass-panel rounded-3xl p-5 mb-10 flex flex-col md:flex-row gap-4 md:items-center"
          >
            {/* Search */}
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors z-10" />
              <input
                type="text"
                placeholder="Search by artist, category, nickname..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-glass w-full rounded-2xl pl-14 pr-4 py-4 text-[#1A1A1A] font-medium shadow-inner placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category filter */}
            <div className="w-full md:w-64">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-14 bg-white/60 border-orange-100 text-[#1A1A1A] rounded-2xl uppercase tracking-widest text-xs font-black shadow-inner shadow-black/5 hover:bg-white/80 transition-colors focus:ring-orange-400">
                  <SelectValue placeholder="ALL CATEGORIES" />
                </SelectTrigger>
                <SelectContent className="bg-white/90 backdrop-blur-xl border-orange-100 text-[#1A1A1A] rounded-2xl shadow-xl">
                  <SelectItem value="all" className="font-bold py-3 uppercase text-xs tracking-widest focus:bg-orange-50 focus:text-orange-600">
                    ALL CATEGORIES
                  </SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name} className="font-bold py-3 uppercase text-xs tracking-widest focus:bg-orange-50 focus:text-orange-600">
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-2 bg-orange-50 rounded-2xl p-1.5 border border-orange-100">
              <button
                onClick={() => setViewMode("category")}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewMode === "category"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-foreground shadow-md"
                    : "text-slate-500 hover:text-orange-600"
                }`}
              >
                By Category
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewMode === "grid"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-foreground shadow-md"
                    : "text-slate-500 hover:text-orange-600"
                }`}
              >
                Grid
              </button>
            </div>
          </motion.div>

          {/* Count bar */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-orange-100">
            <h3 className="text-slate-500 text-[10px] font-black tracking-[0.25em] uppercase">
              {loading
                ? "Curating the extraordinary..."
                : showCategoryView
                ? `${activeCategories.length} Categor${activeCategories.length !== 1 ? "ies" : "y"} · ${artists.length} Artist${artists.length !== 1 ? "s" : ""}`
                : `Viewing ${filteredArtists.length} Profile${filteredArtists.length !== 1 ? "s" : ""}${selectedCategory !== "all" ? ` · ${selectedCategory}` : ""}`}
            </h3>
            {(selectedCategory !== "all" || searchQuery) && (
              <button
                onClick={() => { setSelectedCategory("all"); setSearchQuery(""); }}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-600 transition-colors"
              >
                <X className="w-3 h-3" /> Clear Filters
              </button>
            )}
          </div>

          {/* Main content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <p className="text-orange-600 text-[10px] font-black tracking-widest uppercase">
                Curating the extraordinary...
              </p>
            </div>
          ) : showCategoryView ? (
            // ── Category-by-Category view ──────────────────────────────────────
            activeCategories.length > 0 ? (
              <div>
                {activeCategories.map((cat) => (
                  <CategorySection
                    key={cat.id || cat.name}
                    categoryName={cat.name}
                    categoryIcon={cat.icon}
                    artists={cat.artists}
                  />
                ))}
              </div>
            ) : (
              <EmptyState selectedCategory={selectedCategory} onClear={() => { setSelectedCategory("all"); setSearchQuery(""); }} />
            )
          ) : (
            // ── Flat grid view (search results or grid toggle) ─────────────────
            filteredArtists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                {filteredArtists.map((artist, idx) => (
                  <PremiumArtistCard
                    key={artist.id}
                    artist={artist}
                    index={idx}
                    onClick={() => {}}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                selectedCategory={selectedCategory}
                onClear={() => { setSelectedCategory("all"); setSearchQuery(""); }}
              />
            )
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ selectedCategory, onClear }: { selectedCategory: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-3xl p-10 max-w-lg mx-auto">
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-200/60 to-amber-200/60 blur-xl animate-pulse" />
        <div className="relative w-full h-full rounded-full bg-white/70 border border-orange-100 shadow-md flex items-center justify-center">
          <Mic className="h-9 w-9 text-orange-300" />
        </div>
      </div>

      <h3 className="text-xl font-black tracking-wider uppercase text-[#1A1A1A] mb-2">
        {selectedCategory !== "all" ? `No ${selectedCategory} found` : "No artists found."}
      </h3>
      <p className="text-slate-500 text-sm font-medium mb-8 max-w-xs leading-relaxed">
        {selectedCategory !== "all"
          ? `There are no registered artists in the "${selectedCategory}" category yet.`
          : "No artists match your search. Try a different keyword."}
      </p>

      <button
        onClick={onClear}
        className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-foreground text-[10px] font-black uppercase tracking-widest shadow-md shadow-orange-200 hover:shadow-lg hover:shadow-orange-300 hover:scale-105 active:scale-95 transition-all"
      >
        <Sparkles className="w-3.5 h-3.5" />
        View All Artists
      </button>
    </div>
  );
}
