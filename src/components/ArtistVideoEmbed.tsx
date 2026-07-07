import { useMemo } from "react";
import { getYouTubeVideoId } from "@/lib/youtube";

type ArtistVideoEmbedProps = {
  videoUrl?: string | null;
  title: string;
  className?: string;
};

export function ArtistVideoEmbed({ videoUrl, title, className = "" }: ArtistVideoEmbedProps) {
  const videoId = useMemo(() => getYouTubeVideoId(videoUrl), [videoUrl]);

  if (!videoId) return null;

  return (
    <div className={`profile-video-frame aspect-video w-full ${className}`}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        className="h-full w-full"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
