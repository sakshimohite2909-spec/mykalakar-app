import {
  CATEGORY_GROUP_OPTIONS,
  getArtistArtForms,
  getCategoryGroupForArtistType,
  isCategoryGroup,
  type CategoryGroupName,
} from "@/constants/artistSystem";

export type SmartFilters = {
  query: string;
  category: string | null;
  subCategory: string | null;
  categories?: string[];
  subCategories?: string[];
  tags?: string[];
  eventTypes?: string[];
};

export type FilterableArtist = Record<string, unknown>;
export type FilterableEvent = Record<string, unknown>;

export const EMPTY_FILTERS: SmartFilters = {
  query: "",
  category: null,
  subCategory: null,
  categories: [],
  subCategories: [],
  tags: [],
  eventTypes: [],
};

const CATEGORY_ALIASES: Record<string, CategoryGroupName> = {
  music: "Performers",
  performer: "Performers",
  performers: "Performers",
  "event services": "Event Services",
  service: "Event Services",
  services: "Event Services",
  "folk traditional": "Folk & Traditional Arts",
  "folk and traditional": "Folk & Traditional Arts",
  "folk & traditional": "Folk & Traditional Arts",
  "folk & traditional arts": "Folk & Traditional Arts",
  spiritual: "Spiritual & Varkari Sampraday",
  varkari: "Spiritual & Varkari Sampraday",
  "spiritual & varkari": "Spiritual & Varkari Sampraday",
  "spiritual & varkari sampraday": "Spiritual & Varkari Sampraday",
};

const SUBCATEGORY_ALIASES: Record<string, string> = {
  singer: "Singers",
  band: "Orchestra",
  bands: "Orchestra",
  dj: "DJs",
  anchor: "Anchors / Hosts",
  host: "Anchors / Hosts",
  magician: "Magicians",
  puppetry: "Puppet Show",
  kirtan: "Kirtankar",
  bhajan: "Bhajani Mandal",
  bharud: "Bharud",
  "dhol pathak": "Dhol Pathak",
};

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function canonicalCategory(value: unknown) {
  const raw = String(value ?? "").trim();
  if (isCategoryGroup(raw)) return raw;
  return CATEGORY_ALIASES[normalize(raw)] || raw;
}

function canonicalSubCategory(value: unknown) {
  const raw = String(value ?? "").trim();
  return SUBCATEGORY_ALIASES[normalize(raw)] || raw;
}

function includesText(value: unknown, query: string) {
  return normalize(value).includes(normalize(query));
}

function canonicalTag(value: unknown) {
  return String(value ?? "").trim();
}

function compactCanonicalList(values: unknown[] | undefined, canonicalizer: (value: unknown) => string) {
  const seen = new Set<string>();
  return (values || [])
    .map(canonicalizer)
    .map((value) => String(value ?? "").trim())
    .filter((value) => {
      const key = normalize(value);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function legacyCategoryList(filters: SmartFilters) {
  return filters.category ? [filters.category] : [];
}

function legacySubCategoryList(filters: SmartFilters) {
  return filters.subCategory ? [filters.subCategory] : [];
}

export function getActiveCategories(filters: SmartFilters) {
  return compactCanonicalList([...(filters.categories || []), ...legacyCategoryList(filters)], canonicalCategory);
}

export function getActiveSubCategories(filters: SmartFilters) {
  return compactCanonicalList([...(filters.subCategories || []), ...legacySubCategoryList(filters)], canonicalSubCategory);
}

export function getActiveTags(filters: SmartFilters) {
  return compactCanonicalList(filters.tags, canonicalTag);
}

export function getActiveEventTypes(filters: SmartFilters) {
  return compactCanonicalList(filters.eventTypes, canonicalTag);
}

export function hasActiveSmartFilters(filters: SmartFilters) {
  return Boolean(
    filters.query ||
      getActiveCategories(filters).length ||
      getActiveSubCategories(filters).length ||
      getActiveTags(filters).length ||
      getActiveEventTypes(filters).length
  );
}

export function getInjectedSubcategories(filters: SmartFilters) {
  const activeCategories = getActiveCategories(filters);
  if (!activeCategories.length) return CATEGORY_GROUP_OPTIONS.flatMap((group) => group.subcategories);
  return activeCategories.flatMap((category) => getSubcategoriesForCategory(category));
}

export function getSubcategoriesForCategory(category?: string | null) {
  const canonical = canonicalCategory(category);
  if (!canonical || !isCategoryGroup(canonical)) return [];
  return CATEGORY_GROUP_OPTIONS.find((group) => group.name === canonical)?.subcategories || [];
}

export function getParentCategoryForSubCategory(subCategory?: string | null): CategoryGroupName | null {
  if (!subCategory) return null;
  return getCategoryGroupForArtistType(canonicalSubCategory(subCategory));
}

export function syncSmartFilters(next: Partial<SmartFilters>, previous: SmartFilters = EMPTY_FILTERS): SmartFilters {
  const categoryChanged = Object.prototype.hasOwnProperty.call(next, "category");
  const subCategoryChanged = Object.prototype.hasOwnProperty.call(next, "subCategory");
  const categoriesChanged = Object.prototype.hasOwnProperty.call(next, "categories");
  const subCategoriesChanged = Object.prototype.hasOwnProperty.call(next, "subCategories");
  const incoming: SmartFilters = {
    query: next.query ?? previous.query ?? "",
    category: next.category === undefined ? previous.category : next.category ? canonicalCategory(next.category) : next.category,
    subCategory: next.subCategory === undefined ? previous.subCategory : next.subCategory ? canonicalSubCategory(next.subCategory) : next.subCategory,
    categories: categoriesChanged
      ? compactCanonicalList(next.categories, canonicalCategory)
      : compactCanonicalList(previous.categories, canonicalCategory),
    subCategories: subCategoriesChanged
      ? compactCanonicalList(next.subCategories, canonicalSubCategory)
      : compactCanonicalList(previous.subCategories, canonicalSubCategory),
    tags: Object.prototype.hasOwnProperty.call(next, "tags")
      ? compactCanonicalList(next.tags, canonicalTag)
      : compactCanonicalList(previous.tags, canonicalTag),
    eventTypes: Object.prototype.hasOwnProperty.call(next, "eventTypes")
      ? compactCanonicalList(next.eventTypes, canonicalTag)
      : compactCanonicalList(previous.eventTypes, canonicalTag),
  };

  if (categoryChanged) {
    incoming.categories = incoming.category
      ? compactCanonicalList([incoming.category, ...incoming.categories], canonicalCategory)
      : incoming.categories;
  }

  if (subCategoryChanged) {
    incoming.subCategories = incoming.subCategory
      ? compactCanonicalList([incoming.subCategory, ...incoming.subCategories], canonicalSubCategory)
      : incoming.subCategories;
  }

  if (subCategoryChanged && incoming.subCategory) {
    const parent = getParentCategoryForSubCategory(incoming.subCategory);
    if (parent) {
      return {
        ...incoming,
        category: parent,
        categories: compactCanonicalList([parent, ...incoming.categories], canonicalCategory),
      };
    }
  }

  if ((subCategoryChanged || subCategoriesChanged) && getActiveSubCategories(incoming).length) {
    const inferredParents = getActiveSubCategories(incoming)
      .map(getParentCategoryForSubCategory)
      .filter(Boolean) as CategoryGroupName[];
    incoming.categories = compactCanonicalList([...incoming.categories, ...inferredParents], canonicalCategory);
    incoming.category = incoming.category || inferredParents[0] || null;
  }

  if (categoryChanged && !incoming.category && !incoming.categories.length) {
    return {
      ...incoming,
      subCategory: subCategoryChanged ? incoming.subCategory : null,
      subCategories: subCategoryChanged ? incoming.subCategories : [],
    };
  }

  const activeCategories = getActiveCategories(incoming);
  if (activeCategories.length) {
    const allowed = activeCategories.flatMap(getSubcategoriesForCategory);
    const allowedSet = new Set(allowed.map(normalize));
    const activeSubs = getActiveSubCategories(incoming);
    const validSubs = activeSubs.filter((item) => allowedSet.has(normalize(item)));

    if (activeSubs.length && validSubs.length !== activeSubs.length) {
      return {
        ...incoming,
        subCategory: incoming.subCategory && allowedSet.has(normalize(incoming.subCategory)) ? incoming.subCategory : null,
        subCategories: validSubs,
      };
    }
  }

  incoming.category = incoming.category || incoming.categories[0] || null;
  incoming.subCategory = incoming.subCategory || incoming.subCategories[0] || null;

  return incoming;
}

export function resetSmartFilters(): SmartFilters {
  return { ...EMPTY_FILTERS };
}

export function getArtistSubCategory(artist: FilterableArtist) {
  return canonicalSubCategory(artist.subCategory || artist.subcategory || artist.artistProfile?.primaryArtForm || getArtistArtForms(artist)[0] || "");
}

export function getArtistCategory(artist: FilterableArtist) {
  const explicit = artist.category || artist.categoryGroup || artist.mainCategory;
  const canonical = canonicalCategory(explicit);
  if (canonical && isCategoryGroup(canonical)) return canonical;
  return getParentCategoryForSubCategory(getArtistSubCategory(artist)) || canonical || "";
}

export function artistMatchesFilters(artist: FilterableArtist, filters: SmartFilters) {
  const query = normalize(filters.query);
  const artForms = getArtistArtForms(artist);
  const subCategory = getArtistSubCategory(artist);
  const category = getArtistCategory(artist);
  const activeCategories = getActiveCategories(filters);
  const activeSubCategories = getActiveSubCategories(filters);
  const activeTags = getActiveTags(filters);
  const activeEventTypes = getActiveEventTypes(filters);
  const artistTags = [
    artist.tag,
    artist.tags,
    artist.specialties,
    artist.artistProfile?.tags,
    artist.artistProfile?.specialties,
    artist.eventTypes,
    artist.preferredEvents,
  ].flat().filter(Boolean);
  const artistEventTypes = [
    artist.eventType,
    artist.eventTypes,
    artist.preferredEventTypes,
    artist.preferredEvents,
    artist.artistProfile?.eventTypes,
  ].flat().filter(Boolean);

  const matchesQuery = !query || [
    artist.name,
    artist.professionalName,
    artist.bio,
    artist.district,
    artist.city,
    artist.state,
    category,
    subCategory,
    ...artForms,
    ...artistTags,
    ...artistEventTypes,
  ].some((value) => includesText(value, query));

  const matchesCategory = !activeCategories.length || activeCategories.some((value) => normalize(category) === normalize(value));
  const matchesSubCategory = !activeSubCategories.length || [subCategory, ...artForms.map(canonicalSubCategory)].some((value) =>
    activeSubCategories.some((active) => normalize(value) === normalize(active))
  );
  const matchesTags = !activeTags.length || activeTags.every((tag) => artistTags.some((value) => includesText(value, tag)));
  const matchesEventTypes = !activeEventTypes.length || activeEventTypes.some((eventType) => artistEventTypes.some((value) => includesText(value, eventType)));

  return matchesQuery && matchesCategory && matchesSubCategory && matchesTags && matchesEventTypes;
}

export function filterArtists<T extends FilterableArtist>(artists: T[], filters: SmartFilters) {
  return artists.filter((artist) => artistMatchesFilters(artist, filters));
}

export function getEventCategory(event: FilterableEvent) {
  const requiredCategories = Array.isArray(event.requiredCategories) ? event.requiredCategories : [];
  return (
    getParentCategoryForSubCategory(event.artType || event.subCategory || event.subcategory || event.category) ||
    requiredCategories.map(getParentCategoryForSubCategory).find(Boolean) ||
    canonicalCategory(event.category) ||
    ""
  );
}

export function eventMatchesFilters(event: FilterableEvent, filters: SmartFilters) {
  const query = normalize(filters.query);
  const artType = canonicalSubCategory(event.artType || event.subCategory || event.subcategory || event.category || "");
  const category = getEventCategory(event);
  const activeCategories = getActiveCategories(filters);
  const activeSubCategories = getActiveSubCategories(filters);
  const activeTags = getActiveTags(filters);
  const activeEventTypes = getActiveEventTypes(filters);
  const requiredCategories = Array.isArray(event.requiredCategories)
    ? event.requiredCategories.map(canonicalSubCategory).filter(Boolean)
    : [];
  const artTypeCandidates = [artType, ...requiredCategories].filter(Boolean);
  const categoryCandidates = Array.from(
    new Set([category, ...artTypeCandidates.map(getParentCategoryForSubCategory).filter(Boolean)])
  );

  const matchesQuery = !query || [
    event.title,
    event.name,
    event.description,
    event.requirements,
    event.location,
    event.type,
    event.eventType,
    event.tags,
    category,
    artType,
    ...requiredCategories,
  ].some((value) => includesText(value, query));

  const eventTags = [event.tag, event.tags, event.keywords].flat().filter(Boolean);
  const eventTypes = [event.type, event.eventType, event.eventTypes, event.occasion, event.occasionType].flat().filter(Boolean);
  const matchesCategory = !activeCategories.length || categoryCandidates.some((value) =>
    activeCategories.some((active) => normalize(value) === normalize(active))
  );
  const matchesSubCategory = !activeSubCategories.length || artTypeCandidates.some((value) =>
    activeSubCategories.some((active) => normalize(value) === normalize(active))
  );
  const matchesTags = !activeTags.length || activeTags.every((tag) => eventTags.some((value) => includesText(value, tag)));
  const matchesEventTypes = !activeEventTypes.length || activeEventTypes.some((eventType) => eventTypes.some((value) => includesText(value, eventType)));

  return matchesQuery && matchesCategory && matchesSubCategory && matchesTags && matchesEventTypes;
}

export function filterEvents<T extends FilterableEvent>(events: T[], filters: SmartFilters) {
  return events.filter((event) => eventMatchesFilters(event, filters));
}
