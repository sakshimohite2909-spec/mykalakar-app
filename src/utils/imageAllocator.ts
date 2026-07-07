import {
  allocateImage,
  getImageUsageDebug,
  resetGlobalImageAllocator,
  validateUniqueImages,
} from "@/utils/globalImageAllocator";

export function getUniqueImage(category = "fallback", usageId = "usage:default", preferredUrl?: string | null) {
  return allocateImage({
    category,
    context: usageId,
    entityId: usageId,
    preferredUrl,
  }).url;
}

export function resetImageAllocator() {
  resetGlobalImageAllocator();
}

export { getImageUsageDebug, validateUniqueImages };
