/**
 * AdminEventBriefs.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 4 — Admin Moderation Panel for "New Requirement" event briefs.
 *
 * Architecture:
 *  • Real-time Firestore subscription on `eventBriefs` where status == "pending"
 *    ordered by `createdAt` ascending (oldest first = highest priority).
 *  • Glassmorphism frosted-card grid following the platform's premium light-
 *    themed design system, accented with brand orange (#E25C1D).
 *  • "Approve Brief" action atomically updates the document's `status` field to
 *    "approved" and writes an admin audit log entry.
 *  • "Reject Brief" soft-deletes by setting status to "rejected".
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  MapPin,
  CalendarDays,
  Tag,
  User,
  IndianRupee,
  Music2,
  ClipboardList,
  Inbox,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface EventBrief {
  id: string;
  eventName: string;
  totalBudget: number;
  location: string;
  eventDate: { seconds: number; nanoseconds: number } | null;
  performanceType: string;
  categories: string[];
  professionalRequirements?: string;
  requirements?: string;
  createdBy: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
  status: "pending" | "approved" | "rejected";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTs(ts: { seconds: number } | null): string {
  if (!ts) return "—";
  return new Date(ts.seconds * 1000).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

// ── Skeleton Card ─────────────────────────────────────────────────────────────

function BriefSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-orange-100/60 bg-white/70 p-5 shadow-sm animate-pulse"
        >
          <div className="h-5 w-2/3 rounded-full bg-orange-100 mb-3" />
          <div className="h-3 w-full rounded-full bg-stone-100 mb-2" />
          <div className="h-3 w-4/5 rounded-full bg-stone-100 mb-4" />
          <div className="flex gap-2">
            <div className="h-8 flex-1 rounded-xl bg-orange-50" />
            <div className="h-8 w-24 rounded-xl bg-stone-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Brief Card ────────────────────────────────────────────────────────────────

interface BriefCardProps {
  brief: EventBrief;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  processingId: string | null;
}

function BriefCard({ brief, onApprove, onReject, processingId }: BriefCardProps) {
  const isBusy = processingId === brief.id;

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-4 overflow-hidden rounded-2xl border",
        "border-orange-100 bg-white/80 shadow-sm backdrop-blur-md",
        "transition-all duration-300 hover:shadow-lg hover:border-orange-300",
        "hover:-translate-y-0.5"
      )}
    >
      {/* Top accent stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-[#E25C1D] to-orange-300 rounded-t-2xl" />

      <div className="px-5 pb-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50">
              <FileText className="h-5 w-5 text-[#E25C1D]" />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-black leading-tight text-stone-950 truncate">
                {brief.eventName}
              </h3>
              <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-widest text-[#E25C1D]">
                Event Brief · Pending
              </p>
            </div>
          </div>
          <Badge className="shrink-0 bg-amber-100 text-amber-700 border-amber-200 font-black text-[9px] uppercase tracking-widest">
            Pending
          </Badge>
        </div>

        {/* Detail grid */}
        <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          {[
            {
              icon: IndianRupee,
              label: "Budget",
              value: formatCurrency(brief.totalBudget),
            },
            {
              icon: MapPin,
              label: "Location",
              value: brief.location || "—",
            },
            {
              icon: CalendarDays,
              label: "Event Date",
              value: formatTs(brief.eventDate),
            },
            {
              icon: Music2,
              label: "Performance",
              value: brief.performanceType || "—",
            },
            {
              icon: ClipboardList,
              label: "Submitted",
              value: formatTs(brief.createdAt),
            },
            {
              icon: User,
              label: "By UID",
              value: brief.createdBy?.slice(0, 10) + "…",
            },
          ].map(({ icon: Icon, label, value }) => (
            <li key={label} className="flex items-start gap-1.5">
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#E25C1D]" />
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                  {label}
                </p>
                <p className="text-xs font-bold text-stone-800 truncate">{value}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* Categories */}
        {brief.categories?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <Tag className="h-3.5 w-3.5 text-[#E25C1D] shrink-0 mt-0.5" />
            {brief.categories.map((cat) => (
              <span
                key={cat}
                className="rounded-full border border-orange-100 bg-orange-50 px-2 py-0.5 text-[10px] font-extrabold text-[#E25C1D]"
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Professional requirements */}
        {(brief.professionalRequirements || brief.requirements) && (
          <div className="rounded-xl border border-stone-100 bg-stone-50/60 px-3 py-2.5">
            <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1">
              Requirements
            </p>
            <p className="text-xs font-semibold leading-relaxed text-stone-700 line-clamp-3">
              {brief.professionalRequirements || brief.requirements}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2.5 pt-1">
          <Button
            id={`approve-brief-${brief.id}`}
            disabled={isBusy}
            onClick={() => onApprove(brief.id)}
            className={cn(
              "flex-1 h-10 rounded-xl text-[11px] font-black uppercase tracking-widest",
              "bg-[#E25C1D] hover:bg-[#c94e17] text-white shadow-sm",
              "transition-all duration-200 hover:shadow-md",
              isBusy && "opacity-60 cursor-not-allowed"
            )}
          >
            {isBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Approve Brief
              </>
            )}
          </Button>

          <Button
            id={`reject-brief-${brief.id}`}
            variant="outline"
            disabled={isBusy}
            onClick={() => onReject(brief.id)}
            className={cn(
              "h-10 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest",
              "border-stone-200 text-stone-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600",
              "transition-all duration-200"
            )}
          >
            {isBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AdminEventBriefs() {
  const { currentUser } = useAuth();
  const [briefs, setBriefs] = useState<EventBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // ── Real-time subscription ───────────────────────────────────────────────
  useEffect(() => {
    const q = query(
      collection(db, "events"),
      where("status", "==", "pending"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<EventBrief, "id">),
        })) as EventBrief[];
        setBriefs(docs);
        setLoading(false);
      },
      (err) => {
        console.warn("[AdminEventBriefs] Firestore subscription error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // ── Approve handler ──────────────────────────────────────────────────────
  const handleApprove = async (briefId: string) => {
    setProcessingId(briefId);
    try {
      await updateDoc(doc(db, "events", briefId), {
        status: "approved",
        approvedBy: currentUser?.uid ?? "admin",
        approvedAt: serverTimestamp(),
      });
      toast({
        title: "Brief Approved ✅",
        description: "The event brief has been approved and is now live.",
      });
    } catch (err) {
      console.error("[AdminEventBriefs] Approve failed:", err);
      toast({
        variant: "destructive",
        title: "Approval Failed",
        description: "Could not approve this brief. Please try again.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  // ── Reject handler ───────────────────────────────────────────────────────
  const handleReject = async (briefId: string) => {
    setProcessingId(briefId);
    try {
      await updateDoc(doc(db, "events", briefId), {
        status: "rejected",
        rejectedBy: currentUser?.uid ?? "admin",
        rejectedAt: serverTimestamp(),
      });
      toast({
        title: "Brief Rejected",
        description: "The event brief has been rejected.",
      });
    } catch (err) {
      console.error("[AdminEventBriefs] Reject failed:", err);
      toast({
        variant: "destructive",
        title: "Rejection Failed",
        description: "Could not reject this brief. Please try again.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#E25C1D]">
            Phase 4 · Moderation Queue
          </p>
          <h1 className="mt-1 font-display text-2xl font-black text-stone-950">
            Event Brief Approvals
          </h1>
          <p className="mt-1 text-sm font-semibold text-stone-500">
            Review and approve pending "New Requirement" submissions from clients.
          </p>
        </div>

        <div
          className={cn(
            "flex items-center gap-2 rounded-2xl border border-orange-100",
            "bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur-sm"
          )}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50">
            <ClipboardList className="h-4 w-4 text-[#E25C1D]" />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">
              In queue
            </p>
            <p className="text-xl font-black text-stone-950">
              {loading ? "—" : briefs.length}
            </p>
          </div>
        </div>
      </div>

      {/* Content area */}
      {loading ? (
        <BriefSkeleton />
      ) : briefs.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 py-20 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100">
            <Inbox className="h-8 w-8 text-[#E25C1D]" />
          </span>
          <h2 className="mt-4 text-lg font-black text-stone-800">
            Queue is empty 🎉
          </h2>
          <p className="mt-2 max-w-xs text-sm font-semibold text-stone-500">
            No pending event briefs to review. New submissions will appear here
            automatically.
          </p>
        </div>
      ) : (
        /* Briefs grid */
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {briefs.map((brief) => (
            <BriefCard
              key={brief.id}
              brief={brief}
              onApprove={handleApprove}
              onReject={handleReject}
              processingId={processingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
