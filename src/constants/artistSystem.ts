export const MAIN_CATEGORIES = [
  "Performers",
  "Event Services",
  "Folk & Traditional Arts",
  "Spiritual & Varkari Sampraday",
] as const;

export type MainCategory = (typeof MAIN_CATEGORIES)[number];

export const CATEGORY_STRUCTURE = {
  "Performers": {
    icon: "🎭",
    subcategories: [
      "Karaoke Singers",
      "Orchestra",
      "Magicians",
      "Puppet Show",
      "DJs",
      "Anchors / Hosts",
      "Motivational Speakers",
      "Actors",
      "Singers",
    ],
  },
  "Event Services": {
    icon: "🎥",
    subcategories: [
      "Photography",
      "Videography",
      "Makeup Artists",
      "Mehndi Artists",
    ],
  },
  "Folk & Traditional Arts": {
    icon: "🥁",
    subcategories: [
      "Gondhal",
      "Jagran",
      "Bharud",
      "Shahiri & Powada",
      "Lezim Pathak",
      "Zanj Pathak",
      "Dhol Pathak",
      "Waghya Murali",
      "Jalsa & Dashavatar",
      "Dhagaai & Dholki",
      "Bahurupiya",
    ],
  },
  "Spiritual & Varkari Sampraday": {
    icon: "🕉️",
    subcategories: [
      "Kirtankar",
      "Pravachankar",
      "Vyaspeeth Chalak",
      "Chiplya Player",
      "Gayak",
      "Mrudungmani",
      "Bharudkar",
      "Sound System",
      "Mandap & Decoration",
      "Veenekari",
      "Taal Kari",
      "Varkari Sanstha",
      "Bhajani Mandal",
      "Shastriya Bhajan",
      "Tabla Vadak",
      "Harmonium Vadak",
      "Dholki Vadak",
    ],
  },
} as const;

export const CATEGORY_GROUPS = CATEGORY_STRUCTURE;
export type CategoryGroupName = keyof typeof CATEGORY_GROUPS;

export const CATEGORY_GROUP_ICONS = Object.entries(CATEGORY_STRUCTURE).reduce((acc, [name, data]) => {
  acc[name as CategoryGroupName] = data.icon;
  return acc;
}, {} as Record<CategoryGroupName, string>);

export const ARTIST_TYPES = Object.values(CATEGORY_STRUCTURE).flatMap(cat => cat.subcategories);

export type ArtistType = typeof ARTIST_TYPES[number];

export function normalizeCategoryKey(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, "-");
}

export function normalizeArtistType(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  // Check if it's already one of our known types
  const match = ARTIST_TYPES.find(t => t.toLowerCase() === raw.toLowerCase());
  return match || raw;
}

const CATEGORY_IMAGES: Record<string, string> = {
  "Performers": "https://images.unsplash.com/photo-1516280440502-6292021fb07b?auto=format&fit=crop&w=1200&q=80",
  "Event Services": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
  "Folk & Traditional Arts": "https://images.unsplash.com/photo-1605335661331-1e9680eddbec?auto=format&fit=crop&w=1200&q=80",
  "Spiritual & Varkari Sampraday": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80",
};

export const CATEGORY_GROUP_OPTIONS = Object.entries(CATEGORY_STRUCTURE).map(([name, data], index) => ({
  id: normalizeCategoryKey(name),
  name,
  icon: data.icon,
  slug: normalizeCategoryKey(name),
  image: CATEGORY_IMAGES[name] || `/categories/${normalizeCategoryKey(name)}.png`,
  imageUrl: CATEGORY_IMAGES[name] || `/categories/${normalizeCategoryKey(name)}.png`,
  subcategories: [...data.subcategories],
  count: 0,
  sortOrder: index + 1,
  isActive: true,
}));

export const ARTIST_TYPE_OPTIONS = ARTIST_TYPES.map(type => ({
  id: normalizeCategoryKey(type),
  name: type,
  sortOrder: ARTIST_TYPES.indexOf(type),
}));

export function isCategoryGroup(value: unknown): value is CategoryGroupName {
  return typeof value === "string" && value in CATEGORY_GROUPS;
}

export function getCategoryGroupForArtistType(artistType: unknown): CategoryGroupName | null {
  const normalized = normalizeArtistType(artistType);
  for (const [groupName, group] of Object.entries(CATEGORY_GROUPS)) {
    if (group.subcategories.some(sub => sub.toLowerCase() === String(normalized).toLowerCase())) {
      return groupName as CategoryGroupName;
    }
  }
  return null;
}

export function getArtistTypesForFilter(categoryGroup?: CategoryGroupName | null): typeof ARTIST_TYPES {
  if (!categoryGroup || !isCategoryGroup(categoryGroup)) return ARTIST_TYPES;
  return CATEGORY_GROUPS[categoryGroup].subcategories as unknown as typeof ARTIST_TYPES;
}

export function getArtistArtForms(artist: Record<string, any>): string[] {
  const profileArtForms = Array.isArray(artist.artistProfile?.artForms) ? artist.artistProfile.artForms : [];
  const categories = Array.isArray(artist.categories) ? artist.categories : [];
  const categoriesArray = Array.isArray(artist.categoriesArray) ? artist.categoriesArray : [];
  const artsList = Array.isArray(artist.artsList) ? artist.artsList : [];
  const categoryValue = String(artist.category ?? "").trim();
  const getArtValues = (art: Record<string, any> | string) =>
    typeof art === "string"
      ? [art]
      : [art?.artForm, art?.category, art?.subcategory, art?.subCategory, ...(Array.isArray(art?.types) ? art.types : [])];
  const candidates = [
    ...(categoryValue && !isCategoryGroup(categoryValue) ? [categoryValue] : []),
    artist.subcategory,
    artist.artForm,
    ...categories.flatMap(getArtValues),
    ...profileArtForms,
    ...categoriesArray.flatMap(getArtValues),
    ...artsList.flatMap(getArtValues),
  ];

  return Array.from(new Set(candidates.map(c => String(c ?? "").trim()).filter(Boolean)));
}

export function normalizeArtistRecord<T extends Record<string, any>>(artist: T): T {
  const artForms = getArtistArtForms(artist);
  return {
    ...artist,
    category: artist.category || artForms[0] || "",
    categories: artForms,
    artistProfile: {
      ...(artist.artistProfile || {}),
      artForms,
      experience: artist.artistProfile?.experience ?? artist.experience ?? "",
      bio: artist.artistProfile?.bio ?? artist.bio ?? "",
      location: artist.artistProfile?.location ?? artist.location ?? artist.district ?? artist.city ?? artist.state ?? "",
      profileImage: artist.artistProfile?.profileImage ?? artist.media?.profilePhoto ?? artist.profilePhoto ?? "",
    },
    userId: artist.userId || artist.uid || artist.id || "",
  };
}
