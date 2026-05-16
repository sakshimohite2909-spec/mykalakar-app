import { CATEGORY_IMAGE_MAP } from "@/config/imageRegistry";

export { CATEGORY_IMAGE_MAP };

export const DEFAULT_MAPPED_IMAGE =
  "https://images.unsplash.com/photo-1604028591871-33230a1c1d43?auto=format&fit=crop&w=800&q=80";

function normalizeCategoryKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const NORMALIZED_IMAGE_MAP = Object.entries(CATEGORY_IMAGE_MAP).reduce((acc, [key, url]) => {
  acc[normalizeCategoryKey(key)] = url;
  return acc;
}, {});

const FALLBACK_ALIASES = {
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
  performers: "actors",
  "shahir powada": "shahiri powada",
  "shahir and powada": "shahiri and powada",
  "soundsystem": "sound system",
  spiritual: "kirtankar",
  "taalkari": "taal kari",
  "venekari": "veenekari",
  "vyaspethchalak": "vyaspeeth chalak",
  "wedding artist": "marriage",
  "zanz pathak": "zanj pathak",
  wedding: "marriage",
  weddings: "marriage",
  singer: "singers",
  dj: "djs",
};

export function getMappedImage(categoryName, fallback = DEFAULT_MAPPED_IMAGE) {
  const normalized = normalizeCategoryKey(categoryName);
  if (!normalized) return fallback;

  if (NORMALIZED_IMAGE_MAP[normalized]) {
    return NORMALIZED_IMAGE_MAP[normalized];
  }

  if (FALLBACK_ALIASES[normalized] && NORMALIZED_IMAGE_MAP[FALLBACK_ALIASES[normalized]]) {
    return NORMALIZED_IMAGE_MAP[FALLBACK_ALIASES[normalized]];
  }

  const compactNormalized = normalized.replace(/\s+/g, "");
  const compactMatch = Object.entries(NORMALIZED_IMAGE_MAP).find(([key]) => {
    return key.replace(/\s+/g, "") === compactNormalized;
  });
  if (compactMatch) return compactMatch[1];

  const matchedEntry = Object.entries(NORMALIZED_IMAGE_MAP).find(([key]) => {
    const compactKey = key.replace(/\s+/g, "");
    return normalized.includes(key) || key.includes(normalized) || compactNormalized.includes(compactKey) || compactKey.includes(compactNormalized);
  });

  return matchedEntry?.[1] || fallback;
}

export function hasMappedImage(categoryName) {
  const normalized = normalizeCategoryKey(categoryName);
  return Boolean(normalized && NORMALIZED_IMAGE_MAP[normalized]);
}
