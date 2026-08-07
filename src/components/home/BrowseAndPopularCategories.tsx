import { Link } from "react-router-dom";
import {
  Camera,
  Sparkles,
  Utensils,
  Flower2,
  Building2,
  Paintbrush,
  Disc,
  Car,
} from "lucide-react";

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

export const POPULAR_CATEGORIES = [
  {
    title: "Photography",
    icon: Camera,
    link: "/events/Wedding/Photography",
  },
  {
    title: "Entertainment",
    icon: Sparkles,
    link: "/events/Wedding/Entertainment",
  },
  {
    title: "Catering",
    icon: Utensils,
    link: "/events/Wedding/Catering",
  },
  {
    title: "Decoration",
    icon: Flower2,
    link: "/events/Wedding/Decoration",
  },
  {
    title: "Venue",
    icon: Building2,
    link: "/events/Wedding/Venue",
  },
  {
    title: "Makeup",
    icon: Paintbrush,
    link: "/events/Wedding/Makeup",
  },
  {
    title: "DJ",
    icon: Disc,
    link: "/artists?subCategory=DJ",
  },
  {
    title: "Transport",
    icon: Car,
    link: "/artists?subCategory=Transport",
  },
];

export default function BrowseAndPopularCategories() {
  return (
    <section className="mx-auto w-full max-w-[1240px] px-4 md:px-6 py-6 md:py-8">
      {/* ─── 1. Browse by Event ─── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-extrabold text-stone-900 tracking-tight">
            Browse by Event
          </h2>
          <Link
            to="/artists"
            className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            View All
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-5">
          {BROWSE_EVENTS.map((evt) => (
            <Link
              key={evt.title}
              to={evt.link}
              className="group flex flex-col cursor-pointer"
            >
              <div className="relative aspect-[1.25/1] w-full overflow-hidden rounded-2xl bg-stone-100 shadow-sm border border-stone-200/60">
                <img
                  src={evt.image}
                  alt={evt.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <h3 className="mt-2.5 text-sm md:text-base font-extrabold text-stone-900 group-hover:text-orange-600 transition-colors leading-tight">
                {evt.title}
              </h3>
              <p className="mt-0.5 text-xs font-semibold text-stone-500">
                {evt.subtitle}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* ─── 2. Popular Categories ─── */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-extrabold text-stone-900 tracking-tight">
            Popular Categories
          </h2>
          <Link
            to="/artists"
            className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            View All
          </Link>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2.5 sm:gap-3.5">
          {POPULAR_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.title}
                to={cat.link}
                className="group flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:border-orange-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer min-h-[96px]"
              >
                <div className="flex h-10 w-10 items-center justify-center text-stone-800 group-hover:text-orange-600 transition-colors">
                  <Icon className="h-6 w-6 stroke-[1.75]" />
                </div>
                <span className="mt-1 text-[11px] sm:text-xs font-bold text-stone-800 text-center group-hover:text-orange-600 transition-colors truncate w-full">
                  {cat.title}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
