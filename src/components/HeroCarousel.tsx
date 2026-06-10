import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic2,
  Sparkles,
  Music2,
  Disc,
  Drum,
  Speech,
  Laugh,
  Flame,
  Users,
  Grid,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Globe2,
  Headphones,
  Award,
} from "lucide-react";

interface SlideData {
  id: number;
  image: string;
  headline: string;
  subheading: string;
  cta1Text: string;
  cta1Link: string;
  cta2Text: string;
  cta2Link: string;
  badge?: string;
}

const slides: SlideData[] = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1920&q=80",
    headline: "India's Home of Extraordinary Artists",
    subheading: "Discover verified performers, dancers, singers, musicians and entertainers for every occasion.",
    cta1Text: "Explore Artists",
    cta1Link: "/artists",
    cta2Text: "Post an Event",
    cta2Link: "/events",
    badge: "10,000+ Successful Bookings",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1520872024865-3ff2805d8bb3?auto=format&fit=crop&w=1920&q=80",
    headline: "Book India's Finest Singers",
    subheading: "Find verified vocal artists for weddings, concerts, festivals and corporate events.",
    cta1Text: "Explore Singers",
    cta1Link: "/artists",
    cta2Text: "Book Now",
    cta2Link: "/artists",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1605335661331-1e9680eddbec?auto=format&fit=crop&w=1920&q=80",
    headline: "Celebrate India's Cultural Heritage",
    subheading: "Connect with traditional performers and cultural artists from every region.",
    cta1Text: "Explore Cultural Artists",
    cta1Link: "/artists",
    cta2Text: "Learn More",
    cta2Link: "/explore",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1920&q=80",
    headline: "Live Bands That Elevate Every Event",
    subheading: "Discover talented bands ready for weddings, festivals and corporate celebrations.",
    cta1Text: "Explore Bands",
    cta1Link: "/artists",
    cta2Text: "Book Event",
    cta2Link: "/events",
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1560439514-4e9645039924?auto=format&fit=crop&w=1920&q=80",
    headline: "Professional Hosts For Memorable Events",
    subheading: "Find experienced anchors, emcees and presenters for any occasion.",
    cta1Text: "Explore Hosts",
    cta1Link: "/artists",
    cta2Text: "Hire Now",
    cta2Link: "/artists",
  },
];

const categories = [
  { name: "Singers", icon: Mic2, query: "Singers" },
  { name: "Dancers", icon: Sparkles, query: "Dance Artists" },
  { name: "Musicians", icon: Music2, query: "Traditional Musicians" },
  { name: "DJs", icon: Disc, query: "DJs" },
  { name: "Bands", icon: Drum, query: "Orchestra" },
  { name: "Anchors", icon: Speech, query: "Anchors / Hosts" },
  { name: "Comedians", icon: Laugh, query: "Performers" },
  { name: "Folk Artists", icon: Flame, query: "Folk Art" },
  { name: "Cultural Groups", icon: Users, query: "Spiritual & Varkari Sampraday" },
  { name: "View All", icon: Grid, query: "" },
];

const trustItems = [
  {
    icon: ShieldCheck,
    title: "Verified Artists",
    desc: "100% verified artist profiles",
  },
  {
    icon: Award,
    title: "Secure Booking",
    desc: "Safe and trusted transactions",
  },
  {
    icon: Globe2,
    title: "Nationwide Network",
    desc: "Artists from across India",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    desc: "Dedicated customer assistance",
  },
  {
    icon: Sparkles,
    title: "Premium Experience",
    desc: "Trusted by thousands of event organizers",
  },
];

export default function HeroCarousel() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  // Auto-play interval
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    touchStartX.current = null;
  };

  const activeSlide = slides[activeIndex];

  return (
    <div className="relative w-full max-w-[1240px] mx-auto px-4 md:px-6 mt-6 pb-4 flex flex-col items-center">
      {/* Slider Container */}
      <div
        className="relative w-full min-h-[350px] h-[350px] sm:h-[450px] sm:max-h-[450px] lg:h-[520px] lg:max-h-[520px] overflow-hidden rounded-[24px] shadow-2xl bg-black select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slide Images & Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Background Image Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10 z-10" />
            <img
              src={activeSlide?.image || "/assets/static/fallback-image.webp"}
              alt={activeSlide?.headline || "MyKalaakar"}
              loading="lazy"
              className="w-full h-full object-cover object-center"
            />

            {/* Slide Details */}
            <div className="absolute inset-x-6 bottom-8 sm:bottom-12 md:bottom-16 z-20 max-w-3xl text-left text-white px-2 sm:px-6 md:px-12 flex flex-col gap-2.5 md:gap-3.5">
              {activeSlide?.badge && (
                <span className="w-fit inline-flex items-center gap-1.5 rounded-full bg-[#F97316]/90 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-sm shadow-md">
                  <Award className="h-3 w-3" /> {activeSlide.badge}
                </span>
              )}
              <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black leading-tight text-white tracking-tight drop-shadow-md">
                {activeSlide?.headline}
              </h2>
              <p className="text-[11px] sm:text-xs md:text-sm lg:text-base font-semibold text-stone-250 leading-relaxed max-w-2xl drop-shadow-sm">
                {activeSlide?.subheading}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-2.5 mt-1.5">
                <Link
                  to={activeSlide?.cta1Link || "/artists"}
                  className="inline-flex h-9 sm:h-11 items-center justify-center rounded-full bg-[#F97316] hover:bg-[#EA580C] px-4 sm:px-5 text-xs font-extrabold text-white shadow-lg transition active:scale-[0.98]"
                >
                  {activeSlide?.cta1Text}
                </Link>
                <Link
                  to={activeSlide?.cta2Link || "/events"}
                  className="inline-flex h-9 sm:h-11 items-center justify-center rounded-full border-2 border-white/80 bg-white/10 hover:bg-white hover:text-[#111827] px-4 sm:px-5 text-xs font-extrabold text-white transition active:scale-[0.98]"
                >
                  {activeSlide?.cta2Text}
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Previous Arrow */}
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/60 active:scale-90"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Next Arrow */}
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/60 active:scale-90"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Slide pagination indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === activeIndex ? "w-8 bg-[#F97316]" : "w-2 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
