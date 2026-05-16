import { IMAGE_POOL, type ImagePoolItem } from "@/data/imagePool";

export type ImageCategory = ImagePoolItem["category"] | string;
export type ImageContext =
  | "card"
  | "gallery"
  | "background"
  | "hero"
  | "bento"
  | "avatar"
  | "empty"
  | "ui"
  | string;

export type AllocateImageInput = {
  category?: ImageCategory;
  context: ImageContext;
  entityId: string;
  preferredUrl?: string | null;
  orientation?: ImagePoolItem["orientation"];
};

export type AllocatedImage = ImagePoolItem & {
  ownerKey: string;
  external?: boolean;
};

let usedImageIds = new Set<string>();
let usedImageUrls = new Set<string>();

const assignments = new Map<string, AllocatedImage>();
const urlOwners = new Map<string, string>();
const idOwners = new Map<string, string>();

const CATEGORY_ALIASES: Record<string, ImagePoolItem["category"][]> = {
  singer: ["singer"],
  singers: ["singer"],
  gayak: ["singer", "mandal"],
  karaoke: ["singer"],
  orchestra: ["singer", "general"],
  performer: ["singer", "dj", "general"],
  performers: ["singer", "dj", "general"],
  anchor: ["general"],
  host: ["general"],
  magician: ["general"],
  dj: ["dj"],
  djs: ["dj"],
  "dj's": ["dj"],
  mandal: ["mandal"],
  dhol: ["mandal"],
  "dhol pathak": ["mandal"],
  zanj: ["mandal"],
  "zanj pathak": ["mandal"],
  lezim: ["mandal"],
  "lezim pathak": ["mandal"],
  kirtan: ["mandal", "singer"],
  kirtankar: ["mandal", "singer"],
  bhajan: ["mandal", "singer"],
  "bhajani mandal": ["mandal", "singer"],
  tabla: ["mandal"],
  "tabla vadak": ["mandal"],
  harmonium: ["mandal"],
  folk: ["mandal"],
  spiritual: ["mandal", "singer"],
  event: ["event"],
  events: ["event"],
  wedding: ["event"],
  "indian wedding": ["event"],
  marriage: ["event"],
  birthday: ["event"],
  "birthday party": ["event"],
  "wedding decoration": ["event"],
  "birthday cake": ["event"],
  photography: ["event"],
  videography: ["event"],
  makeup: ["event"],
  mehndi: ["event"],
  gondhal: ["mandal"],
  "maharashtra folk": ["mandal"],
  "folk performance": ["mandal"],
  "traditional dance india": ["mandal"],
  "ritual performance": ["mandal"],
  jagran: ["mandal", "singer"],
  "night devotional": ["mandal", "singer"],
  "temple night": ["mandal", "singer"],
  "bhajan night": ["mandal", "singer"],
  bharud: ["mandal", "singer"],
  "folk theatre": ["general", "mandal"],
  "traditional artist": ["mandal"],
  "indian storytelling": ["general", "mandal"],
  "stage performance": ["general", "singer"],
  powada: ["mandal", "singer"],
  "shahiri & powada": ["mandal", "singer"],
  "warrior performance": ["general", "mandal"],
  "folk singer": ["singer", "mandal"],
  "historical performance": ["general", "mandal"],
  "traditional singing": ["singer", "mandal"],
  "waghya murali": ["mandal"],
  "jalsa & dashavatar": ["general", "mandal"],
  dashavatar: ["general", "mandal"],
  jalsa: ["general", "mandal"],
  dhagaai: ["mandal", "singer"],
  "dhagaai & dholki": ["mandal", "singer"],
  dholki: ["mandal", "singer"],
  bahurupiya: ["general", "mandal"],
  pravachankar: ["general", "singer"],
  "vyaspeeth chalak": ["general"],
  chiplya: ["mandal", "singer"],
  "chiplya player": ["mandal", "singer"],
  mrudung: ["mandal"],
  mrudungmani: ["mandal"],
  "sound system": ["event"],
  mandap: ["event"],
  "mandap & decoration": ["event"],
  "varkari sanstha": ["mandal", "singer"],
  "shastriya bhajan": ["singer", "mandal"],
  "harmonium vadak": ["mandal", "singer"],
  "harmonium player": ["mandal", "singer"],
  "tabla player": ["mandal"],
  "dholki player": ["mandal", "singer"],
  category: ["general"],
  hero: ["general"],
  fallback: ["general"],
  general: ["general"],
  default: ["general"],
  ui: ["general"],
};

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export function hashKey(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function categoriesFor(category?: ImageCategory) {
  const key = normalize(category || "general");
  return CATEGORY_ALIASES[key] || CATEGORY_ALIASES[key.replace(/ artists?$/, "")] || ["general"];
}

function orientationForContext(context: ImageContext, explicit?: ImagePoolItem["orientation"]) {
  if (explicit) return explicit;
  const key = normalize(context);
  if (key.includes("hero") || key.includes("background") || key.includes("cover") || key.includes("bento") || key.includes("event")) {
    return "landscape";
  }
  return "portrait";
}

function ownerKeyFor(input: AllocateImageInput) {
  return `${input.context}:${input.entityId}`;
}

function isPoolUrl(url: string) {
  return IMAGE_POOL.some((item) => item.url === url);
}

function createExternalItem(input: AllocateImageInput, ownerKey: string, url: string): AllocatedImage {
  const category = categoriesFor(input.category)[0];
  return {
    id: `external_${hashKey(`${ownerKey}:${url}`).toString(36)}`,
    url,
    category,
    orientation: orientationForContext(input.context, input.orientation),
    used: false,
    tags: ["external", category],
    ownerKey,
    external: true,
  };
}

function markUsed(item: ImagePoolItem, ownerKey: string): AllocatedImage {
  const existingUrlOwner = urlOwners.get(item.url);
  const existingIdOwner = idOwners.get(item.id);

  if ((existingUrlOwner && existingUrlOwner !== ownerKey) || (existingIdOwner && existingIdOwner !== ownerKey)) {
    console.error("[global-image-allocator] duplicate allocation blocked", {
      imageId: item.id,
      url: item.url,
      existingUrlOwner,
      existingIdOwner,
      nextOwner: ownerKey,
    });
    throw new Error(`Duplicate image allocation blocked for ${ownerKey}`);
  }

  const allocated: AllocatedImage = { ...item, ownerKey };
  usedImageIds.add(item.id);
  usedImageUrls.add(item.url);
  urlOwners.set(item.url, ownerKey);
  idOwners.set(item.id, ownerKey);
  assignments.set(ownerKey, allocated);
  return allocated;
}

function scoreImage(item: ImagePoolItem, input: AllocateImageInput) {
  const categories = categoriesFor(input.category);
  const orientation = orientationForContext(input.context, input.orientation);
  let score = 0;

  if (categories.includes(item.category)) score += 100;
  if (item.orientation === orientation) score += 24;
  if (item.tags?.some((tag) => categories.includes(normalize(tag) as ImagePoolItem["category"]))) score += 12;
  if (normalize(input.context).includes(item.category)) score += 8;

  return score;
}

function rankCandidates(pool: ImagePoolItem[], input: AllocateImageInput, ownerKey: string) {
  const seed = hashKey(`${input.entityId}:${input.context}`);
  return pool
    .map((item, index) => ({
      item,
      score: scoreImage(item, input),
      tie: (hashKey(`${ownerKey}:${item.id}`) + seed + index) % 100000,
    }))
    .sort((a, b) => b.score - a.score || a.tie - b.tie)
    .map((entry) => entry.item);
}

export function allocateImage(input: AllocateImageInput): AllocatedImage {
  const ownerKey = ownerKeyFor(input);
  const existing = assignments.get(ownerKey);
  if (existing) return existing;

  const preferredUrl = String(input.preferredUrl || "").trim();
  const preferredPoolItem = preferredUrl ? IMAGE_POOL.find((item) => item.url === preferredUrl) : undefined;

  if (preferredPoolItem && !usedImageIds.has(preferredPoolItem.id) && !usedImageUrls.has(preferredPoolItem.url)) {
    return markUsed(preferredPoolItem, ownerKey);
  }

  if (preferredUrl && !usedImageUrls.has(preferredUrl) && !preferredPoolItem) {
    return markUsed(createExternalItem(input, ownerKey, preferredUrl), ownerKey);
  }

  if (preferredUrl && usedImageUrls.has(preferredUrl)) {
    console.warn("[global-image-allocator] preferred image already used; replacing with unused pool image", {
      ownerKey,
      preferredUrl,
      currentOwner: urlOwners.get(preferredUrl),
    });
  }

  const categories = categoriesFor(input.category);
  const unusedByCategory = IMAGE_POOL.filter(
    (item) => categories.includes(item.category) && !usedImageIds.has(item.id) && !usedImageUrls.has(item.url),
  );
  const categoryCandidate = rankCandidates(unusedByCategory, input, ownerKey)[0];
  if (categoryCandidate) return markUsed(categoryCandidate, ownerKey);

  const unusedGlobal = IMAGE_POOL.filter((item) => !usedImageIds.has(item.id) && !usedImageUrls.has(item.url));
  const globalCandidate = rankCandidates(unusedGlobal, input, ownerKey)[0];
  if (globalCandidate) return markUsed(globalCandidate, ownerKey);

  console.error("[global-image-allocator] image pool exhausted", {
    ownerKey,
    category: input.category,
    poolSize: IMAGE_POOL.length,
    usedImageIds: usedImageIds.size,
    usedImageUrls: usedImageUrls.size,
  });
  throw new Error(`No unused image exists for ${ownerKey}`);
}

export function validateImagePool() {
  const ids = new Set<string>();
  const urls = new Set<string>();
  const duplicateIds: string[] = [];
  const duplicateUrls: string[] = [];

  IMAGE_POOL.forEach((item) => {
    if (ids.has(item.id)) duplicateIds.push(item.id);
    if (urls.has(item.url)) duplicateUrls.push(item.url);
    ids.add(item.id);
    urls.add(item.url);
  });

  if (duplicateIds.length || duplicateUrls.length || IMAGE_POOL.length < 1) {
    console.error("[global-image-allocator] invalid image pool", {
      poolSize: IMAGE_POOL.length,
      duplicateIds,
      duplicateUrls,
    });
    throw new Error("Invalid image pool: expected at least one globally unique image.");
  }
}

export function validateUniqueImages(context: string, images: Array<{ usageId: string; url: string }>) {
  const seen = new Map<string, string>();
  images.forEach((image) => {
    const existing = seen.get(image.url);
    if (existing && existing !== image.usageId) {
      console.error("[global-image-allocator] duplicate image detected before render", {
        context,
        url: image.url,
        firstUsageId: existing,
        duplicateUsageId: image.usageId,
      });
    }
    seen.set(image.url, image.usageId);
  });
}

export function resetGlobalImageAllocator() {
  usedImageIds = new Set<string>();
  usedImageUrls = new Set<string>();
  assignments.clear();
  urlOwners.clear();
  idOwners.clear();
}

export function getImageUsageDebug() {
  return {
    poolSize: IMAGE_POOL.length,
    usedImageIds: usedImageIds.size,
    usedImageUrls: usedImageUrls.size,
    assignments: assignments.size,
  };
}

validateImagePool();
