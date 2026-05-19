import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ImagePlus,
  Loader2,
  UploadCloud,
} from "lucide-react";
import {
  registerArtistProfile,
  validateProfileImageFile,
} from "@/services/firebaseServices";

const initialFormState = {
  fullName: "",
  stageName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phoneNumber: "",
  discipline: "",
  artForm: "",
  city: "",
  state: "",
  experienceYears: "",
  bio: "",
  instagramUrl: "",
  portfolioUrl: "",
};

const disciplineOptions = ["Music", "Dance", "Painting", "Theatre", "Design", "Other"];

const inputClass =
  "mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100";
const textAreaClass =
  "mt-2 min-h-32 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100";
const labelClass = "text-sm font-semibold text-slate-900";
const errorClass = "mt-2 text-sm font-medium text-red-600";

function isValidUrl(value) {
  if (!value.trim()) return true;

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function validateForm(formData, profileImage) {
  const errors = {};
  const imageValidation = validateProfileImageFile(profileImage);

  if (formData.fullName.trim().length < 2) {
    errors.fullName = "Full name must be at least 2 characters.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  if (formData.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  } else if (!/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) || !/\d/.test(formData.password)) {
    errors.password = "Password must include uppercase, lowercase, and number characters.";
  }

  if (formData.confirmPassword !== formData.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (!/^[6-9]\d{9}$/.test(formData.phoneNumber.trim())) {
    errors.phoneNumber = "Enter a valid 10 digit mobile number.";
  }

  if (!formData.discipline) {
    errors.discipline = "Select a discipline.";
  }

  if (formData.artForm.trim().length < 2) {
    errors.artForm = "Art form must be at least 2 characters.";
  }

  if (formData.city.trim().length < 2) {
    errors.city = "City is required.";
  }

  if (formData.state.trim().length < 2) {
    errors.state = "State is required.";
  }

  const experience = Number(formData.experienceYears);
  if (!formData.experienceYears || Number.isNaN(experience) || experience < 0 || experience > 80) {
    errors.experienceYears = "Experience must be a realistic number from 0 to 80.";
  }

  if (formData.bio.trim().length < 20) {
    errors.bio = "Bio must be at least 20 characters.";
  }

  if (!isValidUrl(formData.instagramUrl)) {
    errors.instagramUrl = "Please enter a valid URL.";
  }

  if (!isValidUrl(formData.portfolioUrl)) {
    errors.portfolioUrl = "Please enter a valid URL.";
  }

  if (!imageValidation.valid) {
    errors.profileImage = imageValidation.message;
  }

  return errors;
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className={errorClass}>{message}</p>;
}

function FormMessage({ message, onDismiss }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(onDismiss, 5200);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      className={`mb-6 rounded-lg border p-4 ${
        message.type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-950"
          : "border-red-200 bg-red-50 text-red-950"
      }`}
      role="status"
    >
      <div className="flex items-start gap-3">
        {message.type === "success" ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
        ) : (
          <AlertCircle className="mt-0.5 h-5 w-5 text-red-700" />
        )}
        <div>
          <p className="font-semibold">{message.title}</p>
          <p className="mt-1 text-sm">{message.body}</p>
        </div>
      </div>
    </div>
  );
}

export default function ArtistRegistrationForm() {
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState(initialFormState);
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const currentValidation = useMemo(() => validateForm(formData, profileImage), [formData, profileImage]);
  const canSubmit = Object.keys(currentValidation).length === 0 && !submitting;

  useEffect(() => {
    if (!profileImage) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(profileImage);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [profileImage]);

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));

    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: "" }));
    }
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0] || null;
    const validation = validateProfileImageFile(file);

    if (!validation.valid) {
      setProfileImage(null);
      setErrors((current) => ({ ...current, profileImage: validation.message }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setProfileImage(file);
    setErrors((current) => ({ ...current, profileImage: "" }));
  }

  function resetForm() {
    setFormData(initialFormState);
    setProfileImage(null);
    setPreviewUrl("");
    setUploadProgress(0);
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage(null);

    const nextErrors = validateForm(formData, profileImage);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setMessage({
        type: "error",
        title: "Review the highlighted fields",
        body: "A valid profile image and complete artist details are required before submission.",
      });
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);

    try {
      const payload = {
        ...formData,
        fullName: formData.fullName.trim(),
        stageName: formData.stageName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        artForm: formData.artForm.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        experienceYears: Number(formData.experienceYears),
        bio: formData.bio.trim(),
        instagramUrl: formData.instagramUrl.trim(),
        portfolioUrl: formData.portfolioUrl.trim(),
      };

      const result = await registerArtistProfile(payload, profileImage, ({ progress }) => {
        setUploadProgress(progress);
      });

      setMessage({
        type: "success",
        title: "Artist profile submitted",
        body: `The profile was saved to Firebase with artist ID ${result.artistId}.`,
      });
      resetForm();
    } catch (error) {
      setMessage({
        type: "error",
        title: "Registration failed",
        body: error?.message || "Could not submit the artist profile.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <Link to="/" className="text-sm font-bold uppercase tracking-[0.2em] text-orange-600">
            MyKalakar
          </Link>
          <h1 className="mt-8 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Build a credible artist profile.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-700">
            Submit a complete artist profile with secure Firebase Auth, Cloud Storage image upload,
            and Firestore profile data in one clean flow.
          </p>
          <div className="mt-8 grid gap-3">
            {["Required profile image", "Private contact details saved", "Admin review ready"].map((item) => (
              <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">
                {item}
              </div>
            ))}
          </div>
        </aside>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-600">
                Artist Registration
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                Create your profile
              </h2>
            </div>
            <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-orange-700">
              Already registered?
            </Link>
          </div>

          <FormMessage message={message} onDismiss={() => setMessage(null)} />

          <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Full Name</span>
                <input name="fullName" className={inputClass} value={formData.fullName} onChange={updateField} autoComplete="name" />
                <FieldError message={errors.fullName} />
              </label>

              <label className="block">
                <span className={labelClass}>Stage Name</span>
                <input name="stageName" className={inputClass} value={formData.stageName} onChange={updateField} autoComplete="organization" />
                <FieldError message={errors.stageName} />
              </label>

              <label className="block">
                <span className={labelClass}>Private Email</span>
                <input name="email" className={inputClass} type="email" value={formData.email} onChange={updateField} autoComplete="email" />
                <FieldError message={errors.email} />
              </label>

              <label className="block">
                <span className={labelClass}>Phone Number</span>
                <input name="phoneNumber" className={inputClass} inputMode="numeric" value={formData.phoneNumber} onChange={updateField} autoComplete="tel" />
                <FieldError message={errors.phoneNumber} />
              </label>

              <label className="block">
                <span className={labelClass}>Password</span>
                <input name="password" className={inputClass} type="password" value={formData.password} onChange={updateField} autoComplete="new-password" />
                <FieldError message={errors.password} />
              </label>

              <label className="block">
                <span className={labelClass}>Confirm Password</span>
                <input name="confirmPassword" className={inputClass} type="password" value={formData.confirmPassword} onChange={updateField} autoComplete="new-password" />
                <FieldError message={errors.confirmPassword} />
              </label>

              <label className="block">
                <span className={labelClass}>Discipline</span>
                <select name="discipline" className={inputClass} value={formData.discipline} onChange={updateField}>
                  <option value="">Select discipline</option>
                  {disciplineOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.discipline} />
              </label>

              <label className="block">
                <span className={labelClass}>Art Form</span>
                <input name="artForm" className={inputClass} value={formData.artForm} onChange={updateField} placeholder="Tabla, Bharatanatyam, Watercolor..." />
                <FieldError message={errors.artForm} />
              </label>

              <label className="block">
                <span className={labelClass}>City</span>
                <input name="city" className={inputClass} value={formData.city} onChange={updateField} autoComplete="address-level2" />
                <FieldError message={errors.city} />
              </label>

              <label className="block">
                <span className={labelClass}>State</span>
                <input name="state" className={inputClass} value={formData.state} onChange={updateField} autoComplete="address-level1" />
                <FieldError message={errors.state} />
              </label>

              <label className="block">
                <span className={labelClass}>Experience Years</span>
                <input name="experienceYears" className={inputClass} type="number" min="0" max="80" value={formData.experienceYears} onChange={updateField} />
                <FieldError message={errors.experienceYears} />
              </label>

              <label className="block">
                <span className={labelClass}>Instagram URL</span>
                <input name="instagramUrl" className={inputClass} value={formData.instagramUrl} onChange={updateField} placeholder="https://instagram.com/..." />
                <FieldError message={errors.instagramUrl} />
              </label>
            </div>

            <label className="block">
              <span className={labelClass}>Portfolio URL</span>
              <input name="portfolioUrl" className={inputClass} value={formData.portfolioUrl} onChange={updateField} placeholder="https://..." />
              <FieldError message={errors.portfolioUrl} />
            </label>

            <label className="block">
              <span className={labelClass}>Bio</span>
              <textarea name="bio" className={textAreaClass} value={formData.bio} onChange={updateField} />
              <FieldError message={errors.bio} />
            </label>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <label className="block">
                <span className={labelClass}>
                  Profile Image <span className="text-red-600">*</span>
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-950 file:mr-4 file:rounded-md file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-orange-600"
                  onChange={handleImageChange}
                />
                <p className="mt-2 text-sm text-slate-700">
                  For optimal 3D gallery display, images must be close-up shots and 4k resolution.
                </p>
              </label>
              <FieldError message={errors.profileImage} />

              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Selected artist profile" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus className="h-10 w-10 text-slate-400" />
                  )}
                </div>
                <div className="text-sm text-slate-700">
                  <p className="font-semibold text-slate-950">
                    {profileImage ? profileImage.name : "No valid image selected"}
                  </p>
                  <p className="mt-1">Accepted formats: JPG, PNG, WebP. Maximum size: 12MB.</p>
                  {submitting ? (
                    <div className="mt-3">
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full bg-orange-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <p className="mt-2 font-medium text-slate-800">Uploading image: {uploadProgress}%</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-md text-sm leading-6 text-slate-600">
                Passwords are used only for Firebase Auth and are never saved into Firestore.
              </p>
              <button
                type="submit"
                disabled={!canSubmit}
                aria-disabled={!canSubmit}
                className={`inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-sm font-bold transition ${
                  canSubmit
                    ? "bg-orange-500 text-black shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-100"
                    : "pointer-events-none cursor-not-allowed bg-slate-200 text-slate-500"
                }`}
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
                {submitting ? "Submitting" : "Submit Profile"}
                {!submitting ? <ArrowRight className="h-4 w-4" /> : null}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
