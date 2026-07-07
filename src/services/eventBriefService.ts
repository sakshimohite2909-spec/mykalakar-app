/**
 * eventBriefService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 4 — MyKalakar "New Requirement" event brief Firestore write handler.
 *
 * Responsibilities:
 *  • Sanitise and structure the incoming form payload.
 *  • Bind `createdBy` to the active `auth.uid` so Firestore rules can validate
 *    the field against the authenticated identity.
 *  • Set `status` to "pending" as a static literal — clients may never change
 *    this themselves; only admins may advance it.
 *  • Stamp `createdAt` with `serverTimestamp()` so ordering is authoritative.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { db, auth } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

// ── Public interface ──────────────────────────────────────────────────────────

/** Raw data collected from the "New Requirement" event brief form. */
export interface EventBriefFormData {
  eventName: string;
  totalBudget: string | number;
  location: string;
  /** ISO date string (e.g. "2026-08-15") or a JS Date */
  eventDate: string | Date;
  performanceType: string;
  /** Array of selected category / tag strings */
  categories: string[];
  professionalRequirements: string;
}

/** Firestore document structure as written to `eventBriefs/{id}`. */
export interface EventBriefDocument {
  eventName: string;
  totalBudget: number;
  location: string;
  eventDate: Timestamp;
  performanceType: string;
  categories: string[];
  professionalRequirements: string;
  createdBy: string;
  createdAt: ReturnType<typeof serverTimestamp>;
  status: "pending";
}

/** Response returned after a successful or failed write. */
export interface SubmitEventBriefResult {
  success: boolean;
  docId?: string;
  error?: string;
}

// ── Helper — sanitise string ──────────────────────────────────────────────────

function cleanStr(value: unknown): string {
  return String(value ?? "").trim();
}

// ── Core write handler ────────────────────────────────────────────────────────

/**
 * submitEventBrief
 * ─────────────────────────────────────────────────────────────────────────────
 * Sanitises the form payload, attaches the authenticated user's UID, and
 * writes the document to the root `eventBriefs` collection.
 *
 * Throws (propagates) if:
 *   • The user is not signed in.
 *   • The Firestore write is rejected by security rules.
 */
export async function submitEventBrief(
  formData: EventBriefFormData
): Promise<SubmitEventBriefResult> {
  try {
    // ── 1. Auth guard ──────────────────────────────────────────────────────
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return {
        success: false,
        error: "You must be signed in to post an event requirement.",
      };
    }

    // ── 2. Sanitise each field ─────────────────────────────────────────────
    const eventName = cleanStr(formData.eventName);
    if (!eventName) {
      return { success: false, error: "Event name is required." };
    }

    // totalBudget — parse to integer, default 0 on non-numeric input
    const totalBudget = Math.max(
      0,
      parseInt(String(formData.totalBudget ?? 0).replace(/[^\d]/g, ""), 10) || 0
    );

    const location = cleanStr(formData.location);

    // eventDate — convert ISO string or Date to Firestore Timestamp
    let eventDate: Timestamp;
    if (formData.eventDate instanceof Date) {
      eventDate = Timestamp.fromDate(formData.eventDate);
    } else {
      const parsed = new Date(cleanStr(formData.eventDate));
      eventDate = isNaN(parsed.getTime())
        ? Timestamp.fromDate(new Date())
        : Timestamp.fromDate(parsed);
    }

    const performanceType = cleanStr(formData.performanceType);

    // categories — filter empty strings, deduplicate
    const categories: string[] = [
      ...new Set(
        (Array.isArray(formData.categories) ? formData.categories : [])
          .map((c) => cleanStr(c))
          .filter(Boolean)
      ),
    ];

    const professionalRequirements = cleanStr(formData.professionalRequirements);

    // ── 3. Build the Firestore payload ─────────────────────────────────────
    const payload: EventBriefDocument = {
      eventName,
      totalBudget,
      location,
      eventDate,
      performanceType,
      categories,
      professionalRequirements,
      createdBy: currentUser.uid,   // bound to authenticated identity
      createdAt: serverTimestamp(),  // authoritative server-side stamp
      status: "pending",            // immutable by client — admin-only field
    };

    // ── 4. Write to Firestore ──────────────────────────────────────────────
    const colRef = collection(db, "eventBriefs");
    const docRef = await addDoc(colRef, payload);

    return { success: true, docId: docRef.id };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to submit event brief.";
    console.error("[eventBriefService] submitEventBrief error:", err);
    return { success: false, error: message };
  }
}
