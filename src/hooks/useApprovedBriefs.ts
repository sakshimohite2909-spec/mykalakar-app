/**
 * useApprovedBriefs.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 5 — Real-time Firestore subscriber hook for the public "Approved
 * Event Briefs" feed.
 *
 * Query: eventBriefs WHERE status == "approved" ORDER BY createdAt DESC
 *
 * The snapshot listener is automatically unsubscribed when the component that
 * owns this hook unmounts, preventing memory leaks.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ── Public type ───────────────────────────────────────────────────────────────

export interface ApprovedEventBrief {
  id: string;
  eventName: string;
  totalBudget: number;
  location: string;
  eventDate: Timestamp | null;
  performanceType: string;
  categories: string[];
  professionalRequirements: string;
  createdBy: string;
  createdAt: Timestamp | null;
  status: "approved";
}

export type BriefFeedState =
  | { status: "loading" }
  | { status: "success"; briefs: ApprovedEventBrief[] }
  | { status: "error"; message: string };

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useApprovedBriefs
 *
 * Returns a `BriefFeedState` that progresses through:
 *  loading → success (live, updating) | error
 *
 * The underlying `onSnapshot` listener is cleaned up automatically on unmount.
 */
export function useApprovedBriefs(): BriefFeedState {
  const [state, setState] = useState<BriefFeedState>({ status: "loading" });

  // Keep a stable ref to the unsubscribe function so cleanup works even if
  // the effect fires more than once (React strict-mode double-invoke).
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setState({ status: "loading" });

    const q = query(
      collection(db, "eventBriefs"),
      where("status", "==", "approved")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const briefs = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ApprovedEventBrief, "id">),
        })) as ApprovedEventBrief[];

        // Sort client-side to prevent composite index errors
        briefs.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
          const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
          return bTime - aTime;
        });

        setState({ status: "success", briefs });
      },
      (err) => {
        console.warn("[useApprovedBriefs] Firestore error:", err);
        setState({
          status: "error",
          message: "Could not load live briefs. Please try again shortly.",
        });
      }
    );

    unsubRef.current = unsub;

    // ── Cleanup on unmount ───────────────────────────────────────────────
    return () => {
      unsub();
      unsubRef.current = null;
    };
  }, []); // fires once on mount; snapshot keeps itself live

  return state;
}
