import { imageRegistry } from "@/services/ImageRegistryService";

/**
 * Compatibility layer for the legacy getContextualImage.
 * Now routes to the high-performance ImageRegistryService.
 */
export function getContextualImage(text: string, id: string = "demo", index: number = 0) {
  // Map text to category for the registry
  const t = text.toLowerCase();
  let category = "Default";
  
  if (t.includes('birthday')) category = "Performers"; 
  else if (t.includes('wedding') || t.includes('marriage')) category = "Event Services";
  else if (t.includes('corporate') || t.includes('office') || t.includes('business')) category = "Performers";
  else if (t.includes('music') || t.includes('singer') || t.includes('band') || t.includes('dj')) category = "Performers";
  else if (t.includes('actor') || t.includes('theatre') || t.includes('drama')) category = "Performers";
  else if (t.includes('magic') || t.includes('puppet')) category = "Performers";
  else if (t.includes('makeup') || t.includes('mehndi')) category = "Event Services";
  else if (t.includes('dhol') || t.includes('zanj') || t.includes('varkari') || t.includes('kirtan') || t.includes('tabla')) category = "Folk & Traditional Arts";

  return imageRegistry.getStableImage(`${id}-${index}`, { category, tags: [text], type: "dynamic" });
}

// Re-export registry for direct access
export { imageRegistry };
