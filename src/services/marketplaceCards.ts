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
import { correctTypo, normalizeCategory, safeString, safeNumber, safeBoolean, resolveArtistProfilePhoto } from "@/services/dataNormalizer";
import { getArtistRatingSummary } from "@/services/ratingUtils";
import { imageRegistry } from "@/services/ImageRegistryService";

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
  const src = String(url || "").trim();
  return Boolean(src) && !isGenericAvatar(src) && /^(https?:\/\/|data:image\/|blob:|\/)/i.test(src);
}

function getUploadedImages(artist: any) {
  const profileImage = resolveArtistProfilePhoto(artist);
  const coverImage = artist.coverImage?.thumbnail || artist.coverImage?.url || artist.media?.coverPhoto || artist.coverPhoto || "";
  const gallery = Array.isArray(artist.gallery)
    ? artist.gallery.map((item: Record<string, unknown> | string) => typeof item === "string" ? item : item?.thumbnail || item?.url || item).filter(Boolean)
    : [];
  const galleryPhotos = Array.isArray(artist.media?.galleryPhotos)
    ? artist.media.galleryPhotos
    : Array.isArray(artist.galleryPhotos)
      ? artist.galleryPhotos
      : [];

  return compactUnique([profileImage, coverImage, ...gallery, ...galleryPhotos]).filter(isUploadedMedia);
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
    .map((item: Record<string, unknown> | string, index: number) => {
      const category = typeof item === "string" ? getArtistCategory(artist) || "Performers" : normalize(item.category || item.mainCategory || getArtistCategory(artist) || "Performers");
      const subCategory = typeof item === "string" ? item : normalize(item.subCategory || item.name || item.artForm || getArtistSubCategory(artist) || "Artist");
      const serviceId = slug(subCategory || category || index);
      const key = `${category}:${subCategory}`.toLowerCase();

      if (seen.has(key)) return null;
      seen.add(key);

      return {
        category,
        subCategory,
        priceRange: getPriceRange(artist, typeof item === "string" ? {} : item),
        serviceId,
      };
    })
    .filter(Boolean) as ArtistService[];
}

function resolveCardImage(artist: any, service: ArtistService, serviceIndex: number, cardId: string): string {
  const categoryName = service.subCategory || service.category || "Performers";

  // 1. Check for category-specific photo upload
  const categorySpecificPhoto = resolveArtistProfilePhoto(artist, categoryName);
  if (categorySpecificPhoto && isUploadedMedia(categorySpecificPhoto)) {
    return categorySpecificPhoto;
  }

  // 2. Check if service object itself carries an uploaded image
  const serviceObj = service as any;
  if (serviceObj.image && isUploadedMedia(serviceObj.image)) return serviceObj.image;
  if (serviceObj.photo && isUploadedMedia(serviceObj.photo)) return serviceObj.photo;
  if (serviceObj.profilePhoto && isUploadedMedia(serviceObj.profilePhoto)) return serviceObj.profilePhoto;

  // 3. For primary service (serviceIndex 0), check top-level profile photo or cover image
  if (serviceIndex === 0) {
    const primaryPhoto = resolveArtistProfilePhoto(artist);
    if (primaryPhoto && isUploadedMedia(primaryPhoto)) {
      return primaryPhoto;
    }
    const uploadedImages = getUploadedImages(artist);
    if (uploadedImages.length > 0) {
      return uploadedImages[0];
    }
  }

  // 4. For secondary services without a matching uploaded photo, use category-appropriate image registry
  return imageRegistry.getUniqueImage({
    category: categoryName,
    type: "artist",
    key: cardId,
  });
}

export function deduplicateCardsByArtist<T extends ArtistCardViewModel>(cards: T[]): T[] {
  const seen = new Set<string>();
  return cards.filter((card) => {
    if (!card.artistId || seen.has(card.artistId)) return false;
    seen.add(card.artistId);
    return true;
  });
}

export function buildArtistCards(
  artists: any[],
  maxCards?: number,
  options?: { deduplicateByArtist?: boolean }
): ArtistCardViewModel[] {
  const cards: ArtistCardViewModel[] = [];
  const seenArtistIds = new Set<string>();

  artists.forEach((artist) => {
    const artistId = normalize(artist.id || artist.uid);
    if (!artistId) return;

    if (options?.deduplicateByArtist && seenArtistIds.has(artistId)) {
      return;
    }

    const services = getArtistServices(artist);
    if (!services.length) return;

    const location = compactUnique([artist.district || artist.city, artist.state]).join(", ") || normalize(artist.location) || "Maharashtra";
    const ratingSummary = getArtistRatingSummary(artist);

    const servicesToBuild = options?.deduplicateByArtist ? services.slice(0, 1) : services;

    servicesToBuild.forEach((service, serviceIndex) => {
      const cardId = `${artistId}_${service.serviceId}`;
      const image = resolveCardImage(artist, service, serviceIndex, cardId);

      cards.push({
        cardId,
        artistId,
        uid: safeString(artist.uid || artistId),
        serviceId: service.serviceId,
        name: correctTypo(safeString(artist.displayName || artist.name || artist.stageName || artist.professionalName, "Premium Artist")),
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
      seenArtistIds.add(artistId);
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
