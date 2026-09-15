import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";

export type CommissionSplitType = "margin_percentage" | "total_booking_percentage";

export interface IncentiveTier {
  minBookings: number;
  maxBookings?: number; // undefined or 999 for infinity
  incentivePct: number; // e.g., 5, 10, 20
  tierName: string;     // e.g., "Base Tier (0-29)", "Silver Tier (30-49)", "Gold Tier (50+)"
  badgeColor?: string;
  description?: string;
}

export const DEFAULT_INCENTIVE_TIERS: IncentiveTier[] = [
  {
    minBookings: 0,
    maxBookings: 29,
    incentivePct: 5,
    tierName: "Base Tier (० ते २९ बुकिंग्स)",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-300",
    description: "० ते २९ बुकिंग्ससाठी ५% बेस इन्सेंटिव्ह",
  },
  {
    minBookings: 30,
    maxBookings: 49,
    incentivePct: 10,
    tierName: "Silver Tier (३० ते ४९ बुकिंग्स)",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    description: "३० ते ४९ बुकिंग्स पूर्ण केल्यावर १०% इन्सेंटिव्ह",
  },
  {
    minBookings: 50,
    maxBookings: 999,
    incentivePct: 20,
    tierName: "Gold Super Tier (५०+ बुकिंग्स)",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    description: "५० किंवा अधिक बुकिंग्सवर कमाल २०% सुपर इन्सेंटिव्ह",
  },
];

export interface CommissionConfig {
  splitType: CommissionSplitType;
  telecallerPercentage: number;   // e.g., 20%
  ownerPercentage: number;        // e.g., 80% (100 - telecallerPercentage or custom)
  flatBonusPerBooking: number;    // Flat extra incentive per confirmed booking in INR (e.g., 100)
  minimumBookingThreshold: number;// Minimum booking amount to trigger commission
  enableTieredIncentives?: boolean; // Enable monthly volume-based tiered incentives
  incentiveTiers?: IncentiveTier[]; // Monthly volume slabs
  notes?: string;
  updatedAt?: string | Date;
  updatedBy?: string;
}

export interface CommissionCalculationResult {
  bookingAmount: number;
  artistPayout: number;
  grossMargin: number;
  splitType: CommissionSplitType;
  telecallerCommissionPct: number;
  ownerProfitPct: number;
  telecallerCommission: number;
  ownerProfit: number;
  flatBonus: number;
}

export interface TelecallerMonthlyStats {
  monthYear: string;                 // e.g., "2026-09"
  totalBookingsCount: number;         // Count of confirmed/booked leads this month
  totalGrossMarginGenerated: number;  // Total margin/profit generated
  totalBookingRevenue: number;        // Total gross deal value
  activeTier: IncentiveTier;          // Active tier for the count
  appliedIncentivePct: number;        // Applied tier % (e.g. 5, 10, 20)
  estimatedIncentiveAmount: number;   // Estimated monthly incentive
  nextTier: IncentiveTier | null;     // Next unlockable tier
  remainingToNextTier: number;        // How many more bookings needed for next tier
  progressPctToNextTier: number;      // Progress percentage (0-100)
}

const SETTINGS_DOC_PATH = "system_settings";
const SETTINGS_DOC_ID = "commission_config";
const LOCAL_COMMISSION_CONFIG_KEY = "mykalakar_commission_config";

export const DEFAULT_COMMISSION_CONFIG: CommissionConfig = {
  splitType: "margin_percentage",
  telecallerPercentage: 20,
  ownerPercentage: 80,
  flatBonusPerBooking: 0,
  minimumBookingThreshold: 1000,
  enableTieredIncentives: true,
  incentiveTiers: DEFAULT_INCENTIVE_TIERS,
  notes: "डिफॉल्ट कमिशन: नफ्याच्या (मार्जिन) २०% टेलिकॉलरला आणि मासिक टार्गेट इन्सेंटिव्ह (३० वर १०%, ५० वर २०%).",
};

export function getLocalCommissionConfig(): CommissionConfig {
  try {
    const raw = localStorage.getItem(LOCAL_COMMISSION_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_COMMISSION_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn("Could not read local commission config:", e);
  }
  return DEFAULT_COMMISSION_CONFIG;
}

export function saveLocalCommissionConfig(config: CommissionConfig): void {
  try {
    localStorage.setItem(LOCAL_COMMISSION_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn("Could not save local commission config:", e);
  }
}

export async function fetchCommissionConfig(): Promise<CommissionConfig> {
  const local = getLocalCommissionConfig();
  try {
    const snap = await getDoc(doc(db, SETTINGS_DOC_PATH, SETTINGS_DOC_ID));
    if (snap.exists()) {
      const data = snap.data() as CommissionConfig;
      const merged = { ...DEFAULT_COMMISSION_CONFIG, ...data };
      saveLocalCommissionConfig(merged);
      return merged;
    }
  } catch (err: any) {
    if (err?.code !== "permission-denied") {
      console.warn("Could not fetch remote commission config, using local fallback:", err?.message || err);
    }
  }
  return local;
}

export async function updateCommissionConfig(
  config: Partial<CommissionConfig>,
  updatedBy = "admin@mykalakar.com"
): Promise<CommissionConfig> {
  const current = getLocalCommissionConfig();
  const telecallerPercentage = typeof config.telecallerPercentage === "number" ? Math.min(100, Math.max(0, config.telecallerPercentage)) : current.telecallerPercentage;
  const ownerPercentage = typeof config.ownerPercentage === "number" ? Math.min(100, Math.max(0, config.ownerPercentage)) : Math.max(0, 100 - telecallerPercentage);

  const updated: CommissionConfig = {
    ...current,
    ...config,
    telecallerPercentage,
    ownerPercentage,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  saveLocalCommissionConfig(updated);

  try {
    await setDoc(
      doc(db, SETTINGS_DOC_PATH, SETTINGS_DOC_ID),
      {
        ...updated,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err: any) {
    if (err?.code !== "permission-denied") {
      console.warn("Could not persist commission config to Firestore:", err?.message || err);
    }
  }

  window.dispatchEvent(new CustomEvent("mykalakar_commission_config_updated", { detail: updated }));
  return updated;
}

export function subscribeCommissionConfig(callback: (config: CommissionConfig) => void): () => void {
  callback(getLocalCommissionConfig());

  let unsubFirestore = () => {};
  try {
    unsubFirestore = onSnapshot(
      doc(db, SETTINGS_DOC_PATH, SETTINGS_DOC_ID),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as CommissionConfig;
          const merged = { ...DEFAULT_COMMISSION_CONFIG, ...data };
          saveLocalCommissionConfig(merged);
          callback(merged);
        }
      },
      (error) => {
        if (error?.code !== "permission-denied") {
          console.warn("Commission config subscription warning:", error?.message || error);
        }
      }
    );
  } catch {
    // offline fallback
  }

  const handleCustomEvent = (e: any) => {
    if (e.detail) {
      callback(e.detail);
    }
  };
  window.addEventListener("mykalakar_commission_config_updated", handleCustomEvent);

  return () => {
    unsubFirestore();
    window.removeEventListener("mykalakar_commission_config_updated", handleCustomEvent);
  };
}

/**
 * Calculates the exact split for Telecaller commission vs MyKalakar owner profit
 */
export function calculateCommissionSplit(
  bookingAmount: number,
  artistPayout: number,
  config?: CommissionConfig
): CommissionCalculationResult {
  const cfg = config || getLocalCommissionConfig();
  const safeBooking = Math.max(0, Number(bookingAmount) || 0);
  const safeArtist = Math.max(0, Number(artistPayout) || 0);
  const grossMargin = Math.max(0, safeBooking - safeArtist);
  const flatBonus = Number(cfg.flatBonusPerBooking) || 0;

  let telecallerCommission = 0;
  let ownerProfit = 0;

  if (cfg.splitType === "margin_percentage") {
    // Model 1: Percentage of the Platform Margin (Booking - Artist)
    const baseCommission = Math.round((grossMargin * (cfg.telecallerPercentage || 0)) / 100);
    telecallerCommission = baseCommission + flatBonus;
    ownerProfit = Math.max(0, grossMargin - telecallerCommission);
  } else {
    // Model 2: Percentage of Total Booking Amount
    const baseCommission = Math.round((safeBooking * (cfg.telecallerPercentage || 0)) / 100);
    telecallerCommission = baseCommission + flatBonus;
    ownerProfit = Math.max(0, safeBooking - safeArtist - telecallerCommission);
  }

  return {
    bookingAmount: safeBooking,
    artistPayout: safeArtist,
    grossMargin,
    splitType: cfg.splitType,
    telecallerCommissionPct: cfg.telecallerPercentage,
    ownerProfitPct: cfg.ownerPercentage,
    telecallerCommission,
    ownerProfit,
    flatBonus,
  };
}

/**
 * Resolves the active tier, next tier, and progress for a given booking count
 */
export function getTierForBookingCount(
  count: number,
  tiers: IncentiveTier[] = DEFAULT_INCENTIVE_TIERS
): {
  activeTier: IncentiveTier;
  nextTier: IncentiveTier | null;
  remainingToNextTier: number;
  progressPctToNextTier: number;
} {
  const sorted = [...tiers].sort((a, b) => a.minBookings - b.minBookings);
  let activeTier = sorted[0] || DEFAULT_INCENTIVE_TIERS[0];
  let nextTier: IncentiveTier | null = null;

  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i];
    const max = typeof t.maxBookings === "number" ? t.maxBookings : 999999;
    if (count >= t.minBookings) {
      activeTier = t;
      nextTier = sorted[i + 1] || null;
    }
  }

  let remainingToNextTier = 0;
  let progressPctToNextTier = 100;

  if (nextTier) {
    remainingToNextTier = Math.max(0, nextTier.minBookings - count);
    const range = nextTier.minBookings - activeTier.minBookings;
    const currentInRange = count - activeTier.minBookings;
    progressPctToNextTier = Math.min(100, Math.max(0, Math.round((currentInRange / Math.max(1, range)) * 100)));
  }

  return {
    activeTier,
    nextTier,
    remainingToNextTier,
    progressPctToNextTier,
  };
}

/**
 * Calculates current calendar month's aggregated stats, active tier, and projected incentive
 */
export function calculateTelecallerMonthlyStats(
  leads: any[],
  config?: CommissionConfig,
  targetMonthYear?: string
): TelecallerMonthlyStats {
  const cfg = config || getLocalCommissionConfig();
  const tiers = cfg.incentiveTiers && cfg.incentiveTiers.length > 0 ? cfg.incentiveTiers : DEFAULT_INCENTIVE_TIERS;

  // Determine current month in YYYY-MM format
  const now = new Date();
  const currentMonthStr =
    targetMonthYear ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  let count = 0;
  let totalGrossMargin = 0;
  let totalRevenue = 0;

  leads.forEach((l) => {
    if (!l) return;
    const isConfirmed = l.status === "artist_confirmed" || l.status === "booked" || (l as any).status === "completed";
    if (!isConfirmed) return;

    // Check if lead belongs to the target month
    let leadDateStr = "";
    if (l.eventDate && typeof l.eventDate === "string") {
      // Handles formats like "2026-09-23" or "23-09-2026"
      if (l.eventDate.includes("-")) {
        const parts = l.eventDate.split("-");
        if (parts[0].length === 4) {
          leadDateStr = `${parts[0]}-${parts[1]}`;
        } else if (parts[2]?.length === 4) {
          leadDateStr = `${parts[2]}-${parts[1]}`;
        }
      }
    }
    if (!leadDateStr && l.createdAt) {
      try {
        const d = new Date(l.createdAt);
        if (!isNaN(d.getTime())) {
          leadDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        }
      } catch {
        // ignore
      }
    }

    // If month matching or fallback to current leads if date isn't parseable
    const matchesMonth = !leadDateStr || leadDateStr === currentMonthStr;
    if (matchesMonth) {
      count += 1;
      const b = Math.max(0, Number(l.bookingAmount || l.budget) || 0);
      const a = Math.max(0, Number(l.artistPayout || l.confirmedPrice || l.artistOfferBudget) || (b > 0 ? Math.round(b * 0.8) : 0));
      const margin = Math.max(0, b - a);
      totalRevenue += b;
      totalGrossMargin += margin;
    }
  });

  const tierInfo = getTierForBookingCount(count, tiers);
  const appliedIncentivePct = cfg.enableTieredIncentives !== false ? tierInfo.activeTier.incentivePct : cfg.telecallerPercentage;

  // Compute estimated incentive based on applied tier percentage
  let estimatedIncentiveAmount = 0;
  if (cfg.splitType === "margin_percentage") {
    estimatedIncentiveAmount = Math.round((totalGrossMargin * appliedIncentivePct) / 100);
  } else {
    estimatedIncentiveAmount = Math.round((totalRevenue * appliedIncentivePct) / 100);
  }

  // Add flat bonus if configured
  if (cfg.flatBonusPerBooking && cfg.flatBonusPerBooking > 0) {
    estimatedIncentiveAmount += count * cfg.flatBonusPerBooking;
  }

  return {
    monthYear: currentMonthStr,
    totalBookingsCount: count,
    totalGrossMarginGenerated: totalGrossMargin,
    totalBookingRevenue: totalRevenue,
    activeTier: tierInfo.activeTier,
    appliedIncentivePct,
    estimatedIncentiveAmount,
    nextTier: tierInfo.nextTier,
    remainingToNextTier: tierInfo.remainingToNextTier,
    progressPctToNextTier: tierInfo.progressPctToNextTier,
  };
}

