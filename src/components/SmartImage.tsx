import { HTMLAttributes, useEffect, useMemo, useState } from "react";
import { allocateImage } from "@/utils/globalImageAllocator";
import { getMappedImage } from "@/utils/imageMapping";
import { getUsableImageUrl } from "@/utils/fallbackImages";

const EMPTY_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

interface SmartImageProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt: string;
  imageClassName?: string;
  containerClassName?: string;
  priority?: boolean;
  aspectRatio?: string;
  showSkeleton?: boolean;
  fallbackSrc?: string;
  lowResSrc?: string;
  sizes?: string;
  width?: number;
  height?: number;
  usageId?: string;
  category?: string;
  orientation?: "landscape" | "portrait";
}

function safeSrc(src?: string | null, fallback = EMPTY_PIXEL) {
  const value = String(src || "").trim();
  return value || fallback;
}

function isExternalUrl(src?: string | null) {
  return /^https?:\/\//i.test(String(src || "").trim());
}

export function SmartImage({
  src,
  alt,
  imageClassName = "",
  containerClassName = "",
  priority = false,
  aspectRatio = "aspect-[4/5]",
  showSkeleton = true,
  fallbackSrc,
  lowResSrc,
  sizes = "(max-width: 768px) 100vw, 33vw",
  width = 800,
  height = 1000,
  usageId,
  category = "general",
  orientation,
  style,
  ...props
}: SmartImageProps) {
  const stableUsageId = usageId || `smart-image:${alt}`;
  const preferredSrc = getUsableImageUrl(src);
  const mappedCategorySrc = useMemo(
    () => (preferredSrc ? "" : getMappedImage(category, "")),
    [category, preferredSrc],
  );
  const resolvedSrc = useMemo(
    () => {
      if (preferredSrc && isExternalUrl(preferredSrc)) {
        return preferredSrc;
      }

      return (
        mappedCategorySrc ||
        allocateImage({
          category,
          context: stableUsageId,
          entityId: stableUsageId,
          preferredUrl: src,
          orientation,
        }).url
      );
    },
    [category, mappedCategorySrc, orientation, preferredSrc, src, stableUsageId],
  );
  const fallback = useMemo(
    () => {
      if (fallbackSrc) {
        if (isExternalUrl(fallbackSrc)) return safeSrc(fallbackSrc);

        return allocateImage({
          category: "general",
          context: "fallback",
          entityId: `${stableUsageId}:fallback`,
          preferredUrl: fallbackSrc,
          orientation,
        }).url;
      }

      if (mappedCategorySrc) {
        return allocateImage({
          category,
          context: `${stableUsageId}:mapped-fallback`,
          entityId: `${stableUsageId}:mapped-fallback`,
          orientation,
        }).url;
      }

      return resolvedSrc;
    },
    [category, fallbackSrc, mappedCategorySrc, orientation, resolvedSrc, stableUsageId],
  );
  const previewSrc = lowResSrc;
  const [currentSrc, setCurrentSrc] = useState(resolvedSrc);
  const [loaded, setLoaded] = useState(false);
  const [failedFallback, setFailedFallback] = useState(false);

  useEffect(() => {
    setCurrentSrc(resolvedSrc);
    setLoaded(false);
    setFailedFallback(false);
  }, [resolvedSrc]);

  const handleError = () => {
    if (currentSrc !== fallback) {
      setCurrentSrc(fallback);
      setLoaded(false);
      return;
    }

    setFailedFallback(true);
    setCurrentSrc(EMPTY_PIXEL);
    setLoaded(true);
  };

  return (
    <div
      className={`smart-image relative isolate overflow-hidden bg-stone-100 ${aspectRatio} ${containerClassName}`}
      style={{
        ...style,
        backgroundPosition: "center",
        backgroundSize: "cover",
        transform: "translateZ(0)",
      }}
      {...props}
    >
      {showSkeleton && !loaded ? (
        <div className="smart-image-skeleton absolute inset-0 z-10 opacity-80" aria-hidden="true" />
      ) : null}
      {!loaded && !failedFallback ? <div className="absolute inset-0 z-[11] backdrop-blur-md" aria-hidden="true" /> : null}

      <img
        src={currentSrc}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        sizes={sizes}
        width={width}
        height={height}
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={`h-full w-full object-cover transition-[opacity,transform] duration-300 ease-out ${
          loaded ? "opacity-100 scale-100" : "opacity-0 scale-[1.015]"
        } ${imageClassName}`}
        {...({ fetchpriority: priority ? "high" : "auto" } as Record<string, string>)}
      />
    </div>
  );
}
