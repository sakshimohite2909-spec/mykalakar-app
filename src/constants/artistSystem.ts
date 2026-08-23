export const MAIN_CATEGORIES = [
  "Varkari Sampraday",
  "Wedding",
  "Performers",
  "Event Services",
  "Folk & Traditional Arts",
  "Birthday",
  "Corporate Event",
  "Cultural Event",
  "Religious Event",
  "College Event",
  "Festival Event",
  "Other Events",
] as const;

export type MainCategory = (typeof MAIN_CATEGORIES)[number];

// ─── 9 MAIN EVENT CARDS FOR HOME PAGE ───
export const MAIN_EVENT_CARDS = [
  {
    id: "varkari-sampraday",
    name: "Varkari Sampraday",
    icon: "🚩",
    image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=1200&auto=format&fit=crop",
    subcategoriesPreview: ["Kirtankar", "Pravachankar", "Bhajani Mandal", "Mridangamani"],
    description: "Kirtan, Pravachan, Bhajan, Bhagwat Katha & Varkari Ensembles",
  },
  {
    id: "wedding",
    name: "Wedding",
    icon: "💍",
    image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1200&auto=format&fit=crop",
    subcategoriesPreview: ["Photographers", "Catering", "Decorators", "Mehendi", "DJs"],
    description: "Venues, Bridal Makeup, Photography, Catering & Entertainment",
  },
  {
    id: "birthday",
    name: "Birthday",
    icon: "🎂",
    image: "https://images.unsplash.com/photo-1530103862676-de88924083a2?q=80&w=1200&auto=format&fit=crop",
    subcategoriesPreview: ["Magicians", "Balloon Decorators", "DJs", "Clowns / Mascot"],
    description: "Magicians, Balloon Decoration, Karaoke & Birthday Entertainers",
  },
  {
    id: "corporate-event",
    name: "Corporate Event",
    icon: "💼",
    image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=1200&auto=format&fit=crop",
    subcategoriesPreview: ["Anchors / Hosts", "Speakers", "LED Wall", "Sound System"],
    description: "Professional Hosts, AV Setup, Stage Lighting & Keynote Speakers",
  },
  {
    id: "cultural-event",
    name: "Cultural Event",
    icon: "🪕",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=1200&auto=format&fit=crop",
    subcategoriesPreview: ["Gondhal", "Bharud", "Lezim Pathak", "Powada"],
    description: "Gondhal, Bharud, Shahiri Powada & Traditional Folk Acts",
  },
  {
    id: "religious-event",
    name: "Religious Event",
    icon: "🕉️",
    image: "https://images.unsplash.com/photo-1608613304899-ea8098577e38?q=80&w=1200&auto=format&fit=crop",
    subcategoriesPreview: ["Pandit / Priest", "Ram Katha", "Kirtan", "Bhajan"],
    description: "Pooja Pandits, Ram Katha Recitations & Spiritual Bhajans",
  },
  {
    id: "college-event",
    name: "College Event",
    icon: "🎓",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop",
    subcategoriesPreview: ["Live Bands", "DJs", "Dance Groups", "Celebrity Acts"],
    description: "Rock Bands, Pro DJs, Fest Anchors & Dance Troupe Acts",
  },
  {
    id: "festival-event",
    name: "Festival Event",
    icon: "🎆",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop",
    subcategoriesPreview: ["Dhol-Tasha Pathak", "Zanj Pathak", "Fireworks"],
    description: "Dhol Tasha Pathak, Grand Fireworks & Procession Ensembles",
  },
  {
    id: "other-events",
    name: "Other Events",
    icon: "🌟",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop",
    subcategoriesPreview: ["Photography", "Videography", "Mandap & Setup"],
    description: "Customized Event Setup, Media & Specialty Artist Booking",
  },
] as const;

// ─── 3-LEVEL HIERARCHY: Event Type (L1) -> Category Group (L2) -> Subcategory (L3) ───
export const EVENT_CATEGORY_HIERARCHY: Record<
  string,
  {
    icon: string;
    groups: Record<string, { icon: string; subcategories: string[] }>;
  }
> = {
  "Varkari Sampraday": {
    icon: "🚩",
    groups: {
      "Spiritual Speakers": {
        icon: "🎙️",
        subcategories: [
          "Kirtankar",
          "Pravachankar",
          "Vyaspithchalak",
          "Chopdar",
          "Bhagwat Katha Kathan",
          "Ram Katha",
        ],
      },
      "Vocal Artists": {
        icon: "🎤",
        subcategories: [
          "Gayak",
          "Bharudkar",
          "Bhajani Mandal",
          "Shastriya Bhajan",
        ],
      },
      "Instrumental Artists": {
        icon: "🪘",
        subcategories: [
          "Mridangamani",
          "Vinekari",
          "Talkari",
          "Tabla Vadak",
          "Harmonium Vadak",
          "Dholki Vadak",
        ],
      },
      "Organizations": {
        icon: "🏛️",
        subcategories: [
          "Warkari Sanstha",
        ],
      },
      "Event Services": {
        icon: "🔊",
        subcategories: [
          "Sound System",
          "Mandap Decoration",
          "Stage & Lighting",
          "Photography & Videography",
        ],
      },
    },
  },
  "Wedding": {
    icon: "💍",
    groups: {
      "Venues": {
        icon: "🏰",
        subcategories: [
          "Banquet Hall",
          "Marriage Hall",
          "Lawn",
          "Resort",
          "Hotel",
          "Farmhouse",
          "Temple Venue",
        ],
      },
      "Bridal & Groom Services": {
        icon: "💄",
        subcategories: [
          "Bridal Makeup Artist",
          "Groom Makeup Artist",
          "Mehendi Artist",
          "Hairstylist",
          "Nail Artist",
          "Saree Draping",
          "Personal Stylist",
        ],
      },
      "Photography & Videography": {
        icon: "📸",
        subcategories: [
          "Wedding Photographer",
          "Candid Photographer",
          "Traditional Photographer",
          "Wedding Videographer",
          "Cinematic Videographer",
          "Drone Photography",
          "Pre-Wedding Shoot",
          "Live Streaming",
          "Photo Booth",
        ],
      },
      "Entertainment": {
        icon: "🎭",
        subcategories: [
          "DJ",
          "Live Singer",
          "Karaoke Singer",
          "Orchestra",
          "Wedding Band",
          "Anchor (Emcee)",
          "Celebrity Artist",
          "Dance Group",
          "Choreographer",
          "Dhol-Tasha Pathak",
          "Lezim Pathak",
          "Folk Artist",
          "Magician",
          "Mimicry Artist",
        ],
      },
      "Catering": {
        icon: "🍽️",
        subcategories: [
          "Veg Catering",
          "Non-Veg Catering",
          "Buffet Service",
          "Live Food Counter",
          "Sweet Counter",
          "Mocktail Counter",
          "Tea & Coffee Counter",
          "Maharashtrian Catering",
          "South Indian Catering",
          "North Indian Catering",
        ],
      },
      "Decoration": {
        icon: "💐",
        subcategories: [
          "Wedding Decorator",
          "Flower Decoration",
          "Mandap Decoration",
          "Stage Decoration",
          "Entrance Decoration",
          "Balloon Decoration",
          "Theme Decoration",
          "Lighting Decoration",
        ],
      },
      "Event Setup": {
        icon: "🎪",
        subcategories: [
          "Sound System",
          "LED Wall",
          "Stage Setup",
          "Lighting",
          "Generator",
          "Tent House",
          "Chairs & Tables",
          "AC / Air Cooler Rental",
        ],
      },
      "Transportation": {
        icon: "🚗",
        subcategories: [
          "Bridal Car",
          "Luxury Car Rental",
          "Bus Rental",
          "Guest Transport",
        ],
      },
      "Guest Hospitality": {
        icon: "🏨",
        subcategories: [
          "Hotel Booking",
          "Guest House",
          "Welcome Team",
          "Hospitality Staff",
          "Help Desk",
        ],
      },
      "Invitations": {
        icon: "💌",
        subcategories: [
          "Wedding Card Designer",
          "Digital Invitation",
          "Video Invitation",
          "Printing Service",
        ],
      },
      "Wedding Essentials": {
        icon: "🎁",
        subcategories: [
          "Pandit / Priest",
          "Wedding Planner",
          "Wedding Coordinator",
          "Return Gift Supplier",
          "Gift Packaging",
          "Wedding Cake",
          "Fireworks",
          "Security Service",
          "Housekeeping",
        ],
      },
      "Shopping": {
        icon: "🛍️",
        subcategories: [
          "Bridal Wear",
          "Groom Wear",
          "Jewellery",
          "Footwear",
          "Accessories",
          "Costume Rental",
        ],
      },
    },
  },
  "Birthday": {
    icon: "🎂",
    groups: {
      "Entertainers": {
        icon: "🎭",
        subcategories: ["Magicians", "Puppet Show", "Clowns / Mascot", "Mimicry Artist", "Balloon Modeler", "Game Host / Anchor"],
      },
      "Music & Dance": {
        icon: "🎵",
        subcategories: ["DJs", "Karaoke Singers", "Kids Dance Group", "Live Singer"],
      },
      "Decoration & Setup": {
        icon: "🎈",
        subcategories: ["Balloon Decoration", "Theme Decoration", "Sound System", "Lighting", "Stage Setup"],
      },
      "Media & Fun": {
        icon: "📸",
        subcategories: ["Birthday Photographer", "Cinematic Videographer", "Photo Booth", "Temporary Tattoo Artist", "Face Painting"],
      },
    },
  },
  "Corporate Event": {
    icon: "💼",
    groups: {
      "Hosts & Speakers": {
        icon: "🎙️",
        subcategories: ["Anchors / Hosts", "Motivational Speakers", "Keynote Speakers", "Panel Moderators", "Celebrity Host"],
      },
      "Entertainment": {
        icon: "🎸",
        subcategories: ["Live Bands", "Stand-up Comedians", "Magicians", "Instrumental Artists", "DJs", "Dance Group"],
      },
      "AV, Stage & Tech Setup": {
        icon: "🔊",
        subcategories: ["Sound System", "LED Wall", "Stage & Lighting", "Projector & Screen", "Live Streaming"],
      },
      "Photography & Video": {
        icon: "📸",
        subcategories: ["Corporate Photographer", "Event Videographer", "Drone Photography", "Live Webcasting"],
      },
      "Venues & Catering": {
        icon: "🏢",
        subcategories: ["Conference Hall", "Corporate Catering", "Guest Hospitality", "Welcome Team"],
      },
    },
  },
  "Cultural Event": {
    icon: "🪕",
    groups: {
      "Folk & Performing Groups": {
        icon: "🥁",
        subcategories: ["Gondhal", "Jagran", "Bharud", "Shahiri & Powada", "Lezim Pathak", "Dhol Pathak", "Folk Artist"],
      },
    },
  },
  "Religious Event": {
    icon: "🕉️",
    groups: {
      "Spiritual & Bhajan": {
        icon: "🚩",
        subcategories: ["Kirtankar", "Pravachankar", "Bhajani Mandal", "Shastriya Bhajan", "Pandit / Priest", "Bhagwat Katha Kathan", "Ram Katha"],
      },
    },
  },
  "College Event": {
    icon: "🎓",
    groups: {
      "College Acts": {
        icon: "🎸",
        subcategories: ["DJs", "Live Bands", "Anchors / Hosts", "Dance Group", "Celebrity Artist"],
      },
    },
  },
  "Festival Event": {
    icon: "🎆",
    groups: {
      "Festival Ensembles": {
        icon: "🥁",
        subcategories: ["Dhol-Tasha Pathak", "Lezim Pathak", "Zanj Pathak", "Folk Artist", "Fireworks"],
      },
    },
  },
  "Other Events": {
    icon: "🌟",
    groups: {
      "General Services": {
        icon: "✨",
        subcategories: ["Photography", "Videography", "Sound System", "Mandap Decoration", "Pandit / Priest"],
      },
    },
  },
} as const;

export type EventHierarchyKey = keyof typeof EVENT_CATEGORY_HIERARCHY;

// ─── LEGACY CATEGORY_STRUCTURE (Maintained for backwards compatibility) ───
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
      "Live Bands",
    ],
  },
  "Event Services": {
    icon: "🎥",
    subcategories: [
      "Photography",
      "Videography",
      "Makeup Artists",
      "Mehndi Artists",
      "Sound System",
      "Mandap Decoration",
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
  "Varkari Sampraday": {
    icon: "🚩",
    subcategories: [
      "Kirtankar",
      "Pravachankar",
      "Vyaspithchalak",
      "Chopdar",
      "Bhagwat Katha Kathan",
      "Ram Katha",
      "Gayak",
      "Bharudkar",
      "Bhajani Mandal",
      "Shastriya Bhajan",
      "Mridangamani",
      "Vinekari",
      "Talkari",
      "Tabla Vadak",
      "Harmonium Vadak",
      "Dholki Vadak",
      "Chiplya Player",
      "Warkari Sanstha",
      "Sound System",
      "Mandap Decoration",
    ],
  },
  "Spiritual & Varkari Sampraday": {
    icon: "🚩",
    subcategories: [
      "Kirtankar",
      "Pravachankar",
      "Vyaspithchalak",
      "Chopdar",
      "Bhagwat Katha Kathan",
      "Ram Katha",
      "Gayak",
      "Mrudungmani",
      "Mridangamani",
      "Bharudkar",
      "Veenekari",
      "Vinekari",
      "Taal Kari",
      "Talkari",
      "Varkari Sanstha",
      "Bhajani Mandal",
      "Shastriya Bhajan",
      "Tabla Vadak",
      "Harmonium Vadak",
      "Dholki Vadak",
      "Chiplya Player",
    ],
  },
  "Wedding": {
    icon: "💍",
    subcategories: [
      "Banquet Hall",
      "Marriage Hall",
      "Lawn",
      "Resort",
      "Hotel",
      "Farmhouse",
      "Temple Venue",
      "Bridal Makeup Artist",
      "Groom Makeup Artist",
      "Mehendi Artist",
      "Hairstylist",
      "Nail Artist",
      "Saree Draping",
      "Personal Stylist",
      "Wedding Photographer",
      "Candid Photographer",
      "Traditional Photographer",
      "Wedding Videographer",
      "Cinematic Videographer",
      "Drone Photography",
      "Pre-Wedding Shoot",
      "Live Streaming",
      "Photo Booth",
      "DJ",
      "Live Singer",
      "Karaoke Singer",
      "Orchestra",
      "Wedding Band",
      "Anchor (Emcee)",
      "Celebrity Artist",
      "Dance Group",
      "Choreographer",
      "Dhol-Tasha Pathak",
      "Lezim Pathak",
      "Folk Artist",
      "Magician",
      "Mimicry Artist",
      "Veg Catering",
      "Non-Veg Catering",
      "Buffet Service",
      "Live Food Counter",
      "Sweet Counter",
      "Mocktail Counter",
      "Tea & Coffee Counter",
      "Maharashtrian Catering",
      "South Indian Catering",
      "North Indian Catering",
      "Wedding Decorator",
      "Flower Decoration",
      "Mandap Decoration",
      "Stage Decoration",
      "Entrance Decoration",
      "Balloon Decoration",
      "Theme Decoration",
      "Lighting Decoration",
      "Stage Setup",
      "Lighting",
      "Generator",
      "Tent House",
      "Chairs & Tables",
      "AC / Air Cooler Rental",
      "Bridal Car",
      "Luxury Car Rental",
      "Bus Rental",
      "Guest Transport",
      "Hotel Booking",
      "Guest House",
      "Welcome Team",
      "Hospitality Staff",
      "Help Desk",
      "Wedding Card Designer",
      "Digital Invitation",
      "Video Invitation",
      "Printing Service",
      "Pandit / Priest",
      "Wedding Planner",
      "Wedding Coordinator",
      "Return Gift Supplier",
      "Gift Packaging",
      "Wedding Cake",
      "Fireworks",
      "Security Service",
      "Housekeeping",
      "Bridal Wear",
      "Groom Wear",
      "Jewellery",
      "Footwear",
      "Accessories",
      "Costume Rental",
    ],
  },
  "Birthday": {
    icon: "🎂",
    subcategories: [
      "Magicians",
      "Puppet Show",
      "Karaoke Singers",
      "DJs",
      "Dance Group",
      "Clowns / Mascot",
      "Balloon Decoration",
      "Theme Decoration",
      "Sound System",
      "Lighting Decoration",
    ],
  },
  "Corporate Event": {
    icon: "💼",
    subcategories: [
      "Anchors / Hosts",
      "Motivational Speakers",
      "Celebrity Artist",
      "Photography",
      "Videography",
      "LED Wall",
      "Sound System",
      "Lighting",
    ],
  },
  "Cultural Event": {
    icon: "🪕",
    subcategories: [
      "Gondhal",
      "Jagran",
      "Bharud",
      "Shahiri & Powada",
      "Lezim Pathak",
      "Dhol Pathak",
      "Folk Artist",
    ],
  },
  "Religious Event": {
    icon: "🕉️",
    subcategories: [
      "Kirtankar",
      "Pravachankar",
      "Bhajani Mandal",
      "Shastriya Bhajan",
      "Pandit / Priest",
      "Bhagwat Katha Kathan",
      "Ram Katha",
    ],
  },
  "College Event": {
    icon: "🎓",
    subcategories: [
      "DJs",
      "Live Bands",
      "Anchors / Hosts",
      "Dance Group",
      "Celebrity Artist",
    ],
  },
  "Festival Event": {
    icon: "🎆",
    subcategories: [
      "Dhol-Tasha Pathak",
      "Lezim Pathak",
      "Zanj Pathak",
      "Folk Artist",
      "Fireworks",
    ],
  },
  "Other Events": {
    icon: "🌟",
    subcategories: [
      "Photography",
      "Videography",
      "Sound System",
      "Mandap Decoration",
      "Pandit / Priest",
    ],
  },
} as const;

export function getSubcategoriesForMainCategory(mainCategory?: string | null): string[] {
  if (!mainCategory) return [];
  const raw = String(mainCategory).trim();

  // Check 3-level hierarchy first
  for (const [eName, eData] of Object.entries(EVENT_CATEGORY_HIERARCHY)) {
    if (eName.toLowerCase() === raw.toLowerCase()) {
      const subs = Object.values(eData.groups).flatMap(g => g.subcategories);
      return Array.from(new Set(subs));
    }
  }

  // Check legacy CATEGORY_STRUCTURE
  for (const [cName, cData] of Object.entries(CATEGORY_STRUCTURE)) {
    if (cName.toLowerCase() === raw.toLowerCase()) {
      return [...cData.subcategories];
    }
  }

  return [];
}

export const CATEGORY_GROUPS = CATEGORY_STRUCTURE;
export type CategoryGroupName = keyof typeof CATEGORY_GROUPS;

export const CATEGORY_GROUP_ICONS = Object.entries(CATEGORY_STRUCTURE).reduce((acc, [name, data]) => {
  acc[name as CategoryGroupName] = data.icon;
  return acc;
}, {} as Record<CategoryGroupName, string>);

// All unique subcategory names across the system
export const ARTIST_TYPES = Array.from(
  new Set(Object.values(CATEGORY_STRUCTURE).flatMap(cat => cat.subcategories))
);

export type ArtistType = (typeof ARTIST_TYPES)[number];

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
  const match = ARTIST_TYPES.find(t => t.toLowerCase() === raw.toLowerCase());
  return match || raw;
}

const CATEGORY_IMAGES: Record<string, string> = {
  "Varkari Sampraday": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80",
  "Wedding": "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80",
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

// ─── 3-LEVEL HIERARCHY HELPER FUNCTIONS ───
export function getCategoryGroupsForEventType(eventType: string): string[] {
  const normalizedEvent = String(eventType ?? "").trim().toLowerCase();
  for (const [eName, eData] of Object.entries(EVENT_CATEGORY_HIERARCHY)) {
    if (eName.toLowerCase() === normalizedEvent) {
      return Object.keys(eData.groups);
    }
  }
  return [];
}

export function getSubcategoriesForCategoryGroup(eventType: string, groupName: string): string[] {
  const normalizedEvent = String(eventType ?? "").trim().toLowerCase();
  const normalizedGroup = String(groupName ?? "").trim().toLowerCase();

  for (const [eName, eData] of Object.entries(EVENT_CATEGORY_HIERARCHY)) {
    if (eName.toLowerCase() === normalizedEvent) {
      for (const [gName, gData] of Object.entries(eData.groups)) {
        if (gName.toLowerCase() === normalizedGroup) {
          return gData.subcategories;
        }
      }
    }
  }

  // Fallback if groupName matched legacy category group
  const legacyMatch = Object.entries(CATEGORY_STRUCTURE).find(
    ([k]) => k.toLowerCase() === normalizedGroup || k.toLowerCase() === normalizedEvent
  );
  if (legacyMatch) {
    return [...legacyMatch[1].subcategories];
  }

  return [];
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

// ─── RELATIONAL 3-LEVEL HIERARCHY HELPERS ───

export interface ArtistServiceItem {
  id?: string;
  event: string;
  category: string;
  subcategory: string;
  artForm?: string;
  mainCategory?: string;
  soloPrice?: string | number;
  duoPrice?: string | number;
  teamPrice?: string | number;
  showPricingOnProfile?: boolean;
  youtubeLinks?: string[];
}

export function extractArtistServices(artist: Record<string, any>): ArtistServiceItem[] {
  if (Array.isArray(artist?.services) && artist.services.length > 0) {
    return artist.services.map((item: any, idx: number) => {
      const sub = item.subcategory || item.subCategory || item.artForm || item.name || "Artist";
      const cat = item.category || item.mainCategory || (findHierarchyForSubcategory(sub)?.category) || "General";
      const evt = item.event || item.eventType || (findHierarchyForSubcategory(sub)?.eventType) || "General Event";
      return {
        id: item.id || `service-${idx}`,
        event: evt,
        category: cat,
        subcategory: sub,
        artForm: sub,
        soloPrice: item.soloPrice ?? item.soloPerformancePrice ?? 0,
        duoPrice: item.duoPrice ?? item.duoPerformancePrice ?? 0,
        teamPrice: item.teamPrice ?? item.teamPerformancePrice ?? 0,
        showPricingOnProfile: item.showPricingOnProfile ?? true,
        youtubeLinks: Array.isArray(item.youtubeLinks) ? item.youtubeLinks : [],
      };
    });
  }

  if (Array.isArray(artist?.artsList) && artist.artsList.length > 0) {
    return artist.artsList.map((item: any, idx: number) => {
      const sub = item.artForm || item.category || item.subCategory || item.subcategory || item.name || "Artist";
      const cat = item.mainCategory || item.category || (findHierarchyForSubcategory(sub)?.category) || "General";
      const evt = item.eventType || (findHierarchyForSubcategory(sub)?.eventType) || "General Event";
      return {
        id: item.id || `art-${idx}`,
        event: evt,
        category: cat,
        subcategory: sub,
        artForm: sub,
        soloPrice: item.soloPrice ?? item.soloPerformancePrice ?? 0,
        duoPrice: item.duoPrice ?? item.duoPerformancePrice ?? 0,
        teamPrice: item.teamPrice ?? item.teamPerformancePrice ?? 0,
        showPricingOnProfile: item.showPricingOnProfile ?? true,
        youtubeLinks: Array.isArray(item.youtubeLinks) ? item.youtubeLinks : [],
      };
    });
  }

  // Fallback to legacy single service fields
  const sub = artist?.subCategory || artist?.subcategory || artist?.artForm || artist?.category || "Artist";
  const hierarchy = findHierarchyForSubcategory(sub);
  const cat = artist?.mainCategory || artist?.categoryGroup || artist?.category || hierarchy?.category || "General";
  const evt = artist?.eventType || hierarchy?.eventType || "General Event";

  return [
    {
      id: "service-0",
      event: evt,
      category: cat,
      subcategory: sub,
      artForm: sub,
      soloPrice: artist?.soloPrice ?? 0,
      duoPrice: artist?.duoPrice ?? 0,
      teamPrice: artist?.teamPrice ?? 0,
      showPricingOnProfile: artist?.showPricingOnProfile ?? true,
      youtubeLinks: Array.isArray(artist?.youtubeLinks) ? artist?.youtubeLinks : [],
    },
  ];
}

export function getEventTypes(): string[] {
  return [
    "Varkari Sampraday",
    "Wedding",
    "Birthday",
    "Corporate Event",
    "Cultural Event",
    "Religious Event",
    "College Event",
    "Festival Event",
    "Other Events",
  ];
}

export function getCategoriesForEvent(eventType: string): Array<{ id: string; name: string; icon: string; eventType: string; subcategories: string[] }> {
  const normalized = String(eventType ?? "").trim().toLowerCase();
  for (const [eName, eData] of Object.entries(EVENT_CATEGORY_HIERARCHY)) {
    if (eName.toLowerCase() === normalized) {
      return Object.entries(eData.groups).map(([gName, gData]) => ({
        id: normalizeCategoryKey(gName),
        name: gName,
        icon: gData.icon,
        eventType: eName,
        subcategories: gData.subcategories,
      }));
    }
  }
  return [];
}

export function getSubcategoriesForCategory(eventType: string, categoryName: string): string[] {
  const normalizedEvent = String(eventType ?? "").trim().toLowerCase();
  const normalizedCategory = String(categoryName ?? "").trim().toLowerCase();

  for (const [eName, eData] of Object.entries(EVENT_CATEGORY_HIERARCHY)) {
    if (eName.toLowerCase() === normalizedEvent) {
      for (const [gName, gData] of Object.entries(eData.groups)) {
        if (gName.toLowerCase() === normalizedCategory) {
          return gData.subcategories;
        }
      }
    }
  }
  return [];
}

export function findHierarchyForSubcategory(subCategoryName: string): { eventType: string; category: string; subCategory: string } | null {
  const normalizedSub = String(subCategoryName ?? "").trim().toLowerCase();
  if (!normalizedSub) return null;

  for (const [eName, eData] of Object.entries(EVENT_CATEGORY_HIERARCHY)) {
    for (const [gName, gData] of Object.entries(eData.groups)) {
      for (const sub of gData.subcategories) {
        if (sub.toLowerCase() === normalizedSub) {
          return { eventType: eName, category: gName, subCategory: sub };
        }
      }
    }
  }
  return null;
}

/**
 * Safely extracts all unique city locations for an artist (City-wise).
 */
export function extractArtistLocations(artist: Record<string, any>): string[] {
  if (!artist) return [];
  const set = new Set<string>();

  const add = (val: unknown) => {
    if (!val) return;
    if (typeof val === "string") {
      val.split(/[,/]/).forEach((item) => {
        const cleaned = item.trim();
        const lower = cleaned.toLowerCase();
        // Ignore generic state/country names so filter remains strictly City-wise
        if (
          cleaned &&
          cleaned.length > 1 &&
          lower !== "maharashtra" &&
          lower !== "india" &&
          lower !== "mh"
        ) {
          set.add(cleaned);
        }
      });
    } else if (Array.isArray(val)) {
      val.forEach(add);
    }
  };

  add(artist.city);
  add(artist.location);
  add(artist.serviceLocations);
  add(artist.serviceCities);
  add(artist.availableCities);
  add(artist.cities);
  if (artist.artistProfile) {
    add(artist.artistProfile.city);
    add(artist.artistProfile.location);
    add(artist.artistProfile.serviceLocations);
    add(artist.artistProfile.serviceCities);
  }
  if (Array.isArray(artist.services)) {
    artist.services.forEach((s: any) => {
      add(s.location);
      add(s.city);
      add(s.cities);
    });
  }

  return Array.from(set);
}

/**
 * Evaluates whether an artist matches a selected city filter.
 */
export function matchesArtistCity(artist: Record<string, any>, selectedCity: string): boolean {
  if (!selectedCity || selectedCity === "All Cities" || selectedCity === "All" || selectedCity === "all") {
    return true;
  }
  const target = selectedCity.trim().toLowerCase();
  
  // 1. Direct substring match on raw location string (e.g. location: "Sangli, Maharashtra" contains "sangli")
  const rawLoc = String(artist?.location || artist?.city || artist?.artistProfile?.location || "").toLowerCase();
  if (rawLoc && rawLoc.includes(target)) {
    return true;
  }

  // 2. Extracted location tokens match
  const locations = extractArtistLocations(artist);
  if (locations.length === 0 && !rawLoc) {
    return true; // Fallback: include artists with unassigned location
  }

  return locations.some((loc) => {
    const lLower = loc.toLowerCase();
    return lLower.includes(target) || target.includes(lLower);
  });
}


