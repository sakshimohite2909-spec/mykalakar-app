import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fetchCompleteArtistProfileById } from "@/services/firebaseServices";

const inputClass =
  "mt-2 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-[#111827] outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100";
const textareaClass =
  "mt-2 min-h-28 w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm font-semibold leading-6 text-[#111827] outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100";
const labelClass = "text-xs font-black uppercase tracking-[0.16em] text-gray-500";

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function toArray(value) {
  if (Array.isArray(value)) return value.filter((item) => item !== undefined && item !== null && item !== "");
  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function uniqueList(values) {
  return Array.from(new Set(values.map((item) => String(item || "").trim()).filter(Boolean)));
}

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatValue(value) {
  if (value === undefined || value === null || value === "") return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(toNumber(value));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(toNumber(value));
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && typeof value.toDate === "function") return value.toDate();
  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatDate(value) {
  const date = toDate(value);
  return date ? date.toLocaleString() : "Not recorded";
}

function splitDraftList(value) {
  return uniqueList(String(value || "").split(/[,\n]/));
}

function normalizeArtEntries(profile) {
  const source = firstValue(profile?.artsList, profile?.categoriesArray, profile?.artEntries);
  const list = Array.isArray(source) ? source : [];

  if (list.length > 0) {
    return list.map((entry, index) => {
      const artForm = firstValue(entry?.artForm, entry?.category, entry?.subcategory, profile?.artForm, profile?.subcategory);
      return {
        id: entry?.id || `art-${index + 1}`,
        mainCategory: firstValue(entry?.mainCategory, profile?.mainCategory, profile?.category),
        category: firstValue(entry?.category, artForm),
        artForm,
        subcategory: firstValue(entry?.subcategory, artForm),
        types: toArray(entry?.types),
        soloPrice: toNumber(firstValue(entry?.soloPrice, entry?.soloPerformancePrice, profile?.soloPrice)),
        duoPrice: toNumber(firstValue(entry?.duoPrice, entry?.duoPerformancePrice, profile?.duoPrice)),
        teamPrice: toNumber(firstValue(entry?.teamPrice, entry?.teamPerformancePrice, profile?.teamPrice)),
        showPricingOnProfile: Boolean(firstValue(entry?.showPricingOnProfile, profile?.showPricingOnProfile, false)),
        youtubeLinks: toArray(entry?.youtubeLinks),
      };
    });
  }

  const fallbackArtForm = firstValue(profile?.artForm, profile?.subcategory, toArray(profile?.categories)[0]);
  return [
    {
      id: "art-1",
      mainCategory: firstValue(profile?.mainCategory, profile?.category),
      category: fallbackArtForm,
      artForm: fallbackArtForm,
      subcategory: fallbackArtForm,
      types: toArray(profile?.types),
      soloPrice: toNumber(profile?.soloPrice),
      duoPrice: toNumber(profile?.duoPrice),
      teamPrice: toNumber(profile?.teamPrice),
      showPricingOnProfile: Boolean(profile?.showPricingOnProfile || profile?.showPriceOnProfile),
      youtubeLinks: toArray(profile?.youtubeLinks),
    },
  ];
}

function readArtistProfile(profile, routeId) {
  const identity = profile?.identity || {};
  const contact = profile?.contact || {};
  const artistProfile = profile?.artistProfile || {};
  const analytics = profile?.performanceAnalytics || {};
  const pricing = profile?.services?.pricing || profile?.pricing || {};
  const media = profile?.media || {};
  const verification = profile?.verification || {};
  const bankDetails = profile?.bankDetails || {};
  const assistant = profile?.assistant || {};
  const artEntries = normalizeArtEntries(profile);
  const primaryArt = artEntries[0] || {};
  const categories = uniqueList([
    ...toArray(artistProfile.artForms),
    ...toArray(profile?.categories),
    ...toArray(profile?.categoriesArray).map((entry) => firstValue(entry?.artForm, entry?.category)),
    primaryArt.artForm,
    profile?.subcategory,
  ]);
  const youtubeLinks = uniqueList([
    ...toArray(profile?.youtubeLinks),
    ...artEntries.flatMap((entry) => toArray(entry.youtubeLinks)),
    ...toArray(profile?.socialLinks).map((link) => link?.url),
  ]);

  return {
    documentId: firstValue(routeId, profile?.id, profile?.artistId, profile?.uid),
    uid: firstValue(profile?.uid, profile?.artistId, routeId),
    username: profile?.username,
    fullName: firstValue(profile?.name, profile?.fullName, profile?.artistName, identity.legalName),
    brandName: firstValue(profile?.brandName, profile?.nickName, identity.brandName, profile?.stageName),
    privateEmail: firstValue(contact.privateEmail, profile?.privateEmail, profile?.email),
    mobileNumber: firstValue(contact.mobileNumber, profile?.mobileNumber, profile?.phoneNumber, profile?.phone),
    emergencyNumber: firstValue(contact.emergencyNumber, profile?.emergencyNumber),
    phoneOptional: profile?.phoneOptional,
    dob: firstValue(profile?.dob, profile?.dateOfBirth),
    age: firstValue(profile?.age, ""),
    showAgeOnProfile: Boolean(firstValue(profile?.showAgeOnProfile, profile?.ageDisplay, false)),
    gender: profile?.gender,
    travelWillingness: profile?.travelWillingness,
    languages: uniqueList([...toArray(profile?.languages), ...toArray(profile?.languagesSpoken)]),
    district: firstValue(contact.district, profile?.district, profile?.city),
    state: firstValue(contact.state, profile?.state),
    mainCategory: firstValue(primaryArt.mainCategory, profile?.mainCategory, profile?.category),
    artForm: firstValue(primaryArt.artForm, profile?.artForm, profile?.subcategory),
    categories,
    types: uniqueList([...toArray(profile?.types), ...toArray(primaryArt.types)]),
    artEntries,
    bio: firstValue(artistProfile.bio, profile?.bio, profile?.description),
    experience: toNumber(firstValue(artistProfile.experience, profile?.experience, profile?.experienceYears)),
    followers: toNumber(firstValue(analytics.followers, profile?.followers)),
    views: toNumber(firstValue(analytics.views, profile?.views)),
    rating: toNumber(profile?.rating),
    reviews: toNumber(profile?.reviews),
    soloPrice: toNumber(firstValue(pricing.soloPrice, profile?.soloPrice, primaryArt.soloPrice)),
    duoPrice: toNumber(firstValue(pricing.duoPrice, profile?.duoPrice, primaryArt.duoPrice)),
    teamPrice: toNumber(firstValue(pricing.teamPrice, profile?.teamPrice, primaryArt.teamPrice)),
    showPricingOnProfile: Boolean(firstValue(profile?.showPricingOnProfile, profile?.showPriceOnProfile, primaryArt.showPricingOnProfile)),
    profileImageUrl: firstValue(media.profileImageUrl, media.profilePhoto, artistProfile.profileImage, profile?.profileImageUrl, profile?.profilePhoto, profile?.imageUrl),
    coverImageUrl: firstValue(media.coverImageUrl, media.coverPhoto, artistProfile.coverImage, profile?.coverImageUrl, profile?.coverPhoto, profile?.bannerImageUrl),
    aadharImageUrl: firstValue(media.aadharPhoto, profile?.aadharPhoto),
    galleryPhotos: uniqueList([...toArray(media.galleryPhotos), ...toArray(profile?.galleryPhotos)]),
    categoryMedia: Array.isArray(media.categoryMedia) ? media.categoryMedia : [],
    aadharNumber: firstValue(identity.aadharNumber, profile?.aadharNumber),
    bankName: firstValue(bankDetails.bankName, profile?.bankName),
    ifscCode: firstValue(bankDetails.ifscCode, profile?.ifscCode),
    accountNumber: firstValue(bankDetails.accountNumber, profile?.accountNumber),
    portfolioUrl: firstValue(profile?.portfolioUrl, youtubeLinks[0]),
    liveLink: profile?.liveLink,
    youtubeLinks,
    hasAssistant: Boolean(firstValue(assistant.hasAssistant, assistant.needAssistant === "yes", profile?.hasAssistant)),
    assistantName: firstValue(assistant.name, profile?.assistantName),
    assistantContact: firstValue(assistant.contact, profile?.assistantContact),
    suggestionComment: profile?.suggestionComment,
    status: firstValue(verification.status, profile?.applicationStatus, profile?.status, "pending"),
    availability: firstValue(profile?.availability, "available"),
    verified: Boolean(firstValue(verification.isVerified, profile?.verified, false)),
    trending: Boolean(profile?.trending),
    mediaUploadStatus: profile?.mediaUploadStatus,
    mediaUploadWarnings: toArray(profile?.mediaUploadWarnings),
    createdAt: profile?.createdAt,
    updatedAt: profile?.updatedAt,
  };
}

function makeDraft(viewModel) {
  return {
    fullName: viewModel.fullName || "",
    brandName: viewModel.brandName || "",
    username: viewModel.username || "",
    privateEmail: viewModel.privateEmail || "",
    mobileNumber: viewModel.mobileNumber || "",
    emergencyNumber: viewModel.emergencyNumber || "",
    phoneOptional: viewModel.phoneOptional || "",
    dob: viewModel.dob || "",
    age: String(viewModel.age || ""),
    showAgeOnProfile: Boolean(viewModel.showAgeOnProfile),
    gender: viewModel.gender || "",
    travelWillingness: viewModel.travelWillingness || "",
    languages: viewModel.languages.join(", "),
    district: viewModel.district || "",
    state: viewModel.state || "",
    mainCategory: viewModel.mainCategory || "",
    artForm: viewModel.artForm || "",
    categories: viewModel.categories.join(", "),
    types: viewModel.types.join(", "),
    bio: viewModel.bio || "",
    experience: String(viewModel.experience || 0),
    followers: String(viewModel.followers || 0),
    views: String(viewModel.views || 0),
    rating: String(viewModel.rating || 0),
    reviews: String(viewModel.reviews || 0),
    soloPrice: String(viewModel.soloPrice || 0),
    duoPrice: String(viewModel.duoPrice || 0),
    teamPrice: String(viewModel.teamPrice || 0),
    showPricingOnProfile: Boolean(viewModel.showPricingOnProfile),
    profileImageUrl: viewModel.profileImageUrl || "",
    coverImageUrl: viewModel.coverImageUrl || "",
    aadharImageUrl: viewModel.aadharImageUrl || "",
    galleryPhotos: viewModel.galleryPhotos.join("\n"),
    aadharNumber: viewModel.aadharNumber || "",
    bankName: viewModel.bankName || "",
    ifscCode: viewModel.ifscCode || "",
    accountNumber: viewModel.accountNumber || "",
    portfolioUrl: viewModel.portfolioUrl || "",
    liveLink: viewModel.liveLink || "",
    youtubeLinks: viewModel.youtubeLinks.join("\n"),
    hasAssistant: Boolean(viewModel.hasAssistant),
    assistantName: viewModel.assistantName || "",
    assistantContact: viewModel.assistantContact || "",
    suggestionComment: viewModel.suggestionComment || "",
    status: viewModel.status || "pending",
    availability: viewModel.availability || "available",
    verified: Boolean(viewModel.verified),
    trending: Boolean(viewModel.trending),
  };
}

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (value && typeof value === "object" && typeof value.toDate !== "function") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneValue(item)]));
  }

  return value;
}

function setNestedValue(target, path, value) {
  const parts = String(path).split(".");
  let current = target;

  parts.slice(0, -1).forEach((part) => {
    if (!current[part] || typeof current[part] !== "object" || Array.isArray(current[part])) {
      current[part] = {};
    }

    current = current[part];
  });

  current[parts[parts.length - 1]] = value;
}

function applyUpdatesToProfile(profile, updates) {
  const nextProfile = cloneValue(profile || {});

  Object.entries(updates).forEach(([path, value]) => {
    if (path.includes(".")) {
      setNestedValue(nextProfile, path, value);
    } else {
      nextProfile[path] = value;
    }
  });

  return nextProfile;
}

function StatusMessage({ message, onDismiss }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(onDismiss, 5200);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  const success = message.type === "success";

  return (
    <div
      className={`rounded-lg border p-4 ${
        success ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-red-200 bg-red-50 text-red-950"
      }`}
      role="status"
    >
      <div className="flex items-start gap-3">
        {success ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
        ) : (
          <AlertCircle className="mt-0.5 h-5 w-5 text-red-700" />
        )}
        <div>
          <p className="font-black">{message.title}</p>
          <p className="mt-1 text-sm font-medium leading-6">{message.body}</p>
        </div>
      </div>
    </div>
  );
}

function Card({ children, title }) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black tracking-tight text-[#111827]">{title}</h2>
      <div className="mt-5">{children}</div>
    </article>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="border-b border-gray-100 py-3 last:border-b-0">
      <p className={labelClass}>{label}</p>
      <p className="mt-1 break-words text-sm font-bold leading-6 text-[#111827]">{formatValue(value)}</p>
    </div>
  );
}

function EditInput({ label, name, onChange, type = "text", value }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input
        name={name}
        type={type}
        min={type === "number" ? "0" : undefined}
        className={inputClass}
        value={value}
        onChange={onChange}
      />
    </label>
  );
}

function EditTextarea({ label, name, onChange, value }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <textarea name={name} className={textareaClass} value={value} onChange={onChange} />
    </label>
  );
}

function EditCheckbox({ checked, label, name, onChange }) {
  return (
    <label className="inline-flex h-11 items-center gap-3 rounded-lg border border-gray-300 bg-white px-3 text-sm font-black text-[#111827]">
      <input
        name={name}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
      />
      {label}
    </label>
  );
}

function Pills({ emptyText = "None recorded", items }) {
  if (!items.length) {
    return <p className="text-sm font-bold text-gray-600">{emptyText}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
          {item}
        </span>
      ))}
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-[#F9FAFB] p-4">
      <p className={labelClass}>{label}</p>
      <p className="mt-2 text-2xl font-black text-[#111827]">{formatNumber(value)}</p>
    </div>
  );
}

function PriceBox({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-[#F9FAFB] p-4">
      <p className={labelClass}>{label}</p>
      <p className="mt-2 text-xl font-black text-[#111827]">{formatCurrency(value)}</p>
    </div>
  );
}

function MediaFrame({ alt, src, title, wide = false }) {
  return (
    <div>
      <p className={labelClass}>{title}</p>
      <div className={`mt-2 flex overflow-hidden rounded-lg border border-gray-200 bg-[#F9FAFB] ${wide ? "h-44" : "h-64"}`}>
        {src ? (
          <img src={src} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm font-bold text-gray-500">
            No image asset available
          </div>
        )}
      </div>
    </div>
  );
}

function GalleryGrid({ images }) {
  if (!images.length) return <p className="text-sm font-bold text-gray-600">No gallery photos uploaded</p>;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {images.map((image, index) => (
        <div key={`${image}-${index}`} className="aspect-square overflow-hidden rounded-lg border border-gray-200 bg-[#F9FAFB]">
          <img src={image} alt={`Gallery ${index + 1}`} className="h-full w-full object-cover" />
        </div>
      ))}
    </div>
  );
}

function CategoryMediaList({ items }) {
  if (!items.length) return <p className="text-sm font-bold text-gray-600">No category-specific media recorded</p>;

  return (
    <div className="grid gap-4">
      {items.map((item, index) => {
        const profilePhotos = toArray(item?.profilePhotos);
        const performancePhotos = toArray(item?.performancePhotos);

        return (
          <div key={`${item?.artForm || item?.category || "category"}-${index}`} className="rounded-lg border border-gray-200 bg-[#F9FAFB] p-4">
            <p className="text-sm font-black text-[#111827]">{formatValue(item?.artForm || item?.category)}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-gray-500">{formatValue(item?.mainCategory)}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className={labelClass}>Profile Media</p>
                <div className="mt-2"><GalleryGrid images={profilePhotos} /></div>
              </div>
              <div>
                <p className={labelClass}>Performance Media</p>
                <div className="mt-2"><GalleryGrid images={performancePhotos} /></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LinkList({ links }) {
  if (!links.length) return <p className="text-sm font-bold text-gray-600">No links submitted</p>;

  return (
    <div className="grid gap-2">
      {links.map((link) => (
        <a key={link} href={link} target="_blank" rel="noreferrer" className="break-all text-sm font-bold text-orange-700 hover:text-orange-900">
          {link}
        </a>
      ))}
    </div>
  );
}

function PricingTable({ artEntries }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] bg-[#F9FAFB] text-xs font-black uppercase tracking-[0.14em] text-gray-500">
        <div className="px-3 py-3">Art Form</div>
        <div className="px-3 py-3">Solo</div>
        <div className="px-3 py-3">Duo</div>
        <div className="px-3 py-3">Team</div>
      </div>
      {artEntries.map((entry) => (
        <div key={entry.id} className="grid grid-cols-[1.5fr_1fr_1fr_1fr] border-t border-gray-100 text-sm font-bold text-[#111827]">
          <div className="px-3 py-3">{formatValue(entry.artForm || entry.category)}</div>
          <div className="px-3 py-3">{formatCurrency(entry.soloPrice)}</div>
          <div className="px-3 py-3">{formatCurrency(entry.duoPrice)}</div>
          <div className="px-3 py-3">{formatCurrency(entry.teamPrice)}</div>
        </div>
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-gray-200 bg-white">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-600" />
        <p className="mt-4 text-sm font-bold text-[#111827]">Loading artist profile...</p>
      </div>
    </div>
  );
}

export default function AdminArtistDashboard() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState(null);

  const viewModel = useMemo(() => (profile ? readArtistProfile(profile, id) : null), [id, profile]);

  useEffect(() => {
    let mounted = true;

    async function loadArtist() {
      setLoading(true);
      setMessage(null);

      try {
        const result = await fetchCompleteArtistProfileById(id);

        if (!mounted) return;
        setProfile(result);
        setDraft(result ? makeDraft(readArtistProfile(result, id)) : null);
      } catch (error) {
        if (!mounted) return;
        setMessage({
          type: "error",
          title: "Profile unavailable",
          body: error?.message || "Could not load this artist profile.",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadArtist();

    return () => {
      mounted = false;
    };
  }, [id]);

  function updateDraft(event) {
    const { checked, name, type, value } = event.target;

    setDraft((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function cancelEditing() {
    if (viewModel) setDraft(makeDraft(viewModel));
    setEditMode(false);
    setMessage(null);
  }

  function buildUpdates() {
    const categories = splitDraftList(draft.categories);
    const types = splitDraftList(draft.types);
    const languages = splitDraftList(draft.languages);
    const youtubeLinks = splitDraftList(draft.youtubeLinks);
    const galleryPhotos = splitDraftList(draft.galleryPhotos);
    const fullName = draft.fullName.trim();
    const brandName = draft.brandName.trim();
    const privateEmail = draft.privateEmail.trim();
    const mobileNumber = draft.mobileNumber.trim();
    const emergencyNumber = draft.emergencyNumber.trim();
    const phoneOptional = draft.phoneOptional.trim();
    const district = draft.district.trim();
    const state = draft.state.trim();
    const mainCategory = draft.mainCategory.trim();
    const artForm = draft.artForm.trim() || categories[0] || "";
    const bio = draft.bio.trim();
    const experience = toNumber(draft.experience);
    const soloPrice = toNumber(draft.soloPrice);
    const duoPrice = toNumber(draft.duoPrice);
    const teamPrice = toNumber(draft.teamPrice);
    const profileImageUrl = draft.profileImageUrl.trim();
    const coverImageUrl = draft.coverImageUrl.trim();
    const aadharImageUrl = draft.aadharImageUrl.trim();
    const existingArts = Array.isArray(profile?.artsList) ? profile.artsList : [];
    const primaryArt = {
      ...(existingArts[0] || {}),
      mainCategory,
      category: artForm,
      artForm,
      subcategory: artForm,
      types,
      soloPerformancePrice: soloPrice,
      duoPerformancePrice: duoPrice,
      teamPerformancePrice: teamPrice,
      soloPrice,
      duoPrice,
      teamPrice,
      showPricingOnProfile: Boolean(draft.showPricingOnProfile),
      youtubeLinks,
    };
    const artsList = [primaryArt, ...existingArts.slice(1)];
    const categoryMedia = Array.isArray(profile?.media?.categoryMedia) ? profile.media.categoryMedia : [];
    const nextCategoryMedia = categoryMedia.length
      ? [
          {
            ...categoryMedia[0],
            mainCategory,
            category: artForm,
            artForm,
            profilePhotos: [profileImageUrl].filter(Boolean),
            performancePhotos: [coverImageUrl, ...galleryPhotos].filter(Boolean),
            youtubeLinks,
          },
          ...categoryMedia.slice(1),
        ]
      : [
          {
            mainCategory,
            category: artForm,
            artForm,
            profilePhotos: [profileImageUrl].filter(Boolean),
            performancePhotos: [coverImageUrl, ...galleryPhotos].filter(Boolean),
            youtubeLinks,
          },
        ];

    return {
      name: fullName,
      artistName: fullName,
      fullName,
      brandName,
      nickName: brandName,
      username: draft.username.trim(),
      email: privateEmail,
      privateEmail,
      mobileNumber,
      phoneNumber: mobileNumber,
      emergencyNumber,
      phoneOptional,
      dob: draft.dob,
      dateOfBirth: draft.dob,
      age: toNumber(draft.age),
      showAgeOnProfile: Boolean(draft.showAgeOnProfile),
      ageDisplay: Boolean(draft.showAgeOnProfile),
      gender: draft.gender.trim(),
      travelWillingness: draft.travelWillingness.trim(),
      languages,
      languagesSpoken: languages,
      district,
      state,
      category: mainCategory,
      mainCategory,
      subcategory: artForm,
      artForm,
      categories,
      types,
      artsList,
      categoriesArray: artsList,
      bio,
      description: bio,
      experience,
      followers: toNumber(draft.followers),
      views: toNumber(draft.views),
      rating: toNumber(draft.rating),
      reviews: toNumber(draft.reviews),
      soloPrice,
      duoPrice,
      teamPrice,
      showPricingOnProfile: Boolean(draft.showPricingOnProfile),
      showPriceOnProfile: Boolean(draft.showPricingOnProfile),
      profilePhoto: profileImageUrl,
      profileImageUrl,
      coverPhoto: coverImageUrl,
      coverImageUrl,
      galleryPhotos,
      aadharPhoto: aadharImageUrl,
      portfolioUrl: draft.portfolioUrl.trim(),
      liveLink: draft.liveLink.trim(),
      youtubeLinks,
      socialLinks: youtubeLinks.map((url) => ({ platform: "youtube", url })),
      aadharNumber: draft.aadharNumber.trim(),
      bankName: draft.bankName.trim(),
      ifscCode: draft.ifscCode.trim().toUpperCase(),
      accountNumber: draft.accountNumber.trim(),
      assistant: {
        hasAssistant: Boolean(draft.hasAssistant),
        name: draft.assistantName.trim(),
        contact: draft.assistantContact.trim(),
        needAssistant: draft.hasAssistant ? "yes" : "no",
      },
      suggestionComment: draft.suggestionComment.trim(),
      status: draft.status.trim() || "pending",
      applicationStatus: draft.status.trim() || "pending",
      availability: draft.availability.trim() || "available",
      verified: Boolean(draft.verified),
      trending: Boolean(draft.trending),
      "identity.legalName": fullName,
      "identity.brandName": brandName,
      "identity.aadharNumber": draft.aadharNumber.trim(),
      "contact.privateEmail": privateEmail,
      "contact.mobileNumber": mobileNumber,
      "contact.emergencyNumber": emergencyNumber,
      "contact.district": district,
      "contact.state": state,
      "artistProfile.artForms": categories,
      "artistProfile.experience": experience,
      "artistProfile.bio": bio,
      "artistProfile.location": [district, state].filter(Boolean).join(", "),
      "artistProfile.profileImage": profileImageUrl,
      "artistProfile.coverImage": coverImageUrl,
      "artistProfile.youtubeLinks": youtubeLinks,
      "performanceAnalytics.followers": toNumber(draft.followers),
      "performanceAnalytics.views": toNumber(draft.views),
      "services.pricing.soloPrice": soloPrice,
      "services.pricing.duoPrice": duoPrice,
      "services.pricing.teamPrice": teamPrice,
      "media.profilePhoto": profileImageUrl,
      "media.profileImageUrl": profileImageUrl,
      "media.coverPhoto": coverImageUrl,
      "media.coverImageUrl": coverImageUrl,
      "media.galleryPhotos": galleryPhotos,
      "media.aadharPhoto": aadharImageUrl,
      "media.categoryMedia": nextCategoryMedia,
      "bankDetails.bankName": draft.bankName.trim(),
      "bankDetails.ifscCode": draft.ifscCode.trim().toUpperCase(),
      "bankDetails.accountNumber": draft.accountNumber.trim(),
      "verification.status": draft.status.trim() || "pending",
      "verification.isVerified": Boolean(draft.verified),
      "search.displayName": brandName || fullName,
      "search.categoryLabels": categories,
      "search.district": district,
      "search.state": state,
      "search.subcategory": artForm,
    };
  }

  async function saveChanges() {
    if (!draft || !viewModel?.documentId) return;

    setSaving(true);
    setMessage(null);

    try {
      const updates = buildUpdates();
      await updateDoc(doc(db, "artists", viewModel.documentId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      const nextProfile = applyUpdatesToProfile(profile, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      setProfile(nextProfile);
      setDraft(makeDraft(readArtistProfile(nextProfile, id)));
      setEditMode(false);
      setMessage({
        type: "success",
        title: "Artist profile updated",
        body: "The structured Firestore artist record has been saved.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        title: "Update failed",
        body: error?.message || "Could not update this artist profile.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-7xl bg-[#F9FAFB] px-4 py-8 text-[#111827] sm:px-6 lg:px-8">
        <LoadingState />
      </section>
    );
  }

  if (!profile || !viewModel || !draft) {
    return (
      <section className="mx-auto w-full max-w-7xl bg-[#F9FAFB] px-4 py-8 text-[#111827] sm:px-6 lg:px-8">
        <StatusMessage message={message} onDismiss={() => setMessage(null)} />
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-black text-[#111827]">Artist profile not found.</p>
          <Link to="/admin/artists" className="mt-4 inline-flex text-sm font-black text-orange-700 hover:text-orange-900">
            Back to registry
          </Link>
        </div>
      </section>
    );
  }

  const displayName = formatValue(viewModel.brandName || viewModel.fullName);

  return (
    <section className="mx-auto w-full max-w-7xl bg-[#F9FAFB] px-4 py-8 text-[#111827] sm:px-6 lg:px-8">
      <div className="space-y-6">
        <StatusMessage message={message} onDismiss={() => setMessage(null)} />

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div>
              <Link to="/admin/artists" className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-orange-700">
                <ArrowLeft className="h-4 w-4" />
                Artist registry
              </Link>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-orange-600">
                Structured Management Console
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#111827] sm:text-4xl">
                {displayName}
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-black">
                Review and edit every submitted registration field without exposing raw database payloads.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setEditMode((current) => !current)}
                className={`inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-black transition ${
                  editMode
                    ? "border-orange-500 bg-orange-50 text-orange-800"
                    : "border-gray-300 bg-white text-[#111827] hover:bg-[#F9FAFB]"
                }`}
              >
                <Pencil className="h-4 w-4" />
                {editMode ? "Editing Profile" : "Edit Profile"}
              </button>

              {editMode ? (
                <>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={saving}
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-black text-[#111827] transition hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveChanges}
                    disabled={saving}
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-black text-black transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? "Saving" : "Save Updates"}
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Identity & Contact">
            {editMode ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <EditInput label="Full Name" name="fullName" value={draft.fullName} onChange={updateDraft} />
                <EditInput label="Brand Name" name="brandName" value={draft.brandName} onChange={updateDraft} />
                <EditInput label="Username" name="username" value={draft.username} onChange={updateDraft} />
                <EditInput label="Private Email" name="privateEmail" type="email" value={draft.privateEmail} onChange={updateDraft} />
                <EditInput label="Mobile Number" name="mobileNumber" value={draft.mobileNumber} onChange={updateDraft} />
                <EditInput label="Emergency Number" name="emergencyNumber" value={draft.emergencyNumber} onChange={updateDraft} />
                <EditInput label="Optional Phone" name="phoneOptional" value={draft.phoneOptional} onChange={updateDraft} />
                <EditInput label="Date of Birth" name="dob" type="date" value={draft.dob} onChange={updateDraft} />
                <EditInput label="Age" name="age" type="number" value={draft.age} onChange={updateDraft} />
                <EditInput label="Gender" name="gender" value={draft.gender} onChange={updateDraft} />
                <EditInput label="Travel Willingness" name="travelWillingness" value={draft.travelWillingness} onChange={updateDraft} />
                <EditInput label="Languages Spoken" name="languages" value={draft.languages} onChange={updateDraft} />
                <EditInput label="District" name="district" value={draft.district} onChange={updateDraft} />
                <EditInput label="State" name="state" value={draft.state} onChange={updateDraft} />
                <EditCheckbox label="Show Age On Profile" name="showAgeOnProfile" checked={draft.showAgeOnProfile} onChange={updateDraft} />
              </div>
            ) : (
              <div>
                <InfoRow label="Full Name" value={viewModel.fullName} />
                <InfoRow label="Brand Name" value={viewModel.brandName} />
                <InfoRow label="Username" value={viewModel.username} />
                <InfoRow label="Private Email" value={viewModel.privateEmail} />
                <InfoRow label="Mobile Number" value={viewModel.mobileNumber} />
                <InfoRow label="Emergency Number" value={viewModel.emergencyNumber} />
                <InfoRow label="Optional Phone" value={viewModel.phoneOptional} />
                <InfoRow label="Date of Birth" value={viewModel.dob} />
                <InfoRow label="Age Display" value={viewModel.showAgeOnProfile ? `${formatValue(viewModel.age)} shown` : "Hidden"} />
                <InfoRow label="Gender" value={viewModel.gender} />
                <InfoRow label="Travel Willingness" value={viewModel.travelWillingness} />
                <InfoRow label="District" value={viewModel.district} />
                <InfoRow label="State" value={viewModel.state} />
                <div className="py-3">
                  <p className={labelClass}>Languages Spoken</p>
                  <div className="mt-2"><Pills items={viewModel.languages} /></div>
                </div>
              </div>
            )}
          </Card>

          <Card title="Artistic Profile">
            {editMode ? (
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <EditInput label="Main Category" name="mainCategory" value={draft.mainCategory} onChange={updateDraft} />
                  <EditInput label="Art Form / Subcategory" name="artForm" value={draft.artForm} onChange={updateDraft} />
                  <EditInput label="Category Pills" name="categories" value={draft.categories} onChange={updateDraft} />
                  <EditInput label="Types" name="types" value={draft.types} onChange={updateDraft} />
                  <EditInput label="Experience Years" name="experience" type="number" value={draft.experience} onChange={updateDraft} />
                  <EditInput label="Portfolio URL" name="portfolioUrl" value={draft.portfolioUrl} onChange={updateDraft} />
                  <EditInput label="Live Stream Link" name="liveLink" value={draft.liveLink} onChange={updateDraft} />
                </div>
                <EditTextarea label="Bio" name="bio" value={draft.bio} onChange={updateDraft} />
                <EditTextarea label="YouTube Links" name="youtubeLinks" value={draft.youtubeLinks} onChange={updateDraft} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <EditInput label="Followers" name="followers" type="number" value={draft.followers} onChange={updateDraft} />
                  <EditInput label="Views" name="views" type="number" value={draft.views} onChange={updateDraft} />
                  <EditInput label="Rating" name="rating" type="number" value={draft.rating} onChange={updateDraft} />
                  <EditInput label="Reviews" name="reviews" type="number" value={draft.reviews} onChange={updateDraft} />
                </div>
              </div>
            ) : (
              <div className="grid gap-5">
                <div>
                  <p className={labelClass}>Category / Subcategory</p>
                  <div className="mt-2"><Pills items={viewModel.categories} /></div>
                </div>
                <InfoRow label="Main Category" value={viewModel.mainCategory} />
                <InfoRow label="Art Form / Subcategory" value={viewModel.artForm} />
                <div>
                  <p className={labelClass}>Types</p>
                  <div className="mt-2"><Pills emptyText="No specific types selected" items={viewModel.types} /></div>
                </div>
                <div>
                  <p className={labelClass}>Bio</p>
                  <p className="mt-2 rounded-lg border border-gray-200 bg-[#F9FAFB] p-4 text-sm font-semibold leading-7 text-black">
                    {formatValue(viewModel.bio)}
                  </p>
                </div>
                <InfoRow label="Experience" value={`${formatNumber(viewModel.experience)} years`} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <StatBox label="Followers" value={viewModel.followers} />
                  <StatBox label="Views" value={viewModel.views} />
                  <StatBox label="Rating" value={viewModel.rating} />
                  <StatBox label="Reviews" value={viewModel.reviews} />
                </div>
                <InfoRow label="Portfolio URL" value={viewModel.portfolioUrl} />
                <InfoRow label="Live Stream Link" value={viewModel.liveLink} />
                <div>
                  <p className={labelClass}>YouTube Links</p>
                  <div className="mt-2"><LinkList links={viewModel.youtubeLinks} /></div>
                </div>
              </div>
            )}
          </Card>

          <Card title="Pricing & Services">
            {editMode ? (
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <EditInput label="Solo Price" name="soloPrice" type="number" value={draft.soloPrice} onChange={updateDraft} />
                  <EditInput label="Duo Price" name="duoPrice" type="number" value={draft.duoPrice} onChange={updateDraft} />
                  <EditInput label="Team Price" name="teamPrice" type="number" value={draft.teamPrice} onChange={updateDraft} />
                </div>
                <EditCheckbox label="Show Pricing On Profile" name="showPricingOnProfile" checked={draft.showPricingOnProfile} onChange={updateDraft} />
              </div>
            ) : (
              <div className="grid gap-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <PriceBox label="Solo Price" value={viewModel.soloPrice} />
                  <PriceBox label="Duo Price" value={viewModel.duoPrice} />
                  <PriceBox label="Team Price" value={viewModel.teamPrice} />
                </div>
                <InfoRow label="Show Pricing On Profile" value={viewModel.showPricingOnProfile} />
                <PricingTable artEntries={viewModel.artEntries} />
              </div>
            )}
          </Card>

          <Card title="Media Elements">
            <div className="grid gap-5">
              <MediaFrame alt={`${displayName} profile`} src={viewModel.profileImageUrl} title="Profile Image" />
              <MediaFrame alt={`${displayName} cover`} src={viewModel.coverImageUrl} title="Cover Image" wide />
              <MediaFrame alt={`${displayName} identity document`} src={viewModel.aadharImageUrl} title="Aadhar Card Image" wide />
              <div>
                <p className={labelClass}>Gallery Photos</p>
                <div className="mt-2"><GalleryGrid images={viewModel.galleryPhotos} /></div>
              </div>
              <div>
                <p className={labelClass}>Category Media</p>
                <div className="mt-2"><CategoryMediaList items={viewModel.categoryMedia} /></div>
              </div>

              {editMode ? (
                <div className="grid gap-4">
                  <EditInput label="Profile Image URL" name="profileImageUrl" value={draft.profileImageUrl} onChange={updateDraft} />
                  <EditInput label="Cover Image URL" name="coverImageUrl" value={draft.coverImageUrl} onChange={updateDraft} />
                  <EditInput label="Aadhar Image URL" name="aadharImageUrl" value={draft.aadharImageUrl} onChange={updateDraft} />
                  <EditTextarea label="Gallery Image URLs" name="galleryPhotos" value={draft.galleryPhotos} onChange={updateDraft} />
                </div>
              ) : null}
            </div>
          </Card>

          <Card title="Verification & Payout">
            {editMode ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <EditInput label="Aadhar Number" name="aadharNumber" value={draft.aadharNumber} onChange={updateDraft} />
                <EditInput label="Bank Name" name="bankName" value={draft.bankName} onChange={updateDraft} />
                <EditInput label="IFSC Code" name="ifscCode" value={draft.ifscCode} onChange={updateDraft} />
                <EditInput label="Account Number" name="accountNumber" value={draft.accountNumber} onChange={updateDraft} />
                <EditCheckbox label="Has Assistant" name="hasAssistant" checked={draft.hasAssistant} onChange={updateDraft} />
                <EditInput label="Assistant Name" name="assistantName" value={draft.assistantName} onChange={updateDraft} />
                <EditInput label="Assistant Contact" name="assistantContact" value={draft.assistantContact} onChange={updateDraft} />
                <div className="sm:col-span-2">
                  <EditTextarea label="Suggestion Comment" name="suggestionComment" value={draft.suggestionComment} onChange={updateDraft} />
                </div>
              </div>
            ) : (
              <div>
                <InfoRow label="Aadhar Number" value={viewModel.aadharNumber} />
                <InfoRow label="Bank Name" value={viewModel.bankName} />
                <InfoRow label="IFSC Code" value={viewModel.ifscCode} />
                <InfoRow label="Account Number" value={viewModel.accountNumber} />
                <InfoRow label="Has Assistant" value={viewModel.hasAssistant} />
                <InfoRow label="Assistant Name" value={viewModel.assistantName} />
                <InfoRow label="Assistant Contact" value={viewModel.assistantContact} />
                <InfoRow label="Suggestion Comment" value={viewModel.suggestionComment} />
              </div>
            )}
          </Card>

          <div className="lg:col-span-2">
            <Card title="System Metadata">
              {editMode ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <EditInput label="Status" name="status" value={draft.status} onChange={updateDraft} />
                  <EditInput label="Availability" name="availability" value={draft.availability} onChange={updateDraft} />
                  <EditCheckbox label="Verified" name="verified" checked={draft.verified} onChange={updateDraft} />
                  <EditCheckbox label="Trending" name="trending" checked={draft.trending} onChange={updateDraft} />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 bg-[#F9FAFB] p-4">
                    <p className={labelClass}>Technical Document ID</p>
                    <p className="mt-2 break-words text-sm font-black text-[#111827]">{formatValue(viewModel.documentId)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-[#F9FAFB] p-4">
                    <p className={labelClass}>UID</p>
                    <p className="mt-2 break-words text-sm font-black text-[#111827]">{formatValue(viewModel.uid)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-[#F9FAFB] p-4">
                    <p className={labelClass}>Status</p>
                    <p className="mt-2 text-sm font-black text-[#111827]">{formatValue(viewModel.status)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-[#F9FAFB] p-4">
                    <p className={labelClass}>Availability</p>
                    <p className="mt-2 text-sm font-black text-[#111827]">{formatValue(viewModel.availability)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-[#F9FAFB] p-4">
                    <p className={labelClass}>Created At</p>
                    <p className="mt-2 text-sm font-black text-[#111827]">{formatDate(viewModel.createdAt)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-[#F9FAFB] p-4">
                    <p className={labelClass}>Updated At</p>
                    <p className="mt-2 text-sm font-black text-[#111827]">{formatDate(viewModel.updatedAt)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-[#F9FAFB] p-4">
                    <p className={labelClass}>Verified</p>
                    <p className="mt-2 text-sm font-black text-[#111827]">{formatValue(viewModel.verified)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-[#F9FAFB] p-4">
                    <p className={labelClass}>Trending</p>
                    <p className="mt-2 text-sm font-black text-[#111827]">{formatValue(viewModel.trending)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-[#F9FAFB] p-4">
                    <p className={labelClass}>Media Upload Status</p>
                    <p className="mt-2 text-sm font-black text-[#111827]">{formatValue(viewModel.mediaUploadStatus)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-[#F9FAFB] p-4 md:col-span-3">
                    <p className={labelClass}>Media Upload Warnings</p>
                    <div className="mt-2"><Pills emptyText="No upload warnings" items={viewModel.mediaUploadWarnings} /></div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
