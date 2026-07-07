export type CuratedVisualCategory = "singer" | "dj" | "mandal" | "event" | "general";
export type CuratedVisualOrientation = "landscape" | "portrait";

export type CuratedVisual = {
  id: string;
  sourceId: string;
  category: CuratedVisualCategory;
  orientation: CuratedVisualOrientation;
  tags: string[];
};

type ImageSize = {
  width: number;
  height: number;
};

export function pexelsImage(sourceId: string, size: ImageSize = { width: 1200, height: 900 }) {
  return `https://images.pexels.com/photos/${sourceId}/pexels-photo-${sourceId}.jpeg?auto=compress&cs=tinysrgb&w=${size.width}&h=${size.height}&fit=crop&dpr=1`;
}

export const CURATED_VISUALS: CuratedVisual[] = [
  { id: "classical-stage-vocalist", sourceId: "37260262", category: "singer", orientation: "landscape", tags: ["classical", "vocalist", "stage", "artist"] },
  { id: "folk-dance-procession", sourceId: "34193177", category: "mandal", orientation: "landscape", tags: ["folk", "dance", "festival", "culture"] },
  { id: "pune-dhol-performance", sourceId: "28493510", category: "mandal", orientation: "landscape", tags: ["dhol", "pathak", "festival", "maharashtra"] },
  { id: "dandiya-event-night", sourceId: "17264037", category: "mandal", orientation: "landscape", tags: ["dandiya", "folk", "event", "dance"] },
  { id: "concert-crowd-lights", sourceId: "31853515", category: "event", orientation: "landscape", tags: ["concert", "event", "lights", "audience"] },
  { id: "festival-audience-stage", sourceId: "19762492", category: "event", orientation: "landscape", tags: ["festival", "stage", "crowd", "music"] },
  { id: "band-stage-performance", sourceId: "8942888", category: "event", orientation: "landscape", tags: ["band", "music", "stage", "performance"] },
  { id: "drummer-stage-energy", sourceId: "35367450", category: "mandal", orientation: "landscape", tags: ["drum", "rhythm", "stage", "artist"] },
  { id: "indian-wedding-ceremony", sourceId: "30215313", category: "event", orientation: "landscape", tags: ["wedding", "ceremony", "event", "ritual"] },
  { id: "wedding-couple-heritage", sourceId: "19780151", category: "event", orientation: "portrait", tags: ["wedding", "photography", "event", "portrait"] },
  { id: "outdoor-wedding-event", sourceId: "30394998", category: "event", orientation: "landscape", tags: ["wedding", "decor", "mandap", "celebration"] },
  { id: "bridal-makeup-artist", sourceId: "33986816", category: "event", orientation: "portrait", tags: ["makeup", "bridal", "artist", "service"] },
  { id: "mehndi-artist-hands", sourceId: "13713418", category: "event", orientation: "portrait", tags: ["mehndi", "hands", "wedding", "artist"] },
  { id: "bridal-mehndi-detail", sourceId: "32500103", category: "event", orientation: "portrait", tags: ["mehndi", "bridal", "detail", "service"] },
  { id: "henna-event-prep", sourceId: "32029488", category: "event", orientation: "portrait", tags: ["henna", "mehndi", "celebration", "wedding"] },
  { id: "event-videographer", sourceId: "32538906", category: "event", orientation: "landscape", tags: ["videography", "camera", "event", "coverage"] },
  { id: "camera-production-set", sourceId: "30620518", category: "event", orientation: "landscape", tags: ["camera", "production", "media", "service"] },
  { id: "microphone-vocalist", sourceId: "164821", category: "singer", orientation: "landscape", tags: ["microphone", "singer", "performance", "stage"] },
  { id: "stage-guitarist", sourceId: "167636", category: "singer", orientation: "landscape", tags: ["guitar", "musician", "performer", "stage"] },
  { id: "dj-console-night", sourceId: "2111015", category: "dj", orientation: "landscape", tags: ["dj", "console", "party", "music"] },
  { id: "dj-lights-crowd", sourceId: "2034851", category: "dj", orientation: "landscape", tags: ["dj", "lights", "event", "dance"] },
  { id: "host-mic-stage", sourceId: "2774556", category: "general", orientation: "landscape", tags: ["host", "anchor", "stage", "speaker"] },
  { id: "speaker-event-stage", sourceId: "1181396", category: "general", orientation: "landscape", tags: ["speaker", "conference", "stage", "event"] },
  { id: "theatre-spotlight", sourceId: "36826274", category: "general", orientation: "landscape", tags: ["theatre", "stage", "performer", "spotlight"] },
  { id: "camera-operator-event", sourceId: "274937", category: "event", orientation: "landscape", tags: ["photography", "camera", "event", "service"] },
  { id: "celebration-stage-lights", sourceId: "1190297", category: "event", orientation: "landscape", tags: ["celebration", "lights", "event", "party"] },
  { id: "live-music-singer", sourceId: "1763075", category: "singer", orientation: "landscape", tags: ["live", "music", "singer", "concert"] },
  { id: "concert-hall-performance", sourceId: "1105666", category: "event", orientation: "landscape", tags: ["concert", "performance", "audience", "stage"] },
  { id: "artist-painting-studio", sourceId: "1266808", category: "general", orientation: "landscape", tags: ["artist", "painting", "arts", "creative"] },
  { id: "cultural-street-event", sourceId: "2263436", category: "mandal", orientation: "landscape", tags: ["culture", "street", "festival", "event"] },
];

const HERO_SIZE = { width: 1440, height: 900 };
const CARD_LANDSCAPE = { width: 900, height: 640 };
const CARD_PORTRAIT = { width: 760, height: 960 };
const THUMB_LANDSCAPE = { width: 720, height: 520 };
const WIDE_BANNER = { width: 1280, height: 720 };

function urlFor(id: string, size: ImageSize) {
  const visual = CURATED_VISUALS.find((item) => item.id === id);
  return pexelsImage(visual?.sourceId || CURATED_VISUALS[0].sourceId, size);
}

export const CURATED_IMAGE_CATALOG = {
  hero: [
    urlFor("pune-dhol-performance", HERO_SIZE),
    urlFor("classical-stage-vocalist", HERO_SIZE),
    urlFor("folk-dance-procession", HERO_SIZE),
    urlFor("concert-crowd-lights", HERO_SIZE),
  ],
  categories: [
    urlFor("live-music-singer", CARD_LANDSCAPE),
    urlFor("camera-operator-event", CARD_LANDSCAPE),
    urlFor("folk-dance-procession", CARD_LANDSCAPE),
    urlFor("classical-stage-vocalist", CARD_LANDSCAPE),
    urlFor("theatre-spotlight", CARD_LANDSCAPE),
    urlFor("event-videographer", CARD_LANDSCAPE),
    urlFor("pune-dhol-performance", CARD_LANDSCAPE),
    urlFor("dandiya-event-night", CARD_LANDSCAPE),
    urlFor("outdoor-wedding-event", CARD_LANDSCAPE),
    urlFor("cultural-street-event", CARD_LANDSCAPE),
  ],
  artists: [
    urlFor("microphone-vocalist", CARD_PORTRAIT),
    urlFor("stage-guitarist", CARD_PORTRAIT),
    urlFor("theatre-spotlight", CARD_PORTRAIT),
    urlFor("artist-painting-studio", CARD_PORTRAIT),
    urlFor("dj-console-night", CARD_PORTRAIT),
    urlFor("host-mic-stage", CARD_PORTRAIT),
    urlFor("speaker-event-stage", CARD_PORTRAIT),
    urlFor("concert-hall-performance", CARD_PORTRAIT),
    urlFor("classical-stage-vocalist", CARD_PORTRAIT),
    urlFor("camera-operator-event", CARD_PORTRAIT),
    urlFor("event-videographer", CARD_PORTRAIT),
    urlFor("bridal-makeup-artist", CARD_PORTRAIT),
    urlFor("mehndi-artist-hands", CARD_PORTRAIT),
    urlFor("folk-dance-procession", CARD_PORTRAIT),
    urlFor("cultural-street-event", CARD_PORTRAIT),
    urlFor("dandiya-event-night", CARD_PORTRAIT),
    urlFor("pune-dhol-performance", CARD_PORTRAIT),
    urlFor("drummer-stage-energy", CARD_PORTRAIT),
    urlFor("celebration-stage-lights", CARD_PORTRAIT),
    urlFor("band-stage-performance", CARD_PORTRAIT),
    urlFor("classical-stage-vocalist", THUMB_LANDSCAPE),
    urlFor("speaker-event-stage", THUMB_LANDSCAPE),
    urlFor("live-music-singer", THUMB_LANDSCAPE),
    urlFor("drummer-stage-energy", THUMB_LANDSCAPE),
    urlFor("stage-guitarist", THUMB_LANDSCAPE),
    urlFor("concert-crowd-lights", THUMB_LANDSCAPE),
  ],
  events: [
    urlFor("indian-wedding-ceremony", CARD_LANDSCAPE),
    urlFor("theatre-spotlight", CARD_LANDSCAPE),
    urlFor("speaker-event-stage", CARD_LANDSCAPE),
    urlFor("folk-dance-procession", CARD_LANDSCAPE),
    urlFor("classical-stage-vocalist", CARD_LANDSCAPE),
    urlFor("dandiya-event-night", CARD_LANDSCAPE),
    urlFor("band-stage-performance", CARD_LANDSCAPE),
    urlFor("bridal-mehndi-detail", CARD_LANDSCAPE),
    urlFor("pune-dhol-performance", CARD_LANDSCAPE),
    urlFor("cultural-street-event", CARD_LANDSCAPE),
    urlFor("event-videographer", CARD_LANDSCAPE),
    urlFor("host-mic-stage", CARD_LANDSCAPE),
    urlFor("concert-hall-performance", CARD_LANDSCAPE),
    urlFor("drummer-stage-energy", CARD_LANDSCAPE),
  ],
  ui: [
    urlFor("artist-painting-studio", THUMB_LANDSCAPE),
    urlFor("classical-stage-vocalist", CARD_PORTRAIT),
    urlFor("camera-production-set", THUMB_LANDSCAPE),
    urlFor("celebration-stage-lights", THUMB_LANDSCAPE),
  ],
} as const;

export const CURATED_STATIC_IMAGES = {
  heroDhol: urlFor("pune-dhol-performance", HERO_SIZE),
  heroKirtan: urlFor("classical-stage-vocalist", HERO_SIZE),
  heroTabla: urlFor("drummer-stage-energy", HERO_SIZE),
  heroZanj: urlFor("folk-dance-procession", HERO_SIZE),
  profileCover: urlFor("artist-painting-studio", WIDE_BANNER),
  eventsBanner: urlFor("concert-crowd-lights", WIDE_BANNER),
  fallback: urlFor("artist-painting-studio", THUMB_LANDSCAPE),
  uiFallback: urlFor("camera-production-set", THUMB_LANDSCAPE),
  avatar: urlFor("classical-stage-vocalist", CARD_PORTRAIT),
  categories: {
    Performers: urlFor("live-music-singer", CARD_LANDSCAPE),
    "Event Services": urlFor("event-videographer", CARD_LANDSCAPE),
    "Folk & Traditional Arts": urlFor("folk-dance-procession", CARD_LANDSCAPE),
    "Spiritual & Varkari Sampraday": urlFor("classical-stage-vocalist", CARD_LANDSCAPE),
  },
} as const;

const POOL_VARIANTS = [
  { suffix: "landscape-a", size: { width: 900, height: 620 }, orientation: "landscape" as const },
  { suffix: "landscape-b", size: { width: 1100, height: 780 }, orientation: "landscape" as const },
  { suffix: "portrait-a", size: { width: 760, height: 960 }, orientation: "portrait" as const },
  { suffix: "portrait-b", size: { width: 860, height: 1080 }, orientation: "portrait" as const },
];

export const CURATED_IMAGE_POOL = CURATED_VISUALS.flatMap((visual) =>
  POOL_VARIANTS.map((variant) => ({
    id: `${visual.id}-${variant.suffix}`,
    url: pexelsImage(visual.sourceId, variant.size),
    category: visual.category,
    orientation: variant.orientation,
    tags: [...visual.tags, visual.category, "curated", "pexels"],
  })),
);
