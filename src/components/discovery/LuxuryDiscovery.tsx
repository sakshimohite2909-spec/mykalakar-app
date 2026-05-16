import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { CATEGORY_GROUP_OPTIONS } from "@/constants/artistSystem";
import { cn } from "@/lib/utils";
import { SmartImage } from "@/components/SmartImage";
import {
  getActiveCategories,
  getActiveEventTypes,
  getActiveSubCategories,
  getActiveTags,
  getEventCategory,
  getInjectedSubcategories,
  type SmartFilters,
} from "@/services/filterEngine";
import { formatDate, formatRating, safeString } from "@/services/dataNormalizer";
import type { ArtistCardViewModel } from "@/services/marketplaceCards";

type FilterPatch = Partial<SmartFilters>;
type EventCardRecord = Record<string, unknown>;

type LuxuryFilterBarProps = {
  filters: SmartFilters;
  onChange: (next: FilterPatch) => void;
  onReset: () => void;
  resultCount: number;
  loading?: boolean;
  placeholder?: string;
  tagOptions?: string[];
  eventTypeOptions?: string[];
};

const chipMotion = {
  initial: { opacity: 0, y: 8, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.96 },
  transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
};

function toggleValue(values: string[], value: string) {
  const key = value.toLowerCase();
  return values.some((item) => item.toLowerCase() === key)
    ? values.filter((item) => item.toLowerCase() !== key)
    : [...values, value];
}

function compact(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const clean = value.trim();
    const key = clean.toLowerCase();
    if (!clean || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function FilterPill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      layout
      whileHover={{ y: -2, scale: 1.015 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn("luxury-filter-pill", active && "is-active")}
    >
      {children}
    </motion.button>
  );
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <motion.span layout {...chipMotion} className="luxury-active-chip">
      {label}
      <button type="button" onClick={onRemove} aria-label={`Remove ${label}`}>
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.span>
  );
}

export function LuxuryFilterBar({
  filters,
  onChange,
  onReset,
  resultCount,
  loading,
  placeholder = "Search artists, art forms, location",
  tagOptions = [],
  eventTypeOptions = [],
}: LuxuryFilterBarProps) {
  const activeCategories = getActiveCategories(filters);
  const activeSubCategories = getActiveSubCategories(filters);
  const activeTags = getActiveTags(filters);
  const activeEventTypes = getActiveEventTypes(filters);
  const subcategories = getInjectedSubcategories(filters);

  const toggleCategory = (category: string) => {
    const nextCategories = toggleValue(activeCategories, category);
    const nextSubCategories = activeSubCategories.filter((subCategory) => {
      const parent = CATEGORY_GROUP_OPTIONS.find((group) => group.subcategories.includes(subCategory))?.name;
      return !parent || nextCategories.includes(parent);
    });
    onChange({
      category: nextCategories[0] || null,
      categories: nextCategories,
      subCategory: nextSubCategories[0] || null,
      subCategories: nextSubCategories,
    });
  };

  const toggleSubCategory = (subCategory: string) => {
    const nextSubCategories = toggleValue(activeSubCategories, subCategory);
    onChange({
      subCategory: nextSubCategories[0] || null,
      subCategories: nextSubCategories,
    });
  };

  const toggleTag = (tag: string) => {
    onChange({ tags: toggleValue(activeTags, tag) });
  };

  const toggleEventType = (eventType: string) => {
    onChange({ eventTypes: toggleValue(activeEventTypes, eventType) });
  };

  return (
    <motion.section layout className="luxury-filter-dock" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
      <div className="luxury-filter-topline">
        <div className="luxury-search-field">
          <Search className="h-4 w-4" />
          <input
            value={filters.query}
            onChange={(event) => onChange({ query: event.target.value })}
            placeholder={placeholder}
            aria-label={placeholder}
          />
          {filters.query ? (
            <button type="button" onClick={() => onChange({ query: "" })} aria-label="Clear search">
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <div className="luxury-filter-count">
          <SlidersHorizontal className="h-4 w-4" />
          {loading ? "Curating" : `${resultCount} result${resultCount === 1 ? "" : "s"}`}
        </div>
      </div>

      <div className="luxury-chip-row" aria-label="Parent categories">
        <FilterPill active={!activeCategories.length && !activeSubCategories.length} onClick={onReset}>
          All
        </FilterPill>
        {CATEGORY_GROUP_OPTIONS.map((group) => (
          <FilterPill key={group.id} active={activeCategories.includes(group.name)} onClick={() => toggleCategory(group.name)}>
            <span>{group.name}</span>
            <em>{group.subcategories.length}</em>
          </FilterPill>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {subcategories.length ? (
          <motion.div layout className="luxury-chip-row secondary" aria-label="Injected subcategories" {...chipMotion}>
            {subcategories.map((subCategory) => (
              <FilterPill key={subCategory} active={activeSubCategories.includes(subCategory)} onClick={() => toggleSubCategory(subCategory)}>
                {subCategory}
              </FilterPill>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {tagOptions.length || eventTypeOptions.length ? (
        <div className="luxury-chip-row tertiary" aria-label="Tags and event types">
          {compact(tagOptions).slice(0, 8).map((tag) => (
            <FilterPill key={`tag:${tag}`} active={activeTags.includes(tag)} onClick={() => toggleTag(tag)}>
              #{tag}
            </FilterPill>
          ))}
          {compact(eventTypeOptions).slice(0, 8).map((eventType) => (
            <FilterPill key={`event:${eventType}`} active={activeEventTypes.includes(eventType)} onClick={() => toggleEventType(eventType)}>
              {eventType}
            </FilterPill>
          ))}
        </div>
      ) : null}

      <AnimatePresence initial={false}>
        {filters.query || activeCategories.length || activeSubCategories.length || activeTags.length || activeEventTypes.length ? (
          <motion.div layout className="luxury-active-row" {...chipMotion}>
            {filters.query ? <ActiveChip label={`Search: ${filters.query}`} onRemove={() => onChange({ query: "" })} /> : null}
            {activeCategories.map((category) => (
              <ActiveChip
                key={`active-cat:${category}`}
                label={category}
                onRemove={() => toggleCategory(category)}
              />
            ))}
            {activeSubCategories.map((subCategory) => (
              <ActiveChip
                key={`active-sub:${subCategory}`}
                label={subCategory}
                onRemove={() => toggleSubCategory(subCategory)}
              />
            ))}
            {activeTags.map((tag) => (
              <ActiveChip key={`active-tag:${tag}`} label={`Tag: ${tag}`} onRemove={() => toggleTag(tag)} />
            ))}
            {activeEventTypes.map((eventType) => (
              <ActiveChip key={`active-event:${eventType}`} label={eventType} onRemove={() => toggleEventType(eventType)} />
            ))}
            <button type="button" className="luxury-clear-link" onClick={onReset}>
              <RefreshCw className="h-3.5 w-3.5" />
              Clear all
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}

export function LuxuryArtistCard({ artist, index }: { artist: ArtistCardViewModel; index: number }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 18, scale: 0.98 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.035, 0.2), ease: [0.16, 1, 0.3, 1] }}
      className="luxury-card luxury-artist-card group"
    >
      <Link to={`/artist/${artist.artistId}`} aria-label={`View ${artist.name}`}>
        <div className="luxury-card-media">
          <SmartImage
            src={artist.image}
            alt={artist.name || artist.subCategory}
            usageId={`luxury-artist:${artist.cardId}`}
            category={artist.subCategory || artist.category}
            orientation="landscape"
            priority={index < 6}
            aspectRatio="aspect-auto"
            sizes="(max-width: 720px) 100vw, (max-width: 1180px) 33vw, 260px"
            containerClassName="h-full w-full transition duration-700 group-hover:scale-[1.04]"
          />
          <div className="luxury-card-vignette" />
          <span className="luxury-card-rating">
            <Star className="h-3.5 w-3.5 fill-current" />
            {formatRating(artist.rating)}
          </span>
        </div>
        <div className="luxury-card-body">
          <div className="luxury-card-kicker">
            <span>{artist.category}</span>
            {artist.verified ? <BadgeCheck className="h-4 w-4" /> : null}
          </div>
          <div className="luxury-card-title-row">
            <h3>{artist.name || "Premium Artist"}</h3>
            <ArrowUpRight className="h-5 w-5" />
          </div>
          <p className="luxury-card-subtitle">{artist.subCategory}</p>
          <p className="luxury-card-description">{artist.bio}</p>
          <div className="luxury-card-meta">
            <span>
              <MapPin className="h-3.5 w-3.5" />
              {artist.location}
            </span>
            <strong>{artist.priceRange}</strong>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export function LuxuryEventCard({ event, index }: { event: EventCardRecord; index: number }) {
  const artType = safeString(event.artType || event.subCategory || event.subcategory || event.category, "Event");
  const category = getEventCategory(event) || "Event";
  const image = safeString(event.image || event.imageUrl || event.coverImage);
  const title = safeString(event.title || event.name, "Curated Event Brief");
  const description = safeString(event.description || event.requirements || artType, "A verified event brief looking for the right creative team.");

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 18, scale: 0.98 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.035, 0.2), ease: [0.16, 1, 0.3, 1] }}
      className="luxury-card luxury-event-card group"
    >
      <Link to={`/event/${String(event.id || "")}`} aria-label={`View ${title}`}>
        <div className="luxury-card-media">
          <SmartImage
            src={image}
            alt={title}
            usageId={`luxury-event:${String(event.id || "event")}`}
            category={artType || category}
            orientation="landscape"
            priority={index < 4}
            aspectRatio="aspect-auto"
            sizes="(max-width: 720px) 100vw, (max-width: 1180px) 33vw, 260px"
            containerClassName="h-full w-full transition duration-700 group-hover:scale-[1.04]"
          />
          <div className="luxury-card-vignette" />
          <span className="luxury-card-rating">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(event.eventDate)}
          </span>
        </div>
        <div className="luxury-card-body">
          <div className="luxury-card-kicker">
            <span>{category}</span>
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="luxury-card-title-row">
            <h3>{title}</h3>
            <ArrowUpRight className="h-5 w-5" />
          </div>
          <p className="luxury-card-subtitle">{artType}</p>
          <p className="luxury-card-description">{description}</p>
          <div className="luxury-card-meta">
            <span>
              <MapPin className="h-3.5 w-3.5" />
              {safeString(event.location || event.district || event.state, "Maharashtra")}
            </span>
            <strong>
              Open brief
              <ArrowRight className="h-3.5 w-3.5" />
            </strong>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export function LuxuryEmptyState({ label, onReset }: { label: string; onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="luxury-empty-state"
    >
      <Sparkles className="h-8 w-8" />
      <h2>No {label} matched this curation.</h2>
      <p>Clear one layer or widen the parent category to bring the full collection back into view.</p>
      <button type="button" onClick={onReset}>
        Reset Filters
        <RefreshCw className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export { AnimatePresence };
