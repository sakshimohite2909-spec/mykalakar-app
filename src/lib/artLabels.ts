import { normalizeCategoryKey } from "@/constants/artistSystem";

const ART_LABEL_KEYS: Record<string, string> = {
  "dhol pathak": "artLabel.dholPathak",
  "zanj pathak": "artLabel.zanjPathak",
  "zanz pathak": "artLabel.zanjPathak",
  varkari: "artLabel.varkari",
  gondhal: "artLabel.gondhal",
  jagran: "artLabel.jagran",
  bharud: "artLabel.bharud",
  kirtankar: "artLabel.kirtankar",
  lavani: "artLabel.lavani",
  "folk dance": "artLabel.folkDance",
  "traditional musicians": "artLabel.traditionalMusicians",
  singer: "artLabel.singer",
  musician: "artLabel.musician",
  dancer: "artLabel.dancer",
  anchor: "artLabel.anchor",
  actor: "artLabel.actor",
  dj: "artLabel.dj",
  "music artists": "artLabel.musicArtists",
  "dance artists": "artLabel.danceArtists",
  "stage and entertainment": "artLabel.stageEntertainment",
  "creative artists": "artLabel.creativeArtists",
  "folk art": "artLabel.folkArt",
  "event artists": "artLabel.eventArtists",
};

export function getArtLabel(t: (key: string) => string, value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const key = ART_LABEL_KEYS[normalizeCategoryKey(raw)];
  return key ? t(key) : raw;
}
