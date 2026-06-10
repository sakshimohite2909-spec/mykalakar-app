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
import { cn } from "@/lib/utils";
import { SmartImage } from "@/components/SmartImage";
import {
  getActiveCategories,
  getActiveEventTypes,
  getActiveSubCategories,
  getActiveTags,
  getEventCategory,
  type FilterFacetGroup,
  type SmartFilters,
} from "@/services/filterEngine";
import { formatDate, safeString } from "@/services/dataNormalizer";
import type { ArtistCardViewModel } from "@/services/marketplaceCards";
import { useI18n } from "@/i18n/I18nProvider";
import { getArtLabel } from "@/lib/artLabels";

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
  categoryFacets?: FilterFacetGroup[];
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

function normalizeKey(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
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
  const { t } = useI18n(); // ADDED FOR i18n
  return (
    <motion.span layout {...chipMotion} className="luxury-active-chip">
      {label}
      <button type="button" onClick={onRemove} aria-label={t("filters.removeFilter", { label })}> {/* ADDED FOR i18n */}
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
  placeholder,
  tagOptions = [],
  eventTypeOptions = [],
  categoryFacets: providedCategoryFacets,
}: LuxuryFilterBarProps) {
  const { formatNumber, t } = useI18n(); // ADDED FOR i18n
  const searchPlaceholder = placeholder || t("filters.searchPlaceholder"); // ADDED FOR i18n
  const activeCategories = getActiveCategories(filters);
  const activeSubCategories = getActiveSubCategories(filters);
  const activeTags = getActiveTags(filters);
  const activeEventTypes = getActiveEventTypes(filters);
  const categoryFacets = (providedCategoryFacets ?? []).filter(
    (group) => group.count > 0
  );
  const activeCategoryKeys = new Set(activeCategories.map(normalizeKey));
  const subCategoryFacets = categoryFacets
    .filter((group) => !activeCategoryKeys.size || activeCategoryKeys.has(normalizeKey(group.name)))
    .flatMap((group) =>
      group.subcategories
        .filter((subCategory) => subCategory.count > 0)
        .map((subCategory) => ({
          ...subCategory,
          category: group.name,
        }))
    );
  const subCategoryParentByKey = new Map(
    subCategoryFacets.map((subCategory) => [normalizeKey(subCategory.name), subCategory.category])
  );

  const toggleCategory = (category: string) => {
    const nextCategories = toggleValue(activeCategories, category);
    const nextSubCategories = activeSubCategories.filter((subCategory) => {
      if (!nextCategories.length) return false;
      const parent = subCategoryParentByKey.get(normalizeKey(subCategory));
      return !parent || nextCategories.some((item) => normalizeKey(item) === normalizeKey(parent));
    });
    onChange({
      category: nextCategories[0] || null,
      categories: nextCategories,
      subCategory: nextSubCategories[0] || null,
      subCategories: nextSubCategories,
    });
  };

  const toggleSubCategory = (subCategory: string, parentCategory?: string) => {
    const nextSubCategories = toggleValue(activeSubCategories, subCategory);
    const nextCategories =
      parentCategory && !activeCategories.some((category) => normalizeKey(category) === normalizeKey(parentCategory))
        ? [...activeCategories, parentCategory]
        : activeCategories;
    onChange({
      category: nextCategories[0] || null,
      categories: nextCategories,
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
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
          {filters.query ? (
            <button type="button" onClick={() => onChange({ query: "" })} aria-label={t("filters.clearSearch")}> {/* ADDED FOR i18n */}
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <div className="luxury-filter-count">
          <SlidersHorizontal className="h-4 w-4" />
          {loading ? t("filters.curating") : t("filters.resultCount", { count: formatNumber(resultCount) })} {/* ADDED FOR i18n */}
        </div>
      </div>

      <div className="luxury-chip-row" aria-label={t("filters.parentCategories")}> {/* ADDED FOR i18n */}
        <FilterPill active={!activeCategories.length && !activeSubCategories.length} onClick={onReset}>
          {t("filters.all")} {/* ADDED FOR i18n */}
        </FilterPill>
        {categoryFacets.map((group) => (
          <FilterPill key={group.id} active={activeCategories.includes(group.name)} onClick={() => toggleCategory(group.name)}>
            <span>{getArtLabel(t, group.name)}</span> {/* ADDED FOR i18n */}
            <em>{formatNumber(group.count)}</em> {/* ADDED FOR i18n */}
          </FilterPill>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {subCategoryFacets.length ? (
          <motion.div layout className="luxury-chip-row secondary" aria-label={t("filters.subcategories")} {...chipMotion}> {/* ADDED FOR i18n */}
            {subCategoryFacets.map((subCategory) => (
              <FilterPill
                key={`${subCategory.category}:${subCategory.name}`}
                active={activeSubCategories.includes(subCategory.name)}
                onClick={() => toggleSubCategory(subCategory.name, subCategory.category)}
              >
                {getArtLabel(t, subCategory.name)} {/* ADDED FOR i18n */}
                <em>{formatNumber(subCategory.count)}</em> {/* ADDED FOR i18n */}
              </FilterPill>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {tagOptions.length || eventTypeOptions.length ? (
        <div className="luxury-chip-row tertiary" aria-label={t("filters.tagsAndEvents")}> {/* ADDED FOR i18n */}
          {compact(tagOptions).slice(0, 8).map((tag) => (
            <FilterPill key={`tag:${tag}`} active={activeTags.includes(tag)} onClick={() => toggleTag(tag)}>
              #{tag}
            </FilterPill>
          ))}
          {compact(eventTypeOptions).slice(0, 8).map((eventType) => (
            <FilterPill key={`event:${eventType}`} active={activeEventTypes.includes(eventType)} onClick={() => toggleEventType(eventType)}>
              {getArtLabel(t, eventType)} {/* ADDED FOR i18n */}
            </FilterPill>
          ))}
        </div>
      ) : null}

      <AnimatePresence initial={false}>
        {filters.query || activeCategories.length || activeSubCategories.length || activeTags.length || activeEventTypes.length ? (
          <motion.div layout className="luxury-active-row" {...chipMotion}>
            {filters.query ? <ActiveChip label={t("filters.searchChip", { query: filters.query })} onRemove={() => onChange({ query: "" })} /> : null} {/* ADDED FOR i18n */}
            {activeCategories.map((category) => (
              <ActiveChip
                key={`active-cat:${category}`}
                label={getArtLabel(t, category)}
                onRemove={() => toggleCategory(category)}
              />
            ))}
            {activeSubCategories.map((subCategory) => (
              <ActiveChip
                key={`active-sub:${subCategory}`}
                label={getArtLabel(t, subCategory)}
                onRemove={() => toggleSubCategory(subCategory)}
              />
            ))}
            {activeTags.map((tag) => (
              <ActiveChip key={`active-tag:${tag}`} label={t("filters.tagChip", { tag })} onRemove={() => toggleTag(tag)} />
            ))}
            {activeEventTypes.map((eventType) => (
              <ActiveChip key={`active-event:${eventType}`} label={getArtLabel(t, eventType)} onRemove={() => toggleEventType(eventType)} />
            ))}
            <button type="button" className="luxury-clear-link" onClick={onReset}>
              <RefreshCw className="h-3.5 w-3.5" />
              {t("filters.clearAll")} {/* ADDED FOR i18n */}
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}

export function LuxuryArtistCard({ artist, index }: { artist: ArtistCardViewModel; index: number }) {
  const { formatNumber, t } = useI18n(); // ADDED FOR i18n
  const categoryLabel = getArtLabel(t, artist.category); // ADDED FOR i18n
  const subCategoryLabel = getArtLabel(t, artist.subCategory); // ADDED FOR i18n
  const ratingLabel = artist.reviews > 0 ? `${artist.rating.toFixed(1)} (${formatNumber(artist.reviews)})` : t("artist.noRatingsYet"); // ADDED FOR i18n
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 18, scale: 0.98 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.035, 0.2), ease: [0.16, 1, 0.3, 1] }}
      className="luxury-card luxury-artist-card group"
    >
      <Link to={`/artist/${artist.artistId}`} aria-label={t("artist.viewAria", { name: artist.name })}> {/* ADDED FOR i18n */}
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
            {ratingLabel}
          </span>
        </div>
        <div className="luxury-card-body">
          <div className="luxury-card-kicker">
            <span>{categoryLabel}</span> {/* ADDED FOR i18n */}
            {artist.verified ? <BadgeCheck className="h-4 w-4" /> : null}
          </div>
          <div className="luxury-card-title-row">
            <h3>{artist.name || t("artist.premiumArtist")}</h3> {/* ADDED FOR i18n */}
            <ArrowUpRight className="h-5 w-5" />
          </div>
          <p className="luxury-card-subtitle">{subCategoryLabel}</p> {/* ADDED FOR i18n */}
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
  const { t } = useI18n(); // ADDED FOR i18n
  const artType = safeString(event.artType || event.subCategory || event.subcategory || event.category, t("event.defaultArtType")); // ADDED FOR i18n
  const category = getEventCategory(event) || t("event.defaultArtType"); // ADDED FOR i18n
  const image = safeString(event.image || event.imageUrl || event.coverImage);
  const title = safeString(event.title || event.name, t("event.curatedBrief")); // ADDED FOR i18n
  const description = safeString(event.description || event.requirements || artType, t("event.verifiedBrief")); // ADDED FOR i18n
  const artTypeLabel = getArtLabel(t, artType); // ADDED FOR i18n
  const categoryLabel = getArtLabel(t, category); // ADDED FOR i18n

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 18, scale: 0.98 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.035, 0.2), ease: [0.16, 1, 0.3, 1] }}
      className="luxury-card luxury-event-card group"
    >
      <Link to={`/event/${String(event.id || "")}`} aria-label={t("event.viewAria", { title })}> {/* ADDED FOR i18n */}
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
            <span>{categoryLabel}</span> {/* ADDED FOR i18n */}
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="luxury-card-title-row">
            <h3>{title}</h3>
            <ArrowUpRight className="h-5 w-5" />
          </div>
          <p className="luxury-card-subtitle">{artTypeLabel}</p> {/* ADDED FOR i18n */}
          <p className="luxury-card-description">{description}</p>
          <div className="luxury-card-meta">
            <span>
              <MapPin className="h-3.5 w-3.5" />
              {safeString(event.location || event.district || event.state, t("location.maharashtra"))} {/* ADDED FOR i18n */}
            </span>
            <strong>
              {t("event.openBrief")} {/* ADDED FOR i18n */}
              <ArrowRight className="h-3.5 w-3.5" />
            </strong>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export function LuxuryEmptyState({ label, onReset }: { label: string; onReset: () => void }) {
  const { t } = useI18n(); // ADDED FOR i18n
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="luxury-empty-state"
    >
      <Sparkles className="h-8 w-8" />
      <h2>{t("empty.discoveryTitle", { label: t(`explore.tabs.${label}`) })}</h2> {/* ADDED FOR i18n */}
      <p>{t("empty.discoveryText")}</p> {/* ADDED FOR i18n */}
      <button type="button" onClick={onReset}>
        {t("filters.reset")} {/* ADDED FOR i18n */}
        <RefreshCw className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export { AnimatePresence };
