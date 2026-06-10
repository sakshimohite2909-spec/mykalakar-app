export const FALLBACK_IMAGE_GROUPS = {
  singersVocalists: [
    // 4K Performers / mic close-up (primary)
    "https://images.unsplash.com/photo-1516280440503-6c841441a10f?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1516280440504-45ea078ffa9a?auto=format&fit=crop&w=3840&q=100",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=3840&q=100",
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=3840&q=100",
    "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=3840&q=100",
  ],
  actorsTheaterPerformers: [
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=3840&q=100",
    "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=3840&q=100",
    "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=3840&q=100",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=3840&q=100",
  ],
  dholPathak: [
    // 4K Tabla/Dhol close-up (primary — Folk & Traditional)
    "https://images.unsplash.com/photo-1604882749372-9bd804b40778?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1605335191295-88544fb4af6e?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=3840&q=100",
    "https://images.unsplash.com/photo-1605135897648-9366fa7a9b19?auto=format&fit=crop&w=3840&q=100",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=3840&q=100",
    "https://upload.wikimedia.org/wikipedia/commons/e/ea/Dhol_Pathak.jpg",
  ],
  zanjPathakFolkDance: [
    "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=3840&q=100",
    "https://images.unsplash.com/photo-1610123598147-f632aa18b275?auto=format&fit=crop&w=3840&q=100",
    "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=3840&q=100",
    "https://upload.wikimedia.org/wikipedia/commons/4/4b/Flashmob_Lezim_performance.jpg",
  ],
  fineArtVisualArtists: [
    // 4K Camera lens close-up (primary — Event Services)
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1565214975484-3cfa9e56f914?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1512496015851-a1dc8a4746b1?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=3840&q=100",
    "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=3840&q=100",
    "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=3840&q=100",
    "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=3840&q=100",
  ],
  harmoniumSpiritual: [
    // 4K Harmonium keys close-up (primary — Spiritual & Varkari Sampraday)
    "https://images.unsplash.com/photo-1598285526019-20412e8c2ec6?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542838686-37ed7a7bfdd3?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1604085572504-a392ddf0d86a?q=80&w=2000&auto=format&fit=crop",
  ],
  birthdayEventCelebrations: [
    "https://images.unsplash.com/photo-1530103862676-de88924083a2?auto=format&fit=crop&w=3840&q=100",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=3840&q=100",
    "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=3840&q=100",
    "https://images.unsplash.com/photo-1482484316928-150cc9017e6e?auto=format&fit=crop&w=3840&q=100",
  ],
} as const;

type FallbackImageGroupKey = keyof typeof FALLBACK_IMAGE_GROUPS;

const FALLBACK_KEYWORDS: Array<{ key: FallbackImageGroupKey; terms: string[] }> = [
  {
    key: "dholPathak",
    terms: ["dhol pathak", "dholki", "dhol", "traditional percussion", "tabla", "mrudung", "mrudang"],
  },
  {
    key: "zanjPathakFolkDance",
    terms: ["zanj pathak", "zanz pathak", "lezim", "folk dance", "folk traditional", "folk and traditional", "folk & traditional"],
  },
  { key: "harmoniumSpiritual", terms: ["harmonium", "spiritual and varkari", "spiritual varkari", "varkari sampraday", "kirtankar", "pravachan", "bhajan", "varkari"] },
  {
    key: "singersVocalists",
    terms: ["singer", "singers", "vocalist", "vocalists", "gayak", "karaoke", "orchestra", "kirtan"],
  },
  {
    key: "actorsTheaterPerformers",
    terms: ["actor", "actors", "theater", "theatre", "performer", "performers", "stage performer", "anchor", "host", "motivational speaker"],
  },
  {
    key: "fineArtVisualArtists",
    terms: ["fine art", "visual artist", "visual artists", "painting", "painter", "mehndi", "makeup", "photography", "videography"],
  },
  {
    key: "birthdayEventCelebrations",
    terms: ["birthday", "event", "celebration", "marriage", "wedding", "party", "mandap", "decoration", "dj", "sound system"],
  },
];

export function normalizeFallbackImageKey(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function getFallbackImageGroupKey(...values: unknown[]): FallbackImageGroupKey | null {
  const normalizedValues = values.map(normalizeFallbackImageKey).filter(Boolean);
  if (!normalizedValues.length) return null;
  const haystack = normalizedValues.join(" ");

  const match = FALLBACK_KEYWORDS.find(({ terms }) =>
    terms.some((term) => {
      const normalizedTerm = normalizeFallbackImageKey(term);
      return haystack.includes(normalizedTerm) || normalizedValues.some((value) => normalizedTerm.includes(value));
    }),
  );

  return match?.key || null;
}

export function getFallbackImagesForArt(...values: unknown[]) {
  const key = getFallbackImageGroupKey(...values);
  return key ? [...FALLBACK_IMAGE_GROUPS[key]] : [];
}

export function getFallbackImageForArt(values: unknown[] = [], seed = "") {
  const images = getFallbackImagesForArt(...values);
  if (!images.length) return "";
  const index = seed ? hashString(seed) % images.length : 0;
  return images[index];
}

export function isGenericPlaceholderImage(value: unknown) {
  const src = String(value || "").trim();
  return !src || /ui-avatars\.com|api\/\?name=|placeholder\.svg|fallback-image\.webp/i.test(src);
}

export function getUsableImageUrl(value: unknown) {
  const src = String(value || "").trim();
  return isGenericPlaceholderImage(src) ? "" : src;
}
