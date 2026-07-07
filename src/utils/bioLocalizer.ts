import { getArtLabel } from "@/lib/artLabels";

export function getLocalizedBio(
  bioStr: string,
  subCategory: string,
  location: string,
  t: (k: string, options?: any) => string
): string {
  const artTypeLabel = getArtLabel(t, subCategory);

  if (!bioStr) {
    return t("artist.defaultBioWithLocation", { artType: artTypeLabel, location });
  }

  const lowerBio = bioStr.toLowerCase();
  
  // 1. Check if it is the default generated bio: "Professional [Subcategory] available for curated events."
  const fallbackRegex = /^Professional\s+(.*?)\s+available\s+for\s+curated\s+events\.?$/i;
  const match = fallbackRegex.exec(bioStr);
  if (match) {
    const matchedArt = match[1];
    const localizedArt = getArtLabel(t, matchedArt);
    return t("artist.defaultBioWithLocation", { artType: localizedArt, location });
  }

  // 2. Check for known demo descriptions in English and translate them
  if (lowerBio.includes("traditional cultural performance group showcasing art, energy")) {
    return t("artist.demoBio.traditionalGroup");
  }
  if (lowerBio.includes("kirtankar at varkari sampraday")) {
    return t("artist.demoBio.kirtankarVarkari");
  }

  // 3. Fallback to original bio from database
  return bioStr;
}
