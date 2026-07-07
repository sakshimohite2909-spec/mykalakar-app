import { normalizeCategoryKey } from "@/constants/artistSystem";
import { getArtistSubCategory, getParentCategoryForSubCategory } from "@/services/filterEngine";
import type { ArtistCardViewModel } from "@/services/marketplaceCards";

export type EventRequirementSubcategory = {
  name: string;
  count: number;
};

export type EventRequirementGroup = {
  id: string;
  name: string;
  icon?: string;
  count: number;
  subcategories: EventRequirementSubcategory[];
};

type GroupMetadata = {
  id?: string;
  name?: string;
  icon?: string;
  sortOrder?: number;
};

const EVENT_FILTER_TERMS: Record<string, string[]> = {
  "1": ["Wedding", "Marriage"],
  "2": ["Birthday", "Birthday Party"],
  "3": ["Corporate", "Corporate Event"],
  "4": ["Festival", "Festival Celebration"],
  "5": ["Spiritual", "Spiritual Event"],
};

const ALL_EVENT_TERMS = new Set(["all", "all events", "any", "any event", "any events", "all event types"]);
const NON_SPECIFIC_EVENT_TERMS = new Set(["event", "events"]);

function normalize(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeKey(value: unknown) {
  return normalize(value).toLowerCase();
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function compactUnique(values: unknown[]) {
  const seen = new Set<string>();
  return values
    .flat()
    .map(normalize)
    .filter((value) => {
      const key = normalizeKey(value);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function isArtistCardAvailable(card: ArtistCardViewModel) {
  const artist = card.artist || {};
  const availability = normalizeKey(artist.availability || artist.artistProfile?.availability || "available");
  const status = normalizeKey(artist.status || artist.applicationStatus || artist.verification?.status || "active");
  const unavailableValues = new Set(["busy", "booked", "inactive", "unavailable", "not available", "not_available"]);

  return !unavailableValues.has(availability) && (!status || ["active", "approved"].includes(status));
}

export function filterAvailableArtistCards<T extends ArtistCardViewModel>(cards: T[]) {
  return cards.filter(isArtistCardAvailable);
}

function getArtistProfile(card: ArtistCardViewModel) {
  const profile = card.artist?.artistProfile;
  return profile && typeof profile === "object" ? (profile as Record<string, unknown>) : {};
}

function getArtistEventValues(card: ArtistCardViewModel) {
  const artist = card.artist || {};
  const profile = getArtistProfile(card);

  return compactUnique([
    ...card.eventTypes,
    ...toArray(artist.eventType),
    ...toArray(artist.eventTypes),
    ...toArray(artist.preferredEvents),
    ...toArray(artist.preferredEventTypes),
    ...toArray(profile.eventTypes),
    ...toArray(profile.preferredEvents),
    ...toArray(profile.preferredEventTypes),
  ]);
}

function isSpecificEventValue(value: string) {
  return value.length > 2 && !NON_SPECIFIC_EVENT_TERMS.has(value);
}

export function getEventRequirementTerms(eventId?: string | null, eventName?: string | null) {
  return compactUnique([...(EVENT_FILTER_TERMS[eventId || ""] || []), eventName]);
}

export function artistCardMatchesEvent(card: ArtistCardViewModel, eventId?: string | null, eventName?: string | null) {
  const eventTerms = getEventRequirementTerms(eventId, eventName).map(normalizeKey);
  if (!eventTerms.length) return true;

  const artistEventValues = getArtistEventValues(card).map(normalizeKey);
  if (artistEventValues.some((value) => ALL_EVENT_TERMS.has(value))) return true;

  return eventTerms.some((term) =>
    artistEventValues.some((value) => isSpecificEventValue(value) && (value.includes(term) || term.includes(value)))
  );
}

export function filterArtistCardsForEvent<T extends ArtistCardViewModel>(cards: T[], eventId?: string | null, eventName?: string | null) {
  return cards.filter((card) => artistCardMatchesEvent(card, eventId, eventName));
}

export function artistCardMatchesLocation(card: ArtistCardViewModel, state?: string | null, district?: string | null) {
  const stateKey = normalizeKey(state);
  const districtKey = normalizeKey(district);
  if (!stateKey && !districtKey) return true;

  const artist = card.artist || {};
  const profile = getArtistProfile(card);
  const values = compactUnique([
    card.location,
    artist.location,
    artist.district,
    artist.city,
    artist.state,
    profile.location,
    profile.district,
    profile.city,
    profile.state,
  ]).map(normalizeKey);

  const matchesState = !stateKey || values.some((value) => value.includes(stateKey));
  const matchesDistrict = !districtKey || values.some((value) => value.includes(districtKey));
  return matchesState && matchesDistrict;
}

export function filterArtistCardsByLocation<T extends ArtistCardViewModel>(cards: T[], state?: string | null, district?: string | null) {
  return cards.filter((card) => artistCardMatchesLocation(card, state, district));
}

export function buildEventRequirementGroups(cards: ArtistCardViewModel[], metadata: GroupMetadata[] = []): EventRequirementGroup[] {
  const metadataByName = new Map(
    metadata.map((group, index) => [
      normalizeKey(group.name),
      {
        ...group,
        sortOrder: typeof group.sortOrder === "number" ? group.sortOrder : index,
      },
    ])
  );
  const groups = new Map<
    string,
    {
      id: string;
      name: string;
      icon?: string;
      sortOrder: number;
      firstSeen: number;
      artistIds: Set<string>;
      subcategories: Map<string, { name: string; firstSeen: number; artistIds: Set<string> }>;
    }
  >();

  cards.forEach((card, index) => {
    if (!isArtistCardAvailable(card)) return;

    const rawCategory = normalize(card.category);
    const rawSubCategory = normalize(card.subCategory);
    const subCategory = getArtistSubCategory({ subCategory: rawSubCategory }) || rawSubCategory;
    const category = getParentCategoryForSubCategory(subCategory) || rawCategory;
    const artistId = normalize(card.artistId || card.uid || card.artist?.id || card.artist?.uid || card.cardId);
    if (!category || !subCategory || !artistId) return;

    const categoryKey = normalizeKey(category);
    const metadataEntry = metadataByName.get(categoryKey);
    if (!groups.has(categoryKey)) {
      groups.set(categoryKey, {
        id: metadataEntry?.id || normalizeCategoryKey(category),
        name: category,
        icon: metadataEntry?.icon,
        sortOrder: metadataEntry?.sortOrder ?? Number.MAX_SAFE_INTEGER,
        firstSeen: index,
        artistIds: new Set<string>(),
        subcategories: new Map(),
      });
    }

    const group = groups.get(categoryKey)!;
    group.artistIds.add(artistId);

    const subCategoryKey = normalizeKey(subCategory);
    if (!group.subcategories.has(subCategoryKey)) {
      group.subcategories.set(subCategoryKey, {
        name: subCategory,
        firstSeen: index,
        artistIds: new Set<string>(),
      });
    }
    group.subcategories.get(subCategoryKey)!.artistIds.add(artistId);
  });

  return Array.from(groups.values())
    .map((group) => {
      const subcategories = Array.from(group.subcategories.values())
        .map((subCategory) => ({
          name: subCategory.name,
          count: subCategory.artistIds.size,
          firstSeen: subCategory.firstSeen,
        }))
        .filter((subCategory) => subCategory.count > 0)
        .sort((a, b) => a.firstSeen - b.firstSeen)
        .map(({ firstSeen, ...subCategory }) => subCategory);

      return {
        id: group.id,
        name: group.name,
        icon: group.icon,
        count: subcategories.reduce((total, subCategory) => total + subCategory.count, 0),
        firstSeen: group.firstSeen,
        sortOrder: group.sortOrder,
        subcategories,
      };
    })
    .filter((group) => group.count > 0 && group.subcategories.length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.firstSeen - b.firstSeen)
    .map(({ firstSeen, sortOrder, ...group }) => group);
}
