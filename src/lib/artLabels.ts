import { normalizeCategoryKey } from "@/constants/artistSystem";

const ART_LABEL_KEYS: Record<string, string> = {
  performers: "artLabel.performers", // ADDED FOR i18n
  "event-services": "artLabel.eventServices", // ADDED FOR i18n
  "folk-and-traditional-arts": "artLabel.folkTraditionalArts", // ADDED FOR i18n
  "spiritual-and-varkari-sampraday": "artLabel.spiritualVarkari", // ADDED FOR i18n
  "karaoke-singers": "artLabel.karaokeSingers", // ADDED FOR i18n
  orchestra: "artLabel.orchestra", // ADDED FOR i18n
  magicians: "artLabel.magicians", // ADDED FOR i18n
  "puppet-show": "artLabel.puppetShow", // ADDED FOR i18n
  djs: "artLabel.djs", // ADDED FOR i18n
  "anchors-hosts": "artLabel.anchorsHosts", // ADDED FOR i18n
  "motivational-speakers": "artLabel.motivationalSpeakers", // ADDED FOR i18n
  actors: "artLabel.actors", // ADDED FOR i18n
  singers: "artLabel.singers", // ADDED FOR i18n
  photography: "artLabel.photography", // ADDED FOR i18n
  videography: "artLabel.videography", // ADDED FOR i18n
  "makeup-artists": "artLabel.makeupArtists", // ADDED FOR i18n
  "mehndi-artists": "artLabel.mehndiArtists", // ADDED FOR i18n
  "dhol pathak": "artLabel.dholPathak",
  "dhol-pathak": "artLabel.dholPathak", // ADDED FOR i18n
  "zanj pathak": "artLabel.zanjPathak",
  "zanj-pathak": "artLabel.zanjPathak", // ADDED FOR i18n
  "zanz pathak": "artLabel.zanjPathak",
  varkari: "artLabel.varkari",
  gondhal: "artLabel.gondhal",
  jagran: "artLabel.jagran",
  bharud: "artLabel.bharud",
  "shahiri-and-powada": "artLabel.shahiriPowada", // ADDED FOR i18n
  "lezim-pathak": "artLabel.lezimPathak", // ADDED FOR i18n
  "waghya-murali": "artLabel.waghyaMurali", // ADDED FOR i18n
  "jalsa-and-dashavatar": "artLabel.jalsaDashavatar", // ADDED FOR i18n
  "dhagaai-and-dholki": "artLabel.dhagaaiDholki", // ADDED FOR i18n
  bahurupiya: "artLabel.bahurupiya", // ADDED FOR i18n
  kirtankar: "artLabel.kirtankar",
  pravachankar: "artLabel.pravachankar", // ADDED FOR i18n
  "vyaspeeth-chalak": "artLabel.vyaspeethChalak", // ADDED FOR i18n
  "chiplya-player": "artLabel.chiplyaPlayer", // ADDED FOR i18n
  gayak: "artLabel.gayak", // ADDED FOR i18n
  mrudungmani: "artLabel.mrudungmani", // ADDED FOR i18n
  bharudkar: "artLabel.bharudkar", // ADDED FOR i18n
  "sound-system": "artLabel.soundSystem", // ADDED FOR i18n
  "mandap-and-decoration": "artLabel.mandapDecoration", // ADDED FOR i18n
  veenekari: "artLabel.veenekari", // ADDED FOR i18n
  "taal-kari": "artLabel.taalKari", // ADDED FOR i18n
  "varkari-sanstha": "artLabel.varkariSanstha", // ADDED FOR i18n
  "bhajani-mandal": "artLabel.bhajaniMandal", // ADDED FOR i18n
  "shastriya-bhajan": "artLabel.shastriyaBhajan", // ADDED FOR i18n
  "tabla-vadak": "artLabel.tablaVadak", // ADDED FOR i18n
  "harmonium-vadak": "artLabel.harmoniumVadak", // ADDED FOR i18n
  "dholki-vadak": "artLabel.dholkiVadak", // ADDED FOR i18n
  lavani: "artLabel.lavani",
  "folk dance": "artLabel.folkDance",
  "folk-dance": "artLabel.folkDance", // ADDED FOR i18n
  "traditional musicians": "artLabel.traditionalMusicians",
  "traditional-musicians": "artLabel.traditionalMusicians", // ADDED FOR i18n
  singer: "artLabel.singer",
  musician: "artLabel.musician",
  dancer: "artLabel.dancer",
  anchor: "artLabel.anchor",
  actor: "artLabel.actor",
  dj: "artLabel.dj",
  "music artists": "artLabel.musicArtists",
  "music-artists": "artLabel.musicArtists", // ADDED FOR i18n
  "dance artists": "artLabel.danceArtists",
  "dance-artists": "artLabel.danceArtists", // ADDED FOR i18n
  "stage and entertainment": "artLabel.stageEntertainment",
  "stage-and-entertainment": "artLabel.stageEntertainment", // ADDED FOR i18n
  "creative artists": "artLabel.creativeArtists",
  "creative-artists": "artLabel.creativeArtists", // ADDED FOR i18n
  "folk art": "artLabel.folkArt",
  "folk-art": "artLabel.folkArt", // ADDED FOR i18n
  "event artists": "artLabel.eventArtists",
  "event-artists": "artLabel.eventArtists", // ADDED FOR i18n
  marriage: "eventType.marriage.name", // ADDED FOR i18n
  wedding: "eventType.marriage.name", // ADDED FOR i18n
  birthday: "eventType.birthday.name", // ADDED FOR i18n
  "birthday-party": "eventType.birthday.name", // ADDED FOR i18n
  corporate: "eventType.corporate.name", // ADDED FOR i18n
  "corporate-event": "eventType.corporate.name", // ADDED FOR i18n
  festival: "eventType.festival.name", // ADDED FOR i18n
  "festival-celebration": "eventType.festival.name", // ADDED FOR i18n
  spiritual: "eventType.spiritual.name", // ADDED FOR i18n
  "spiritual-event": "eventType.spiritual.name", // ADDED FOR i18n
};

export function getArtLabel(t: (key: string) => string, value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const key = ART_LABEL_KEYS[normalizeCategoryKey(raw)] ?? ART_LABEL_KEYS[raw.toLowerCase()]; // ADDED FOR i18n
  return key ? t(key) : raw;
}
