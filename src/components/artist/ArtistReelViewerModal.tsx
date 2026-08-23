import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
  PhoneCall,
  Sparkles,
} from "lucide-react";

export type ArtistReelItem = {
  id: string;
  url: string;
  title?: string;
  thumbnailUrl?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reels: ArtistReelItem[];
  initialIndex?: number;
  artistName: string;
  artistCategory?: string;
  artistAvatar?: string;
  onBookArtist: () => void;
};

export default function ArtistReelViewerModal({
  open,
  onOpenChange,
  reels,
  initialIndex = 0,
  artistName,
  artistCategory,
  artistAvatar,
  onBookArtist,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setIsPlaying(true);
    }
  }, [open, initialIndex]);

  const currentReel = reels[currentIndex] || reels[0];

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      if (isPlaying) {
        videoRef.current.play().catch(() => {
          // Autoplay policy fallback: mute and retry
          setIsMuted(true);
          videoRef.current?.play().catch(() => {});
        });
      }
    }
  }, [currentIndex, open]);

  if (!currentReel) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0); // loop back
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(reels.length - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md p-0 overflow-hidden bg-black border-stone-800 rounded-3xl text-white shadow-2xl h-[85vh] max-h-[780px] flex flex-col justify-between">
        {/* Video Area */}
        <div
          className="relative w-full h-full bg-black flex items-center justify-center cursor-pointer select-none"
          onClick={togglePlay}
        >
          <video
            ref={videoRef}
            src={currentReel.url}
            playsInline
            loop
            muted={isMuted}
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            className="w-full h-full object-cover"
          />

          {/* Top Floating Header */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between z-20 pointer-events-auto">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-md">
                <ShieldCheck className="h-3.5 w-3.5" /> MyKalakar Verified Reel
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                className="h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md flex items-center justify-center text-white border border-white/10 transition"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenChange(false);
                }}
                className="h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md flex items-center justify-center text-white border border-white/10 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Center Play/Pause Indicator (Shown when paused) */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="h-16 w-16 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl scale-110 animate-in fade-in zoom-in-90 duration-150">
                <Play className="h-8 w-8 fill-white translate-x-0.5" />
              </div>
            </div>
          )}

          {/* Left/Right Navigation Controls */}
          {reels.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 transition z-20 pointer-events-auto"
                aria-label="Previous Reel"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 transition z-20 pointer-events-auto"
                aria-label="Next Reel"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Bottom Floating Info & Book Button */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-black via-black/70 to-transparent z-20 pointer-events-auto flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-orange-500 bg-stone-800 shrink-0">
                {artistAvatar ? (
                  <img src={artistAvatar} alt={artistName} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center font-black text-orange-400">
                    {artistName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-white truncate">{artistName}</h4>
                <p className="text-[11px] text-stone-300 truncate font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-orange-400 shrink-0" />
                  {currentReel.title || artistCategory || "Live Performance"}
                </p>
              </div>

              {reels.length > 1 && (
                <span className="text-[11px] text-stone-400 font-bold bg-white/10 px-2 py-0.5 rounded-full">
                  {currentIndex + 1} / {reels.length}
                </span>
              )}
            </div>

            {/* Direct Booking CTA */}
            <Button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChange(false);
                onBookArtist();
              }}
              className="w-full h-11 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition"
            >
              <PhoneCall className="h-4 w-4" /> Book {artistName} (Check Availability)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
