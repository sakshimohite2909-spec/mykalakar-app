import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Youtube,
  ExternalLink,
  Play,
  Loader2,
  Save,
  User,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import CreatableSelect from "react-select/creatable";
import { toast } from "@/hooks/use-toast";
import { FIREBASE_WRITE_TIMEOUT_MS, firebaseErrorMessage, withTimeout } from "@/lib/firebaseSafe";

interface ProfileCategory {
  category: string;
}

interface ProfileFormState {
  fullName: string;
  age: number | "";
  gender: string;
  categories: ProfileCategory[];
  youtubeLinks: string[];
}

interface ProfileFormProps {
  initial?: Partial<ProfileFormState>;
  onSave?: (data: ProfileFormState) => Promise<void>;
  disabled?: boolean;
}

const categoryOptions = [
  {
    label: "General Categories",
    options: [
      { value: "Actors", label: "Actors" },
      { value: "Singer", label: "Singer" },
      { value: "Karaoke Singers", label: "Karaoke Singers" },
      { value: "Orchestra", label: "Orchestra" },
      { value: "Magicians", label: "Magicians" },
      { value: "Pappate show", label: "Pappate show" },
      { value: "DJ's", label: "DJ's" },
      { value: "Anchors / Hosts", label: "Anchors / Hosts" },
      { value: "Motivational speakers", label: "Motivational speakers" },
      { value: "Photo & Videography", label: "Photo & Videography" },
      { value: "Makeup / Mehndi Artist", label: "Makeup / Mehndi Artist" }
    ]
  },
  {
    label: "Folk Art",
    options: [
      { value: "Folk Art", label: "Folk Art (General)" },
      { value: "Gondhal", label: "Gondhal" },
      { value: "Jagran", label: "Jagran" },
      { value: "Bharud", label: "Bharud" },
      { value: "Shahir & Powada", label: "Shahir & Powada" },
      { value: "Lezim pathak", label: "Lezim pathak" },
      { value: "Zanz pathak", label: "Zanz pathak" },
      { value: "Dhol pathak", label: "Dhol pathak" },
      { value: "Waghya-Murali", label: "Waghya-Murali" },
      { value: "Jalsa & Dashavtar", label: "Jalsa & Dashavtar" },
      { value: "Dhagari & dhol ovi", label: "Dhagari & dhol ovi" },
      { value: "Bahurupiya", label: "Bahurupiya" }
    ]
  },
  {
    label: "Varkari Sampraday",
    options: [
      { value: "Varkari Sampraday", label: "Varkari Sampraday (General)" },
      { value: "Kirtankar", label: "Kirtankar" },
      { value: "Pravachankar", label: "Pravachankar" },
      { value: "Vyaspethchalak", label: "Vyaspethchalak" },
      { value: "Chopdar", label: "Chopdar" },
      { value: "Gayak", label: "Gayak" },
      { value: "Mrudangmani", label: "Mrudangmani" },
      { value: "Bharudkar", label: "Bharudkar" },
      { value: "Soundsystem", label: "Soundsystem" },
      { value: "Mandap & decoration", label: "Mandap & decoration" },
      { value: "Venekari", label: "Venekari" },
      { value: "Taalkari", label: "Taalkari" },
      { value: "Varkari Sanstha", label: "Varkari Sanstha" },
      { value: "Bhajani Mandal", label: "Bhajani Mandal" },
      { value: "Shastriya Bhajan", label: "Shastriya Bhajan" },
      { value: "Tabla vadak", label: "Tabla vadak" },
      { value: "Harmonium vadak", label: "Harmonium vadak" },
      { value: "Dholki vadak", label: "Dholki vadak" }
    ]
  }
];

// ─── YouTube embed utility ────────────────────────────────────────────────────
function getYoutubeEmbedUrl(url: string): string | null {
  const regExp =
    /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11
    ? `https://www.youtube.com/embed/${match[2]}`
    : null;
}

// ─── YouTube Link Card ────────────────────────────────────────────────────────
function YouTubeLinkCard({
  url,
  index,
  onChange,
  onRemove,
}: {
  url: string;
  index: number;
  onChange: (val: string) => void;
  onRemove: () => void;
}) {
  const embedUrl = getYoutubeEmbedUrl(url);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm overflow-hidden"
    >
      {/* URL Input Row */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
          <Youtube className="h-5 w-5 text-orange-500" />
        </div>
        <input
          id={`youtube-link-${index}`}
          type="url"
          value={url}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/30 
            focus:outline-none border-b border-white/10 focus:border-orange-500 pb-1 
            transition-colors"
          aria-label={`YouTube Link ${index + 1}`}
        />
        <button
          type="button"
          onClick={onRemove}
          className="p-2 rounded-xl hover:bg-orange-500/20 text-foreground/40 hover:text-orange-500 
            transition-all shrink-0"
          aria-label="Remove link"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Embedded Player or styled URL card */}
      {url && (
        <div className="px-4 pb-4">
          {embedUrl ? (
            <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/10 shadow-lg">
              <iframe
                width="100%"
                height="100%"
                src={embedUrl}
                title={`YouTube video ${index + 1}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          ) : (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 
                border border-white/10 transition-all group"
            >
              <Play className="h-4 w-4 text-orange-400 shrink-0" />
              <span className="text-xs text-foreground/60 truncate flex-1 group-hover:text-foreground/80 transition-colors">
                {url}
              </span>
              <ExternalLink className="h-3.5 w-3.5 text-foreground/30 shrink-0" />
            </a>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─── Main ProfileForm Component ────────────────────────────────────────────────
export function ProfileForm({ initial = {}, onSave, disabled = false }: ProfileFormProps) {
  const [form, setForm] = useState<ProfileFormState>({
    fullName: initial.fullName ?? "",
    age: initial.age ?? "",
    gender: initial.gender ?? "",
    categories: initial.categories ?? [{ category: "" }],
    youtubeLinks: initial.youtubeLinks ?? [""],
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ProfileFormState>(
    key: K,
    val: ProfileFormState[K]
  ) => setForm((p) => ({ ...p, [key]: val }));

  const addCategory = () => {
    set("categories", [...form.categories, { category: "" }]);
  };

  const removeCategory = (index: number) => {
    if (form.categories.length === 1) return;
    set("categories", form.categories.filter((_, i) => i !== index));
  };

  const updateCategory = (index: number, field: keyof ProfileCategory, val: string) => {
    const next = [...form.categories];
    next[index] = { ...next[index], [field]: val };
    set("categories", next);
  };

  const addLink = () => set("youtubeLinks", [...form.youtubeLinks, ""]);

  const updateLink = (i: number, val: string) => {
    const next = [...form.youtubeLinks];
    next[i] = val;
    set("youtubeLinks", next);
  };

  const removeLink = (i: number) => {
    set("youtubeLinks", form.youtubeLinks.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await withTimeout(onSave(form), FIREBASE_WRITE_TIMEOUT_MS, "Saving this profile is taking too long. Please try again.");
    } catch (error) {
      toast({ variant: "destructive", title: "Profile not saved", description: firebaseErrorMessage(error, "Could not save profile.") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Personal Details ─────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/10">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <User className="h-4 w-4 text-orange-500" />
          </div>
          <h2 className="font-bold text-foreground text-lg font-outfit uppercase tracking-tight">Personal Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName" className="text-foreground/70 text-sm font-semibold">
              Full Name *
            </Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="Your full name"
              disabled={disabled}
              className="bg-white/5 border-white/10 text-foreground placeholder:text-foreground/20 
                focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 rounded-xl h-11"
            />
          </div>

          {/* Age */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="age" className="text-foreground/70 text-sm font-semibold">
              Age *
            </Label>
            <Input
              id="age"
              name="age"
              type="number"
              min={1}
              max={120}
              value={form.age}
              onChange={(e) =>
                set("age", e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="e.g. 28"
              disabled={disabled}
              className="bg-white/5 border-white/10 text-foreground placeholder:text-foreground/20 
                focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 rounded-xl h-11"
            />
          </div>

          {/* Gender */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label htmlFor="gender" className="text-foreground/70 text-sm font-semibold">
              Gender *
            </Label>
            <Select
              value={form.gender}
              onValueChange={(v) => set("gender", v)}
              disabled={disabled}
            >
              <SelectTrigger
                id="gender"
                className="bg-white/5 border-white/10 text-foreground rounded-xl h-11 focus:ring-orange-500/30"
              >
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-orange-100 bg-white/95 text-slate-800 shadow-2xl backdrop-blur-3xl">
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Non-Binary">Non-Binary</SelectItem>
                <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-orange-400" />
            </div>
            <h2 className="font-bold text-foreground text-lg font-outfit uppercase tracking-tight">Artistic Categories</h2>
          </div>
          <button
            type="button"
            onClick={addCategory}
            disabled={disabled}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest
              bg-orange-500 text-foreground hover:bg-orange-600 transition-all shadow-[0_4px_20px_rgba(249,115,22,0.3)] disabled:opacity-40"
          >
            <Plus className="h-4 w-4" /> Add Another Category
          </button>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {form.categories.map((catEntry, idx) => {
              return (
                <motion.div
                  key={idx}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md"
                >
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-5 pt-4">
                    {/* Category Selection */}
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-foreground/70 text-xs font-bold uppercase tracking-widest">
                        Category {idx + 1} *
                      </Label>
                      <CreatableSelect
                        isClearable
                        isDisabled={disabled}
                        options={categoryOptions}
                        placeholder="Search or add your art form..."
                        value={catEntry.category ? { label: catEntry.category, value: catEntry.category } : null}
                        onChange={(newValue: any) => updateCategory(idx, "category", newValue ? newValue.value : "")}
                        formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        maxMenuHeight={300}
                        styles={{
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          control: (base) => ({
                            ...base,
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                            borderColor: "rgba(255, 255, 255, 0.1)",
                            borderRadius: "0.75rem",
                            minHeight: "44px",
                            boxShadow: "none",
                            color: "white",
                            "&:hover": {
                              borderColor: "#f97316",
                            }
                          }),
                          menu: (base) => ({
                            ...base,
                            backgroundColor: "#0f172a",
                            borderRadius: "0.75rem",
                            overflow: "visible",
                            border: "1px solid rgba(255,255,255,0.1)",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                            zIndex: 50,
                          }),
                          menuList: (base) => ({
                            ...base,
                            maxHeight: 300,
                            overflowY: "auto",
                            WebkitOverflowScrolling: "touch",
                          }),
                          option: (base, { isFocused, isSelected }) => ({
                            ...base,
                            backgroundColor: isSelected ? "#f97316" : isFocused ? "rgba(255,255,255,0.1)" : "transparent",
                            color: "white",
                            cursor: "pointer",
                            "&:active": {
                              backgroundColor: "#f97316",
                            }
                          }),
                          singleValue: (base) => ({
                            ...base,
                            color: "white"
                          }),
                          input: (base) => ({
                            ...base,
                            color: "white"
                          })
                        }}
                      />
                    </div>
                  </div>

                  {form.categories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCategory(idx)}
                      className="absolute top-4 right-4 p-2 text-foreground/30 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </section>

      {/* ── YouTube Links ──────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Youtube className="h-4 w-4 text-orange-500" />
            </div>
            <h2 className="font-bold text-foreground text-lg font-outfit uppercase tracking-tight">Showcase Links</h2>
          </div>
          <button
            type="button"
            onClick={addLink}
            disabled={disabled}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest
              bg-white/10 text-foreground border border-white/10 hover:bg-white/20
              transition-all disabled:opacity-40"
          >
            <Plus className="h-4 w-4" /> Add Link
          </button>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {form.youtubeLinks.map((url, i) => (
              <YouTubeLinkCard
                key={i}
                url={url}
                index={i}
                onChange={(val) => updateLink(i, val)}
                onRemove={() => removeLink(i)}
              />
            ))}
          </AnimatePresence>

          {form.youtubeLinks.length === 0 && (
            <div className="text-center py-10 rounded-2xl border border-dashed border-white/10 text-foreground/30">
              <Youtube className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No links added yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Save Button ───────────────────────────────────────────────────── */}
      {onSave && (
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={saving || disabled}
          className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl
            font-black text-base text-foreground uppercase tracking-widest
            bg-gradient-to-r from-orange-500 to-amber-500
            shadow-[0_8px_30px_rgba(249,115,22,0.3)]
            hover:shadow-[0_12px_40px_rgba(249,115,22,0.5)]
            transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <Save className="h-5 w-5 group-hover:scale-110 transition-transform" />
              Complete Registration
            </>
          )}
        </motion.button>
      )}
    </div>
  );
}

// ─── ProfileDisplay (read-only view) ─────────────────────────────────────────
export function ProfileDisplay({ data }: { data: Partial<ProfileFormState> }) {
  const embedCount = (data.youtubeLinks ?? []).filter(
    (u) => getYoutubeEmbedUrl(u)
  ).length;

  return (
    <div className="space-y-6">
      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Full Name", value: data.fullName },
          { label: "Age", value: data.age?.toString() },
          { label: "Gender", value: data.gender },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <p className="text-foreground/40 text-[10px] font-black uppercase tracking-widest mb-1">
              {label}
            </p>
            <p className="text-foreground font-bold">{value || "—"}</p>
          </div>
        ))}
      </div>

      {/* Categories Display */}
      <div className="space-y-3">
        <h3 className="text-foreground/40 text-[10px] font-black uppercase tracking-widest px-1">Artistic Specializations</h3>
        <div className="grid grid-cols-1 gap-3">
          {(data.categories ?? []).map((cat, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-orange-500/20">
              <span className="text-foreground font-bold text-sm tracking-tight">{cat.category}</span>
            </div>
          ))}
        </div>
      </div>

      {/* YouTube embeds */}
      {(data.youtubeLinks ?? []).length > 0 && (
        <div className="space-y-4 pt-4 border-t border-white/10">
          <h3 className="text-foreground font-black flex items-center gap-2 text-xs uppercase tracking-widest">
            <Youtube className="h-4 w-4 text-orange-500" />
            Spotlight ({embedCount} video{embedCount !== 1 ? "s" : ""})
          </h3>
          {data.youtubeLinks!.map((url, i) => {
            const embed = getYoutubeEmbedUrl(url);
            if (!url) return null;
            return embed ? (
              <div
                key={i}
                className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 shadow-xl"
              >
                <iframe
                  width="100%"
                  height="100%"
                  src={embed}
                  title={`Performance ${i + 1}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            ) : (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 
                  border border-white/10 transition-all group"
              >
                <ExternalLink className="h-4 w-4 text-orange-400 shrink-0" />
                <span className="text-sm text-foreground/60 truncate group-hover:text-foreground/80">
                  {url}
                </span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
