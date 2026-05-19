import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Save,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import {
  fetchAdminArtistProfile,
  updateAdminArtistProfile,
} from "@/services/firebaseServices";

const readonlyFields = new Set(["id", "createdAt", "updatedAt"]);
const priorityFields = [
  "id",
  "uid",
  "artistId",
  "status",
  "applicationStatus",
  "email",
  "privateEmail",
  "phone",
  "phoneNumber",
  "mobileNumber",
  "createdAt",
  "updatedAt",
];

function isTimestampLike(value) {
  return value && typeof value === "object" && typeof value.toDate === "function";
}

function formatLabel(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (isTimestampLike(value)) return value.toDate().toLocaleString();
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value) || typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function serializeDraftValue(value) {
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined) return "";
  if (Array.isArray(value) || (typeof value === "object" && !isTimestampLike(value))) {
    return JSON.stringify(value, null, 2);
  }
  return formatValue(value);
}

function coerceDraftValue(originalValue, draftValue) {
  if (typeof originalValue === "boolean") return Boolean(draftValue);
  if (typeof originalValue === "number") return Number(draftValue);
  if (Array.isArray(originalValue) || (typeof originalValue === "object" && originalValue !== null && !isTimestampLike(originalValue))) {
    if (!String(draftValue).trim()) return Array.isArray(originalValue) ? [] : {};
    return JSON.parse(draftValue);
  }
  return draftValue;
}

function makeDraft(profile) {
  return Object.fromEntries(
    Object.entries(profile || {}).map(([key, value]) => [key, serializeDraftValue(value)])
  );
}

function sortProfileEntries(profile) {
  return Object.entries(profile || {}).sort(([a], [b]) => {
    const aPriority = priorityFields.indexOf(a);
    const bPriority = priorityFields.indexOf(b);
    if (aPriority !== -1 || bPriority !== -1) {
      if (aPriority === -1) return 1;
      if (bPriority === -1) return -1;
      return aPriority - bPriority;
    }
    return a.localeCompare(b);
  });
}

function FloatingToast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(onClose, 4200);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          initial={{ opacity: 0, y: -14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -14, scale: 0.98 }}
          className="fixed right-4 top-5 z-[80] w-[calc(100vw-2rem)] max-w-md rounded-lg border border-white/60 bg-white/55 p-4 shadow-[0_24px_80px_rgba(31,41,55,0.18)] backdrop-blur-2xl"
          role="status"
        >
          <div className="flex gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                toast.type === "success" ? "bg-emerald-500/15 text-emerald-700" : "bg-red-500/15 text-red-700"
              }`}
            >
              {toast.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-black text-[#1E1B4B]">{toast.title}</p>
              <p className="mt-1 text-sm font-semibold text-[#1F2937]">{toast.message}</p>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse rounded-xl bg-white/60 p-8">
        <div className="h-8 w-64 rounded-xl bg-white/60" />
        <div className="mt-4 h-4 w-96 max-w-full rounded-xl bg-white/60" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-xl bg-white/60" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-xl bg-white/60" />
        ))}
      </div>
    </div>
  );
}

export default function AdminArtistDashboard() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let isActive = true;

    async function loadProfile() {
      setLoading(true);
      try {
        const result = await fetchAdminArtistProfile(id);
        if (!isActive) return;
        setProfile(result);
        setDraft(makeDraft(result));
      } catch (error) {
        if (!isActive) return;
        setToast({
          type: "error",
          title: "Profile unavailable",
          message: error?.message || "Could not load this artist profile.",
        });
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      isActive = false;
    };
  }, [id]);

  const entries = useMemo(() => sortProfileEntries(profile), [profile]);

  const summary = useMemo(
    () => [
      { label: "Private Email", value: profile?.privateEmail || profile?.email },
      { label: "Phone", value: profile?.phoneNumber || profile?.mobileNumber || profile?.phone },
      { label: "Status", value: profile?.status || profile?.applicationStatus },
      { label: "Internal ID", value: profile?.id || id },
    ],
    [id, profile]
  );

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const cancelEditing = () => {
    setDraft(makeDraft(profile));
    setEditMode(false);
  };

  const saveChanges = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const updates = {};

      for (const [key, originalValue] of entries) {
        if (readonlyFields.has(key) || isTimestampLike(originalValue)) continue;
        const nextValue = coerceDraftValue(originalValue, draft[key]);
        if (JSON.stringify(nextValue) !== JSON.stringify(originalValue)) {
          updates[key] = nextValue;
        }
      }

      if (!Object.keys(updates).length) {
        setToast({
          type: "success",
          title: "No changes to save",
          message: "The profile is already synchronized.",
        });
        setEditMode(false);
        return;
      }

      const syncedFields = await updateAdminArtistProfile(id, updates);
      const nextProfile = {
        ...profile,
        ...updates,
        updatedAt: syncedFields.updatedAt,
      };

      setProfile(nextProfile);
      setDraft(makeDraft(nextProfile));
      setEditMode(false);
      setToast({
        type: "success",
        title: "Artist updated",
        message: "Local admin state now matches the saved Firebase document.",
      });
    } catch (error) {
      setToast({
        type: "error",
        title: "Update failed",
        message: error?.message || "Could not update this artist profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderEditControl = (key, value) => {
    const readOnly = readonlyFields.has(key) || isTimestampLike(value);

    if (readOnly) {
      return (
        <input
          value={formatValue(value)}
          disabled
          className="mt-3 h-11 w-full rounded-lg border border-white/60 bg-white/35 px-3 text-sm font-bold text-slate-600"
        />
      );
    }

    if (typeof value === "boolean") {
      return (
        <button
          type="button"
          role="switch"
          aria-checked={Boolean(draft[key])}
          onClick={() => updateDraft(key, !draft[key])}
          className={`mt-3 inline-flex h-9 w-16 items-center rounded-full border border-white/70 p-1 transition ${
            draft[key] ? "bg-indigo-700" : "bg-white/50"
          }`}
        >
          <span
            className={`h-7 w-7 rounded-full bg-white shadow-sm transition ${
              draft[key] ? "translate-x-7" : "translate-x-0"
            }`}
          />
        </button>
      );
    }

    if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
      return (
        <textarea
          value={draft[key] ?? ""}
          onChange={(event) => updateDraft(key, event.target.value)}
          className="mt-3 min-h-36 w-full rounded-lg border border-white/60 bg-white/45 px-3 py-3 font-mono text-xs font-semibold leading-5 text-[#1F2937] outline-none backdrop-blur-2xl focus:border-indigo-300 focus:ring-4 focus:ring-indigo-200/40"
          spellCheck={false}
        />
      );
    }

    return (
      <input
        type={typeof value === "number" ? "number" : "text"}
        value={draft[key] ?? ""}
        onChange={(event) => updateDraft(key, event.target.value)}
        className="mt-3 h-11 w-full rounded-lg border border-white/60 bg-white/45 px-3 text-sm font-bold text-[#1F2937] outline-none backdrop-blur-2xl focus:border-indigo-300 focus:ring-4 focus:ring-indigo-200/40"
      />
    );
  };

  return (
    <section className="mx-auto w-full max-w-7xl text-[#1F2937]">
      <FloatingToast toast={toast} onClose={() => setToast(null)} />

      {loading ? (
        <DashboardSkeleton />
      ) : profile ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-white/60 bg-white/40 p-6 shadow-[0_24px_80px_rgba(31,41,55,0.10)] backdrop-blur-2xl">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
              <div>
                <Link
                  to="/admin/artists"
                  className="inline-flex items-center gap-2 text-sm font-black text-indigo-700 transition hover:text-indigo-950"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Artist registry
                </Link>
                <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="h-24 w-24 overflow-hidden rounded-lg border border-white/70 bg-white/50">
                    {profile.profileImageUrl || profile.profilePhoto || profile.media?.profilePhoto ? (
                      <img
                        src={profile.profileImageUrl || profile.profilePhoto || profile.media?.profilePhoto}
                        alt={profile.name || "Artist profile"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-black text-indigo-700">
                        {(profile.name || "A").slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-700">Admin Artist Control</p>
                    <h1 className="mt-2 text-3xl font-black text-[#1E1B4B] sm:text-4xl">
                      {profile.name || profile.fullName || "Artist Profile"}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#1F2937]">
                      Unrestricted document view with synchronized Firebase update controls.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={editMode}
                  onClick={() => setEditMode((value) => !value)}
                  className="inline-flex items-center gap-3 rounded-lg border border-white/60 bg-white/45 px-4 py-3 text-sm font-black text-[#1E1B4B] backdrop-blur-2xl transition hover:bg-white/70"
                >
                  <span
                    className={`relative h-7 w-12 rounded-full border border-white/70 transition ${
                      editMode ? "bg-indigo-700" : "bg-white/60"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition ${
                        editMode ? "left-5" : "left-0.5"
                      }`}
                    />
                  </span>
                  {editMode ? "Edit Mode" : "Read-Only"}
                </button>

                {editMode ? (
                  <>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="rounded-lg border border-white/60 bg-white/45 px-4 py-3 text-sm font-black text-[#1E1B4B] backdrop-blur-2xl transition hover:bg-white/70"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveChanges}
                      disabled={saving}
                      className={`inline-flex items-center gap-2 rounded-lg bg-[#1E1B4B] px-4 py-3 text-sm font-black text-white shadow-[0_16px_40px_rgba(30,27,75,0.22)] transition ${
                        saving ? "pointer-events-none cursor-not-allowed opacity-50" : "hover:bg-indigo-900"
                      }`}
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Changes
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summary.map((item) => (
              <div key={item.label} className="rounded-lg border border-white/60 bg-white/40 p-5 backdrop-blur-2xl">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-700">
                  <ShieldCheck className="h-4 w-4" />
                  {item.label}
                </p>
                <p className="mt-3 break-words text-lg font-black text-[#1E1B4B]">{formatValue(item.value)}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-white/60 bg-white/35 p-5 backdrop-blur-2xl">
            <div className="mb-5 flex items-center gap-3">
              <SlidersHorizontal className="h-5 w-5 text-indigo-700" />
              <h2 className="text-xl font-black text-[#1E1B4B]">Complete Firestore Document</h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {entries.map(([key, value]) => (
                <motion.div
                  key={key}
                  layout
                  className="rounded-lg border border-white/60 bg-white/40 p-4 backdrop-blur-2xl"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">{formatLabel(key)}</p>
                    <span className="rounded-lg border border-white/60 bg-white/40 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">
                      {Array.isArray(value) ? "array" : isTimestampLike(value) ? "timestamp" : typeof value}
                    </span>
                  </div>

                  {editMode ? (
                    renderEditControl(key, value)
                  ) : (
                    <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-white/60 bg-white/35 p-3 text-sm font-semibold leading-6 text-[#1F2937]">
                      {formatValue(value)}
                    </pre>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-white/60 bg-white/40 p-8 text-center backdrop-blur-2xl">
          <p className="text-lg font-black text-[#1E1B4B]">Artist profile not found.</p>
          <Link to="/admin/artists" className="mt-4 inline-flex text-sm font-black text-indigo-700">
            Back to registry
          </Link>
        </div>
      )}
    </section>
  );
}
