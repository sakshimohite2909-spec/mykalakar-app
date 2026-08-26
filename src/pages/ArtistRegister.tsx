import React, {
  type ChangeEvent,
  type ComponentType,
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Controller, type FieldValues, type Path, type UseFormRegister, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  AtSign,
  BadgeCheck,
  Building2,
  CreditCard,
  Eye,
  EyeOff,
  FileImage,
  IndianRupee,
  Loader2,
  Lock,
  MapPin,
  MessageSquare,
  Music,
  Phone,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Upload,
  User,
  Users,
  X,
  Youtube,
} from "lucide-react";
import { collection, doc, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes, type UploadResult } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
import { compressImageUpload } from "@/utils/imageCompression";
import { FIREBASE_UPLOAD_TIMEOUT_MS, FIREBASE_WRITE_TIMEOUT_MS, firebaseErrorMessage, logFirebaseError, sanitizePayload, withTimeout } from "@/lib/firebaseSafe";
import { imageRegistry } from "@/services/ImageRegistryService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { getExternalUrl, getYoutubeThumbnailUrl } from "@/lib/youtube";
import { getIndiaDistrictsByStateName, getIndiaStates } from "@/lib/indiaLocations";
import {
  ARTIST_TYPES,
  CATEGORY_STRUCTURE,
  MAIN_CATEGORIES,
  getSubcategoriesForMainCategory,
  normalizeArtistType,
  getEventTypes,
  getCategoriesForEvent,
  getSubcategoriesForCategory,
  ALL_EVENT_TYPES,
  getArtOptionDetails,
  type MasterArtOption,
} from "@/constants/artistSystem";
import {
  PHONE_MAX_LENGTH,
  PHONE_PLACEHOLDER,
  sanitizePhoneNumber,
  validatePhoneNumber,
} from "@/lib/phoneUtils";
import { useI18n } from "@/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";
import {
  DateOfBirthSelect,
  INDIAN_BANK_OPTIONS,
  PremiumCheckbox,
  SearchableLanguageSelect,
  SearchableSingleSelect,
} from "@/components/artist/ArtistProfileInputs";
import { SearchableArtSelector } from "@/components/artist/SearchableArtSelector";
import { LiveFaceCapture } from "@/components/artist/LiveFaceCapture";
import { ArtistReelsUploader, type LocalReelItem } from "@/components/artist/ArtistReelsUploader";
import { uploadVideoFile } from "@/lib/uploadService";
import { Check } from "lucide-react";

type AuthRole = "artist" | "user";
type PortfolioPlatform = "youtube";
type PortfolioLink = { platform: PortfolioPlatform; url: string };
type ExtraArtMediaField = "profile" | "performance";
type ExtraArtEntry = {
  id: string;
  eventType: string;
  eventTypes?: string[];
  mainCategory: string;
  category: string;
  soloPrice: string;
  duoPrice: string;
  teamPrice: string;
  showPricingOnProfile: boolean;
  profileFile: File | null;
  profilePreview: string;
  performanceFile: File | null;
  performancePreview: string;
  youtubeLinks: PortfolioLink[];
};
type PreparedExtraArtEntry = Omit<ExtraArtEntry, "youtubeLinks"> & { youtubeLinks: string[] };

const roleTabs: Array<{ id: AuthRole; label: string; icon: ComponentType<{ className?: string }>; color: string }> = [
  { id: "artist", label: "Artist", icon: Music, color: "from-orange-500 to-amber-400" },
];

const artCategoryOptions = [...ARTIST_TYPES];

const fullNameRule = z
  .string()
  .min(3, "Full name must be at least 3 characters.")
  .regex(/^[a-zA-Z\s.\-'\u00C0-\u017F]*$/, "Full name can contain letters, spaces, periods, hyphens, and apostrophes.");

const usernameRule = z
  .string()
  .min(4, "Username must be at least 4 characters.")
  .regex(/^\S*$/, "Username cannot contain spaces.");

const passwordRule = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, "Password must contain at least one uppercase letter, one number, and one special character.");

const mobileRule = z
  .string()
  .min(1, "Phone number is required.")
  .refine(validatePhoneNumber, "Phone number must be exactly 10 digits.");

const emergencyRule = z
  .string()
  .min(1, "Emergency contact is required.")
  .refine(validatePhoneNumber, "Emergency contact must be exactly 10 digits.");

const optionalPhoneRule = z
  .string()
  .optional()
  .refine((value) => !value || validatePhoneNumber(value), {
    message: "Phone number must be exactly 10 digits.",
  });

const aadharRule = z.preprocess(
  (value) => String(value ?? "").replace(/\s/g, ""),
  z
    .string()
    .regex(/^\d{12}$/, "Aadhaar number must be exactly 12 digits.")
);
const bankNameRule = z.string().min(1, "Bank name is required.");
const ifscRule = z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "IFSC code must strictly match Indian IFSC format.");
const accountRule = z
  .string()
  .min(9, "Account number must be at least 9 digits.")
  .max(18, "Account number must be at most 18 digits.")
  .regex(/^\d+$/, "Account number must contain digits only.");
const stateRule = z.string().min(1, "State is required.");
const districtRule = z.string().min(1, "District is required.");

const artistRegistrationSchema = z
  .object({
    fullName: fullNameRule,
    username: usernameRule,
    password: passwordRule,
    confirmPassword: z.string().min(1, "Confirm password is required."),
    brandName: z.string().optional(),
    mobileNumber: mobileRule,
    emergencyNumber: emergencyRule,
    phoneOptional: optionalPhoneRule,
    dob: z.string().min(1, "Date of birth is required."),
    gender: z.string().min(1, "Gender is required."),
    travelWillingness: z.string().min(1, "Travel willingness is required."),
    eventType: z.string().min(1, "Event Type is required."),
    mainCategory: z.string().min(1, "Main category is required."),
    artCategory: z.string().min(1, "Subcategory / art form is required."),
    soloPrice: z.string().optional(),
    duoPrice: z.string().optional(),
    teamPrice: z.string().optional(),
    state: stateRule,
    district: districtRule,
    experience: z.string().min(1, "Experience is required.").regex(/^\d+$/, "Experience must be a number."),
    bio: z.string().optional(),
    aadharNumber: aadharRule,
    bankName: bankNameRule,
    ifscCode: ifscRule,
    accountNumber: accountRule,
    confirmAccountNumber: z.string().min(1, "Please confirm your account number."),
    portfolioUrl: z
      .union([
        z.string().regex(
          /^(https?:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/,
          "Must be a valid YouTube URL (e.g. youtube.com/watch?v=...)"
        ),
        z.literal(""),
      ])
      .optional(),
    hasAssistant: z.boolean(),
    assistantName: z.string().optional(),
    assistantContact: z.string().optional(),
    suggestionComment: z.string().optional(),
    voucherType: z.enum(["normal", "premium"]),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((values) => values.accountNumber === values.confirmAccountNumber, {
    message: "Account numbers do not match. Please re-enter.",
    path: ["confirmAccountNumber"],
  });

const userRegistrationSchema = z
  .object({
    fullName: fullNameRule,
    username: usernameRule,
    password: passwordRule,
    confirmPassword: z.string().min(1, "Confirm password is required."),
    phoneOptional: mobileRule,
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type ArtistRegistrationValues = z.infer<typeof artistRegistrationSchema>;
type UserRegistrationValues = z.infer<typeof userRegistrationSchema>;

const artistDefaults: ArtistRegistrationValues = {
  fullName: "",
  username: "",
  password: "",
  confirmPassword: "",
  brandName: "",
  mobileNumber: "",
  emergencyNumber: "",
  phoneOptional: "",
  dob: "",
  gender: "",
  travelWillingness: "local",
  eventType: "Varkari Sampraday",
  mainCategory: "",
  artCategory: "",
  soloPrice: "",
  duoPrice: "",
  teamPrice: "",
  state: "",
  district: "",
  experience: "",
  bio: "",
  aadharNumber: "",
  bankName: "",
  ifscCode: "",
  accountNumber: "",
  confirmAccountNumber: "",
  portfolioUrl: "",
  hasAssistant: false,
  assistantName: "",
  assistantContact: "",
  suggestionComment: "",
  voucherType: "normal",
};

const userDefaults: UserRegistrationValues = {
  fullName: "",
  username: "",
  password: "",
  confirmPassword: "",
  phoneOptional: "",
};

const inputClass =
  "input-premium w-full px-4 py-3 text-[#1A1A1A]";
const errorInputClass = "border-red-400 focus:border-red-500 focus:ring-red-200";
const PROFILE_IMAGE_HELPER_TEXT = "For optimal 3D gallery display, images must be close-up shots and 4k resolution.";
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;

function digitsOnly(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function createYoutubeLink(): PortfolioLink {
  return { platform: "youtube", url: "" };
}

function createExtraArtEntry(): ExtraArtEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    eventType: "Wedding",
    eventTypes: ["Wedding", "Birthday", "Cultural Event"],
    mainCategory: "",
    category: "",
    soloPrice: "",
    duoPrice: "",
    teamPrice: "",
    showPricingOnProfile: false,
    profileFile: null,
    profilePreview: "",
    performanceFile: null,
    performancePreview: "",
    youtubeLinks: [createYoutubeLink()],
  };
}

function EventTypeMultiSelect({
  selectedEvents,
  onChange,
}: {
  selectedEvents: string[];
  onChange: (events: string[]) => void;
}) {
  const toggleEvent = (event: string) => {
    if (selectedEvents.includes(event)) {
      if (selectedEvents.length === 1) return;
      onChange(selectedEvents.filter((e) => e !== event));
    } else {
      onChange([...selectedEvents, event]);
    }
  };

  return (
    <div className="space-y-2 mt-1">
      <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
        Where do you perform this? (Select Event Types)
      </label>
      <div className="flex flex-wrap gap-2">
        {ALL_EVENT_TYPES.map((evt) => {
          const isSelected = selectedEvents.includes(evt);
          return (
            <button
              key={evt}
              type="button"
              onClick={() => toggleEvent(evt)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-extrabold transition-all select-none ${
                isSelected
                  ? "border-orange-500 bg-orange-500 text-white shadow-sm shadow-orange-200"
                  : "border-slate-200 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50/50"
              }`}
            >
              <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-sm border ${
                isSelected ? "border-white bg-white text-orange-600" : "border-slate-300 bg-white"
              }`}>
                {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
              </span>
              <span>{evt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getSubmittedYoutubeLinks(links: PortfolioLink[]) {
  return links.map((link) => link.url.trim()).filter(Boolean);
}

function formatAadhar(value: string) {
  return digitsOnly(value, 12).replace(/(\d{4})(?=\d)/g, "$1 ");
}

function getAgeLabel(dob: string) {
  if (!dob) return "Select DOB to auto-calculate";
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return "Select DOB to auto-calculate";

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return `${Math.max(age, 0)} Years Old`;
}

function sanitizeStorageFileName(fileName: string) {
  const safeName = String(fileName || "artist-image")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 96);

  return safeName || "artist-image";
}

function validateImageFile(file: File | null, required = false) {
  if (!file) {
    return required
      ? { valid: false, message: "Profile image is required before submitting." }
      : { valid: true, message: "" };
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, message: "Please upload a JPG, PNG, or WebP image." };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { valid: false, message: "Image must be 20MB or smaller." };
  }

  return { valid: true, message: "" };
}

async function uploadArtistRegistrationImage(uid: string, file: File, folder: string) {
  const validation = validateImageFile(file, true);
  if (!validation.valid) throw new Error(validation.message);

  // Compress image before uploading — shrinks 15MB PNGs to < 1MB
  const compressedFile = await compressImageUpload(file);

  const safeFileName = sanitizeStorageFileName(compressedFile.name);
  const storagePath = folder.startsWith("private-documents/")
    ? `${folder}/${Date.now()}-${safeFileName}`
    : `artists/${uid}/${folder}/${Date.now()}-${safeFileName}`;
  const storageRef = ref(storage, storagePath);

  try {
    const snapshot = await withTimeout<UploadResult>(
      uploadBytes(storageRef, compressedFile, {
        contentType: compressedFile.type,
        customMetadata: {
          artistId: uid,
          uploadPurpose: folder,
        },
      }),
      FIREBASE_UPLOAD_TIMEOUT_MS,
      `Could not upload ${folder.replace(/-/g, " ")} image.`
    );
    const downloadUrl = await withTimeout(
      getDownloadURL(snapshot.ref),
      FIREBASE_UPLOAD_TIMEOUT_MS,
      `Could not resolve ${folder.replace(/-/g, " ")} image URL.`
    );

    return { downloadUrl, storagePath };
  } catch (err: any) {
    const errCode = String(err?.code || "");
    const errMsg = String(err?.message || "");
    console.warn(`[Firebase Storage] Upload issue for ${folder}:`, errCode || errMsg);
    if (
      errCode === "storage/quota-exceeded" ||
      errCode === "storage/unauthorized" ||
      errMsg.includes("quota-exceeded") ||
      errMsg.includes("unauthorized") ||
      errCode.includes("quota") ||
      errCode.includes("unauthorized")
    ) {
      console.warn(`[Firebase Storage Warning] Storage rules/quota issue for ${folder}, using safe CDN fallback`);
      const fallbackUrl = imageRegistry.getUniqueImage({
        category: folder.includes("profile") ? "Default" : "Cover",
        type: folder.includes("profile") ? "artist" : "cover",
        key: `${uid}-${folder}`,
      });
      return { downloadUrl: fallbackUrl, storagePath: "" };
    }
    throw err;
  }
}

async function uploadOptionalArtistImage(uid: string, file: File | null, folder: string) {
  if (!file) return { downloadUrl: "", storagePath: "" };

  const validation = validateImageFile(file);
  if (!validation.valid) throw new Error(validation.message);

  try {
    return await uploadArtistRegistrationImage(uid, file, folder);
  } catch (err: any) {
    const errCode = String(err?.code || "");
    const errMsg = String(err?.message || "");
    if (
      errCode === "storage/quota-exceeded" ||
      errCode === "storage/unauthorized" ||
      errMsg.includes("quota-exceeded") ||
      errMsg.includes("unauthorized") ||
      errCode.includes("quota") ||
      errCode.includes("unauthorized")
    ) {
      console.warn(`[Firebase Storage Warning] Storage rules or quota blocked optional ${folder}, using empty URL`);
      return { downloadUrl: "", storagePath: "" };
    }
    throw err;
  }
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-semibold text-red-500">{message}</p>;
}

function SectionHeading({
  icon: Icon,
  title,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-200/70 pb-4">
      <Icon className="h-5 w-5 text-orange-500" />
      <h2 className="font-display text-xl font-bold text-[#2E3A47]">{title}</h2>
    </div>
  );
}

type TextFieldProps<T extends FieldValues> = {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: string;
  icon?: ComponentType<{ className?: string }>;
  type?: string;
  placeholder?: string;
  inputMode?: "text" | "numeric" | "tel" | "url";
  maxLength?: number;
  autoComplete?: string;
  className?: string;
};

function TextField<T extends FieldValues>({
  label,
  name,
  register,
  error,
  icon: Icon,
  type = "text",
  placeholder,
  inputMode,
  maxLength,
  autoComplete,
  className = "",
}: TextFieldProps<T>) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1.5 flex items-center gap-2 text-sm font-bold text-slate-700">
        {Icon ? <Icon className="h-4 w-4 text-orange-500" /> : null}
        {label}
      </label>
      <input
        id={name}
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        {...register(name)}
        className={`${inputClass} ${error ? errorInputClass : ""}`}
      />
      <FieldError message={error} />
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  onBlur,
  error,
  show,
  onToggle,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
}) {
  const inputId = label.replace(/\s+/g, '-').toLowerCase() + '-password';
  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 flex items-center gap-2 text-sm font-bold text-slate-700">
        <Lock className="h-4 w-4 text-orange-500" />
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={show ? "text" : "password"}
          value={value}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          className={`${inputClass} pr-11 ${error ? errorInputClass : ""}`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <FieldError message={error} />
    </div>
  );
}

function SearchableDropdown({
  label,
  value,
  options,
  placeholder,
  disabled = false,
  allowCustom = false,
  error,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  allowCustom?: boolean;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <SearchableSingleSelect
      label={label}
      value={value}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
      allowCustom={allowCustom}
      error={error}
      onChange={onChange}
    />
  );
}

function ArtCategoryCard({
  art,
  index,
  removable = false,
  error,
  onUpdate,
  onMediaFileChange,
  onRemove,
}: {
  art: ExtraArtEntry;
  index: number;
  removable?: boolean;
  error?: string;
  onUpdate: (next: ExtraArtEntry) => void;
  onMediaFileChange: (field: ExtraArtMediaField, file: File | null) => void;
  onRemove?: () => void;
}) {
  const { t } = useI18n();
  const artDetails = useMemo(() => getArtOptionDetails(art.category), [art.category]);

  const handleArtSelect = (opt: MasterArtOption) => {
    onUpdate({
      ...art,
      category: opt.name,
      mainCategory: opt.primaryCategory,
      eventType: opt.defaultEventTypes[0] || "Wedding",
      eventTypes: opt.defaultEventTypes,
    });
  };

  const update = (field: "eventType" | "mainCategory" | "category" | "soloPrice" | "duoPrice" | "teamPrice", value: string) => {
    onUpdate({ ...art, [field]: value });
  };
  const updateEventTypes = (eventTypes: string[]) => {
    onUpdate({ ...art, eventTypes, eventType: eventTypes[0] || art.eventType || "Wedding" });
  };
  const updateShowPricing = (showPricingOnProfile: boolean) => {
    onUpdate({ ...art, showPricingOnProfile });
  };
  const addYoutubeLink = () => {
    onUpdate({ ...art, youtubeLinks: [...art.youtubeLinks, createYoutubeLink()] });
  };
  const updateYoutubeLink = (linkIndex: number, nextLink: PortfolioLink) => {
    onUpdate({
      ...art,
      youtubeLinks: art.youtubeLinks.map((link, currentIndex) => (currentIndex === linkIndex ? nextLink : link)),
    });
  };
  const removeYoutubeLink = (linkIndex: number) => {
    const nextLinks = art.youtubeLinks.filter((_, currentIndex) => currentIndex !== linkIndex);
    onUpdate({ ...art, youtubeLinks: nextLinks.length > 0 ? nextLinks : [createYoutubeLink()] });
  };

  return (
    <div id={`service-card-${art.id}`} className="form-subcard rounded-2xl border border-sky-100 bg-sky-100/70 p-5 shadow-inner">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-black text-slate-500">Service {index + 1}</p>
        {removable ? (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-red-100 bg-white/70 px-3 text-[10px] font-black uppercase tracking-wider text-red-500 transition hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("register.btn.remove") || "Remove"}
          </button>
        ) : null}
      </div>

      <div className="space-y-4">
        {/* 1. What do you offer? */}
        <SearchableArtSelector
          label="What do you offer?"
          value={art.category}
          placeholder="Search or select your art / service (e.g. Singer, Kirtankar, DJ)..."
          error={error}
          onSelect={handleArtSelect}
        />

        {/* 2. Auto-identified Category & Subcategory */}
        {art.category && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                Category
              </label>
              {artDetails.allCategories.length > 1 ? (
                <SearchableDropdown
                  label=""
                  value={art.mainCategory || artDetails.primaryCategory}
                  options={artDetails.allCategories}
                  placeholder="Select Category"
                  onChange={(val) => update("mainCategory", val)}
                />
              ) : (
                <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-white/90 px-3.5 text-xs font-bold text-slate-800 shadow-sm">
                  {art.mainCategory || artDetails.primaryCategory}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                Subcategory / Art Form
              </label>
              <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-white/90 px-3.5 text-xs font-bold text-slate-800 shadow-sm">
                {art.category}
              </div>
            </div>
          </div>
        )}

        {/* 3. Where do you perform this? */}
        {art.category && (
          <EventTypeMultiSelect
            selectedEvents={art.eventTypes && art.eventTypes.length > 0 ? art.eventTypes : [art.eventType || "Wedding"]}
            onChange={updateEventTypes}
          />
        )}
      </div>

      <div className="my-5 h-px bg-white/80" />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <IndianRupee className="h-4 w-4 text-orange-500" />
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-600">{t("register.label.pricing")}</h3>
        </div>
        <PremiumCheckbox
          checked={art.showPricingOnProfile}
          onChange={updateShowPricing}
          label={t("register.label.showPricing")}
          className="w-full justify-start sm:w-auto"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor={`solo-price-${index}`} className="mb-1.5 block text-sm font-bold text-slate-700">{t("register.label.soloPrice")}</label>
          <input
            id={`solo-price-${index}`}
            value={art.soloPrice}
            onChange={(event) => update("soloPrice", digitsOnly(event.target.value, 8))}
            inputMode="numeric"
            placeholder={t("register.placeholder.price")}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`duo-price-${index}`} className="mb-1.5 block text-sm font-bold text-slate-700">{t("register.label.duoPrice")}</label>
          <input
            id={`duo-price-${index}`}
            value={art.duoPrice}
            onChange={(event) => update("duoPrice", digitsOnly(event.target.value, 8))}
            inputMode="numeric"
            placeholder={t("register.placeholder.price")}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`team-price-${index}`} className="mb-1.5 block text-sm font-bold text-slate-700">{t("register.label.teamPrice")}</label>
          <input
            id={`team-price-${index}`}
            value={art.teamPrice}
            onChange={(event) => update("teamPrice", digitsOnly(event.target.value, 8))}
            inputMode="numeric"
            placeholder={t("register.placeholder.price")}
            className={inputClass}
          />
        </div>
      </div>

      <div className="my-5 h-px bg-white/80" />

      <div className="mb-4 flex items-center gap-2">
        <Upload className="h-4 w-4 text-orange-500" />
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-600">{t("register.label.media")}</h3>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <FileDrop
          label={t("register.label.profilePhoto")}
          description={t("register.desc.profilePhoto")}
          file={art.profileFile}
          preview={art.profilePreview}
          onChange={(file) => onMediaFileChange("profile", file)}
        />
        <FileDrop
          label={t("register.label.coverPhoto")}
          description={t("register.desc.coverPhoto")}
          file={art.performanceFile}
          preview={art.performancePreview}
          tone="blue"
          onChange={(file) => onMediaFileChange("performance", file)}
        />
      </div>

      <div className="mt-5 space-y-4">
        <SectionHeading icon={Youtube} title={t("register.section.portfolio")} />
        <PortfolioLinksEditor
          links={art.youtubeLinks}
          onAdd={addYoutubeLink}
          onRemove={removeYoutubeLink}
          onUpdate={updateYoutubeLink}
        />
      </div>
    </div>
  );
}

const PortfolioLinksEditor = memo(function PortfolioLinksEditor({
  links,
  onAdd,
  onRemove,
  onUpdate,
}: {
  links: PortfolioLink[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, next: PortfolioLink) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="form-subcard space-y-4 rounded-2xl border border-orange-100 bg-orange-50/70 p-4 shadow-sm">
      {links.map((link, index) => {
        const trimmedUrl = link.url.trim();
        const thumbnailUrl = link.platform === "youtube" ? getYoutubeThumbnailUrl(trimmedUrl) : null;

        return (
          <div key={index} className="rounded-2xl border border-white/70 bg-white/65 p-4 shadow-sm backdrop-blur-md">
            <div className="grid gap-3 md:grid-cols-[132px_1fr_auto]">
              <div className="input-glass flex h-12 items-center gap-2 px-4 text-sm font-semibold text-[#1A1A1A]">
                <Youtube className="h-4 w-4 text-red-500" />
                YouTube
              </div>

              <label htmlFor={`youtube-link-${index}`} className="sr-only">YouTube Link {index + 1}</label>
              <input
                id={`youtube-link-${index}`}
                type="url"
                inputMode="url"
                value={link.url}
                onChange={(event) => onUpdate(index, { platform: "youtube", url: event.target.value })}
                placeholder={t("register.placeholder.youtubeLink") || "youtube.com/watch?v=..."}
                className="input-glass h-12 w-full px-4 text-sm text-[#1A1A1A] placeholder:text-slate-400"
                aria-label={`YouTube link ${index + 1}`}
              />

              {links.length > 1 ? (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="flex h-12 w-full items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 transition hover:bg-red-100 md:w-12"
                  aria-label="Remove portfolio link"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {thumbnailUrl ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50/70 px-4 py-3 text-xs font-semibold text-slate-700">
                  <Youtube className="h-4 w-4 shrink-0 text-red-500" />
                  <span className="min-w-0 flex-1 truncate">{trimmedUrl}</span>
                </div>
                <a
                  href={getExternalUrl(trimmedUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block aspect-video overflow-hidden rounded-xl border border-red-100 bg-black/5 shadow-sm"
                >
                  <img
                    src={thumbnailUrl}
                    alt={`YouTube portfolio preview ${index + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/15 transition group-hover:bg-black/25">
                    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600 text-white shadow-xl">
                      <Youtube className="h-8 w-8" />
                    </span>
                  </span>
                </a>
              </div>
            ) : trimmedUrl ? (
              <div className="mt-4">
                <div className="flex items-center gap-2 rounded-xl border border-orange-100 bg-white/60 px-4 py-3 text-xs font-semibold text-slate-500">
                  <Youtube className="h-4 w-4 text-orange-500" />
                  {t("register.desc.youtubeHelper")}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}

      <button
        type="button"
        onClick={onAdd}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-orange-100 bg-white/65 text-sm font-black text-slate-700 shadow-sm transition hover:border-orange-200 hover:bg-white"
      >
        <Plus className="h-4 w-4" />
        {t("register.btn.addMoreLinks")}
      </button>
    </div>
  );
});

function FileDrop({
  label,
  description,
  file,
  preview,
  helperText,
  required,
  tone = "orange",
  onChange,
}: {
  label: string;
  description: string;
  file: File | null;
  preview: string;
  helperText?: string;
  required?: boolean;
  tone?: "orange" | "blue" | "slate";
  onChange: (file: File | null) => void;
}) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [altText, setAltText] = useState("");
  const [dragging, setDragging] = useState(false);
  const uid = useId();
  const inputId = `filedrop-${uid}-file`;
  const altId = `filedrop-${uid}-alt`;

  const toneClass =
    tone === "blue"
      ? "border-blue-300 bg-blue-50/40 text-blue-500 hover:border-blue-500 hover:bg-blue-50/70"
      : tone === "slate"
      ? "border-slate-200 bg-slate-50/60 text-slate-500 hover:border-slate-400"
      : "border-orange-300 bg-orange-50/40 text-orange-500 hover:border-orange-500 hover:bg-orange-50/70";

  const draggingClass = dragging
    ? tone === "blue"
      ? "border-blue-500 bg-blue-100/60 scale-[1.02]"
      : "border-orange-500 bg-orange-100/60 scale-[1.02]"
    : "";

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    if (selected) onChange(selected);
    // Reset so same file can be re-selected
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files?.[0] ?? null;
    if (dropped) onChange(dropped);
  };

  const handleOpenPicker = () => {
    inputRef.current?.click();
  };

  return (
    <div>
      {label && (
        <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
          {label} {required ? <span className="text-red-500">*</span> : null}
        </label>
      )}
      {/* Off-screen input — NOT display:none — so .click() works on all browsers */}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden", zIndex: -1 }}
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={handleOpenPicker}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        aria-label={description}
        className={`relative flex h-36 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-200 ${toneClass} ${draggingClass}`}
      >
        {preview ? (
          <>
            <img src={preview} alt={altText || label || description} className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/30 text-sm font-black text-white opacity-0 transition hover:opacity-100">
              <Upload className="h-5 w-5" />
              {t("register.desc.changePhoto") || "Change photo"}
            </span>
          </>
        ) : (
          <>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/80 shadow-sm">
              {file ? <BadgeCheck className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
            </div>
            <span className="px-2 text-center text-sm font-black leading-tight">{description}</span>
            {!file && (
              <span className="mt-1 text-[10px] font-semibold opacity-60">{t("register.desc.dragDrop") || "or drag & drop"}</span>
            )}
          </>
        )}
      </button>

      {/* File name chip */}
      {file && !preview && (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-white/70 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm border border-slate-100">
          <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
          <span className="min-w-0 flex-1 truncate">{file.name}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="ml-1 text-red-400 hover:text-red-600"
            aria-label="Remove file"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {file && (
        <div className="mt-3">
          <label htmlFor={altId} className="mb-1 block text-xs font-bold text-slate-700">
            Image Description (Alt Text) <span className="text-red-500">*</span>
          </label>
          <input
            id={altId}
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder={`Describe the ${(label || description).toLowerCase()}`}
            className="input-premium w-full px-3 py-2 text-sm"
          />
        </div>
      )}
      {helperText ? <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{helperText}</p> : null}
    </div>
  );
}

function RoleTabs({
  activeRole,
  onChange,
}: {
  activeRole: AuthRole;
  onChange: (role: AuthRole) => void;
}) {
  return null;
}

function useRoleFromQuery(defaultRole: AuthRole = "artist") {
  const activeRole: AuthRole = "artist";
  const setActiveRole = (_role: AuthRole) => {};

  return [activeRole, setActiveRole] as const;
}

export default function ArtistRegister() {
  const { t } = useI18n(); // ADDED FOR i18n
  const [activeRole, setActiveRole] = useRoleFromQuery("artist");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingRole, setLoadingRole] = useState<AuthRole | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [aadharPreview, setAadharPreview] = useState("");
  const [liveFaceFile, setLiveFaceFile] = useState<File | null>(null);
  const [liveFacePreview, setLiveFacePreview] = useState("");
  const [galleryFiles, setGalleryFiles] = useState<Array<{ file: File; preview: string }>>([]);
  const [reelFiles, setReelFiles] = useState<LocalReelItem[]>([]);
  const [extraArtEntries, setExtraArtEntries] = useState<ExtraArtEntry[]>([]);
  const [primaryArtYoutubeLinks, setPrimaryArtYoutubeLinks] = useState<PortfolioLink[]>([createYoutubeLink()]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [showAgeOnProfile, setShowAgeOnProfile] = useState(true);
  const [showPrimaryPricingOnProfile, setShowPrimaryPricingOnProfile] = useState(false);
  // "Other" bank name free-text state
  const [customBankName, setCustomBankName] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();

  const artistSchema = useMemo(() => {
    const fullNameRule = z
      .string()
      .min(3, t("register.validation.fullNameMin"))
      .regex(/^[a-zA-Z\s.\-'\u00C0-\u017F]*$/, t("register.validation.fullNameRegex"));

    const usernameRule = z
      .string()
      .min(4, t("register.validation.usernameMin"))
      .regex(/^\S*$/, t("register.validation.usernameRegex"));

    const passwordRule = z
      .string()
      .min(8, t("register.validation.passwordMin"))
      .regex(/(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, t("register.validation.passwordRegex"));

    const mobileRule = z
      .string()
      .min(1, t("register.validation.phoneRequired"))
      .refine(validatePhoneNumber, t("register.validation.phoneDigits"));

    const emergencyRule = z
      .string()
      .min(1, t("register.validation.emergencyRequired"))
      .refine(validatePhoneNumber, t("register.validation.emergencyDigits"));

    const optionalPhoneRule = z
      .string()
      .optional()
      .refine((value) => !value || validatePhoneNumber(value), {
        message: t("register.validation.phoneDigits"),
      });

    const aadharRule = z.preprocess(
      (value) => String(value ?? "").replace(/\s/g, ""),
      z
        .string()
        .regex(/^\d{12}$/, t("register.validation.aadharDigits"))
    );
    const bankNameRule = z.string().min(1, t("register.validation.bankRequired"));
    const ifscRule = z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, t("register.validation.ifscFormat"));
    const accountRule = z
      .string()
      .min(9, t("register.validation.accountMin"))
      .max(18, t("register.validation.accountMax"))
      .regex(/^\d+$/, t("register.validation.accountDigits"));
    const stateRule = z.string().min(1, t("register.validation.stateRequired"));
    const districtRule = z.string().min(1, t("register.validation.districtRequired"));

    return z
      .object({
        fullName: fullNameRule,
        username: usernameRule,
        password: passwordRule,
        confirmPassword: z.string().min(1, t("register.validation.confirmPasswordRequired")),
        brandName: z.string().optional(),
        mobileNumber: mobileRule,
        emergencyNumber: emergencyRule,
        phoneOptional: optionalPhoneRule,
        dob: z.string().min(1, t("register.validation.dobRequired")),
        gender: z.string().min(1, t("register.validation.genderRequired")),
        travelWillingness: z.string().min(1, t("register.validation.travelRequired")),
        eventType: z.string().min(1, "Event Type is required."),
        mainCategory: z.string().min(1, t("register.validation.mainCategoryRequired")),
        artCategory: z.string().min(1, t("register.validation.artCategoryRequired")),
        soloPrice: z.string().optional(),
        duoPrice: z.string().optional(),
        teamPrice: z.string().optional(),
        state: stateRule,
        district: districtRule,
        experience: z.string().min(1, t("register.validation.experienceRequired")).regex(/^\d+$/, t("register.validation.experienceDigits")),
        bio: z.string().optional(),
        aadharNumber: aadharRule,
        bankName: bankNameRule,
        ifscCode: ifscRule,
        accountNumber: accountRule,
        confirmAccountNumber: z.string().min(1, t("register.validation.confirmAccountRequired")),
        portfolioUrl: z
          .union([
            z.string().regex(
              /^(https?:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/,
              t("register.validation.youtubeUrl")
            ),
            z.literal(""),
          ])
          .optional(),
        hasAssistant: z.boolean(),
        assistantName: z.string().optional(),
        assistantContact: z.string().optional(),
        suggestionComment: z.string().optional(),
        voucherType: z.enum(["normal", "premium"]),
      })
      .refine((values) => values.password === values.confirmPassword, {
        message: t("register.validation.passwordMismatch"),
        path: ["confirmPassword"],
      })
      .refine((values) => values.accountNumber === values.confirmAccountNumber, {
        message: t("register.validation.accountMismatch"),
        path: ["confirmAccountNumber"],
      });
  }, [t]);

  const userSchema = useMemo(() => {
    const fullNameRule = z
      .string()
      .min(3, t("register.validation.fullNameMin"))
      .regex(/^[a-zA-Z\s.\-'\u00C0-\u017F]*$/, t("register.validation.fullNameRegex"));

    const usernameRule = z
      .string()
      .min(4, t("register.validation.usernameMin"))
      .regex(/^\S*$/, t("register.validation.usernameRegex"));

    const passwordRule = z
      .string()
      .min(8, t("register.validation.passwordMin"))
      .regex(/(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, t("register.validation.passwordRegex"));

    const mobileRule = z
      .string()
      .min(1, t("register.validation.phoneRequired"))
      .refine(validatePhoneNumber, t("register.validation.phoneDigits"));

    return z
      .object({
        fullName: fullNameRule,
        username: usernameRule,
        password: passwordRule,
        confirmPassword: z.string().min(1, t("register.validation.confirmPasswordRequired")),
        phoneOptional: mobileRule,
      })
      .refine((values) => values.password === values.confirmPassword, {
        message: t("register.validation.passwordMismatch"),
        path: ["confirmPassword"],
      });
  }, [t]);

  const artistForm = useForm<ArtistRegistrationValues>({
    defaultValues: artistDefaults,
    mode: "onChange",
    resolver: zodResolver(artistSchema),
  });
  const userForm = useForm<UserRegistrationValues>({
    defaultValues: userDefaults,
    mode: "onChange",
    resolver: zodResolver(userSchema),
  });
  const selectedState = artistForm.watch("state");
  const selectedDob = artistForm.watch("dob");
  const hasAssistant = artistForm.watch("hasAssistant");
  const stateOptions = useMemo(() => getIndiaStates().map((state) => state.name), []);
  const [districts, setDistricts] = useState<string[]>([]);
  const [primaryEventTypes, setPrimaryEventTypes] = useState<string[]>(["Wedding", "Birthday", "Cultural Event"]);

  useEffect(() => {
    let active = true;

    if (!selectedState) {
      setDistricts([]);
      return () => {
        active = false;
      };
    }

    setDistricts([]);
    getIndiaDistrictsByStateName(selectedState)
      .then((options) => {
        if (active) setDistricts(options);
      })
      .catch((error) => {
        console.error("Failed to load districts", error);
        if (active) setDistricts([]);
      });

    return () => {
      active = false;
    };
  }, [selectedState]);

  useEffect(() => {
    return () => {
      if (profilePreview) URL.revokeObjectURL(profilePreview);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      if (aadharPreview) URL.revokeObjectURL(aadharPreview);
      galleryFiles.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, [aadharPreview, coverPreview, galleryFiles, profilePreview]);

  const setPreviewFile = (
    file: File | null,
    currentPreview: string,
    setFile: (file: File | null) => void,
    setPreview: (preview: string) => void
  ) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({ variant: "destructive", title: "Invalid image", description: validation.message });
      return;
    }

    if (currentPreview) URL.revokeObjectURL(currentPreview);
    setFile(file);
    setPreview(file ? URL.createObjectURL(file) : "");
  };

  const addGalleryFile = (file: File | null) => {
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({ variant: "destructive", title: "Invalid image", description: validation.message });
      return;
    }

    if (galleryFiles.length >= 10) {
      toast({ variant: "destructive", title: "Gallery limit", description: "You can upload up to 10 gallery photos." });
      return;
    }
    setGalleryFiles((current) => [...current, { file, preview: URL.createObjectURL(file) }]);
  };

  const removeGalleryFile = (index: number) => {
    setGalleryFiles((current) => {
      const item = current[index];
      if (item) URL.revokeObjectURL(item.preview);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const handleAddReel = (file: File, title = "Performance Reel") => {
    const newReel: LocalReelItem = {
      id: `local_reel_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      title,
    };
    setReelFiles((prev) => [...prev, newReel]);
  };

  const handleRemoveReel = (id: string) => {
    setReelFiles((prev) => {
      const target = prev.find((r) => r.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((r) => r.id !== id);
    });
  };

  const handleUpdateReelTitle = (id: string, title: string) => {
    setReelFiles((prev) =>
      prev.map((r) => (r.id === id ? { ...r, title } : r))
    );
  };

  const toggleLanguage = (language: string) => {
    setSelectedLanguages((current) =>
      current.includes(language) ? current.filter((item) => item !== language) : [...current, language]
    );
  };

  const addArtEntry = () => {
    const newEntry = createExtraArtEntry();
    setExtraArtEntries((current) => [...current, newEntry]);
    toast({
      title: "Service Added",
      description: `New service card added. Please configure your service details.`,
    });
    setTimeout(() => {
      const el = document.getElementById(`service-card-${newEntry.id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const updateExtraArtEntry = (id: string, nextEntry: ExtraArtEntry) => {
    setExtraArtEntries((current) => current.map((entry) => (entry.id === id ? nextEntry : entry)));
  };

  const updateExtraArtMediaFile = (id: string, field: ExtraArtMediaField, file: File | null) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({ variant: "destructive", title: "Invalid image", description: validation.message });
      return;
    }

    const fileKey = field === "profile" ? "profileFile" : "performanceFile";
    const previewKey = field === "profile" ? "profilePreview" : "performancePreview";

    setExtraArtEntries((current) =>
      current.map((entry) => {
        if (entry.id !== id) return entry;
        if (entry[previewKey]) URL.revokeObjectURL(entry[previewKey]);
        return {
          ...entry,
          [fileKey]: file,
          [previewKey]: file ? URL.createObjectURL(file) : "",
        };
      })
    );
  };

  const removeExtraArtEntry = (id: string) => {
    setExtraArtEntries((current) => {
      const removedEntry = current.find((entry) => entry.id === id);
      if (removedEntry?.profilePreview) URL.revokeObjectURL(removedEntry.profilePreview);
      if (removedEntry?.performancePreview) URL.revokeObjectURL(removedEntry.performancePreview);
      return current.filter((entry) => entry.id !== id);
    });
  };

  const addPrimaryArtYoutubeLink = useCallback(() => {
    setPrimaryArtYoutubeLinks((current) => [...current, createYoutubeLink()]);
  }, []);

  const updatePrimaryArtYoutubeLink = useCallback((index: number, nextLink: PortfolioLink) => {
    setPrimaryArtYoutubeLinks((current) => current.map((link, linkIndex) => (linkIndex === index ? nextLink : link)));
  }, []);

  const removePrimaryArtYoutubeLink = useCallback((index: number) => {
    setPrimaryArtYoutubeLinks((current) => {
      const next = current.filter((_, linkIndex) => linkIndex !== index);
      return next.length > 0 ? next : [createYoutubeLink()];
    });
  }, []);

  const uploadRegistrationMedia = async (uid: string, preparedExtraArts: PreparedExtraArtEntry[]) => {
    if (!profileFile) {
      throw new Error("Profile image is required before submitting.");
    }

    const profileUpload = await uploadArtistRegistrationImage(uid, profileFile, "profile");
    const [coverUpload, aadharUpload, liveFaceUpload, galleryUploads, extraArtUploads, uploadedReels] = await Promise.all([
      uploadOptionalArtistImage(uid, coverFile, "cover"),
      uploadOptionalArtistImage(uid, aadharFile, `private-documents/${uid}/identity`),
      uploadOptionalArtistImage(uid, liveFaceFile, `private-documents/${uid}/live_face`),
      Promise.all(
        galleryFiles.map((item, index) =>
          uploadArtistRegistrationImage(uid, item.file, `gallery/${index + 1}`)
        )
      ),
      Promise.all(
        preparedExtraArts.map(async (entry, index) => {
          const [profileMedia, performanceMedia] = await Promise.all([
            uploadOptionalArtistImage(uid, entry.profileFile, `arts/${index + 2}/profile`),
            uploadOptionalArtistImage(uid, entry.performanceFile, `arts/${index + 2}/performance`),
          ]);

          return {
            id: entry.id,
            profilePhoto: profileMedia.downloadUrl,
            profileStoragePath: profileMedia.storagePath,
            performancePhoto: performanceMedia.downloadUrl,
            performanceStoragePath: performanceMedia.storagePath,
          };
        })
      ),
      Promise.all(
        reelFiles.map(async (reel, index) => {
          try {
            const cleanName = reel.file.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_.-]/g, "");
            const url = await uploadVideoFile(
              reel.file,
              `reels/${uid}/${Date.now()}_${index + 1}_${cleanName}`
            );
            if (!url || url.startsWith("data:")) return null;
            return {
              id: `reel_${Date.now()}_${index + 1}`,
              url,
              videoUrl: url,
              title: reel.title || "Performance Reel",
              type: "uploaded_video",
            };
          } catch (vErr) {
            console.warn("Reel video upload error:", vErr);
            return null;
          }
        })
      ),
    ]);

    return {
      profilePhoto: profileUpload.downloadUrl,
      profileStoragePath: profileUpload.storagePath,
      coverPhoto: coverUpload.downloadUrl,
      coverStoragePath: coverUpload.storagePath,
      aadharPhoto: aadharUpload.downloadUrl,
      aadharStoragePath: aadharUpload.storagePath,
      liveFacePhoto: liveFaceUpload.downloadUrl,
      liveFaceStoragePath: liveFaceUpload.storagePath,
      galleryPhotos: galleryUploads.map((item) => item.downloadUrl),
      galleryStoragePaths: galleryUploads.map((item) => item.storagePath),
      reels: (uploadedReels || []).filter(Boolean),
      extraArtUploads,
    };
  };

  const scrollToError = () => {
    errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const submitArtist = async (values: ArtistRegistrationValues) => {
    // Resolve effective bank name (handle "Other" free-text input)
    const effectiveBankName =
      values.bankName === "Other"
        ? customBankName.trim()
        : values.bankName;

    if (values.bankName === "Other" && effectiveBankName.length < 2) {
      toast({
        variant: "destructive",
        title: t("register.toast.bankRequiredTitle"),
        description: t("register.toast.bankRequiredDesc"),
      });
      scrollToError();
      return;
    }

    const preparedExtraArts = extraArtEntries
      .map((entry) => ({
        ...entry,
        mainCategory: entry.mainCategory.trim(),
        category: entry.category.trim(),
        soloPrice: entry.soloPrice.trim(),
        duoPrice: entry.duoPrice.trim(),
        teamPrice: entry.teamPrice.trim(),
        showPricingOnProfile: entry.showPricingOnProfile,
        youtubeLinks: getSubmittedYoutubeLinks(entry.youtubeLinks),
      }))
      .filter(
        (entry) =>
          entry.category ||
          entry.soloPrice ||
          entry.duoPrice ||
          entry.teamPrice ||
          entry.youtubeLinks.length > 0 ||
          entry.profileFile ||
          entry.performanceFile
      );
    if (preparedExtraArts.some((entry) => !entry.category || !entry.mainCategory)) {
      toast({ variant: "destructive", title: t("register.toast.categoryMissingTitle") || "Category Missing", description: t("register.toast.categoryMissingDesc") || "Please select both a category and subcategory for all services." });
      return;
    }

    // Validate that duplicate category + subcategory combinations are not selected
    const allServicesList = [
      { category: values.mainCategory.trim().toLowerCase(), subcategory: values.artCategory.trim().toLowerCase() },
      ...preparedExtraArts.map((e) => ({
        category: e.mainCategory.trim().toLowerCase(),
        subcategory: e.category.trim().toLowerCase(),
      })),
    ];
    const serviceSet = new Set<string>();
    for (const item of allServicesList) {
      const key = `${item.category}:::${item.subcategory}`;
      if (serviceSet.has(key)) {
        toast({
          variant: "destructive",
          title: "Duplicate Service Detected",
          description: "You have added the same Category and Subcategory combination more than once. Please choose distinct services or remove duplicates.",
        });
        return;
      }
      serviceSet.add(key);
    }

    const profileValidation = validateImageFile(profileFile, true);
    if (!profileValidation.valid) {
      toast({ variant: "destructive", title: t("register.toast.profileImageTitle"), description: profileValidation.message });
      scrollToError();
      return;
    }

    setLoadingRole("artist");

    try {
      const rawUsername = values.username.trim().toLowerCase();
      const sdkEmail = rawUsername.includes("@") ? rawUsername : `${rawUsername}@mykalakar.app`;
      const normalizedUsername = rawUsername;
      const email = sdkEmail;
      const authResult = await authRegister(sdkEmail, values.password);

      if (!authResult.success) {
        toast({ variant: "destructive", title: t("common.error") || "Registration failed", description: authResult.message });
        return;
      }

      const uid = authResult.uid;
      const {
        profilePhoto,
        profileStoragePath,
        coverPhoto,
        coverStoragePath,
        aadharPhoto,
        aadharStoragePath,
        liveFacePhoto,
        liveFaceStoragePath,
        galleryPhotos,
        galleryStoragePaths,
        reels,
        extraArtUploads,
      } = await uploadRegistrationMedia(uid, preparedExtraArts);
      const extraArtUploadMap = new Map<
        string,
        {
          id: string;
          profilePhoto: string;
          profileStoragePath: string;
          performancePhoto: string;
          performanceStoragePath: string;
        }
      >(extraArtUploads.map((item) => [item.id, item]));
      const primaryCategoryYoutubeLinks = getSubmittedYoutubeLinks(primaryArtYoutubeLinks);
      const normalizeSubmittedCategory = (value: string) => normalizeArtistType(value) ?? value.trim();
      const buildCategoryEntry = ({
        mainCategory,
        category,
        soloPrice,
        duoPrice,
        teamPrice,
        showPricingOnProfile,
        youtubeLinks,
      }: {
        mainCategory: string;
        category: string;
        soloPrice: string | number;
        duoPrice: string | number;
        teamPrice: string | number;
        showPricingOnProfile: boolean;
        youtubeLinks: string[];
      }) => {
        const artForm = normalizeSubmittedCategory(category);
        const soloPerformancePrice = Number(soloPrice) || 0;
        const duoPerformancePrice = Number(duoPrice) || 0;
        const teamPerformancePrice = Number(teamPrice) || 0;

        return {
          mainCategory,
          artForm,
          category: artForm,
          subcategory: artForm,
          types: [],
          soloPerformancePrice,
          duoPerformancePrice,
          teamPerformancePrice,
          soloPrice: soloPerformancePrice,
          duoPrice: duoPerformancePrice,
          teamPrice: teamPerformancePrice,
          showPricingOnProfile,
          youtubeLinks,
        };
      };
      const artEntries = [
        buildCategoryEntry({
          mainCategory: values.mainCategory,
          category: values.artCategory,
          soloPrice: values.soloPrice || "",
          duoPrice: values.duoPrice || "",
          teamPrice: values.teamPrice || "",
          showPricingOnProfile: showPrimaryPricingOnProfile,
          youtubeLinks: primaryCategoryYoutubeLinks,
        }),
        ...preparedExtraArts.map((entry) => buildCategoryEntry({
          mainCategory: entry.mainCategory,
          category: entry.category,
          soloPrice: entry.soloPrice,
          duoPrice: entry.duoPrice,
          teamPrice: entry.teamPrice,
          showPricingOnProfile: entry.showPricingOnProfile,
          youtubeLinks: entry.youtubeLinks,
        })),
      ];
      const youtubeLinks = Array.from(new Set(artEntries.flatMap((entry) => entry.youtubeLinks)));
      const socialLinks = youtubeLinks.map((url) => ({ platform: "youtube" as const, url }));
      const categoryMedia = [
        {
          mainCategory: artEntries[0]?.mainCategory || values.mainCategory,
          category: artEntries[0]?.category || values.artCategory,
          artForm: artEntries[0]?.artForm || values.artCategory,
          profilePhotos: [profilePhoto].filter(Boolean),
          performancePhotos: [coverPhoto, ...galleryPhotos].filter(Boolean),
          youtubeLinks: primaryCategoryYoutubeLinks,
        },
        ...preparedExtraArts.map((entry, index) => {
          const media = extraArtUploadMap.get(entry.id);
          const artEntry = artEntries[index + 1];

          return {
            mainCategory: artEntry?.mainCategory || entry.mainCategory,
            category: artEntry?.category || entry.category,
            artForm: artEntry?.artForm || entry.category,
            profilePhotos: media?.profilePhoto ? [media.profilePhoto] : [],
            performancePhotos: media?.performancePhoto ? [media.performancePhoto] : [],
            youtubeLinks: entry.youtubeLinks,
          };
        }),
      ];
      const artForms = Array.from(new Set(artEntries.map((entry) => entry.artForm).filter(Boolean)));
      const categoryNames = Array.from(new Set(artEntries.map((entry) => entry.artForm).filter(Boolean)));
      const artistProfile = {
        artForms,
        experience: Number(values.experience) || 0,
        bio: values.bio || "",
        location: [values.district, values.state].filter(Boolean).join(", "),
        profileImage: profilePhoto,
        coverImage: coverPhoto,
        youtubeLinks,
      };

      const privatePayload = sanitizePayload({
        uid,
        aadharNumber: values.aadharNumber || "",
        aadharPhoto: aadharPhoto || "",
        aadharStoragePath: aadharStoragePath || "",
        liveFacePhoto: liveFacePhoto || "",
        liveFaceStoragePath: liveFaceStoragePath || "",
        bankName: effectiveBankName || "",
        ifscCode: values.ifscCode || "",
        accountNumber: values.accountNumber || "",
        bankDetails: {
          bankName: effectiveBankName || "",
          ifscCode: values.ifscCode || "",
          accountNumber: values.accountNumber || "",
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const servicesList = [
        {
          event: values.eventType || primaryEventTypes[0] || "Wedding",
          eventTypes: primaryEventTypes,
          category: values.mainCategory || "",
          subcategory: values.artCategory || "",
          artForm: values.artCategory || "",
          soloPrice: artEntries[0]?.soloPerformancePrice || 0,
          duoPrice: artEntries[0]?.duoPerformancePrice || 0,
          teamPrice: artEntries[0]?.teamPerformancePrice || 0,
          showPricingOnProfile: artEntries[0]?.showPricingOnProfile || false,
          showPriceOnProfile: artEntries[0]?.showPricingOnProfile || false,
          youtubeLinks: primaryCategoryYoutubeLinks,
        },
        ...preparedExtraArts.map((entry) => ({
          event: entry.eventType || entry.eventTypes?.[0] || values.eventType || "Wedding",
          eventTypes: entry.eventTypes || [entry.eventType || "Wedding"],
          category: entry.mainCategory || "",
          subcategory: entry.category || "",
          artForm: entry.category || "",
          soloPrice: entry.soloPrice ? Number(entry.soloPrice) : 0,
          duoPrice: entry.duoPrice ? Number(entry.duoPrice) : 0,
          teamPrice: entry.teamPrice ? Number(entry.teamPrice) : 0,
          showPricingOnProfile: Boolean(entry.showPricingOnProfile),
          showPriceOnProfile: Boolean(entry.showPricingOnProfile),
          profilePhoto: extraArtUploadMap.get(entry.id)?.profilePhoto || "",
          performancePhoto: extraArtUploadMap.get(entry.id)?.performancePhoto || "",
          youtubeLinks: entry.youtubeLinks,
        })),
      ];

      const payload = sanitizePayload({
        uid,
        status: "pending",
        fullName: values.fullName,
        name: values.fullName,
        username: normalizedUsername,
        email,
        phone: values.mobileNumber,
        mobileNumber: values.mobileNumber,
        emergencyNumber: values.emergencyNumber,
        phoneOptional: values.phoneOptional || "",
        dob: values.dob || "",
        showAgeOnProfile,
        gender: values.gender || "",
        travelWillingness: values.travelWillingness,
        primaryEventType: values.eventType || primaryEventTypes[0] || "Wedding",
        primaryCategory: values.mainCategory || "",
        primarySubcategory: values.artCategory || "",
        eventType: values.eventType || primaryEventTypes[0] || "Wedding",
        mainCategory: values.mainCategory || "",
        category: values.mainCategory || "",
        subcategory: values.artCategory || "",
        categories: categoryNames,
        categoriesArray: artEntries,
        artsList: artEntries,
        services: servicesList,
        artistProfile,
        soloPrice: artEntries[0]?.soloPerformancePrice || 0,
        duoPrice: artEntries[0]?.duoPerformancePrice || 0,
        teamPrice: artEntries[0]?.teamPerformancePrice || 0,
        showPricingOnProfile: artEntries[0]?.showPricingOnProfile || false,
        showPriceOnProfile: artEntries[0]?.showPricingOnProfile || false,
        state: values.state,
        district: values.district,
        experience: Number(values.experience),
        bio: values.bio || "",
        description: values.bio || "",
        availability: "available",
        bankName: effectiveBankName,
        ifscCode: values.ifscCode ? "XXXX" : "",
        bankAccountMasked: values.accountNumber ? `XXXX XXXX ${values.accountNumber.slice(-4)}` : "",
        media: {
          profilePhoto,
          profileImageUrl: profilePhoto,
          profileStoragePath,
          coverPhoto,
          coverImageUrl: coverPhoto,
          coverStoragePath,
          aadharPhoto,
          aadharStoragePath,
          liveFacePhoto,
          liveFaceStoragePath,
          galleryPhotos,
          galleryStoragePaths,
          reels,
          categoryMedia,
        },
        profilePhoto,
        profileImageUrl: profilePhoto,
        coverPhoto,
        coverImageUrl: coverPhoto,
        aadharPhoto,
        liveFacePhoto,
        galleryPhotos,
        reels,
        socialLinks,
        youtubeLinks,
        portfolioUrl: socialLinks[0]?.url || values.portfolioUrl || "",
        assistant: {
          hasAssistant: values.hasAssistant,
          name: values.assistantName || "",
          contact: values.assistantContact || "",
          needAssistant: values.hasAssistant ? "yes" : "no",
        },
        suggestionComment: values.suggestionComment || "",
        mediaUploadStatus: "uploaded",
        mediaUploadWarnings: [],
        voucherType: values.voucherType,
        isPremium: values.voucherType === "premium",
        verified: values.voucherType === "premium" ? true : false,
        trending: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const batch = writeBatch(db);
      batch.set(doc(collection(db, "artist_applications")), payload);
      batch.set(doc(db, "artists", uid), payload, { merge: true });
      batch.set(doc(db, "artistPrivate", uid), privatePayload, { merge: true });
      batch.set(
        doc(db, "users", uid),
        sanitizePayload({
          uid,
          role: "artist",
          username: normalizedUsername,
          email,
          name: values.fullName,
          phone: values.mobileNumber,
          artistProfile: {
            ...artistProfile,
            voucherType: values.voucherType,
            isPremium: values.voucherType === "premium",
            verified: values.voucherType === "premium" ? true : false,
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
        { merge: true }
      );
      await withTimeout(
        batch.commit(),
        FIREBASE_WRITE_TIMEOUT_MS,
        "Could not submit your artist application."
      );
      // Session is intentionally kept alive after successful registration.
      // The user is redirected to the pending-review screen so they can
      // see their application status without needing to log in again.
      toast({
        title: t("register.toast.submittedTitle"),
        description: t("register.toast.submittedDesc"),
      });
      navigate("/pending-review");
    } catch (error) {
      logFirebaseError(error, "Artist Registration Submission");
      if (auth.currentUser) {
        console.warn("Rolling back Auth user registration due to metadata write failure...");
        try {
          const { deleteUser } = await import("firebase/auth");
          await deleteUser(auth.currentUser);
        } catch (deleteError) {
          console.error("Failed to delete user during registration rollback:", deleteError);
        }
      }
      toast({
        variant: "destructive",
        title: t("common.error") || "Registration failed",
        description: firebaseErrorMessage(error, t("register.toast.submitFailed") || "Could not submit your artist registration."),
      });
      scrollToError();
    } finally {
      setLoadingRole(null);
    }
  };

  const submitUser = async (values: UserRegistrationValues) => {
    setLoadingRole("user");
    try {
      const rawUsername = values.username.trim().toLowerCase();
      const sdkEmail = rawUsername.includes("@") ? rawUsername : `${rawUsername}@mykalakar.app`;
      const normalizedUsername = rawUsername;
      const email = sdkEmail;
      const authResult = await authRegister(sdkEmail, values.password);

      if (!authResult.success) {
        toast({ variant: "destructive", title: t("common.error") || "Registration failed", description: authResult.message });
        return;
      }

      await withTimeout(
        setDoc(
          doc(db, "users", authResult.uid),
          sanitizePayload({
            uid: authResult.uid,
            name: values.fullName,
            username: normalizedUsername,
            email,
            phone: values.phoneOptional || "",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }),
          { merge: true }
        ),
        FIREBASE_WRITE_TIMEOUT_MS,
        "Could not save your user profile."
      );

      toast({ title: t("register.toast.createdTitle"), description: t("register.toast.createdDesc") });
      navigate("/profile");
    } catch (error) {
      logFirebaseError(error, "User Registration Submission");
      if (auth.currentUser) {
        console.warn("Rolling back Auth user registration due to metadata write failure...");
        try {
          const { deleteUser } = await import("firebase/auth");
          await deleteUser(auth.currentUser);
        } catch (deleteError) {
          console.error("Failed to delete user during registration rollback:", deleteError);
        }
      }
      toast({
        variant: "destructive",
        title: t("common.error") || "Registration failed",
        description: firebaseErrorMessage(error, t("register.toast.createFailed") || "Could not create your account."),
      });
      scrollToError();
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="register-page auth-page relative z-10 flex min-h-screen w-full flex-col justify-center overflow-visible px-4">
      <div className="registration-shell mx-auto grid w-full max-w-6xl gap-6 pb-16 lg:grid-cols-[360px_1fr]">
        <aside className="registration-visual-panel hidden min-h-[720px] overflow-hidden rounded-lg border border-white/10 bg-white/[0.055] p-8 shadow-2xl backdrop-blur-2xl lg:flex lg:flex-col lg:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-cyan-100">
              {t("register.creatorOnboarding")} {/* ADDED FOR i18n */}
            </span>
            <h2 className="mt-6 text-3xl xl:text-[34px] font-extrabold leading-snug text-white tracking-tight">
              {t("register.visualTitle", { defaultValue: "Build a profile that feels stage-ready." })}
            </h2>
          </div>
          <div className="grid gap-3">
            {[t("register.identity"), t("register.artForms"), t("register.pricing"), t("register.portfolio")].map((item) => ( // ADDED FOR i18n
              <div key={item} className="rounded-lg border border-white/10 bg-white/[0.07] p-4 text-sm font-extrabold text-white/82 backdrop-blur-2xl">
                {item}
              </div>
            ))}
          </div>
        </aside>
        <div className="registration-panel glass-panel min-h-[720px] overflow-visible rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-3xl sm:p-10 md:p-12">
          <div className="mb-8 flex items-center justify-between gap-3"> {/* ADDED FOR i18n */}
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white/70 px-4 py-2 text-sm font-bold text-slate-500 shadow-sm transition hover:text-orange-600"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("auth.backHome")} {/* ADDED FOR i18n */}
            </Link>
            <div className="flex items-center gap-2"> {/* ADDED FOR i18n */}
              <Link
                to={`/login?role=${activeRole}`}
                className="text-sm font-black text-orange-500 transition hover:text-orange-600"
              >
                {t("auth.loginArrow")} {/* ADDED FOR i18n */}
              </Link>
              <LanguageSwitcher compact /> {/* ADDED FOR i18n */}
            </div>
          </div>

          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl gradient-bg shadow-[0_12px_40px_rgba(232,111,58,0.25)]">
              <Music className="h-7 w-7 text-white" />
            </div>
            <h1 className="font-display text-4xl font-black tracking-tight text-[#1A1A1A] md:text-5xl">
              {t("register.join")} <span className="gradient-text-primary">{t("brand.name")}</span>
              {t("register.asArtist")} {/* ADDED FOR i18n */}
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {t("register.subtitle")} {/* ADDED FOR i18n */}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key="artist"
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 18 }}
              transition={{ duration: 0.28 }}
              onSubmit={artistForm.handleSubmit(submitArtist, scrollToError)}
              className="mt-8 space-y-8"
              noValidate
            >
                <div ref={errorRef} className="scroll-mt-24" />
                <SectionHeading icon={Lock} title={t("register.section.loginAccount")} />

                <div className="form-subcard rounded-2xl border border-orange-200/70 bg-orange-50/50 p-5">
                  <p className="mb-4 text-sm font-semibold text-slate-500">
                    {t("register.section.loginAccountDesc")}
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField
                      label={t("register.label.username")}
                      name="username"
                      register={artistForm.register}
                      error={artistForm.formState.errors.username?.message}
                      icon={AtSign}
                      placeholder={t("register.placeholder.username")}
                      className="md:col-span-2"
                    />
                    <Controller
                      name="password"
                      control={artistForm.control}
                      render={({ field }) => (
                        <div className="md:col-span-1">
                          <PasswordField
                            label={t("register.label.password")}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            error={artistForm.formState.errors.password?.message}
                            show={showPassword}
                            onToggle={() => setShowPassword((current) => !current)}
                            placeholder={t("register.placeholder.password")}
                          />
                          <PasswordStrengthMeter password={field.value} />
                        </div>
                      )}
                    />
                    <Controller
                      name="confirmPassword"
                      control={artistForm.control}
                      render={({ field }) => (
                        <PasswordField
                          label={t("register.label.confirmPassword")}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          error={artistForm.formState.errors.confirmPassword?.message}
                          show={showPassword}
                          onToggle={() => setShowPassword((current) => !current)}
                          placeholder={t("register.placeholder.confirmPassword")}
                        />
                      )}
                    />
                  </div>
                </div>

                <SectionHeading icon={User} title={t("register.section.personalInfo")} />

                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label={t("register.label.fullName")}
                    name="fullName"
                    register={artistForm.register}
                    error={artistForm.formState.errors.fullName?.message}
                    placeholder={t("register.placeholder.fullName")}
                  />
                  <TextField
                    label={t("register.label.brandName")}
                    name="brandName"
                    register={artistForm.register}
                    error={artistForm.formState.errors.brandName?.message}
                    placeholder={t("register.placeholder.brandName")}
                  />
                  <Controller
                    name="mobileNumber"
                    control={artistForm.control}
                    render={({ field }) => (
                      <div>
                        <label className="mb-1.5 block text-sm font-bold text-slate-700">{t("register.label.phone")}</label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          value={field.value}
                          onBlur={field.onBlur}
                          onChange={(event) => field.onChange(sanitizePhoneNumber(event.target.value))}
                          placeholder={PHONE_PLACEHOLDER}
                          maxLength={PHONE_MAX_LENGTH}
                          className={`${inputClass} ${artistForm.formState.errors.mobileNumber ? errorInputClass : ""}`}
                        />
                        <FieldError message={artistForm.formState.errors.mobileNumber?.message} />
                      </div>
                    )}
                  />
                  <Controller
                    name="emergencyNumber"
                    control={artistForm.control}
                    render={({ field }) => (
                      <div>
                        <label className="mb-1.5 block text-sm font-bold text-slate-700">{t("register.label.emergency")}</label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          value={field.value}
                          onBlur={field.onBlur}
                          onChange={(event) => field.onChange(sanitizePhoneNumber(event.target.value))}
                          placeholder={PHONE_PLACEHOLDER}
                          maxLength={PHONE_MAX_LENGTH}
                          className={`${inputClass} ${artistForm.formState.errors.emergencyNumber ? errorInputClass : ""}`}
                        />
                        <FieldError message={artistForm.formState.errors.emergencyNumber?.message} />
                      </div>
                    )}
                  />
                  <Controller
                    name="dob"
                    control={artistForm.control}
                    render={({ field }) => (
                      <DateOfBirthSelect
                        label={t("register.label.dob")}
                        required
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={artistForm.formState.errors.dob?.message}
                      />
                    )}
                  />
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                        {t("register.label.ageDisplay")}
                      </span>
                    </label>
                    <input
                      value={getAgeLabel(selectedDob)}
                      readOnly
                      tabIndex={-1}
                      className="input-glass w-full cursor-not-allowed bg-white/50 px-4 py-3 text-sm font-black text-orange-600"
                    />
                    <PremiumCheckbox
                      checked={showAgeOnProfile}
                      onChange={setShowAgeOnProfile}
                      label={t("register.label.showAgeOnProfile")}
                      className="mt-2 min-h-9 px-3 text-xs"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">{t("register.label.gender")}</label>
                    <select {...artistForm.register("gender")} className={`${inputClass} ${artistForm.formState.errors.gender ? errorInputClass : ""}`}>
                      <option value="">{t("register.placeholder.gender")}</option>
                      <option value="male">{t("register.gender.male")}</option>
                      <option value="female">{t("register.gender.female")}</option>
                      <option value="other">{t("register.gender.other")}</option>
                    </select>
                    <FieldError message={artistForm.formState.errors.gender?.message} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">{t("register.label.travel")}</label>
                    <select {...artistForm.register("travelWillingness")} className={inputClass}>
                      <option value="local">{t("register.travel.local")}</option>
                      <option value="state">{t("register.travel.state")}</option>
                      <option value="all">{t("register.travel.all")}</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <SearchableLanguageSelect
                      label={t("register.label.languages")}
                      values={selectedLanguages}
                      onChange={setSelectedLanguages}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-b border-orange-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="font-display text-xl font-bold text-[#2E3A47]">Services & Expertise</h2>
                  <button
                    type="button"
                    onClick={addArtEntry}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-orange-200 transition hover:opacity-95 active:scale-95 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Add Another Service
                  </button>
                </div>

                <div className="form-subcard rounded-2xl border border-sky-100 bg-sky-100/70 p-5 shadow-inner">
                  <p className="mb-4 text-sm font-black text-slate-500">Service 1</p>
                  
                  <div className="space-y-4">
                    {/* 1. What do you offer? */}
                    <SearchableArtSelector
                      label="What do you offer?"
                      value={artistForm.watch("artCategory")}
                      placeholder="Search or select your art / service (e.g. Singer, Kirtankar, DJ)..."
                      error={artistForm.formState.errors.artCategory?.message}
                      onSelect={(opt) => {
                        artistForm.setValue("artCategory", opt.name, { shouldValidate: true });
                        artistForm.setValue("mainCategory", opt.primaryCategory, { shouldValidate: true });
                        artistForm.setValue("eventType", opt.defaultEventTypes[0] || "Wedding", { shouldValidate: true });
                        setPrimaryEventTypes(opt.defaultEventTypes);
                      }}
                    />

                    {/* 2. Auto-identified Category & Subcategory */}
                    {artistForm.watch("artCategory") && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                            Category
                          </label>
                          {(() => {
                            const details = getArtOptionDetails(artistForm.watch("artCategory"));
                            return details.allCategories.length > 1 ? (
                              <SearchableDropdown
                                label=""
                                value={artistForm.watch("mainCategory") || details.primaryCategory}
                                options={details.allCategories}
                                placeholder="Select Category"
                                onChange={(val) => artistForm.setValue("mainCategory", val, { shouldValidate: true })}
                              />
                            ) : (
                              <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-white/90 px-3.5 text-xs font-bold text-slate-800 shadow-sm">
                                {artistForm.watch("mainCategory") || details.primaryCategory}
                              </div>
                            );
                          })()}
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                            Subcategory / Art Form
                          </label>
                          <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-white/90 px-3.5 text-xs font-bold text-slate-800 shadow-sm">
                            {artistForm.watch("artCategory")}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. Where do you perform this? */}
                    {artistForm.watch("artCategory") && (
                      <EventTypeMultiSelect
                        selectedEvents={primaryEventTypes}
                        onChange={(events) => {
                          setPrimaryEventTypes(events);
                          if (events.length > 0) {
                            artistForm.setValue("eventType", events[0]);
                          }
                        }}
                      />
                    )}
                  </div>

                  <div className="my-5 h-px bg-white/80" />

                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-orange-500" />
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-600">{t("register.label.pricing")}</h3>
                    </div>
                    <PremiumCheckbox
                      checked={showPrimaryPricingOnProfile}
                      onChange={setShowPrimaryPricingOnProfile}
                      label={t("register.label.showPricing")}
                      className="w-full justify-start sm:w-auto"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <TextField label={t("register.label.soloPrice")} name="soloPrice" register={artistForm.register} placeholder={t("register.placeholder.price")} />
                    <TextField label={t("register.label.duoPrice")} name="duoPrice" register={artistForm.register} placeholder={t("register.placeholder.price")} />
                    <TextField label={t("register.label.teamPrice")} name="teamPrice" register={artistForm.register} placeholder={t("register.placeholder.price")} />
                  </div>

                  <div className="my-5 h-px bg-white/80" />

                  <div className="mb-4 flex items-center gap-2">
                    <Upload className="h-4 w-4 text-orange-500" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-600">{t("register.label.media")}</h3>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    <FileDrop
                      label={t("register.label.profilePhoto")}
                      description={t("register.desc.profilePhoto")}
                      file={profileFile}
                      preview={profilePreview}
                      required
                      helperText={PROFILE_IMAGE_HELPER_TEXT}
                      onChange={(file) => setPreviewFile(file, profilePreview, setProfileFile, setProfilePreview)}
                    />
                    <FileDrop
                      label={t("register.label.coverPhoto")}
                      description={t("register.desc.coverPhoto")}
                      file={coverFile}
                      preview={coverPreview}
                      tone="blue"
                      onChange={(file) => setPreviewFile(file, coverPreview, setCoverFile, setCoverPreview)}
                    />
                  </div>

                  <div className="mt-5">
                    <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">{t("register.label.performancePhotos")}</label>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                      {galleryFiles.map((item, index) => (
                        <div key={item.preview} className="relative aspect-square overflow-hidden rounded-xl border border-white/70">
                          <img src={item.preview} alt={`Gallery ${index + 1}`} className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeGalleryFile(index)}
                            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-red-500"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <FileDrop
                        label=""
                        description={t("register.desc.addPhoto")}
                        file={null}
                        preview=""
                        onChange={addGalleryFile}
                      />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{t("register.desc.performancePhotosHelper")}</p>
                  </div>

                  {/* Performance Reels & Video Highlights */}
                  <div className="mt-5">
                    <ArtistReelsUploader
                      reels={reelFiles}
                      onAddReel={handleAddReel}
                      onRemoveReel={handleRemoveReel}
                      onUpdateTitle={handleUpdateReelTitle}
                      maxReels={4}
                    />
                  </div>

                  <div className="mt-5 space-y-4">
                    <SectionHeading icon={Youtube} title={t("register.section.portfolio")} />
                    <PortfolioLinksEditor
                      links={primaryArtYoutubeLinks}
                      onAdd={addPrimaryArtYoutubeLink}
                      onRemove={removePrimaryArtYoutubeLink}
                      onUpdate={updatePrimaryArtYoutubeLink}
                    />
                  </div>
                </div>

                <AnimatePresence mode="popLayout">
                  {extraArtEntries.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.25 }}
                    >
                      <ArtCategoryCard
                        art={entry}
                        index={index + 1}
                        removable
                        onUpdate={(nextEntry) => updateExtraArtEntry(entry.id, nextEntry)}
                        onMediaFileChange={(field, file) => updateExtraArtMediaFile(entry.id, field, file)}
                        onRemove={() => removeExtraArtEntry(entry.id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Secondary Add Service Button */}
                <div className="flex justify-center pt-1 pb-3">
                  <button
                    type="button"
                    onClick={addArtEntry}
                    className="inline-flex h-12 w-full max-w-md items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-orange-400/80 bg-orange-50/80 px-6 text-xs font-black uppercase tracking-wider text-orange-700 transition hover:bg-orange-100 hover:border-orange-500 active:scale-95 shadow-sm cursor-pointer"
                  >
                    <Plus className="h-4 w-4 text-orange-600" />
                    + Add Another Service
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Controller
                    name="state"
                    control={artistForm.control}
                    render={({ field }) => (
                      <SearchableDropdown
                        label={t("register.label.state")}
                        value={field.value}
                        options={stateOptions}
                        placeholder={t("register.placeholder.state")}
                        error={artistForm.formState.errors.state?.message}
                        onChange={(value) => {
                          field.onChange(value);
                          artistForm.setValue("district", "", {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          });
                        }}
                      />
                    )}
                  />
                  <Controller
                    name="district"
                    control={artistForm.control}
                    render={({ field }) => (
                      <SearchableDropdown
                        label={t("register.label.district")}
                        value={field.value}
                        options={districts}
                        placeholder={selectedState ? t("register.placeholder.district") : t("register.placeholder.districtSelectState")}
                        disabled={!selectedState}
                        error={artistForm.formState.errors.district?.message}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  <TextField
                    label={t("register.label.experience")}
                    name="experience"
                    register={artistForm.register}
                    error={artistForm.formState.errors.experience?.message}
                    placeholder={t("register.placeholder.experience")}
                    inputMode="numeric"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">{t("register.label.bio")}</label>
                  <textarea
                    {...artistForm.register("bio")}
                    rows={4}
                    placeholder={t("register.placeholder.bio")}
                    className={`${inputClass} min-h-32 resize-y`}
                  />
                </div>

                <SectionHeading icon={CreditCard} title={t("register.section.identity")} />
                {/* Live Face Photo / Selfie KYC Capture */}
                <LiveFaceCapture
                  file={liveFaceFile}
                  preview={liveFacePreview}
                  onChange={(file, previewUrl) => {
                    setLiveFaceFile(file);
                    setLiveFacePreview(previewUrl);
                  }}
                  label="Live Face Photo (Selfie Verification / सेल्फी व्हेरिफिकेशन)"
                  description="Live camera capture to verify artist identity against Aadhaar card for instant admin approval."
                />

                <FileDrop
                  label={t("register.label.aadharPhoto")}
                  description={t("register.desc.aadharPhoto")}
                  file={aadharFile}
                  preview={aadharPreview}
                  tone="slate"
                  onChange={(file) => setPreviewFile(file, aadharPreview, setAadharFile, setAadharPreview)}
                />
                <Controller
                  name="aadharNumber"
                  control={artistForm.control}
                  render={({ field }) => (
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-slate-700">{t("register.label.aadharNumber")}</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={field.value}
                        onBlur={field.onBlur}
                        onChange={(event) => field.onChange(formatAadhar(event.target.value))}
                        placeholder="XXXX XXXX XXXX"
                        maxLength={14}
                        className={`${inputClass} ${artistForm.formState.errors.aadharNumber ? errorInputClass : ""}`}
                      />
                      <FieldError message={artistForm.formState.errors.aadharNumber?.message} />
                    </div>
                  )}
                />

                <SectionHeading icon={Building2} title={t("register.section.bank")} />
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Controller
                      name="bankName"
                      control={artistForm.control}
                      render={({ field }) => (
                        <SearchableDropdown
                          label={t("register.label.bankName")}
                          value={field.value}
                          options={INDIAN_BANK_OPTIONS}
                          placeholder={t("register.placeholder.bankName")}
                          error={artistForm.formState.errors.bankName?.message}
                          onChange={(val) => {
                            field.onChange(val);
                            // Reset custom name whenever a new option is chosen
                            if (val !== "Other") setCustomBankName("");
                          }}
                        />
                      )}
                    />
                    {/* Conditional free-text input for "Other" bank */}
                    {artistForm.watch("bankName") === "Other" && (
                      <div className="mt-3">
                        <label className="mb-1.5 block text-sm font-bold text-slate-700">
                          <span className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-orange-500" />
                            {t("register.label.customBankName")}
                          </span>
                        </label>
                        <input
                          type="text"
                          value={customBankName}
                          onChange={(e) => setCustomBankName(e.target.value)}
                          placeholder={t("register.placeholder.customBankName")}
                          required
                          maxLength={80}
                          className={`${inputClass} ${customBankName.trim().length === 0 || (customBankName.trim().length > 0 && customBankName.trim().length < 2) ? errorInputClass : ""}`}
                        />
                        {customBankName.trim().length === 0 ? (
                          <p className="mt-1.5 text-xs font-semibold text-red-500">{t("register.error.customBankNameRequired")}</p>
                        ) : customBankName.trim().length < 2 ? (
                          <p className="mt-1.5 text-xs font-semibold text-red-500">{t("register.error.customBankNameLength")}</p>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <Controller
                    name="ifscCode"
                    control={artistForm.control}
                    render={({ field }) => (
                      <div>
                        <label className="mb-1.5 block text-sm font-bold text-slate-700">{t("register.label.ifsc")}</label>
                        <input
                          value={field.value}
                          onBlur={field.onBlur}
                          onChange={(event) => field.onChange(event.target.value.toUpperCase().slice(0, 11))}
                          placeholder="SBIN00XXXXX"
                          maxLength={11}
                          className={`${inputClass} ${artistForm.formState.errors.ifscCode ? errorInputClass : ""}`}
                        />
                        <FieldError message={artistForm.formState.errors.ifscCode?.message} />
                      </div>
                    )}
                  />
                  <Controller
                    name="accountNumber"
                    control={artistForm.control}
                    render={({ field }) => (
                      <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-bold text-slate-700">{t("register.label.accountNumber")}</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={field.value}
                          onBlur={field.onBlur}
                          onChange={(event) => field.onChange(event.target.value.replace(/[^\d]/g, "").slice(0, 18))}
                          onKeyPress={(event) => {
                            if (!/[0-9]/.test(event.key)) {
                              event.preventDefault();
                            }
                          }}
                          placeholder={t("register.placeholder.accountNumber")}
                          maxLength={18}
                          minLength={9}
                          className={`${inputClass} ${artistForm.formState.errors.accountNumber ? errorInputClass : ""}`}
                        />
                        <FieldError message={artistForm.formState.errors.accountNumber?.message} />
                      </div>
                    )}
                  />
                  {/* Confirm Account Number — prevents copy-paste errors */}
                  <Controller
                    name="confirmAccountNumber"
                    control={artistForm.control}
                    render={({ field }) => (
                      <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-bold text-slate-700">{t("register.label.confirmAccountNumber")}</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={field.value}
                          onBlur={field.onBlur}
                          onChange={(event) => field.onChange(event.target.value.replace(/[^\d]/g, "").slice(0, 18))}
                          placeholder={t("register.placeholder.confirmAccountNumber")}
                          maxLength={18}
                          className={`${inputClass} ${artistForm.formState.errors.confirmAccountNumber ? errorInputClass : ""}`}
                        />
                        <FieldError message={artistForm.formState.errors.confirmAccountNumber?.message} />
                      </div>
                    )}
                  />
                </div>

                <SectionHeading icon={Sparkles} title={t("register.section.additional")} />

                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label={t("register.label.assistantName")}
                    name="assistantName"
                    register={artistForm.register}
                    placeholder={t("register.placeholder.assistantName")}
                  />
                  <Controller
                    name="assistantContact"
                    control={artistForm.control}
                    render={({ field }) => (
                      <div>
                        <label className="mb-1.5 block text-sm font-bold text-slate-700">{t("register.label.assistantContact")}</label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          value={field.value}
                          onBlur={field.onBlur}
                          onChange={(event) => field.onChange(sanitizePhoneNumber(event.target.value))}
                          placeholder={PHONE_PLACEHOLDER}
                          maxLength={PHONE_MAX_LENGTH}
                          className={inputClass}
                        />
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <SectionHeading icon={Sparkles} title={t("register.voucher.title")} />
                  <Controller
                    name="voucherType"
                    control={artistForm.control}
                    render={({ field }) => (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* Normal Voucher Card */}
                        <button
                          type="button"
                          onClick={() => field.onChange("normal")}
                          className={`flex flex-col items-start p-5 rounded-2xl border text-left transition-all ${
                            field.value === "normal"
                              ? "border-orange-500 bg-orange-50/50 shadow-md ring-2 ring-orange-200"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="flex w-full items-center justify-between">
                            <span className="text-base font-black text-slate-800">{t("register.voucher.normal.name")}</span>
                            <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                              field.value === "normal" ? "border-orange-500 bg-orange-500" : "border-slate-300"
                            }`}>
                              {field.value === "normal" && <div className="h-2 w-2 rounded-full bg-white" />}
                            </span>
                          </div>
                          <span className="mt-1 text-2xl font-black text-slate-900">{t("register.voucher.normal.price")}</span>
                          <p className="mt-3 text-xs font-semibold text-slate-500 leading-relaxed">
                            {t("register.voucher.normal.desc")}
                          </p>
                          <ul className="mt-4 space-y-2 text-[11px] font-bold text-slate-600">
                            <li className="flex items-center gap-1.5">✓ {t("register.voucher.normal.feature1")}</li>
                            <li className="flex items-center gap-1.5">✓ {t("register.voucher.normal.feature2")}</li>
                            <li className="flex items-center gap-1.5">✓ {t("register.voucher.normal.feature3")}</li>
                          </ul>
                        </button>

                        {/* Premium Voucher Card */}
                        <button
                          type="button"
                          onClick={() => field.onChange("premium")}
                          className={`flex flex-col items-start p-5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                            field.value === "premium"
                              ? "border-amber-500 bg-amber-50/30 shadow-lg ring-2 ring-amber-300"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="absolute right-0 top-0 bg-gradient-to-l from-amber-500 to-yellow-400 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
                            <Sparkles className="h-3 w-3 fill-current" />
                            PRO
                          </div>
                          <div className="flex w-full items-center justify-between">
                            <span className="text-base font-black text-slate-800">{t("register.voucher.premium.name")}</span>
                            <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                              field.value === "premium" ? "border-amber-500 bg-amber-500" : "border-slate-300"
                            }`}>
                              {field.value === "premium" && <div className="h-2 w-2 rounded-full bg-white" />}
                            </span>
                          </div>
                          <span className="mt-1 text-2xl font-black text-amber-600">{t("register.voucher.premium.price")}</span>
                          <p className="mt-3 text-xs font-semibold text-slate-500 leading-relaxed">
                            {t("register.voucher.premium.desc")}
                          </p>
                          <ul className="mt-4 space-y-2 text-[11px] font-bold text-slate-600">
                            <li className="flex items-center gap-1.5 text-amber-700">★ {t("register.voucher.premium.feature1")}</li>
                            <li className="flex items-center gap-1.5 text-amber-700">★ {t("register.voucher.premium.feature2")}</li>
                            <li className="flex items-center gap-1.5 text-amber-700">★ {t("register.voucher.premium.feature3")}</li>
                            <li className="flex items-center gap-1.5 text-amber-700">★ {t("register.voucher.premium.feature4")}</li>
                          </ul>
                        </button>
                      </div>
                    )}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">{t("register.label.suggestions")}</label>
                  <textarea
                    {...artistForm.register("suggestionComment")}
                    rows={3}
                    placeholder={t("register.placeholder.suggestions")}
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!artistForm.formState.isValid || !profileFile || loadingRole === "artist"}
                  aria-disabled={!artistForm.formState.isValid || !profileFile || loadingRole === "artist"}
                  className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 text-sm font-black uppercase tracking-widest text-white shadow-lg ${
                    !artistForm.formState.isValid || !profileFile || loadingRole === "artist" ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  {loadingRole === "artist" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {t("register.btn.submit")}
                </button>
              </motion.form>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
