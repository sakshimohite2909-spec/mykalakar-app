import React, { useState, useRef, useEffect } from "react";
import { Camera, RefreshCw, CheckCircle2, ShieldCheck, AlertCircle, X, Sparkles, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface LiveFaceCaptureProps {
  file: File | null;
  preview: string;
  onChange: (file: File | null, previewUrl: string) => void;
  label?: string;
  description?: string;
}

export function LiveFaceCapture({
  file,
  preview,
  onChange,
  label = "Live Face Photo (Selfie Verification)",
  description = "Take a real-time photo to verify your identity. Look straight into the camera in a well-lit area.",
}: LiveFaceCaptureProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Direct camera access is not supported by your browser. Please take a photo with your device camera.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraActive(true);

      // Attach stream to video once active
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.warn);
        }
      }, 100);
    } catch (err: any) {
      console.warn("Camera start failed:", err);
      setCameraError(err.message || "Could not access camera. Please allow camera permissions or upload a direct selfie photo.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flip horizontally for natural mirror selfie feel
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const capturedFile = new File([blob], `live_face_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          const previewUrl = canvas.toDataURL("image/jpeg", 0.9);
          onChange(capturedFile, previewUrl);
          stopCamera();
          toast({
            title: "Live Face Photo Captured! 📸",
            description: "Your selfie has been recorded for instant admin verification.",
          });
        }
      },
      "image/jpeg",
      0.9
    );
  };

  const handleNativeFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const previewUrl = URL.createObjectURL(selectedFile);
    onChange(selectedFile, previewUrl);
    stopCamera();
  };

  const handleRetake = () => {
    onChange(null, "");
    startCamera();
  };

  return (
    <div className="rounded-2xl border-2 border-dashed border-orange-300/80 bg-orange-50/20 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <label className="text-sm font-black text-stone-900 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-orange-600" />
            <span>{label}</span>
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
              Live KYC
            </span>
          </label>
          <p className="text-xs text-stone-500 font-medium leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* ── State 1: Photo is Captured ── */}
      {preview && !isCameraActive && (
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-2 border-emerald-500 shadow-md">
            <img src={preview} alt="Captured Live Face" className="h-full w-full object-cover" />
            <div className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full p-1 shadow-sm">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1">
            <p className="text-xs font-black text-emerald-800 flex items-center justify-center sm:justify-start gap-1">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Live Selfie Captured & Verified
            </p>
            <p className="text-[11px] text-stone-500 font-medium">
              This photo will be verified by the admin team against your Aadhaar card for instant approval.
            </p>
            <div className="pt-2 flex justify-center sm:justify-start gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRetake}
                className="h-8 px-3 rounded-xl font-bold text-xs border-stone-200 text-stone-700 hover:bg-orange-50 hover:text-orange-600"
              >
                <RefreshCw className="h-3 w-3 mr-1.5" /> Retake Photo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── State 2: Active Camera Viewfinder ── */}
      {isCameraActive && (
        <div className="relative overflow-hidden rounded-2xl bg-black border-2 border-orange-500 shadow-xl flex flex-col items-center justify-center p-3">
          <div className="relative w-full max-w-[360px] aspect-[4/3] rounded-xl overflow-hidden bg-stone-900">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
            {/* Oval Face Guide Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-60 border-2 border-dashed border-white/80 rounded-[50%] shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] flex items-center justify-center">
                <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs">
                  Align Face Inside
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 w-full max-w-[360px] justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={stopCamera}
              className="text-white hover:bg-white/20 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={capturePhoto}
              className="h-11 px-6 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-black text-xs shadow-lg shadow-orange-600/40 flex items-center gap-2"
            >
              <Camera className="h-4 w-4" /> Click to Capture
            </Button>
          </div>
        </div>
      )}

      {/* ── State 3: Idle / Prompt to Open Camera ── */}
      {!preview && !isCameraActive && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black text-stone-900">Take Live Camera Photo</p>
              <p className="text-[11px] text-stone-500 font-medium">
                Fast 1-click selfie via front camera
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              onClick={startCamera}
              className="flex-1 sm:flex-none h-10 px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-sm"
            >
              <Camera className="h-3.5 w-3.5 mr-1.5" /> Open Camera
            </Button>

            {/* Mobile / Native Camera upload fallback */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleNativeFileInput}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 px-4 rounded-xl font-bold text-xs border-stone-200 text-stone-700 hover:bg-stone-50"
            >
              Upload Selfie
            </Button>
          </div>
        </div>
      )}

      {/* Camera Error helper */}
      {cameraError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}
    </div>
  );
}
