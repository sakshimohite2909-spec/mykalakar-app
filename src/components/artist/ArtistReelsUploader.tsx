import React, { useRef, useState } from "react";
import { Film, Upload, Trash2, Play, Video, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { validateVideoFile } from "@/lib/uploadService";

export interface LocalReelItem {
  id: string;
  file: File;
  previewUrl: string;
  title: string;
}

interface ArtistReelsUploaderProps {
  reels: LocalReelItem[];
  onAddReel: (file: File, title?: string) => void;
  onRemoveReel: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  maxReels?: number;
}

export function ArtistReelsUploader({
  reels,
  onAddReel,
  onRemoveReel,
  onUpdateTitle,
  maxReels = 4,
}: ArtistReelsUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (reels.length + files.length > maxReels) {
      toast({
        variant: "destructive",
        title: "Limit Reached",
        description: `You can upload up to ${maxReels} performance reels.`,
      });
      return;
    }

    Array.from(files).forEach((file) => {
      const validation = validateVideoFile(file);
      if (!validation.valid) {
        toast({
          variant: "destructive",
          title: "Invalid Video File",
          description: validation.error || "Video must be MP4/MOV and under 30MB.",
        });
        return;
      }
      const defaultTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      onAddReel(file, defaultTitle);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border-2 border-dashed border-orange-300/80 bg-orange-50/20 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-black text-stone-900 flex items-center gap-2">
            <Film className="h-4 w-4 text-orange-600" />
            <span>Performance Reels & Video Highlights (रिल्स आणि व्हिडिओ)</span>
            <span className="text-[10px] font-black uppercase text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
              {reels.length} / {maxReels}
            </span>
          </h4>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Upload short performance video clips or reels (.mp4, .mov, max 30MB each)
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={reels.length >= maxReels}
          className="h-9 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-sm shrink-0"
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" /> + Upload Reel
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Grid of uploaded reels */}
      {reels.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
          {reels.map((reel, idx) => (
            <div
              key={reel.id}
              className="group relative flex flex-col rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition"
            >
              {/* Video Player / Viewport */}
              <div className="relative aspect-[9/16] max-h-[220px] bg-stone-950 overflow-hidden flex items-center justify-center">
                <video
                  src={reel.previewUrl}
                  controls={playingId === reel.id}
                  playsInline
                  className="w-full h-full object-cover"
                />

                {playingId !== reel.id && (
                  <button
                    type="button"
                    onClick={() => setPlayingId(reel.id)}
                    className="absolute inset-0 m-auto h-10 w-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-orange-600 hover:scale-110 transition shadow-lg"
                  >
                    <Play className="h-4 w-4 ml-0.5 fill-current" />
                  </button>
                )}

                <span className="absolute top-2 left-2 bg-black/70 text-white text-[9px] font-black px-2 py-0.5 rounded-md backdrop-blur-xs">
                  Reel #{idx + 1}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    if (playingId === reel.id) setPlayingId(null);
                    onRemoveReel(reel.id);
                  }}
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white shadow-sm transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Title input */}
              <div className="p-2.5 bg-stone-50 border-t border-stone-100">
                <Input
                  value={reel.title}
                  onChange={(e) => onUpdateTitle(reel.id, e.target.value)}
                  placeholder="e.g. Pune Live Show Reel"
                  className="h-8 rounded-lg bg-white border-stone-200 text-xs font-bold text-stone-900"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-6 bg-white/80 rounded-2xl border border-dashed border-stone-300 hover:border-orange-500 hover:bg-orange-50/40 cursor-pointer transition text-center"
        >
          <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-2">
            <Video className="h-5 w-5" />
          </div>
          <p className="text-xs font-black text-stone-900">Add Performance Videos or Reels</p>
          <p className="text-[11px] text-stone-500 font-medium mt-0.5">
            Click here to browse video files (.mp4, .mov up to 30MB)
          </p>
        </div>
      )}
    </div>
  );
}
