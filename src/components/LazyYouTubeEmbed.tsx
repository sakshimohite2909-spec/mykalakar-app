import { useMemo, useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import { getExternalUrl, getYoutubeEmbedUrl, getYoutubeThumbnailUrl, getYoutubeVideoId } from "@/lib/youtube";

type LazyYouTubeEmbedProps = {
  url: string;
  title?: string;
};

export default function LazyYouTubeEmbed({ url, title = "YouTube performance" }: LazyYouTubeEmbedProps) {
  const [playing, setPlaying] = useState(false);
  const videoId = useMemo(() => getYoutubeVideoId(url), [url]);
  const embedUrl = useMemo(() => getYoutubeEmbedUrl(url), [url]);
  const thumbnailUrl = useMemo(() => getYoutubeThumbnailUrl(url), [url]);

  if (!videoId || !embedUrl || !thumbnailUrl) {
    return (
      <a
        href={getExternalUrl(url)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-secondary/50 p-4 transition-colors hover:bg-secondary"
      >
        <span className="flex items-center gap-3 text-sm font-semibold">
          <Play className="h-5 w-5" />
          Open video
        </span>
        <ExternalLink className="h-4 w-4 text-muted-foreground" />
      </a>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-black shadow-sm">
      {playing ? (
        <iframe
          width="100%"
          height="100%"
          src={`${embedUrl}&autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="block h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group relative block h-full w-full overflow-hidden text-left"
          aria-label={`Play ${title}`}
        >
          <img
            src={thumbnailUrl}
            alt={title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <span className="absolute inset-0 bg-black/25 transition group-hover:bg-black/10" />
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-600 text-white shadow-2xl transition group-hover:scale-105">
            <Play className="ml-1 h-7 w-7 fill-current" />
          </span>
        </button>
      )}
    </div>
  );
}
