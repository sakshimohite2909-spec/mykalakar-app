/**
 * Image Registry Configuration
 * Based on the project asset catalog.
 * Categorized for deterministic visual orchestration.
 */

export const IMAGE_REGISTRY = {
  ARTISTS: Array.from({ length: 26 }, (_, i) => `/assets/catalog/artist-${String(i + 1).padStart(2, '0')}.webp`),
  
  EVENTS: [
    ...Array.from({ length: 14 }, (_, i) => `/assets/catalog/event-${String(i + 1).padStart(2, '0')}.webp`),
    "/assets/static/events-banner.webp"
  ],
  
  FOLK: [
    "/cultural/dhol-pathak-performer.png",
    "/cultural/dhol-close-dust.png",
    "/assets/curated/dhol-passion.jpg",
    "/assets/static/hero-dhol.webp"
  ],
  
  SPIRITUAL: [
    "/cultural/varkari-vocalist.png",
    "/cultural/varkari-tanpura.png",
    "/cultural/zanj-temple.png",
    "/assets/static/hero-kirtan.webp",
    "/assets/static/hero-zanj.webp"
  ],
  
  CLASSICAL: [
    "/cultural/tabla-motion.png",
    "/assets/curated/tabla-hands.jpg",
    "/assets/curated/tanpura-singer-1.jpg",
    "/assets/curated/tanpura-singer-2.jpg",
    "/assets/static/hero-tabla.webp"
  ],
  
  UI: [
    ...Array.from({ length: 4 }, (_, i) => `/assets/catalog/hero-${String(i + 1).padStart(2, '0')}.webp`),
    ...Array.from({ length: 4 }, (_, i) => `/assets/catalog/ui-${String(i + 1).padStart(2, '0')}.webp`),
    "/assets/static/fallback-image.webp",
    "/assets/static/profile-cover.webp"
  ]
} as const;

export const FALLBACK_IMAGE = "/assets/static/fallback-image.webp";

export const CATEGORY_IMAGE_MAP: Record<string, string> = {
  // --- FOLK ART & TRADITIONAL ---
  "Folk Art": "https://images.unsplash.com/photo-1604028591871-33230a1c1d43?auto=format&fit=crop&w=800&q=80",
  "Gondhal": "https://images.unsplash.com/photo-1589319623668-3f59190c1054?auto=format&fit=crop&w=800&q=80",
  "Jagran": "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&w=800&q=80",
  "Bharud": "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=800&q=80",
  "Shahiri & Powada": "https://images.unsplash.com/photo-1533147670608-2a2f9776d3ac?auto=format&fit=crop&w=800&q=80",
  "Lezim Pathak": "https://images.unsplash.com/photo-1564507004663-b6dfb3c824d5?auto=format&fit=crop&w=800&q=80",
  "Zanj Pathak": "https://images.unsplash.com/photo-1533558701576-23c65e0272fb?auto=format&fit=crop&w=800&q=80",
  "Dhol Pathak": "https://images.unsplash.com/photo-1622397333309-3056849bc70b?auto=format&fit=crop&w=800&q=80",
  "Waghya Murali": "https://images.unsplash.com/photo-1582046860086-1d120a2f1de9?auto=format&fit=crop&w=800&q=80",
  "Jalsa & Dashavatar": "https://images.unsplash.com/photo-1610058197148-e87a20c788df?auto=format&fit=crop&w=800&q=80",
  "Dhagaai & Dholki": "https://images.unsplash.com/photo-1580974582391-a6649c81a85f?auto=format&fit=crop&w=800&q=80",
  "Bahurupiya": "https://images.unsplash.com/photo-1598007270830-4e1c272eb98b?auto=format&fit=crop&w=800&q=80",

  // --- SPIRITUAL & DEVOTIONAL ---
  "Kirtankar": "https://images.unsplash.com/photo-1605333146030-8a1921f64fcc?auto=format&fit=crop&w=800&q=80",
  "Pravachankar": "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=800&q=80",
  "Vyaspeeth Chalak": "https://images.unsplash.com/photo-1555696958-c5049b866f6f?auto=format&fit=crop&w=800&q=80",
  "Chiplya Player": "https://images.unsplash.com/photo-1604028637785-5b4ff7e1d51a?auto=format&fit=crop&w=800&q=80",
  "Gayak": "https://images.unsplash.com/photo-1516280440502-61f2677d24dc?auto=format&fit=crop&w=800&q=80",
  "Mrudungmani": "https://images.unsplash.com/photo-1550686940-5e589cce080b?auto=format&fit=crop&w=800&q=80",
  "Bharudkar": "https://images.unsplash.com/photo-1583260799863-71aeb3c4f923?auto=format&fit=crop&w=800&q=80",
  "Veenekari": "https://images.unsplash.com/photo-1590480931295-8e998a49c6d8?auto=format&fit=crop&w=800&q=80",
  "Taal Kari": "https://images.unsplash.com/photo-1584598173971-b7cc2b0a5ff3?auto=format&fit=crop&w=800&q=80",
  "Varkari Sanstha": "https://images.unsplash.com/photo-1518302057166-af34eb78bc8a?auto=format&fit=crop&w=800&q=80",
  "Bhajani Mandal": "https://images.unsplash.com/photo-1502660142270-b75fbcbc0214?auto=format&fit=crop&w=800&q=80",
  "Shastriya Bhajan": "https://images.unsplash.com/photo-1605333146030-8a1921f64fcc?auto=format&fit=crop&w=800&q=80",

  // --- INSTRUMENTS & STAGE ---
  "Tabla Vadak": "https://images.unsplash.com/photo-1605333146030-8a1921f64fcc?auto=format&fit=crop&w=800&q=80",
  "Harmonium Vadak": "https://images.unsplash.com/photo-1594955743452-f1d24a91a92e?auto=format&fit=crop&w=800&q=80",
  "Dholki Vadak": "https://images.unsplash.com/photo-1580974582391-a6649c81a85f?auto=format&fit=crop&w=800&q=80",
  "Sound System": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
  "Mandap & Decoration": "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80",

  // --- ENTERTAINMENT & MODERN ---
  "Karaoke Singers": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80",
  "Orchestra": "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80",
  "Magicians": "https://images.unsplash.com/photo-1515250499692-7104b2a4c28f?auto=format&fit=crop&w=800&q=80",
  "Puppet Show": "https://images.unsplash.com/photo-1583642340620-7f5be248c894?auto=format&fit=crop&w=800&q=80",
  "DJs": "https://images.unsplash.com/photo-1516873240891-4bf014598ab4?auto=format&fit=crop&w=800&q=80",
  "Anchors / Hosts": "https://images.unsplash.com/photo-1560439514-4e9645039924?auto=format&fit=crop&w=800&q=80",
  "Motivational Speakers": "https://images.unsplash.com/photo-1475721025505-111ec01c7fb3?auto=format&fit=crop&w=800&q=80",
  "Actors": "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=800&q=80",
  "Singers": "https://images.unsplash.com/photo-1520872024865-3ff2805d8bb3?auto=format&fit=crop&w=800&q=80",

  // --- EVENT TYPES ---
  "Birthday": "https://images.unsplash.com/photo-1530103862676-de3c9de59a9e?auto=format&fit=crop&w=800&q=80",
  "Marriage": "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80"
};

/**
 * Ensures no cross-category duplication as per strict orchestration rules.
 */
export function assertNoImageDuplication() {
  const allImages = Object.values(IMAGE_REGISTRY).flat();
  const uniqueImages = new Set(allImages);
  if (allImages.length !== uniqueImages.size) {
    console.warn("Asset Orchestration Warning: Duplicate images detected across registry categories.");
  }
}
