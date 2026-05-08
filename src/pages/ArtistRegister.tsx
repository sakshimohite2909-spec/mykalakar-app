import {
  type ChangeEvent,
  type ComponentType,
  memo,
  useCallback,
  useEffect,
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
  ChevronDown,
  CreditCard,
  Eye,
  EyeOff,
  FileImage,
  Globe,
  IndianRupee,
  Loader2,
  Lock,
  MapPin,
  MessageSquare,
  Music,
  Phone,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  Upload,
  User,
  Users,
  X,
  Youtube,
} from "lucide-react";
import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FIREBASE_WRITE_TIMEOUT_MS, firebaseErrorMessage, withTimeout } from "@/lib/firebaseSafe";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { getExternalUrl, getYoutubeThumbnailUrl } from "@/lib/youtube";
import { getIndiaDistrictsByStateName, getIndiaStates } from "@/lib/indiaLocations";
import { ARTIST_TYPES, normalizeArtistType } from "@/constants/artistSystem";
import {
  PHONE_MAX_LENGTH,
  PHONE_PLACEHOLDER,
  sanitizePhoneNumber,
  validatePhoneNumber,
} from "@/lib/phoneUtils";

type AuthRole = "artist" | "user";
type PortfolioPlatform = "youtube";
type PortfolioLink = { platform: PortfolioPlatform; url: string };
type ExtraArtEntry = {
  id: string;
  category: string;
  soloPrice: string;
  duoPrice: string;
  teamPrice: string;
};

const roleTabs: Array<{ id: AuthRole; label: string; icon: ComponentType<{ className?: string }>; color: string }> = [
  { id: "artist", label: "Artist", icon: Music, color: "from-orange-500 to-amber-400" },
  { id: "user", label: "User", icon: User, color: "from-rose-500 to-amber-400" },
];

const artCategoryOptions = [...ARTIST_TYPES];

const fullNameRule = z
  .string()
  .min(3, "Full name must be at least 3 characters.")
  .regex(/^[a-zA-Z\s]*$/, "Full name can contain letters and spaces only.");

const usernameRule = z
  .string()
  .min(4, "Username must be at least 4 characters.")
  .regex(/^[a-z0-9_]*$/, "Username can contain lowercase letters, numbers, and underscores only. No spaces.");

const passwordRule = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
  .regex(/\d/, "Password must contain at least one number.")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character.");

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
  z.string().regex(/^\d{12}$/, "Aadhar number must be exactly 12 digits.")
);
const bankNameRule = z.string().min(2, "Bank name must be at least 2 characters.");
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
    artCategory: z.string().min(1, "Category / art form is required."),
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
    portfolioUrl: z.string().optional(),
    liveLink: z.string().optional(),
    hasAssistant: z.boolean(),
    assistantName: z.string().optional(),
    assistantContact: z.string().optional(),
    suggestionComment: z.string().optional(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
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
  portfolioUrl: "",
  liveLink: "",
  hasAssistant: false,
  assistantName: "",
  assistantContact: "",
  suggestionComment: "",
};

const userDefaults: UserRegistrationValues = {
  fullName: "",
  username: "",
  password: "",
  confirmPassword: "",
  phoneOptional: "",
};

const inputClass =
  "input-glass w-full px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-slate-400";
const errorInputClass = "border-red-400 focus:border-red-500 focus:ring-red-200";

function digitsOnly(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
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

function syntheticEmail(username: string) {
  return `${username.toLowerCase().trim()}@mykalakar.app`;
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
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-2 text-sm font-bold text-slate-700">
        <Lock className="h-4 w-4 text-orange-500" />
        {label}
      </label>
      <div className="relative">
        <input
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
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filteredOptions = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => option.toLowerCase().includes(query));
  }, [options, searchValue]);
  const customValue = searchValue.trim();
  const canAddCustom =
    allowCustom &&
    customValue.length > 1 &&
    !options.some((option) => option.toLowerCase() === customValue.toLowerCase());
  const selectValue = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
    setSearchValue("");
  };

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setSearchValue("");
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  useEffect(() => {
    if (open) window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
      setSearchValue("");
    }
  }, [disabled]);

  return (
    <div ref={wrapperRef} className="relative">
      <label className="mb-1.5 block text-sm font-bold text-slate-700">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen((current) => !current);
        }}
        className={`input-glass flex h-[50px] w-full items-center justify-between px-4 text-left text-sm ${
          disabled ? "cursor-not-allowed opacity-60" : ""
        } ${error ? errorInputClass : ""}`}
      >
        <span className={value ? "text-[#1A1A1A]" : "text-slate-400"}>{value || placeholder}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && !disabled ? (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          <div className="sticky top-0 z-10 border-b border-slate-100 bg-white p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={`Search ${label.toLowerCase()}`}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>
          <ul
            className="dropdown-scroll-area no-scrollbar pointer-events-auto max-h-[min(300px,50vh)] overflow-y-auto py-1"
            role="listbox"
          >
            {canAddCustom ? (
              <li>
                <button
                  type="button"
                  onClick={() => selectValue(customValue)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold text-orange-600 transition hover:bg-orange-50"
                >
                  <Plus className="h-4 w-4" />
                  Add "{customValue}"
                </button>
              </li>
            ) : null}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    onClick={() => selectValue(option)}
                    className={`w-full px-4 py-2.5 text-left text-sm transition ${
                      option === value ? "bg-orange-50 font-bold text-orange-600" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {option}
                  </button>
                </li>
              ))
            ) : (
              <li className="px-4 py-3 text-sm text-slate-500">{allowCustom ? "Type a new art form to add it." : "No results found."}</li>
            )}
          </ul>
        </div>
      ) : null}
      <FieldError message={error} />
    </div>
  );
}

function ArtCategoryCard({
  art,
  index,
  removable = false,
  error,
  onUpdate,
  onRemove,
}: {
  art: ExtraArtEntry;
  index: number;
  removable?: boolean;
  error?: string;
  onUpdate: (next: ExtraArtEntry) => void;
  onRemove?: () => void;
}) {
  const update = (field: keyof ExtraArtEntry, value: string) => {
    onUpdate({ ...art, [field]: value });
  };

  return (
    <div className="rounded-2xl border border-sky-100 bg-sky-100/70 p-5 shadow-inner">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-black text-slate-500">Art #{index + 1}</p>
        {removable ? (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-red-100 bg-white/70 px-3 text-[10px] font-black uppercase tracking-wider text-red-500 transition hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        ) : null}
      </div>

      <SearchableDropdown
        label="Category / Art Form *"
        value={art.category}
        options={artCategoryOptions}
        placeholder="Search or add your art form..."
        error={error}
        allowCustom
        onChange={(value) => update("category", value)}
      />

      <div className="my-5 h-px bg-white/80" />

      <div className="mb-4 flex items-center gap-2">
        <IndianRupee className="h-4 w-4 text-orange-500" />
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-600">Performance Pricing</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-bold text-slate-700">Solo Performance</label>
          <input
            value={art.soloPrice}
            onChange={(event) => update("soloPrice", digitsOnly(event.target.value, 8))}
            inputMode="numeric"
            placeholder="e.g. 10000"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-bold text-slate-700">Duo Performance</label>
          <input
            value={art.duoPrice}
            onChange={(event) => update("duoPrice", digitsOnly(event.target.value, 8))}
            inputMode="numeric"
            placeholder="e.g. 15000"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-bold text-slate-700">Team Performance</label>
          <input
            value={art.teamPrice}
            onChange={(event) => update("teamPrice", digitsOnly(event.target.value, 8))}
            inputMode="numeric"
            placeholder="e.g. 25000"
            className={inputClass}
          />
        </div>
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
  return (
    <div className="space-y-4 rounded-2xl border border-orange-100 bg-orange-50/70 p-4 shadow-sm">
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

              <input
                type="url"
                inputMode="url"
                value={link.url}
                onChange={(event) => onUpdate(index, { platform: "youtube", url: event.target.value })}
                placeholder="youtube.com/watch?v=..."
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
                  Paste a valid YouTube video link to preview it here.
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
        Add More Links
      </button>
    </div>
  );
});

function FileDrop({
  label,
  description,
  file,
  preview,
  required,
  tone = "orange",
  onChange,
}: {
  label: string;
  description: string;
  file: File | null;
  preview: string;
  required?: boolean;
  tone?: "orange" | "blue" | "slate";
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const toneClass =
    tone === "blue"
      ? "border-blue-200 bg-blue-50/40 text-blue-500 hover:border-blue-400"
      : tone === "slate"
      ? "border-slate-200 bg-slate-50/60 text-slate-500 hover:border-slate-400"
      : "border-orange-200 bg-orange-50/40 text-orange-500 hover:border-orange-400";

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    onChange(selected);
  };

  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
        {label} {required ? "*" : ""}
      </label>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`relative flex h-36 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition ${toneClass}`}
      >
        {preview ? (
          <>
            <img src={preview} alt={`${label} preview`} className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-sm font-black text-white opacity-0 transition hover:opacity-100">
              Change image
            </span>
          </>
        ) : (
          <>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/70">
              {file ? <BadgeCheck className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
            </div>
            <span className="text-sm font-black">{description}</span>
          </>
        )}
      </button>
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
  return (
    <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-orange-100 bg-orange-50/60 p-1.5 shadow-sm backdrop-blur-md">
      {roleTabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
              activeRole === tab.id
                ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function useRoleFromQuery(defaultRole: AuthRole = "artist") {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const roleParam = searchParams.get("role");
  const pathRole: AuthRole | null = location.pathname.includes("user")
    ? "user"
    : location.pathname.includes("artist")
    ? "artist"
    : null;
  const activeRole: AuthRole = roleParam === "user" || roleParam === "artist" ? roleParam : pathRole ?? defaultRole;

  const setActiveRole = (role: AuthRole) => {
    setSearchParams({ role }, { replace: true });
  };

  return [activeRole, setActiveRole] as const;
}

function createExtraArtEntry(): ExtraArtEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    category: "",
    soloPrice: "",
    duoPrice: "",
    teamPrice: "",
  };
}

export default function ArtistRegister() {
  const [activeRole, setActiveRole] = useRoleFromQuery("artist");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingRole, setLoadingRole] = useState<AuthRole | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [aadharPreview, setAadharPreview] = useState("");
  const [galleryFiles, setGalleryFiles] = useState<Array<{ file: File; preview: string }>>([]);
  const [portfolioLinks, setPortfolioLinks] = useState<PortfolioLink[]>([{ platform: "youtube", url: "" }]);
  const [extraArtEntries, setExtraArtEntries] = useState<ExtraArtEntry[]>([]);
  const { register: authRegister, logout } = useAuth();
  const navigate = useNavigate();

  const artistForm = useForm<ArtistRegistrationValues>({
    defaultValues: artistDefaults,
    mode: "onChange",
    resolver: zodResolver(artistRegistrationSchema),
  });
  const userForm = useForm<UserRegistrationValues>({
    defaultValues: userDefaults,
    mode: "onChange",
    resolver: zodResolver(userRegistrationSchema),
  });
  const selectedState = artistForm.watch("state");
  const selectedDob = artistForm.watch("dob");
  const hasAssistant = artistForm.watch("hasAssistant");
  const stateOptions = useMemo(() => getIndiaStates().map((state) => state.name), []);
  const [districts, setDistricts] = useState<string[]>([]);

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
    if (currentPreview) URL.revokeObjectURL(currentPreview);
    setFile(file);
    setPreview(file ? URL.createObjectURL(file) : "");
  };

  const addGalleryFile = (file: File | null) => {
    if (!file) return;
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

  const addArtEntry = () => {
    setExtraArtEntries((current) => [...current, createExtraArtEntry()]);
  };

  const updateExtraArtEntry = (id: string, nextEntry: ExtraArtEntry) => {
    setExtraArtEntries((current) => current.map((entry) => (entry.id === id ? nextEntry : entry)));
  };

  const removeExtraArtEntry = (id: string) => {
    setExtraArtEntries((current) => current.filter((entry) => entry.id !== id));
  };

  const addPortfolioLink = useCallback(() => {
    setPortfolioLinks((current) => [...current, { platform: "youtube", url: "" }]);
  }, []);

  const updatePortfolioLink = useCallback((index: number, nextLink: PortfolioLink) => {
    setPortfolioLinks((current) => {
      const next = current.map((link, linkIndex) => (linkIndex === index ? nextLink : link));
      artistForm.setValue("portfolioUrl", next[0]?.url ?? "", { shouldDirty: true });
      return next;
    });
  }, [artistForm]);

  const removePortfolioLink = useCallback((index: number) => {
    setPortfolioLinks((current) => {
      const next = current.filter((_, linkIndex) => linkIndex !== index);
      artistForm.setValue("portfolioUrl", next[0]?.url ?? "", { shouldDirty: true });
      return next.length > 0 ? next : [{ platform: "youtube", url: "" }];
    });
  }, [artistForm]);

  const fallbackProfilePhoto = (name = "Artist") =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Artist")}&background=f97316&color=fff&size=256`;

  const getRegistrationImagePath = (
    file: File | null,
    path: string,
    fallback = ""
  ) => {
    if (!file) return fallback;
    const safeName = file.name.trim().replace(/[^\w.-]+/g, "_");
    return `${path}/${Date.now()}_${safeName || "image"}`;
  };

  const submitArtist = async (values: ArtistRegistrationValues) => {
    const preparedExtraArts = extraArtEntries
      .map((entry) => ({
        ...entry,
        category: entry.category.trim(),
        soloPrice: entry.soloPrice.trim(),
        duoPrice: entry.duoPrice.trim(),
        teamPrice: entry.teamPrice.trim(),
      }))
      .filter((entry) => entry.category || entry.soloPrice || entry.duoPrice || entry.teamPrice);
    if (preparedExtraArts.some((entry) => !entry.category)) {
      toast({ variant: "destructive", title: "Category missing", description: "Please select an art form for every added category." });
      return;
    }

    setLoadingRole("artist");

    try {
      const normalizedUsername = values.username.toLowerCase().trim();
      const email = syntheticEmail(normalizedUsername);
      const authResult = await authRegister(email, values.password);

      if (!authResult.success) {
        toast({ variant: "destructive", title: "Registration failed", description: authResult.message });
        return;
      }

      const uid = authResult.uid;
      await withTimeout(
        setDoc(
          doc(db, "users", uid),
          {
            uid,
            username: normalizedUsername,
            email,
            name: values.fullName,
            phone: values.mobileNumber,
            role: "artist",
            status: "pending",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ),
        FIREBASE_WRITE_TIMEOUT_MS,
        "Could not save your user account details."
      );

      const profilePhoto = getRegistrationImagePath(
        profileFile,
        `avatars/${uid}`,
        fallbackProfilePhoto(values.fullName)
      );
      const coverPhoto = getRegistrationImagePath(coverFile, `covers/${uid}`);
      const aadharPhoto = getRegistrationImagePath(aadharFile, `identity/${uid}`);
      const galleryPhotos = galleryFiles
        .map((item) => getRegistrationImagePath(item.file, `galleries/${uid}`))
        .filter(Boolean);
      const socialLinks = portfolioLinks
        .map((link) => ({ platform: link.platform, url: link.url.trim() }))
        .filter((link) => link.url.length > 0);
      const youtubeLinks = socialLinks.filter((link) => link.platform === "youtube").map((link) => link.url);
      const normalizeSubmittedCategory = (value: string) => normalizeArtistType(value) ?? value.trim();
      const artEntries = [
        {
          category: normalizeSubmittedCategory(values.artCategory),
          subcategory: "",
          types: [],
          soloPrice: Number(values.soloPrice) || 0,
          duoPrice: Number(values.duoPrice) || 0,
          teamPrice: Number(values.teamPrice) || 0,
        },
        ...preparedExtraArts.map((entry) => ({
          category: normalizeSubmittedCategory(entry.category),
          subcategory: "",
          types: [],
          soloPrice: Number(entry.soloPrice) || 0,
          duoPrice: Number(entry.duoPrice) || 0,
          teamPrice: Number(entry.teamPrice) || 0,
        })),
      ];

      const payload = {
        uid,
        username: normalizedUsername,
        email,
        role: "artist",
        status: "pending",
        rejectionReason: "",
        name: values.fullName,
        brandName: values.brandName || "",
        mobileNumber: values.mobileNumber,
        emergencyNumber: values.emergencyNumber,
        phoneOptional: values.phoneOptional || "",
        dob: values.dob,
        age: Number.parseInt(getAgeLabel(values.dob), 10) || 0,
        gender: values.gender,
        travelWillingness: values.travelWillingness,
        category: artEntries[0]?.category || values.artCategory,
        subcategory: "",
        types: [],
        categories: Array.from(new Set(artEntries.map((entry) => entry.category).filter(Boolean))),
        artsList: artEntries,
        soloPrice: artEntries[0]?.soloPrice || 0,
        duoPrice: artEntries[0]?.duoPrice || 0,
        teamPrice: artEntries[0]?.teamPrice || 0,
        state: values.state,
        district: values.district,
        experience: Number(values.experience),
        bio: values.bio || "",
        availability: "available",
        aadharNumber: values.aadharNumber,
        identity: {
          aadharNumber: values.aadharNumber,
        },
        bankName: values.bankName,
        ifscCode: values.ifscCode,
        accountNumber: values.accountNumber,
        bankDetails: {
          bankName: values.bankName,
          ifscCode: values.ifscCode,
          accountNumber: values.accountNumber,
        },
        media: {
          profilePhoto,
          coverPhoto,
          galleryPhotos,
          aadharPhoto,
        },
        profilePhoto,
        coverPhoto,
        galleryPhotos,
        aadharPhoto,
        socialLinks,
        youtubeLinks,
        portfolioUrl: socialLinks[0]?.url || values.portfolioUrl || "",
        liveLink: values.liveLink || "",
        assistant: {
          hasAssistant: values.hasAssistant,
          name: values.assistantName || "",
          contact: values.assistantContact || "",
          needAssistant: values.hasAssistant ? "yes" : "no",
        },
        suggestionComment: values.suggestionComment || "",
        mediaUploadStatus: "path-only",
        mediaUploadWarnings: [],
        verified: false,
        trending: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await withTimeout(
        addDoc(collection(db, "artist_applications"), payload),
        FIREBASE_WRITE_TIMEOUT_MS,
        "Could not submit your artist application."
      );
      await withTimeout(
        setDoc(doc(db, "users", uid), { profilePhoto, updatedAt: serverTimestamp() }, { merge: true }),
        FIREBASE_WRITE_TIMEOUT_MS,
        "Could not update your profile photo."
      );
      await logout().catch((logoutError) => console.warn("Logout after artist registration failed:", logoutError));
      toast({
        title: "Registration submitted",
        description: "Your artist profile is under review. Image paths were saved without uploading files.",
      });
      navigate("/login?role=artist");
    } catch (error) {
      console.error("Artist registration error:", error);
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: firebaseErrorMessage(error, "Could not submit your artist registration."),
      });
    } finally {
      setLoadingRole(null);
    }
  };

  const submitUser = async (values: UserRegistrationValues) => {
    setLoadingRole("user");
    try {
      const normalizedUsername = values.username.toLowerCase().trim();
      const email = syntheticEmail(normalizedUsername);
      const authResult = await authRegister(email, values.password);

      if (!authResult.success) {
        toast({ variant: "destructive", title: "Registration failed", description: authResult.message });
        return;
      }

      await withTimeout(
        setDoc(
          doc(db, "users", authResult.uid),
          {
            uid: authResult.uid,
            name: values.fullName,
            username: normalizedUsername,
            email,
            phone: values.phoneOptional || "",
            role: "user",
            status: "active",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ),
        FIREBASE_WRITE_TIMEOUT_MS,
        "Could not save your user profile."
      );

      toast({ title: "Account created", description: "Welcome to MyKalakar." });
      navigate("/profile");
    } catch (error) {
      console.error("User registration error:", error);
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: firebaseErrorMessage(error, "Could not create your account."),
      });
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="relative z-10 w-full px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="glass-panel min-h-[720px] overflow-hidden rounded-[2rem] border border-white/60 bg-white/65 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-3xl sm:p-8 md:p-10">
          <div className="mb-8 flex items-center justify-between gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white/70 px-4 py-2 text-sm font-bold text-slate-500 shadow-sm transition hover:text-orange-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <Link
              to={`/login?role=${activeRole}`}
              className="text-sm font-black text-orange-500 transition hover:text-orange-600"
            >
              Login -&gt;
            </Link>
          </div>

          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl gradient-bg shadow-[0_12px_40px_rgba(232,111,58,0.25)]">
              <Music className="h-7 w-7 text-white" />
            </div>
            <h1 className="font-display text-4xl font-black tracking-tight text-[#1A1A1A] md:text-5xl">
              Join <span className="gradient-text-primary">MyKalakar</span>
              {activeRole === "artist" ? " as an Artist" : " as a User"}
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              India's premier platform for Artists, Performers & Entertainers.
            </p>
          </div>

          <RoleTabs activeRole={activeRole} onChange={setActiveRole} />

          <AnimatePresence mode="wait">
            {activeRole === "artist" ? (
              <motion.form
                key="artist"
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 18 }}
                transition={{ duration: 0.28 }}
                onSubmit={artistForm.handleSubmit(submitArtist)}
                className="mt-8 space-y-8"
                noValidate
              >
                <SectionHeading icon={Lock} title="Create Your Login Account" />

                <div className="rounded-2xl border border-orange-200/70 bg-orange-50/50 p-5">
                  <p className="mb-4 text-sm font-semibold text-slate-500">
                    Choose a unique username and password to log in to your Artist Dashboard.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField
                      label="Username *"
                      name="username"
                      register={artistForm.register}
                      error={artistForm.formState.errors.username?.message}
                      icon={AtSign}
                      placeholder="e.g. dj_phoenix99"
                      className="md:col-span-2"
                    />
                    <Controller
                      name="password"
                      control={artistForm.control}
                      render={({ field }) => (
                        <PasswordField
                          label="Password *"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          error={artistForm.formState.errors.password?.message}
                          show={showPassword}
                          onToggle={() => setShowPassword((current) => !current)}
                          placeholder="Min 8 characters"
                        />
                      )}
                    />
                    <Controller
                      name="confirmPassword"
                      control={artistForm.control}
                      render={({ field }) => (
                        <PasswordField
                          label="Confirm Password *"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          error={artistForm.formState.errors.confirmPassword?.message}
                          show={showPassword}
                          onToggle={() => setShowPassword((current) => !current)}
                          placeholder="Re-enter password"
                        />
                      )}
                    />
                  </div>
                </div>

                <SectionHeading icon={User} title="Personal Information" />

                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Artist Name *"
                    name="fullName"
                    register={artistForm.register}
                    error={artistForm.formState.errors.fullName?.message}
                    placeholder="Your full name"
                  />
                  <TextField
                    label="Nick Name / Brand Name"
                    name="brandName"
                    register={artistForm.register}
                    error={artistForm.formState.errors.brandName?.message}
                    placeholder="Your stage name or brand"
                  />
                  <Controller
                    name="mobileNumber"
                    control={artistForm.control}
                    render={({ field }) => (
                      <div>
                        <label className="mb-1.5 block text-sm font-bold text-slate-700">Phone Number *</label>
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
                        <label className="mb-1.5 block text-sm font-bold text-slate-700">Emergency Number *</label>
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
                  <TextField
                    label="Date of Birth *"
                    name="dob"
                    type="date"
                    register={artistForm.register}
                    error={artistForm.formState.errors.dob?.message}
                  />
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
                      <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                      Synced Age Display
                    </label>
                    <input
                      value={getAgeLabel(selectedDob)}
                      readOnly
                      tabIndex={-1}
                      className="input-glass w-full cursor-not-allowed bg-white/50 px-4 py-3 text-sm font-black text-orange-600"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Gender *</label>
                    <select {...artistForm.register("gender")} className={`${inputClass} ${artistForm.formState.errors.gender ? errorInputClass : ""}`}>
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    <FieldError message={artistForm.formState.errors.gender?.message} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Travel Willingness *</label>
                    <select {...artistForm.register("travelWillingness")} className={inputClass}>
                      <option value="local">Local Only</option>
                      <option value="state">Within State</option>
                      <option value="all">All India</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-b border-orange-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="font-display text-xl font-bold text-[#2E3A47]">Your Art(s) / Skills *</h2>
                  <button
                    type="button"
                    onClick={addArtEntry}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-orange-200"
                  >
                    <Plus className="h-4 w-4" />
                    Add Another Category
                  </button>
                </div>

                <div className="rounded-2xl border border-sky-100 bg-sky-100/70 p-5 shadow-inner">
                  <p className="mb-4 text-sm font-black text-slate-500">Art #1</p>
                  <Controller
                    name="artCategory"
                    control={artistForm.control}
                    render={({ field }) => (
                      <SearchableDropdown
                        label="Category / Art Form *"
                        value={field.value}
                        options={artCategoryOptions}
                        placeholder="Search or add your art form..."
                        error={artistForm.formState.errors.artCategory?.message}
                        allowCustom
                        onChange={field.onChange}
                      />
                    )}
                  />

                  <div className="my-5 h-px bg-white/80" />

                  <div className="mb-4 flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-orange-500" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-600">Performance Pricing</h3>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <TextField label="Solo Performance" name="soloPrice" register={artistForm.register} placeholder="e.g. 10000" />
                    <TextField label="Duo Performance" name="duoPrice" register={artistForm.register} placeholder="e.g. 15000" />
                    <TextField label="Team Performance" name="teamPrice" register={artistForm.register} placeholder="e.g. 25000" />
                  </div>

                  <div className="my-5 h-px bg-white/80" />

                  <div className="mb-4 flex items-center gap-2">
                    <Upload className="h-4 w-4 text-orange-500" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-600">Media</h3>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    <FileDrop
                      label="Profile Photo"
                      description="Upload Profile Photo"
                      file={profileFile}
                      preview={profilePreview}
                      onChange={(file) => setPreviewFile(file, profilePreview, setProfileFile, setProfilePreview)}
                    />
                    <FileDrop
                      label="Cover / Background Photo"
                      description="Upload Background Photo"
                      file={coverFile}
                      preview={coverPreview}
                      tone="blue"
                      onChange={(file) => setPreviewFile(file, coverPreview, setCoverFile, setCoverPreview)}
                    />
                  </div>

                  <div className="mt-5">
                    <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Gallery Photos</label>
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
                        description="Add Photo"
                        file={null}
                        preview=""
                        onChange={addGalleryFile}
                      />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-500">Upload photos of your best work</p>
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
                        onRemove={() => removeExtraArtEntry(entry.id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                <div className="grid gap-4 md:grid-cols-2">
                  <Controller
                    name="state"
                    control={artistForm.control}
                    render={({ field }) => (
                      <SearchableDropdown
                        label="State *"
                        value={field.value}
                        options={stateOptions}
                        placeholder="Select State"
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
                        label="District *"
                        value={field.value}
                        options={districts}
                        placeholder={selectedState ? "Select District" : "Select state first"}
                        disabled={!selectedState}
                        error={artistForm.formState.errors.district?.message}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  <TextField
                    label="Experience (Years) *"
                    name="experience"
                    register={artistForm.register}
                    error={artistForm.formState.errors.experience?.message}
                    placeholder="e.g. 5"
                    inputMode="numeric"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">Description / Bio</label>
                  <textarea
                    {...artistForm.register("bio")}
                    rows={4}
                    placeholder="Tell us about your art, experience, and what makes you unique..."
                    className={`${inputClass} min-h-32 resize-y`}
                  />
                </div>

                <SectionHeading icon={CreditCard} title="Identity Documents" />
                <FileDrop
                  label="Aadhar Card Photo"
                  description="Upload Aadhar Card Photo (Front & Back)"
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
                      <label className="mb-1.5 block text-sm font-bold text-slate-700">Aadhar Number *</label>
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

                <SectionHeading icon={Building2} title="Bank Account Details" />
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Bank Name *"
                    name="bankName"
                    register={artistForm.register}
                    error={artistForm.formState.errors.bankName?.message}
                    placeholder="e.g. SBI, HDFC"
                  />
                  <Controller
                    name="ifscCode"
                    control={artistForm.control}
                    render={({ field }) => (
                      <div>
                        <label className="mb-1.5 block text-sm font-bold text-slate-700">IFSC Code *</label>
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
                        <label className="mb-1.5 block text-sm font-bold text-slate-700">Account Number *</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={field.value}
                          onBlur={field.onBlur}
                          onChange={(event) => field.onChange(digitsOnly(event.target.value, 18))}
                          placeholder="Enter account number"
                          maxLength={18}
                          className={`${inputClass} ${artistForm.formState.errors.accountNumber ? errorInputClass : ""}`}
                        />
                        <FieldError message={artistForm.formState.errors.accountNumber?.message} />
                      </div>
                    )}
                  />
                </div>

                <SectionHeading icon={Globe} title="Links & Portfolio" />
                <PortfolioLinksEditor
                  links={portfolioLinks}
                  onAdd={addPortfolioLink}
                  onRemove={removePortfolioLink}
                  onUpdate={updatePortfolioLink}
                />

                <SectionHeading icon={Sparkles} title="Additional Details" />
                <TextField
                  label="Live Stream Link (Optional)"
                  name="liveLink"
                  register={artistForm.register}
                  placeholder="e.g. YouTube Live URL"
                  inputMode="url"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Assistant / Manager Name (Optional)"
                    name="assistantName"
                    register={artistForm.register}
                    placeholder="Enter name"
                  />
                  <Controller
                    name="assistantContact"
                    control={artistForm.control}
                    render={({ field }) => (
                      <div>
                        <label className="mb-1.5 block text-sm font-bold text-slate-700">Assistant Contact (Optional)</label>
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

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">Any suggestions or comments?</label>
                  <textarea
                    {...artistForm.register("suggestionComment")}
                    rows={3}
                    placeholder="We'd love to hear from you..."
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!artistForm.formState.isValid || loadingRole === "artist"}
                  className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 text-sm font-black uppercase tracking-widest text-white shadow-lg ${
                    !artistForm.formState.isValid || loadingRole === "artist" ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  {loadingRole === "artist" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Submit My Artist Profile
                </button>
              </motion.form>
            ) : activeRole === "user" ? (
              <motion.form
                key="user-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={userForm.handleSubmit(submitUser)}
                className="space-y-6"
              >
                <SectionHeading icon={User} title="User Account Details" />
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Full Name *"
                    name="fullName"
                    register={userForm.register}
                    error={userForm.formState.errors.fullName?.message}
                    placeholder="Enter your name"
                  />
                  <TextField
                    label="Username *"
                    name="username"
                    register={userForm.register}
                    error={userForm.formState.errors.username?.message}
                    placeholder="choose_username"
                  />
                  <Controller
                    name="phoneOptional"
                    control={userForm.control}
                    render={({ field }) => (
                      <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-bold text-slate-700">Phone Number *</label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          value={field.value}
                          onBlur={field.onBlur}
                          onChange={(event) => field.onChange(sanitizePhoneNumber(event.target.value))}
                          placeholder={PHONE_PLACEHOLDER}
                          maxLength={PHONE_MAX_LENGTH}
                          className={`${inputClass} ${userForm.formState.errors.phoneOptional ? errorInputClass : ""}`}
                        />
                        <FieldError message={userForm.formState.errors.phoneOptional?.message} />
                      </div>
                    )}
                  />
                  <Controller
                    name="password"
                    control={userForm.control}
                    render={({ field }) => (
                      <PasswordField
                        label="Password *"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={userForm.formState.errors.password?.message}
                        show={showPassword}
                        onToggle={() => setShowPassword((current) => !current)}
                        placeholder="Min 8 characters"
                      />
                    )}
                  />
                  <Controller
                    name="confirmPassword"
                    control={userForm.control}
                    render={({ field }) => (
                      <PasswordField
                        label="Confirm Password *"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={userForm.formState.errors.confirmPassword?.message}
                        show={showPassword}
                        onToggle={() => setShowPassword((current) => !current)}
                        placeholder="Re-enter password"
                      />
                    )}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!userForm.formState.isValid || loadingRole === "user"}
                  className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-400 text-sm font-black uppercase tracking-widest text-white shadow-lg ${
                    !userForm.formState.isValid || loadingRole === "user" ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  {loadingRole === "user" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                  Create User Account
                </button>
              </motion.form>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
