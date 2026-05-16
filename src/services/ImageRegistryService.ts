import { CATEGORY_IMAGE_MAP, IMAGE_REGISTRY, FALLBACK_IMAGE } from "@/config/imageRegistry";

/**
 * Image Registry Service
 * Principal Asset Orchestration Engine for MyKalakar.
 */

type ContextType = 'artist' | 'event' | 'category';
type RegistryKey = keyof typeof IMAGE_REGISTRY;

const CATEGORY_ALIASES: Record<string, string> = {
  "anchor mc": "anchors hosts",
  "anchors hosts": "anchors hosts",
  "anchor hosts": "anchors hosts",
  "birthday party artist": "birthday",
  "classical singer": "singers",
  corporate: "motivational speakers",
  "dj s": "djs",
  "dhagaai dholki": "dhagaai and dholki",
  "dhangari dhol ovi": "dhagaai dholki",
  "dhangari and dhol ovi": "dhagaai and dholki",
  "dhangari dholki": "dhagaai dholki",
  event: "marriage",
  "event artists": "marriage",
  festival: "folk art",
  "jalsa dashavtar": "jalsa dashavatar",
  "jalsa and dashavtar": "jalsa and dashavatar",
  "mandap decoration": "mandap and decoration",
  "music artists": "singers",
  "mrudangmani": "mrudungmani",
  "performers": "actors",
  "shahir powada": "shahiri powada",
  "shahir and powada": "shahiri and powada",
  "soundsystem": "sound system",
  spiritual: "kirtankar",
  "taalkari": "taal kari",
  "venekari": "veenekari",
  "vyaspethchalak": "vyaspeeth chalak",
  "waghya murali": "waghya murali",
  "wedding artist": "marriage",
  "zanz pathak": "zanj pathak",
  wedding: "marriage",
  weddings: "marriage",
  singer: "singers",
  dj: "djs",
};

export function normalizeCategoryKey(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const NORMALIZED_CATEGORY_IMAGE_MAP = Object.entries(CATEGORY_IMAGE_MAP).reduce<Record<string, string>>((acc, [category, url]) => {
  acc[normalizeCategoryKey(category)] = url;
  return acc;
}, {});

export function getMappedCategoryImage(category?: unknown) {
  const normalized = normalizeCategoryKey(category);
  if (!normalized) return null;

  const directMatch = NORMALIZED_CATEGORY_IMAGE_MAP[normalized];
  if (directMatch) return directMatch;

  const alias = CATEGORY_ALIASES[normalized];
  if (alias && NORMALIZED_CATEGORY_IMAGE_MAP[alias]) {
    return NORMALIZED_CATEGORY_IMAGE_MAP[alias];
  }

  const compactNormalized = normalized.replace(/\s+/g, "");
  const compactMatch = Object.entries(NORMALIZED_CATEGORY_IMAGE_MAP).find(([key]) => key.replace(/\s+/g, "") === compactNormalized);
  if (compactMatch) return compactMatch[1];

  const partialMatch = Object.entries(NORMALIZED_CATEGORY_IMAGE_MAP).find(([key]) => {
    const compactKey = key.replace(/\s+/g, "");
    return normalized.includes(key) || key.includes(normalized) || compactNormalized.includes(compactKey) || compactKey.includes(compactNormalized);
  });
  return partialMatch?.[1] || null;
}

export const getMappedImage = getMappedCategoryImage;

const KEYWORD_MAP: Record<string, keyof typeof IMAGE_REGISTRY> = {
  marriage: 'EVENTS',
  wedding: 'EVENTS',
  birthday: 'EVENTS',
  party: 'EVENTS',
  mandap: 'EVENTS',
  decoration: 'EVENTS',
  dhol: 'FOLK',
  dholki: 'FOLK',
  gondhal: 'FOLK',
  jagran: 'SPIRITUAL',
  bharud: 'FOLK',
  powada: 'FOLK',
  shahiri: 'FOLK',
  lezim: 'FOLK',
  zanj: 'SPIRITUAL',
  waghya: 'SPIRITUAL',
  murali: 'SPIRITUAL',
  dashavatar: 'FOLK',
  jalsa: 'FOLK',
  bahurupiya: 'FOLK',
  pathak: 'FOLK',
  kirtan: 'SPIRITUAL',
  kirtankar: 'SPIRITUAL',
  pravachan: 'SPIRITUAL',
  varkari: 'SPIRITUAL',
  bhajan: 'SPIRITUAL',
  spiritual: 'SPIRITUAL',
  sound: 'EVENTS',
  singer: 'CLASSICAL',
  gayak: 'CLASSICAL',
  tabla: 'CLASSICAL',
  harmonium: 'CLASSICAL',
  mrudung: 'CLASSICAL',
  chiplya: 'SPIRITUAL',
  karaoke: 'CLASSICAL',
  orchestra: 'CLASSICAL',
  dj: 'EVENTS',
  magician: 'UI',
  puppet: 'UI',
  speaker: 'UI',
};

function getRandomImage(pool: readonly string[]): string {
  if (!pool || pool.length === 0) return FALLBACK_IMAGE;
  return pool[Math.floor(Math.random() * pool.length)];
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function getPoolForCategory(category = "", type = "category"): readonly string[] {
  const normalized = `${category} ${type}`.toLowerCase();
  if (normalized.includes("artist")) return IMAGE_REGISTRY.ARTISTS;
  if (normalized.includes("event") || normalized.includes("wedding") || normalized.includes("birthday") || normalized.includes("corporate") || normalized.includes("mandap") || normalized.includes("sound system")) return IMAGE_REGISTRY.EVENTS;
  if (normalized.includes("dhol") || normalized.includes("dholki") || normalized.includes("folk") || normalized.includes("traditional") || normalized.includes("festival") || normalized.includes("gondhal") || normalized.includes("bharud") || normalized.includes("powada") || normalized.includes("shahiri") || normalized.includes("lezim") || normalized.includes("dashavatar") || normalized.includes("jalsa") || normalized.includes("bahurupiya")) return IMAGE_REGISTRY.FOLK;
  if (normalized.includes("spiritual") || normalized.includes("varkari") || normalized.includes("kirtan") || normalized.includes("pravachan") || normalized.includes("jagran") || normalized.includes("bhajan") || normalized.includes("zanj") || normalized.includes("waghya") || normalized.includes("murali") || normalized.includes("chiplya")) return IMAGE_REGISTRY.SPIRITUAL;
  if (normalized.includes("tabla") || normalized.includes("harmonium") || normalized.includes("mrudung") || normalized.includes("classical") || normalized.includes("singer") || normalized.includes("gayak") || normalized.includes("karaoke") || normalized.includes("orchestra")) return IMAGE_REGISTRY.CLASSICAL;
  return IMAGE_REGISTRY.UI;
}

function getStableImageFromPool(key: string, pool: readonly string[]) {
  if (!pool.length) return FALLBACK_IMAGE;
  return pool[hashString(key) % pool.length];
}

/**
 * Resolves an image path based on context keywords and type.
 * Deterministic fallback logic ensures valid paths are always returned.
 */
export function getImageForContext(context: string, type: ContextType = 'category'): string {
  const mappedCategoryImage = getMappedCategoryImage(context);
  if (mappedCategoryImage) return mappedCategoryImage;

  const normalized = String(context || "").toLowerCase();
  
  // 1. Keyword Mapping
  for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
    if (normalized.includes(keyword)) {
      return getRandomImage(IMAGE_REGISTRY[category]);
    }
  }

  // 2. Strict Type Fallback
  if (type === 'artist') return getRandomImage(IMAGE_REGISTRY.ARTISTS);
  if (type === 'event') return getRandomImage(IMAGE_REGISTRY.EVENTS);
  
  // 3. Category Fallback (Categories usually map to UI or specific folk/spiritual/classical)
  return getRandomImage(IMAGE_REGISTRY.UI);
}

/**
 * Compatibility Export for existing components
 */
export const STATIC_IMAGES = {
  heroDhol: "/assets/static/hero-dhol.webp",
  heroKirtan: "/assets/static/hero-kirtan.webp",
  heroTabla: "/assets/static/hero-tabla.webp",
  heroZanj: "/assets/static/hero-zanj.webp",
  profileCover: "/assets/static/profile-cover.webp",
  eventsBanner: "/assets/static/events-banner.webp",
  logo: "/mykalakar-logo.png",
  fallback: FALLBACK_IMAGE,
};

export const IMAGE_CATALOG = {
  artists: IMAGE_REGISTRY.ARTISTS,
  events: IMAGE_REGISTRY.EVENTS,
  folk: IMAGE_REGISTRY.FOLK,
  spiritual: IMAGE_REGISTRY.SPIRITUAL,
  classical: IMAGE_REGISTRY.CLASSICAL,
  ui: IMAGE_REGISTRY.UI,
};

export const PRESET_CATEGORY_IMAGES = {
  Wedding: getImageForContext("Marriage", "event"),
  Birthday: getImageForContext("Birthday", "event"),
  Corporate: getImageForContext("Corporate", "event"),
  Festival: getImageForContext("Festival", "event"),
  Spiritual: getImageForContext("Spiritual", "event"),
};

export const imageRegistry = {
  getStableImage: (key: string, options: { category?: string; type?: string; tags?: string[] }) => {
    const mappedCategoryImage = getMappedCategoryImage(`${options.category || ""} ${(options.tags || []).join(" ")}`);
    if (mappedCategoryImage) return mappedCategoryImage;

    const pool = getPoolForCategory(`${options.category || ""} ${(options.tags || []).join(" ")}`, options.type);
    return getStableImageFromPool(key, pool);
  },
  getMappedImage: (category?: unknown) => getMappedCategoryImage(category),
  getBestImage: (context: string, type: ContextType = 'category') => getImageForContext(context, type),
  getUniqueImage: (options: { category?: string; type?: string; key?: string }) => {
    const mappedCategoryImage = getMappedCategoryImage(options.category);
    if (mappedCategoryImage) return mappedCategoryImage;

    const pool = getPoolForCategory(options.category, options.type);
    return getStableImageFromPool(`${options.category || "default"}:${options.type || "ui"}:${options.key || ""}`, pool);
  },
  getCatalogImages: (catalog: keyof typeof IMAGE_CATALOG | string) => {
    const key = catalog.toLowerCase() as keyof typeof IMAGE_CATALOG;
    return IMAGE_CATALOG[key] || IMAGE_REGISTRY.UI;
  },
};

export const ImageRegistryService = imageRegistry;
