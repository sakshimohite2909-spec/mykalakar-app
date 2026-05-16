import { useMemo, useState } from "react";
import { Play, VideoOff } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getYoutubeEmbedUrl, getYoutubeThumbnailUrl, getYoutubeVideoId } from "@/lib/youtube";
import { SmartImage } from "@/components/SmartImage";

type LazyYouTubeEmbedProps = {
  url: string;
  title?: string;
};

export default function LazyYouTubeEmbed({ url, title = "Performance video" }: LazyYouTubeEmbedProps) {
  const [open, setOpen] = useState(false);
  const videoId = useMemo(() => getYoutubeVideoId(url), [url]);
  const embedUrl = useMemo(() => getYoutubeEmbedUrl(url), [url]);
  const thumbnailUrl = useMemo(() => getYoutubeThumbnailUrl(url), [url]);

  if (!videoId || !embedUrl || !thumbnailUrl) {
    return (
      <div className="flex h-full min-h-[220px] items-center justify-center rounded-lg border border-stone-200 bg-white p-5 text-center shadow-sm">
        <div>
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-stone-100 text-stone-400">
            <VideoOff className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-extrabold text-stone-950">Video unavailable</p>
          <p className="mt-1 text-xs font-semibold text-stone-500">The artist video link needs a valid YouTube URL.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group block h-full w-full overflow-hidden rounded-lg border border-stone-200 bg-white text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_18px_40px_rgba(0,0,0,0.08)] active:scale-[0.99]"
        aria-label={`Play ${title}`}
      >
        <div className="relative aspect-video overflow-hidden bg-stone-950">
          <SmartImage
            src={thumbnailUrl}
            alt={title}
            usageId={`youtube-thumb:${videoId}`}
            category="event"
            orientation="landscape"
            aspectRatio="aspect-auto"
            containerClassName="h-full w-full transition duration-300 group-hover:scale-[1.03]"
          />
          <span className="absolute inset-0 bg-stone-950/24 transition group-hover:bg-stone-950/12" />
          <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-orange-600 shadow-xl transition duration-200 group-hover:scale-105">
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          </span>
        </div>
        <div className="p-4">
          <p className="line-clamp-2 text-sm font-extrabold leading-5 text-stone-950">{title}</p>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[min(960px,calc(100vw-24px))] max-w-none overflow-hidden rounded-lg border-0 bg-stone-950 p-0 shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <div className="aspect-video w-full bg-black">
            <iframe
              width="100%"
              height="100%"
              src={`${embedUrl}&autoplay=1`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              className="block h-full w-full"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
