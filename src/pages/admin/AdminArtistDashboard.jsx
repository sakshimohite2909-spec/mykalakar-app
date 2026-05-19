import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Pencil,
  Save,
  ShieldCheck,
} from "lucide-react";
import {
  fetchCompleteArtistProfileById,
  updateExistingArtistProfile,
} from "@/services/firebaseServices";

const readOnlyFields = new Set(["documentId"]);
const priorityFields = [
  "documentId",
  "id",
  "uid",
  "artistId",
  "status",
  "applicationStatus",
  "fullName",
  "stageName",
  "name",
  "displayName",
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

function timestampToDate(value) {
  if (isTimestampLike(value)) return value.toDate();
  if (value instanceof Date) return value;
  return null;
}

function toDateTimeLocal(value) {
  const date = timestampToDate(value);
  if (!date || Number.isNaN(date.getTime())) return "";

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
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
  if (isTimestampLike(value) || value instanceof Date) return toDateTimeLocal(value);
  if (typeof value === "boolean") return Boolean(value);
  if (value === null || value === undefined) return "";
  if (Array.isArray(value) || typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function coerceDraftValue(originalValue, draftValue) {
  if (isTimestampLike(originalValue) || originalValue instanceof Date) {
    const nextDate = new Date(draftValue);
    if (Number.isNaN(nextDate.getTime())) {
      throw new Error("Enter a valid date and time.");
    }
    return nextDate;
  }

  if (typeof originalValue === "boolean") {
    return Boolean(draftValue);
  }

  if (typeof originalValue === "number") {
    const numberValue = Number(draftValue);
    if (Number.isNaN(numberValue)) throw new Error("Enter a valid number.");
    return numberValue;
  }

  if (Array.isArray(originalValue)) {
    if (!String(draftValue).trim()) return [];
    const parsedValue = JSON.parse(draftValue);
    if (!Array.isArray(parsedValue)) throw new Error("This field must remain a JSON array.");
    return parsedValue;
  }

  if (originalValue && typeof originalValue === "object") {
    if (!String(draftValue).trim()) return {};
    const parsedValue = JSON.parse(draftValue);
    if (!parsedValue || typeof parsedValue !== "object" || Array.isArray(parsedValue)) {
      throw new Error("This field must remain a JSON object.");
    }
    return parsedValue;
  }

  return draftValue;
}

function normalizeComparable(value) {
  if (isTimestampLike(value)) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return value;
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

function isImageUrl(key, value) {
  if (typeof value !== "string") return false;
  if (!/^https?:\/\//i.test(value)) return false;
  return /(image|photo|avatar|picture|profile)/i.test(key) || /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(value);
}

function isUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function StatusMessage({ message, onDismiss }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(onDismiss, 4800);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      className={`rounded-lg border p-4 ${
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

function LoadingState() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-slate-200 bg-white">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-600" />
        <p className="mt-4 text-sm font-semibold text-slate-700">Loading artist profile...</p>
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
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setLoading(true);
      setMessage(null);

      try {
        const result = await fetchCompleteArtistProfileById(id);
        if (!isMounted) return;
        setProfile(result);
        setDraft(makeDraft(result));
      } catch (error) {
        if (!isMounted) return;
        setMessage({
          type: "error",
          title: "Profile unavailable",
          body: error?.message || "Could not load this artist profile.",
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const entries = useMemo(() => sortProfileEntries(profile), [profile]);
  const profileImage = profile?.profileImageUrl || profile?.profilePhoto || profile?.imageUrl || profile?.media?.profilePhoto;

  const summary = useMemo(
    () => [
      { label: "Private Email", value: profile?.privateEmail || profile?.email },
      { label: "Phone", value: profile?.phoneNumber || profile?.mobileNumber || profile?.phone },
      { label: "Status", value: profile?.status || profile?.applicationStatus },
      { label: "Document ID", value: profile?.documentId || id },
    ],
    [id, profile]
  );

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function cancelEditing() {
    setDraft(makeDraft(profile));
    setEditMode(false);
    setMessage(null);
  }

  async function saveChanges() {
    if (!profile) return;

    setSaving(true);
    setMessage(null);

    try {
      const updates = {};

      for (const [key, originalValue] of entries) {
        if (readOnlyFields.has(key)) continue;

        const nextValue = coerceDraftValue(originalValue, draft[key]);
        const before = JSON.stringify(normalizeComparable(originalValue));
        const after = JSON.stringify(normalizeComparable(nextValue));

        if (before !== after) {
          updates[key] = nextValue;
        }
      }

      if (!Object.keys(updates).length) {
        setMessage({
          type: "success",
          title: "No changes to save",
          body: "This artist profile is already up to date.",
        });
        setEditMode(false);
        return;
      }

      const result = await updateExistingArtistProfile(profile.documentId || id, updates);
      const nextProfile = {
        ...profile,
        ...updates,
        adminLastSavedAt: new Date(result.clientSavedAt),
        ...(Object.prototype.hasOwnProperty.call(updates, "updatedAt")
          ? {}
          : { updatedAt: new Date(result.clientSavedAt) }),
      };

      setProfile(nextProfile);
      setDraft(makeDraft(nextProfile));
      setEditMode(false);
      setMessage({
        type: "success",
        title: "Artist updated",
        body: "The Firestore artist document was updated successfully.",
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

  function renderValue(key, value) {
    if (isImageUrl(key, value)) {
      return (
        <div className="mt-3 space-y-3">
          <img src={value} alt={formatLabel(key)} className="h-40 w-full rounded-lg border border-slate-200 object-cover" />
          <a href={value} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 break-all text-sm font-semibold text-orange-700 hover:text-orange-900">
            Open image <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      );
    }

    if (isUrl(value)) {
      return (
        <a href={value} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 break-all text-sm font-semibold text-orange-700 hover:text-orange-900">
          {value} <ExternalLink className="h-4 w-4" />
        </a>
      );
    }

    return (
      <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-800">
        {formatValue(value)}
      </pre>
    );
  }

  function renderEditControl(key, value) {
    if (readOnlyFields.has(key)) {
      return (
        <input
          value={formatValue(value)}
          disabled
          className="mt-3 h-11 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm font-medium text-slate-500"
        />
      );
    }

    if (isTimestampLike(value) || value instanceof Date) {
      return (
        <input
          type="datetime-local"
          value={draft[key] ?? ""}
          onChange={(event) => updateDraft(key, event.target.value)}
          className="mt-3 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-950 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
        />
      );
    }

    if (typeof value === "boolean") {
      return (
        <label className="mt-3 inline-flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
          <input
            type="checkbox"
            checked={Boolean(draft[key])}
            onChange={(event) => updateDraft(key, event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
          />
          {draft[key] ? "True" : "False"}
        </label>
      );
    }

    if (Array.isArray(value) || (value && typeof value === "object")) {
      return (
        <textarea
          value={draft[key] ?? ""}
          onChange={(event) => updateDraft(key, event.target.value)}
          className="mt-3 min-h-36 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 font-mono text-xs leading-5 text-slate-950 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
          spellCheck={false}
        />
      );
    }

    if (String(draft[key] ?? "").length > 120) {
      return (
        <textarea
          value={draft[key] ?? ""}
          onChange={(event) => updateDraft(key, event.target.value)}
          className="mt-3 min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
        />
      );
    }

    return (
      <input
        type={typeof value === "number" ? "number" : "text"}
        value={draft[key] ?? ""}
        onChange={(event) => updateDraft(key, event.target.value)}
        className="mt-3 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-950 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
      />
    );
  }

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-7xl bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
        <LoadingState />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <StatusMessage message={message} onDismiss={() => setMessage(null)} />

        {profile ? (
          <>
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                    {profileImage ? (
                      <img src={profileImage} alt={profile.name || "Artist profile"} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-slate-400">
                        {(profile.name || profile.fullName || "A").slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <div>
                    <Link to="/admin/artists" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-orange-700">
                      <ArrowLeft className="h-4 w-4" />
                      Artist registry
                    </Link>
                    <p className="mt-4 text-xs font-bold uppercase tracking-[0.22em] text-orange-600">
                      Admin Artist Dashboard
                    </p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                      {profile.name || profile.fullName || profile.stageName || "Artist Profile"}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      Complete Firestore profile view with private contact details, timestamps, media URLs, and editable submitted data.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setEditMode((current) => !current)}
                    className={`inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-bold transition ${
                      editMode
                        ? "border-orange-500 bg-orange-50 text-orange-800"
                        : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
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
                        className="h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveChanges}
                        disabled={saving}
                        className="inline-flex h-11 items-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-bold text-black transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {saving ? "Saving" : "Save Updates"}
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {summary.map((item) => (
                <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-orange-600">
                    <ShieldCheck className="h-4 w-4" />
                    {item.label}
                  </p>
                  <p className="mt-3 break-words text-lg font-bold text-slate-950">{formatValue(item.value)}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-950">Submitted Profile Data</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {editMode ? "Edit the fields below and save directly to Firestore." : "Review every field currently stored on the artist document."}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-600">
                  {entries.length} fields
                </span>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {entries.map(([key, value]) => (
                  <article key={key} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                        {formatLabel(key)}
                      </p>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                        {Array.isArray(value) ? "array" : isTimestampLike(value) ? "timestamp" : typeof value}
                      </span>
                    </div>

                    {editMode ? renderEditControl(key, value) : renderValue(key, value)}
                  </article>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-bold text-slate-950">Artist profile not found.</p>
            <Link to="/admin/artists" className="mt-4 inline-flex text-sm font-semibold text-orange-700 hover:text-orange-900">
              Back to registry
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
