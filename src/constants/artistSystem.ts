export const ARTIST_TYPES = [
  "Singer",
  "Musician",
  "Band",
  "DJ",
  "Dancer",
  "Choreographer",
  "Actor",
  "Comedian",
  "Anchor",
  "Mimicry Artist",
  "Magician",
  "Folk Artist",
  "Varkari",
  "Dhol Pathak",
  "Photographer",
  "Videographer",
  "Painter",
  "Makeup Artist",
  "Event Host",
  "Stage Performer",
] as const;

export type ArtistType = (typeof ARTIST_TYPES)[number];

export const CATEGORY_GROUPS = {
  "Music Artists": ["Singer", "Musician", "Band", "DJ"],
  "Dance Artists": ["Dancer", "Choreographer"],
  "Stage & Entertainment": ["Actor", "Comedian", "Anchor", "Mimicry Artist", "Magician"],
  "Creative Artists": ["Photographer", "Videographer", "Painter", "Makeup Artist"],
  "Folk Art": ["Folk Artist", "Varkari", "Dhol Pathak"],
  "Event Artists": ["Event Host", "Stage Performer"],
} as const satisfies Record<string, readonly ArtistType[]>;

export type CategoryGroupName = keyof typeof CATEGORY_GROUPS;

export const CATEGORY_GROUP_ICONS: Record<CategoryGroupName, string> = {
  "Music Artists": "🎵",
  "Dance Artists": "💃",
  "Stage & Entertainment": "🎭",
  "Creative Artists": "🎨",
  "Folk Art": "🥁",
  "Event Artists": "✨",
};

export const ARTIST_TYPE_OPTIONS = ARTIST_TYPES.map((name) => ({
  label: name,
  value: name,
}));

export const CATEGORY_GROUP_OPTIONS = Object.keys(CATEGORY_GROUPS).map((name, index) => ({
  id: normalizeCategoryKey(name),
  name,
  icon: CATEGORY_GROUP_ICONS[name as CategoryGroupName],
  slug: normalizeCategoryKey(name),
  image: "",
  subcategories: [...CATEGORY_GROUPS[name as CategoryGroupName]],
  subcategoryTypes: Object.fromEntries(
    CATEGORY_GROUPS[name as CategoryGroupName].map((type) => [type, [type]])
  ),
  count: 0,
  sortOrder: index + 1,
  isActive: true,
}));

export function normalizeCategoryKey(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const TYPE_BY_KEY = new Map(ARTIST_TYPES.map((type) => [normalizeCategoryKey(type), type] as const));
const GROUP_BY_KEY = new Map(
  Object.keys(CATEGORY_GROUPS).map((group) => [normalizeCategoryKey(group), group as CategoryGroupName] as const)
);

const LEGACY_TYPE_ALIASES: Record<string, ArtistType> = {
  actors: "Actor",
  acting: "Actor",
  singer: "Singer",
  singers: "Singer",
  gayak: "Singer",
  "karaoke singer": "Singer",
  "karaoke singers": "Singer",
  orchestra: "Band",
  magicians: "Magician",
  magician: "Magician",
  "pappate show": "Stage Performer",
  "puppet show": "Stage Performer",
  puppeteer: "Stage Performer",
  "djs": "DJ",
  dj: "DJ",
  "anchors hosts": "Anchor",
  anchors: "Anchor",
  hosts: "Anchor",
  host: "Anchor",
  "motivational speakers": "Stage Performer",
  speaker: "Stage Performer",
  "photo videography": "Photographer",
  photography: "Photographer",
  videography: "Videographer",
  "makeup mehndi artist": "Makeup Artist",
  "mehndi artist": "Makeup Artist",
  "folk art": "Folk Artist",
  gondhal: "Folk Artist",
  jagran: "Folk Artist",
  bharud: "Folk Artist",
  bharudkar: "Varkari",
  "shahir powada": "Folk Artist",
  "lezim pathak": "Folk Artist",
  "zanz pathak": "Folk Artist",
  "dhol pathak": "Dhol Pathak",
  "waghya murali": "Folk Artist",
  "jalsa dashavtar": "Folk Artist",
  "dhagari dhol ovi": "Folk Artist",
  "dhangari dhol ovi": "Folk Artist",
  bahurupiya: "Folk Artist",
  "varkari sampraday": "Varkari",
  "varkari sampradaay": "Varkari",
  kirtankar: "Varkari",
  pravachankar: "Varkari",
  vyaspethchalak: "Varkari",
  chopdar: "Varkari",
  mrudangmani: "Varkari",
  soundsystem: "Varkari",
  "sound system": "Varkari",
  "mandap decoration": "Varkari",
  venekari: "Varkari",
  taalkari: "Varkari",
  "varkari sanstha": "Varkari",
  "bhajani mandal": "Varkari",
  "shastriya bhajan": "Varkari",
  "tabla vadak": "Varkari",
  "harmonium vadak": "Varkari",
  "dholki vadak": "Varkari",
};

export function isCategoryGroup(value: unknown): value is CategoryGroupName {
  return GROUP_BY_KEY.has(normalizeCategoryKey(value));
}

export function normalizeArtistType(value: unknown): ArtistType | null {
  const key = normalizeCategoryKey(value);
  if (!key) return null;
  return TYPE_BY_KEY.get(key) ?? LEGACY_TYPE_ALIASES[key] ?? null;
}

export function getArtistTypesForFilter(value: unknown): ArtistType[] {
  const key = normalizeCategoryKey(value);
  const group = GROUP_BY_KEY.get(key);
  if (group) return [...CATEGORY_GROUPS[group]];
  const type = normalizeArtistType(value);
  return type ? [type] : [];
}

export function getCategoryGroupForArtistType(value: unknown): CategoryGroupName | null {
  const type = normalizeArtistType(value);
  if (!type) return null;
  return (
    (Object.keys(CATEGORY_GROUPS) as CategoryGroupName[]).find((group) =>
      CATEGORY_GROUPS[group].includes(type)
    ) ?? null
  );
}

export const ARTIST_CATEGORIES = ARTIST_TYPES;
export const normalizeArtistCategory = normalizeArtistType;
export const getCategoriesForFilter = getArtistTypesForFilter;
export const getCategoryGroupForCategory = getCategoryGroupForArtistType;

export function normalizeArtistRecord<T extends Record<string, any>>(artist: T): T {
  const primaryArt = Array.isArray(artist.artsList) ? artist.artsList[0] || {} : {};
  const primaryType =
    normalizeArtistType(artist.category) ??
    normalizeArtistType(primaryArt.category) ??
    normalizeArtistType(artist.subcategory) ??
    normalizeArtistType(Array.isArray(artist.categories) ? artist.categories[0] : "") ??
    null;

  const artsList = Array.isArray(artist.artsList)
    ? artist.artsList.map((art: Record<string, any>) => ({
        ...art,
        category: normalizeArtistType(art?.category) ?? normalizeArtistType(art?.subcategory) ?? primaryType ?? "",
      }))
    : primaryType
      ? [{ category: primaryType, subcategory: artist.subcategory || "", types: [] }]
      : [];

  const categories = Array.from(
    new Set([
      primaryType,
      ...artsList.map((art: Record<string, any>) => normalizeArtistType(art?.category)),
      ...(Array.isArray(artist.categories) ? artist.categories.map(normalizeArtistType) : []),
    ].filter(Boolean) as ArtistType[])
  );

  return {
    ...artist,
    category: primaryType ?? artist.category ?? "",
    categories,
    artsList,
    location: artist.location || artist.district || artist.city || artist.state || "",
    userId: artist.userId || artist.uid || artist.id || "",
  };
}
