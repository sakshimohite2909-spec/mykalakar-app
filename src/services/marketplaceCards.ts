import {
  getActiveCategories,
  getActiveEventTypes,
  getActiveSubCategories,
  getActiveTags,
  getArtistCategory,
  getArtistSubCategory,
  getParentCategoryForSubCategory,
  type SmartFilters,
} from "@/services/filterEngine";
import { validateUniqueImages } from "@/utils/imageAllocator";
import { correctTypo, normalizeCategory, safeString, safeNumber, safeBoolean } from "@/services/dataNormalizer";
import { getArtistRatingSummary } from "@/services/ratingUtils";

export type ArtistService = {
  category: string;
  subCategory: string;
  priceRange: string;
  serviceId: string;
};

export type ArtistCardViewModel = {
  cardId: string;
  artistId: string;
  uid: string;
  serviceId: string;
  name: string;
  category: string;
  subCategory: string;
  priceRange: string;
  image: string;
  location: string;
  rating: number;
  reviews: number;
  verified: boolean;
  featured: boolean;
  bio: string;
  tags: string[];
  eventTypes: string[];
  artist: any;
};

function normalize(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeKey(value: unknown) {
  return normalize(value).toLowerCase();
}

function slug(value: unknown) {
  return normalizeKey(value).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "service";
}

function compactUnique(values: unknown[]) {
  const seen = new Set<string>();
  return values
    .map(normalize)
    .filter((value) => {
      const key = normalizeKey(value);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function toArray(value: unknown) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function isGenericAvatar(url: string) {
  return /ui-avatars\.com|api\/\?name=/i.test(url);
}

function isUploadedMedia(url: string) {
  return /^https?:\/\//i.test(url) && !isGenericAvatar(url);
}

function getUploadedImages(artist: any) {
  const profileImage = artist.profileImage?.thumbnail || artist.profileImage?.url || artist.artistProfile?.profileImage || artist.media?.profilePhoto || artist.profilePhoto || "";
  const coverImage = artist.coverImage?.thumbnail || artist.coverImage?.url || artist.media?.coverPhoto || artist.coverPhoto || "";
  const gallery = Array.isArray(artist.gallery)
    ? artist.gallery.map((item: Record<string, unknown> | string) => typeof item === "string" ? item : item?.thumbnail || item?.url || item).filter(Boolean)
    : [];
  const galleryPhotos = Array.isArray(artist.media?.galleryPhotos)
    ? artist.media.galleryPhotos
    : Array.isArray(artist.galleryPhotos)
      ? artist.galleryPhotos
      : [];

  return compactUnique([coverImage, profileImage, ...gallery, ...galleryPhotos]).filter(isUploadedMedia);
}

function getPriceRange(artist: any, service: any) {
  if (service.priceRange) return normalize(service.priceRange);
  const price = Number(service.soloPrice || service.teamPrice || service.price || artist.soloPrice || artist.startingPrice || 0);
  return price > 0 ? `Rs ${price.toLocaleString("en-IN")}+` : "On request";
}

export function getArtistServices(artist: any): ArtistService[] {
  const rawServices = Array.isArray(artist.services) ? artist.services : [];
  const rawArts = Array.isArray(artist.artsList) ? artist.artsList : [];
  const rawCategories = Array.isArray(artist.categories) ? artist.categories : [];

  const candidates = rawServices.length
    ? rawServices
    : rawArts.length
      ? rawArts
      : rawCategories.length
        ? rawCategories.map((category: string | Record<string, unknown>) =>
            typeof category === "string" ? { category } : category
          )
        : [{ category: getArtistSubCategory(artist) || artist.subCategory || artist.category }];

  const seen = new Set<string>();
  return candidates
    .map((service: Record<string, unknown>, index: number) => {
      const subCategory = normalize(service.subCategory || service.subcategory || service.category || service.name || service.type);
      if (!subCategory) return null;
      const rawCategory = normalize(
        service.mainCategory ||
          service.categoryGroup ||
          getParentCategoryForSubCategory(subCategory) ||
          getArtistCategory({ ...artist, subCategory }) ||
          artist.category ||
          "Artists"
      );
      const category = normalizeCategory(rawCategory);
      const serviceId = normalize(service.serviceId || service.id || `${slug(category)}-${slug(subCategory)}-${index}`);
      const dedupeKey = `${normalizeKey(category)}:${normalizeKey(subCategory)}:${normalizeKey(serviceId)}`;
      if (seen.has(dedupeKey)) return null;
      seen.add(dedupeKey);
      return {
        category,
        subCategory,
        serviceId,
        priceRange: getPriceRange(artist, service),
      };
    })
    .filter(Boolean) as ArtistService[];
}

export function buildArtistCards(artists: any[], maxCards?: number): ArtistCardViewModel[] {
  const cards: ArtistCardViewModel[] = [];

  artists.forEach((artist, artistIndex) => {
    const artistId = normalize(artist.id || artist.uid);
    if (!artistId) return;

    const services = getArtistServices(artist);
    if (!services.length) return;

    const uploadedImages = getUploadedImages(artist);
    const location = compactUnique([artist.district || artist.city, artist.state]).join(", ") || normalize(artist.location) || "Maharashtra";
    const ratingSummary = getArtistRatingSummary(artist);

    services.forEach((service, serviceIndex) => {
      const cardId = `${artistId}_${service.serviceId}`;
      const image = uploadedImages[serviceIndex] || "";
      cards.push({
        cardId,
        artistId,
        uid: safeString(artist.uid || artistId),
        serviceId: service.serviceId,
        name: correctTypo(safeString(artist.name || artist.professionalName, "Premium Artist")),
        category: normalizeCategory(service.category),
        subCategory: correctTypo(service.subCategory),
        priceRange: service.priceRange,
        image,
        location,
        rating: safeNumber(ratingSummary.averageRating, 0),
        reviews: safeNumber(ratingSummary.totalRatings, 0),
        verified: safeBoolean(artist.verified),
        featured: safeBoolean(artist.featured || artist.trending || artist.featuredExp),
        bio: safeString(artist.artistProfile?.bio || artist.bio || `Professional ${service.subCategory} available for curated events.`),
        tags: compactUnique([
          ...toArray(artist.tags),
          ...toArray(artist.specialties),
          ...toArray(artist.artistProfile?.tags),
          ...toArray(artist.artistProfile?.specialties),
        ]),
        eventTypes: compactUnique([
          ...toArray(artist.eventTypes),
          ...toArray(artist.preferredEvents),
          ...toArray(artist.preferredEventTypes),
          ...toArray(artist.artistProfile?.eventTypes),
        ]),
        artist,
      });
    });
  });

  // Sort premium voucher artists to the top
  cards.sort((a, b) => {
    const aPremium = a.artist.isPremium === true || a.artist.voucherType === "premium" || (a.artist.artistProfile as any)?.isPremium === true;
    const bPremium = b.artist.isPremium === true || b.artist.voucherType === "premium" || (b.artist.artistProfile as any)?.isPremium === true;
    if (aPremium && !bPremium) return -1;
    if (!aPremium && bPremium) return 1;
    return 0;
  });

  const result = typeof maxCards === "number" ? cards.slice(0, maxCards) : cards;
  validateUniqueImages("artist-cards", result.filter((card) => card.image).map((card) => ({ usageId: card.cardId, url: card.image })));
  return result;
}

export function filterArtistCards<T extends ArtistCardViewModel>(cards: T[], filters: SmartFilters) {
  const query = normalizeKey(filters.query);
  const activeCategories = getActiveCategories(filters).map(normalizeKey);
  const activeSubCategories = getActiveSubCategories(filters).map(normalizeKey);
  const activeTags = getActiveTags(filters).map(normalizeKey);
  const activeEventTypes = getActiveEventTypes(filters).map(normalizeKey);

  return cards.filter((card) => {
    const normalizedSubCategory = getArtistSubCategory({ subCategory: card.subCategory });
    const categoryValues = compactUnique([
      card.category,
      getParentCategoryForSubCategory(normalizedSubCategory || card.subCategory),
    ]).map(normalizeKey);
    const subCategoryValues = compactUnique([card.subCategory, normalizedSubCategory]).map(normalizeKey);
    const tagValues = compactUnique([
      ...card.tags,
      ...toArray(card.artist.tags),
      ...toArray(card.artist.specialties),
      ...toArray(card.artist.artistProfile?.tags),
      ...toArray(card.artist.artistProfile?.specialties),
    ]).map(normalizeKey);
    const eventTypeValues = compactUnique([
      ...card.eventTypes,
      ...toArray(card.artist.eventTypes),
      ...toArray(card.artist.preferredEvents),
      ...toArray(card.artist.preferredEventTypes),
      ...toArray(card.artist.artistProfile?.eventTypes),
    ]).map(normalizeKey);
    const matchesQuery = !query || [
      card.name,
      card.category,
      card.subCategory,
      card.location,
      card.bio,
      card.priceRange,
      ...tagValues,
      ...eventTypeValues,
    ].some((value) => normalizeKey(value).includes(query));
    const matchesCategory = !activeCategories.length || activeCategories.some((category) => categoryValues.includes(category));
    const matchesSubCategory = !activeSubCategories.length || activeSubCategories.some((subCategory) => subCategoryValues.includes(subCategory));
    const matchesTags = !activeTags.length || activeTags.every((tag) => tagValues.some((value) => value.includes(tag)));
    const matchesEventTypes = !activeEventTypes.length || activeEventTypes.some((eventType) => eventTypeValues.some((value) => value.includes(eventType)));

    return matchesQuery && matchesCategory && matchesSubCategory && matchesTags && matchesEventTypes;
  });
}
