import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Search, ChevronDown, Clock, ShieldCheck, UserCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NewRequirementModal from "@/components/NewRequirementModal";

export const CATEGORY_LEVEL2_DATA: Record<
  string,
  {
    title: string;
    subtitle: string;
    heroImage: string;
    allSubcategories: string[];
    popularServices: Array<{
      title: string;
      artistsCount: string;
      image: string;
      queryParam: string;
    }>;
  }
> = {
  Photography: {
    title: "Photography",
    subtitle: "Capture every special moment with professional photography services.",
    heroImage: "https://images.pexels.com/photos/32538906/pexels-photo-32538906.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
    allSubcategories: [
      "Wedding Photographer",
      "Candid Photographer",
      "Traditional Photographer",
      "Drone Photography",
      "Pre-Wedding Shoot",
      "Photo Booth",
      "Live Streaming",
      "Cinematic Videography",
      "More Services",
    ],
    popularServices: [
      {
        title: "Wedding Photographer",
        artistsCount: "1450+ Artists",
        image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=800&auto=format&fit=crop",
        queryParam: "Wedding Photographer",
      },
      {
        title: "Candid Photographer",
        artistsCount: "950+ Artists",
        image: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?q=80&w=800&auto=format&fit=crop",
        queryParam: "Candid Photographer",
      },
      {
        title: "Drone Photography",
        artistsCount: "720+ Artists",
        image: "https://images.pexels.com/photos/30620518/pexels-photo-30620518.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
        queryParam: "Drone Photography",
      },
      {
        title: "Pre-Wedding Shoot",
        artistsCount: "680+ Artists",
        image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=800&auto=format&fit=crop",
        queryParam: "Pre-Wedding Shoot",
      },
    ],
  },
  Entertainment: {
    title: "Entertainment",
    subtitle: "Live musical bands, singers, dancers, DJs, and stage performers for your event.",
    heroImage: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop",
    allSubcategories: [
      "Live Orchestra & Bands",
      "Celebrity Vocalists",
      "Folk Dancers",
      "DJs & Sound Controllers",
      "Stand-Up Comedians",
      "Instrumental Ensemble",
      "Anchors / Hosts",
      "Magicians & Variety Acts",
    ],
    popularServices: [
      {
        title: "Live Orchestra & Bands",
        artistsCount: "1200+ Artists",
        image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=800&auto=format&fit=crop",
        queryParam: "Band",
      },
      {
        title: "Celebrity Vocalists",
        artistsCount: "850+ Artists",
        image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop",
        queryParam: "Singer",
      },
      {
        title: "DJs & Sound Controllers",
        artistsCount: "1100+ Artists",
        image: "https://images.pexels.com/photos/2111015/pexels-photo-2111015.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
        queryParam: "DJ",
      },
      {
        title: "Anchors / Hosts",
        artistsCount: "620+ Artists",
        image: "https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
        queryParam: "Anchor",
      },
    ],
  },
  Decoration: {
    title: "Decoration",
    subtitle: "Transform your venue with floral mandaps, balloon arches, LED lighting & thematic decor.",
    heroImage: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop",
    allSubcategories: [
      "Mandap & Stage Decor",
      "Floral Designers",
      "Balloon Decorators",
      "Entrance Arches",
      "Theme & Lighting Decor",
      "Pathway & Table Decor",
    ],
    popularServices: [
      {
        title: "Mandap & Stage Decor",
        artistsCount: "980+ Artists",
        image: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
        queryParam: "Decorators",
      },
      {
        title: "Floral Designers",
        artistsCount: "640+ Artists",
        image: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=800&auto=format&fit=crop",
        queryParam: "Floral Decor",
      },
      {
        title: "Balloon Decorators",
        artistsCount: "750+ Artists",
        image: "https://images.unsplash.com/photo-1530103862676-de88924083a2?q=80&w=800&auto=format&fit=crop",
        queryParam: "Balloon Decorators",
      },
      {
        title: "Theme & Lighting Decor",
        artistsCount: "510+ Artists",
        image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=800&auto=format&fit=crop",
        queryParam: "Lighting Decor",
      },
    ],
  },
  Venue: {
    title: "Venue",
    subtitle: "Find luxury banquet halls, open lawns, beach resorts & heritage palaces.",
    heroImage: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop",
    allSubcategories: [
      "Banquet Halls",
      "Marriage Lawns",
      "Resorts & Hotels",
      "Heritage Forts",
      "AC Marriage Halls",
    ],
    popularServices: [
      {
        title: "Banquet Halls",
        artistsCount: "820+ Venues",
        image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=800&auto=format&fit=crop",
        queryParam: "Banquet Hall",
      },
      {
        title: "Marriage Lawns",
        artistsCount: "690+ Venues",
        image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=800&auto=format&fit=crop",
        queryParam: "Lawn",
      },
      {
        title: "Resorts & Hotels",
        artistsCount: "430+ Venues",
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop",
        queryParam: "Resort",
      },
      {
        title: "Heritage Forts",
        artistsCount: "210+ Venues",
        image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800&auto=format&fit=crop",
        queryParam: "Heritage",
      },
    ],
  },
  Catering: {
    title: "Catering",
    subtitle: "Authentic multi-cuisine caterers, live counters, dessert stations & Maharashtrian Mahaprasad.",
    heroImage: "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=1200&auto=format&fit=crop",
    allSubcategories: [
      "Traditional Maharashtrian Thali",
      "Multi-Cuisine Buffet",
      "Live Food Stalls",
      "Dessert & Mocktail Bar",
      "Pure Veg Catering",
    ],
    popularServices: [
      {
        title: "Traditional Maharashtrian Thali",
        artistsCount: "910+ Caterers",
        image: "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=800&auto=format&fit=crop",
        queryParam: "Catering",
      },
      {
        title: "Multi-Cuisine Buffet",
        artistsCount: "740+ Caterers",
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop",
        queryParam: "Buffet Catering",
      },
      {
        title: "Live Food Stalls",
        artistsCount: "580+ Caterers",
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=800&auto=format&fit=crop",
        queryParam: "Live Stalls",
      },
      {
        title: "Dessert & Mocktail Bar",
        artistsCount: "460+ Caterers",
        image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=800&auto=format&fit=crop",
        queryParam: "Dessert Bar",
      },
    ],
  },
  Makeup: {
    title: "Makeup",
    subtitle: "Professional bridal makeup artists, HD airbrush makeup, saree draping & hair styling.",
    heroImage: "https://images.pexels.com/photos/33986816/pexels-photo-33986816.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
    allSubcategories: [
      "Bridal HD Makeup",
      "Airbrush Makeup",
      "Groom Makeup & Styling",
      "Party & Family Makeup",
      "Saree Draping & Hair",
    ],
    popularServices: [
      {
        title: "Bridal HD Makeup",
        artistsCount: "1150+ Artists",
        image: "https://images.pexels.com/photos/33986816/pexels-photo-33986816.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
        queryParam: "Bridal Makeup",
      },
      {
        title: "Airbrush Makeup",
        artistsCount: "720+ Artists",
        image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=800&auto=format&fit=crop",
        queryParam: "Airbrush Makeup",
      },
      {
        title: "Groom Makeup & Styling",
        artistsCount: "430+ Artists",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
        queryParam: "Groom Styling",
      },
      {
        title: "Saree Draping & Hair",
        artistsCount: "890+ Artists",
        image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop",
        queryParam: "Hair & Draping",
      },
    ],
  },

  // ─── VARKARI SAMPRADAY LEVEL 2 CATEGORIES ───
  "Spiritual Speakers": {
    title: "Spiritual Speakers",
    subtitle: "Renowned Kirtankars, Pravachankars & Kathakars for Varkari Sampraday programs.",
    heroImage: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=1200&auto=format&fit=crop",
    allSubcategories: [
      "Kirtankar",
      "Pravachankar",
      "Vyaspithchalak",
      "Chopdar",
      "Bhagwat Katha Kathan",
      "Ram Katha",
    ],
    popularServices: [
      {
        title: "Kirtankar",
        artistsCount: "950+ Kirtankars",
        image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=800&auto=format&fit=crop",
        queryParam: "Kirtankar",
      },
      {
        title: "Pravachankar",
        artistsCount: "620+ Pravachankars",
        image: "https://images.unsplash.com/photo-1608613304899-ea8098577e38?q=80&w=800&auto=format&fit=crop",
        queryParam: "Pravachankar",
      },
      {
        title: "Vyaspithchalak",
        artistsCount: "410+ Performers",
        image: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop",
        queryParam: "Vyaspithchalak",
      },
      {
        title: "Bhagwat Katha Kathan",
        artistsCount: "380+ Kathakars",
        image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800&auto=format&fit=crop",
        queryParam: "Bhagwat Katha Kathan",
      },
    ],
  },
  "Vocal Artists": {
    title: "Vocal Artists",
    subtitle: "Bhajani Mandals, Classical Bhajan singers, Bharudkars & Devotional Vocalists.",
    heroImage: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop",
    allSubcategories: [
      "Gayak",
      "Bharudkar",
      "Bhajani Mandal",
      "Shastriya Bhajan",
    ],
    popularServices: [
      {
        title: "Bhajani Mandal",
        artistsCount: "1280+ Groups",
        image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop",
        queryParam: "Bhajani Mandal",
      },
      {
        title: "Bharudkar",
        artistsCount: "450+ Performers",
        image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=800&auto=format&fit=crop",
        queryParam: "Bharudkar",
      },
      {
        title: "Gayak",
        artistsCount: "890+ Singers",
        image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=800&auto=format&fit=crop",
        queryParam: "Gayak",
      },
      {
        title: "Shastriya Bhajan",
        artistsCount: "340+ Vocalists",
        image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop",
        queryParam: "Shastriya Bhajan",
      },
    ],
  },
  "Instrumental Artists": {
    title: "Instrumental Artists",
    subtitle: "Master Mridangamani, Tabla & Harmonium Vadak, Vinekari & Talkaris.",
    heroImage: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop",
    allSubcategories: [
      "Mridangamani",
      "Vinekari",
      "Talkari",
      "Tabla Vadak",
      "Harmonium Vadak",
      "Dholki Vadak",
    ],
    popularServices: [
      {
        title: "Mridangamani",
        artistsCount: "840+ Masters",
        image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop",
        queryParam: "Mridangamani",
      },
      {
        title: "Harmonium Vadak",
        artistsCount: "750+ Artists",
        image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=800&auto=format&fit=crop",
        queryParam: "Harmonium Vadak",
      },
      {
        title: "Tabla Vadak",
        artistsCount: "920+ Artists",
        image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop",
        queryParam: "Tabla Vadak",
      },
      {
        title: "Talkari",
        artistsCount: "610+ Performers",
        image: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop",
        queryParam: "Talkari",
      },
    ],
  },
  "Organizations": {
    title: "Organizations",
    subtitle: "Registered Warkari Sansthas, Dindi Management & Spiritual Collectives.",
    heroImage: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=1200&auto=format&fit=crop",
    allSubcategories: [
      "Warkari Sanstha",
    ],
    popularServices: [
      {
        title: "Warkari Sanstha",
        artistsCount: "310+ Sansthas",
        image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=800&auto=format&fit=crop",
        queryParam: "Warkari Sanstha",
      },
    ],
  },
};

export default function CategoryLevel2Page() {
  const { eventName, categoryName } = useParams<{ eventName: string; categoryName: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [briefModalOpen, setBriefModalOpen] = useState(false);

  const decodedEvent = eventName ? decodeURIComponent(eventName) : "Wedding";
  const decodedCategory = categoryName ? decodeURIComponent(categoryName) : "Photography";

  const categoryData = CATEGORY_LEVEL2_DATA[decodedCategory] || CATEGORY_LEVEL2_DATA["Photography"];

  const filteredSubcategories = useMemo(() => {
    if (!searchQuery.trim()) return categoryData.allSubcategories;
    const q = searchQuery.toLowerCase();
    return categoryData.allSubcategories.filter((sub) => sub.toLowerCase().includes(q));
  }, [searchQuery, categoryData.allSubcategories]);

  const handleSubcategoryClick = (subName: string) => {
    navigate(
      `/events/${encodeURIComponent(decodedEvent)}/${encodeURIComponent(categoryData.title)}/${encodeURIComponent(subName)}`
    );
  };

  return (
    <div className="min-h-screen bg-stone-50/50 flex flex-col font-sans antialiased pt-20">
      <Navbar />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* ─── Breadcrumb Header ─── */}
        <div className="flex items-center justify-between py-2 border-b border-stone-200/60 mb-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 overflow-x-auto whitespace-nowrap no-scrollbar pr-2">
            <Link to="/" className="hover:text-stone-900 transition-colors shrink-0">
              Home
            </Link>
            <span className="shrink-0">&gt;</span>
            <Link to={`/events/${encodeURIComponent(decodedEvent)}`} className="hover:text-stone-900 transition-colors shrink-0">
              {decodedEvent}
            </Link>
            <span className="shrink-0">&gt;</span>
            <span className="text-stone-900 font-bold shrink-0">{categoryData.title}</span>
          </div>
          <button
            onClick={() => navigate("/search")}
            className="p-1.5 rounded-full hover:bg-stone-200/60 text-stone-500 transition"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        {/* ─── Hero Section Banner ─── */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-stone-950 via-stone-900 to-stone-800 text-white p-6 sm:p-8 md:p-10 mb-6 min-h-[220px] sm:min-h-[250px] flex items-center shadow-lg">
          <div className="relative z-10 max-w-lg pb-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
              {categoryData.title}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-stone-300 font-medium leading-relaxed">
              {categoryData.subtitle}
            </p>
          </div>

          {/* Right HD Image with Fading Mask */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 md:w-5/12 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/60 to-transparent z-10" />
            <img
              src={categoryData.heroImage}
              alt={categoryData.title}
              className="h-full w-full object-cover object-center"
            />
          </div>

          {/* Overlay Search Input at Bottom of Hero */}
          <div className="absolute left-6 right-6 bottom-4 md:left-10 md:bottom-6 z-20 max-w-xl">
            <div className="relative flex items-center bg-white rounded-2xl shadow-md border border-stone-200 px-3.5 py-2.5">
              <Search className="h-4 w-4 text-stone-400 mr-2.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subcategory..."
                className="w-full text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 bg-transparent border-none outline-none font-medium"
              />
            </div>
          </div>
        </div>

        {/* ─── Main 2-Column Section ─── */}
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6 md:gap-8 mb-8">
          {/* Left Column: All Subcategories List */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-5 shadow-xs h-fit">
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-stone-100">
              <h2 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider">
                All Subcategories
              </h2>
              <ChevronDown className="h-4 w-4 text-stone-400" />
            </div>

            <ul className="space-y-1">
              {filteredSubcategories.map((sub) => (
                <li key={sub}>
                  <button
                    onClick={() => handleSubcategoryClick(sub)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-stone-700 hover:text-orange-600 hover:bg-orange-50/80 transition-colors flex items-center justify-between group"
                  >
                    <span>{sub}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: Popular Services Cards */}
          <div>
            <h2 className="text-lg md:text-xl font-extrabold text-stone-900 mb-4 tracking-tight">
              Popular Services
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
              {categoryData.popularServices.map((service) => (
                <div
                  key={service.title}
                  onClick={() => handleSubcategoryClick(service.queryParam)}
                  className="group flex flex-col cursor-pointer bg-white rounded-2xl border border-stone-200/80 p-3.5 shadow-xs hover:border-orange-400 hover:shadow-md transition-all duration-300"
                >
                  <div className="relative aspect-[1.35/1] w-full overflow-hidden rounded-xl bg-stone-100 mb-3">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="text-sm font-extrabold text-stone-900 group-hover:text-orange-600 transition-colors leading-snug">
                    {service.title}
                  </h3>
                  <p className="mt-0.5 text-xs font-semibold text-stone-400">
                    {service.artistsCount}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Bottom Callout Banner ("Can't find what you're looking for?") ─── */}
        <div className="rounded-2xl bg-gradient-to-r from-orange-50/90 via-amber-50/80 to-orange-50/90 border border-orange-200/70 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-stone-900 leading-tight">
                Can't find what you're looking for?
              </h4>
              <p className="text-xs font-semibold text-stone-600 mt-0.5">
                Tell us what you need.
              </p>
            </div>
          </div>

          <button
            onClick={() => setBriefModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-white border border-stone-200 text-xs font-extrabold text-stone-800 shadow-2xs hover:bg-stone-950 hover:text-white hover:border-stone-950 transition-all duration-300"
          >
            Request Service
          </button>
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
