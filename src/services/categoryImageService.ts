import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, getDocs } from "firebase/firestore";

// Local storage key for custom category configurations
export const LOCAL_CUSTOM_CATS_KEY = "mykalakar_custom_categories";

// Fallback circular images for system categories
export const DEFAULT_CATEGORY_CIRCULAR_IMAGES: Record<string, string> = {
  // ─── VARKARI & SPIRITUAL ───
  "spiritual speakers": "/cultural/varkari-vocalist.png",
  "vocal artists": "/assets/curated/tanpura-singer-1.jpg",
  "instrumental artists": "/assets/curated/tabla-hands.jpg",
  "organizations": "/cultural/zanj-temple.png",
  "warkari sanstha": "/cultural/zanj-temple.png",
  "event services": "/assets/static/category-event-services.webp",
  "pooja pandits": "https://images.unsplash.com/photo-1608613304899-ea8098577e38?auto=format&fit=crop&w=400&q=80",
  "pandit / priest": "https://images.unsplash.com/photo-1608613304899-ea8098577e38?auto=format&fit=crop&w=400&q=80",

  // ─── WEDDING & RECEPTION ───
  "venues": "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=400&q=80",
  "marriage hall": "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=400&q=80",
  "banquet hall": "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=400&q=80",
  "bridal & groom services": "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=400&q=80",
  "bridal makeup": "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=400&q=80",
  "photography & videography": "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=400&q=80",
  "photography": "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=400&q=80",
  "entertainment": "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=400&q=80",
  "catering": "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=400&q=80",
  "catering & hospitality": "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=400&q=80",
  "decoration": "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80",
  "decor & setup": "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80",
  "event setup": "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=400&q=80",
  "transportation": "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=400&q=80",
  "wedding essentials": "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=400&q=80",
  "shopping": "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80",
  "invitations & gifts": "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=400&q=80",

  // ─── FOLK, CULTURAL & FESTIVALS ───
  "folk artists": "/assets/curated/dhol-passion.jpg",
  "traditional dance": "/cultural/dhol-pathak-performer.png",
  "dhol tasha": "/assets/curated/dhol-passion.jpg",
  "dhol-tasha pathak": "/assets/curated/dhol-passion.jpg",
  "anchors & hosts": "https://images.unsplash.com/photo-1560439514-4e9645039924?auto=format&fit=crop&w=400&q=80",
  "anchors / hosts": "https://images.unsplash.com/photo-1560439514-4e9645039924?auto=format&fit=crop&w=400&q=80",
  "magicians": "https://images.unsplash.com/photo-1515250499692-7104b2a4c28f?auto=format&fit=crop&w=400&q=80",
  "djs": "https://images.unsplash.com/photo-1516873240891-4bf014598ab4?auto=format&fit=crop&w=400&q=80",
  "live bands": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80",
  "balloon decorators": "https://images.unsplash.com/photo-1530103862676-de88924083a2?auto=format&fit=crop&w=400&q=80",
};

// In-memory cache for dynamic category images
let dynamicCategoryImagesCache: Record<string, string> = {};

export function getCustomCategoriesLocal(): any[] {
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOM_CATS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomCategoriesLocal(items: any[]) {
  try {
    localStorage.setItem(LOCAL_CUSTOM_CATS_KEY, JSON.stringify(items));
    // Update memory cache
    items.forEach((item: any) => {
      const img = item.image || item.imageUrl;
      if (item.name && img) {
        dynamicCategoryImagesCache[item.name.toLowerCase().trim()] = img;
      }
    });
  } catch (err) {
    console.error("Save local custom categories failed:", err);
  }
}

/**
 * Initializes and syncs category images from local storage and Firestore in background.
 */
export function initCategoryImageSync() {
  // 1. Prime from localStorage
  const local = getCustomCategoriesLocal();
  local.forEach((item: any) => {
    const img = item.image || item.imageUrl;
    if (item.name && img) {
      dynamicCategoryImagesCache[item.name.toLowerCase().trim()] = img;
    }
  });

  // 2. Subscribe to Firestore categories collection
  try {
    const q = collection(db, "categories");
    onSnapshot(q, (snapshot) => {
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const img = data.image || data.imageUrl;
        if (data.name && img) {
          dynamicCategoryImagesCache[data.name.toLowerCase().trim()] = img;
        }
      });
    }, (err) => {
      console.warn("Category image sync subscription fallback:", err);
    });
  } catch (e) {
    console.warn("Init category image sync error:", e);
  }
}

// Auto-run initialization in browser environment
if (typeof window !== "undefined") {
  initCategoryImageSync();
}

/**
 * Resolves the circle category image dynamically:
 * 1. Explicitly passed image (if valid URL or path)
 * 2. Admin custom uploaded / configured image in Firestore or LocalStorage
 * 3. Exact match from default images map
 * 4. Fuzzy match from default images map
 * 5. General fallback stock image
 */
export function getCategoryCircleImage(catName: string, existingImg?: string): string {
  if (existingImg && (existingImg.startsWith("/") || existingImg.startsWith("http") || existingImg.startsWith("data:image/"))) {
    return existingImg;
  }

  const rawKey = String(catName || "").toLowerCase().trim();
  const norm = rawKey.replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();

  // Check dynamic memory cache (from Admin updates)
  if (dynamicCategoryImagesCache[rawKey]) {
    return dynamicCategoryImagesCache[rawKey];
  }
  if (dynamicCategoryImagesCache[norm]) {
    return dynamicCategoryImagesCache[norm];
  }

  // Check localStorage if not in cache
  const local = getCustomCategoriesLocal();
  const foundInLocal = local.find(
    (c: any) =>
      c.name?.toLowerCase().trim() === rawKey ||
      c.name?.toLowerCase().trim() === norm
  );
  if (foundInLocal && (foundInLocal.image || foundInLocal.imageUrl)) {
    const img = foundInLocal.image || foundInLocal.imageUrl;
    dynamicCategoryImagesCache[rawKey] = img;
    return img;
  }

  // Direct exact match in defaults
  if (DEFAULT_CATEGORY_CIRCULAR_IMAGES[rawKey]) return DEFAULT_CATEGORY_CIRCULAR_IMAGES[rawKey];
  if (DEFAULT_CATEGORY_CIRCULAR_IMAGES[norm]) return DEFAULT_CATEGORY_CIRCULAR_IMAGES[norm];

  // Fuzzy match in defaults
  const match = Object.entries(DEFAULT_CATEGORY_CIRCULAR_IMAGES).find(([k]) => {
    const kNorm = k.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
    return norm.includes(kNorm) || kNorm.includes(norm);
  });
  if (match) return match[1];

  return "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=400&q=80";
}
