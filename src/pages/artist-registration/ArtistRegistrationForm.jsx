import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";
import { Link } from "react-router-dom";
import { registerArtistProfile } from "@/services/firebaseServices";
import {
  artistRegistrationDefaults,
  artistRegistrationSchema,
  disciplineOptions,
} from "./schema";

const inputClass =
  "h-12 w-full rounded-lg border border-white/60 bg-white/45 px-4 text-sm font-semibold text-[#1F2937] outline-none backdrop-blur-2xl transition placeholder:text-slate-500 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-200/40";

const labelClass = "text-xs font-black uppercase tracking-[0.18em] text-[#1E1B4B]";
const errorClass = "mt-1 text-sm font-semibold text-red-600";

function FloatingToast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(onClose, 4800);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          initial={{ opacity: 0, y: -18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -18, scale: 0.98 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed right-4 top-5 z-[70] w-[calc(100vw-2rem)] max-w-md rounded-lg border border-white/60 bg-white/55 p-4 shadow-[0_24px_80px_rgba(31,41,55,0.18)] backdrop-blur-2xl"
          role="status"
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                toast.type === "success" ? "bg-emerald-500/15 text-emerald-700" : "bg-red-500/15 text-red-700"
              }`}
            >
              {toast.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-[#1E1B4B]">{toast.title}</p>
              <p className="mt-1 text-sm font-semibold leading-5 text-[#1F2937]">{toast.message}</p>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function FieldError({ error }) {
  if (!error?.message) return null;
  return <p className={errorClass}>{error.message}</p>;
}

export default function ArtistRegistrationForm() {
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [toast, setToast] = useState(null);

  const {
    control,
    formState: { errors, isSubmitting, isValid },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(artistRegistrationSchema),
    mode: "onChange",
    defaultValues: artistRegistrationDefaults,
  });

  const selectedImage = watch("profileImage");
  const isSubmitDisabled = !isValid || isSubmitting;

  useEffect(() => {
    if (!selectedImage) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedImage);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedImage]);

  const submitButtonClass = useMemo(
    () =>
      [
        "inline-flex h-14 min-h-14 items-center justify-center gap-2 rounded-lg bg-[#1E1B4B] px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-white shadow-[0_18px_48px_rgba(30,27,75,0.22)] transition hover:-translate-y-0.5 hover:bg-indigo-900 focus:outline-none focus:ring-4 focus:ring-indigo-300/50",
        isSubmitDisabled ? "pointer-events-none cursor-not-allowed opacity-50" : "",
      ].join(" "),
    [isSubmitDisabled]
  );

  const onSubmit = async (values) => {
    setToast(null);

    try {
      const { profileImage, ...profileData } = values;
      const result = await registerArtistProfile(profileData, profileImage);
      setToast({
        type: "success",
        title: "Artist profile submitted",
        message: `Registration is synced to Firebase with Artist ID ${result.artistId}.`,
      });
      reset(artistRegistrationDefaults);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setToast({
        type: "error",
        title: "Registration failed",
        message: error?.message || "Could not submit the artist profile.",
      });
    }
  };

  return (
    <section className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <FloatingToast toast={toast} onClose={() => setToast(null)} />

      <div className="grid w-full gap-8 lg:grid-cols-[0.86fr_1.14fr]">
        <motion.aside
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex min-h-[520px] flex-col justify-between rounded-lg border border-white/60 bg-white/40 p-8 shadow-[0_24px_80px_rgba(31,41,55,0.10)] backdrop-blur-2xl"
        >
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg border border-white/60 bg-white/45 px-4 py-2 text-sm font-black text-[#1E1B4B] backdrop-blur-2xl transition hover:bg-white/70"
            >
              MyKalakar
              <Sparkles className="h-4 w-4 text-fuchsia-600" />
            </Link>
            <h1 className="mt-10 max-w-xl text-4xl font-black leading-tight text-[#1E1B4B] sm:text-5xl">
              Premium artist onboarding for the next generation of cultural talent.
            </h1>
            <p className="mt-5 max-w-lg text-base font-semibold leading-7 text-[#1F2937]">
              Create a synchronized artist profile with secure Firebase Auth, Cloud Storage media, and Firestore profile data.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {["Verified identity", "3D gallery ready", "Admin editable"].map((item) => (
              <div key={item} className="rounded-lg border border-white/60 bg-white/35 px-4 py-3 text-sm font-black text-[#1E1B4B] backdrop-blur-2xl">
                {item}
              </div>
            ))}
          </div>
        </motion.aside>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.45 }}
          className="rounded-lg border border-white/60 bg-white/40 p-5 shadow-[0_24px_80px_rgba(31,41,55,0.12)] backdrop-blur-2xl sm:p-8"
        >
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-700">Artist Registration</p>
              <h2 className="mt-2 text-3xl font-black text-[#1E1B4B]">Create your profile</h2>
            </div>
            <Link to="/login" className="text-sm font-black text-indigo-700 transition hover:text-indigo-950">
              Already registered
            </Link>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5" noValidate>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Full Name</span>
                <input className={inputClass} {...register("fullName")} autoComplete="name" />
                <FieldError error={errors.fullName} />
              </label>

              <label className="block">
                <span className={labelClass}>Stage Name</span>
                <input className={inputClass} {...register("stageName")} autoComplete="organization" />
                <FieldError error={errors.stageName} />
              </label>

              <label className="block">
                <span className={labelClass}>Private Email</span>
                <input className={inputClass} type="email" {...register("email")} autoComplete="email" />
                <FieldError error={errors.email} />
              </label>

              <label className="block">
                <span className={labelClass}>Phone Number</span>
                <input className={inputClass} inputMode="numeric" {...register("phoneNumber")} autoComplete="tel" />
                <FieldError error={errors.phoneNumber} />
              </label>

              <label className="block">
                <span className={labelClass}>Password</span>
                <input className={inputClass} type="password" {...register("password")} autoComplete="new-password" />
                <FieldError error={errors.password} />
              </label>

              <label className="block">
                <span className={labelClass}>Confirm Password</span>
                <input className={inputClass} type="password" {...register("confirmPassword")} autoComplete="new-password" />
                <FieldError error={errors.confirmPassword} />
              </label>

              <label className="block">
                <span className={labelClass}>Discipline</span>
                <select className={inputClass} {...register("discipline")}>
                  <option value="">Select discipline</option>
                  {disciplineOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <FieldError error={errors.discipline} />
              </label>

              <label className="block">
                <span className={labelClass}>Art Form</span>
                <input className={inputClass} {...register("artForm")} placeholder="Tabla, Bharatanatyam, Watercolor..." />
                <FieldError error={errors.artForm} />
              </label>

              <label className="block">
                <span className={labelClass}>City</span>
                <input className={inputClass} {...register("city")} autoComplete="address-level2" />
                <FieldError error={errors.city} />
              </label>

              <label className="block">
                <span className={labelClass}>State</span>
                <input className={inputClass} {...register("state")} autoComplete="address-level1" />
                <FieldError error={errors.state} />
              </label>

              <label className="block">
                <span className={labelClass}>Experience Years</span>
                <input className={inputClass} type="number" min="0" max="80" {...register("experienceYears")} />
                <FieldError error={errors.experienceYears} />
              </label>

              <label className="block">
                <span className={labelClass}>Instagram URL</span>
                <input className={inputClass} {...register("instagramUrl")} placeholder="https://instagram.com/..." />
                <FieldError error={errors.instagramUrl} />
              </label>
            </div>

            <label className="block">
              <span className={labelClass}>Portfolio URL</span>
              <input className={inputClass} {...register("portfolioUrl")} placeholder="https://..." />
              <FieldError error={errors.portfolioUrl} />
            </label>

            <label className="block">
              <span className={labelClass}>Bio</span>
              <textarea
                className="min-h-32 w-full rounded-lg border border-white/60 bg-white/45 px-4 py-3 text-sm font-semibold leading-6 text-[#1F2937] outline-none backdrop-blur-2xl transition placeholder:text-slate-500 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-200/40"
                {...register("bio")}
              />
              <FieldError error={errors.bio} />
            </label>

            <Controller
              control={control}
              name="profileImage"
              render={({ field }) => (
                <div>
                  <div className="flex flex-col gap-4 rounded-lg border border-white/60 bg-white/35 p-4 backdrop-blur-2xl sm:flex-row sm:items-center">
                    <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/70 bg-white/50">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Selected artist profile" className="h-full w-full object-cover" />
                      ) : (
                        <ImagePlus className="h-10 w-10 text-indigo-500" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className={labelClass}>
                        Profile Image <span className="text-red-600">*</span>
                      </p>
                      <input
                        ref={(node) => {
                          fileInputRef.current = node;
                        }}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={(event) => field.onChange(event.target.files?.[0])}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/60 bg-white/55 px-4 py-3 text-sm font-black text-[#1E1B4B] shadow-sm backdrop-blur-2xl transition hover:bg-white/80"
                      >
                        <Upload className="h-4 w-4" />
                        Upload profile image
                      </button>
                      <p className="mt-2 text-sm font-semibold text-[#1F2937]">
                        For optimal 3D gallery display, images must be close-up shots and 4k resolution.
                      </p>
                    </div>
                  </div>
                  <FieldError error={errors.profileImage} />
                </div>
              )}
            />

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-md text-sm font-semibold leading-6 text-[#1F2937]">
                Applications are reviewed before public promotion.
              </p>
              <button type="submit" disabled={isSubmitDisabled} className={submitButtonClass}>
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                {isSubmitting ? "Submitting" : "Submit Profile"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
