import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";

export type CommissionSplitType = "margin_percentage" | "total_booking_percentage";

export interface BudgetSlab {
  id: string;
  minBudget: number;
  maxBudget?: number; // e.g. 25000 or 99999999 for infinity
  marginPct: number;  // e.g. 20 (20%)
  commissionPct: number; // e.g. 20 (20% on Gross Margin)
  isActive: boolean;
  slabName?: string;
  notes?: string;
}

export const DEFAULT_BUDGET_SLABS: BudgetSlab[] = [
  {
    id: "slab-1",
    minBudget: 0,
    maxBudget: 25000,
    marginPct: 20,
    commissionPct: 10,
    isActive: true,
    slabName: "Slab 1 (₹0 – ₹25,000)",
  },
  {
    id: "slab-2",
    minBudget: 25001,
    maxBudget: 50000,
    marginPct: 20,
    commissionPct: 10,
    isActive: true,
    slabName: "Slab 2 (₹25,001 – ₹50,000)",
  },
  {
    id: "slab-3",
    minBudget: 50001,
    maxBudget: 99999999,
    marginPct: 30,
    commissionPct: 10,
    isActive: true,
    slabName: "Slab 3 (₹50,001+)",
  },
];

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
  budgetSlabs?: BudgetSlab[];     // Budget-wise Margin & Commission Slabs
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
  matchedSlab?: BudgetSlab;
  marginPct?: number;
  commissionPct?: number;
  netMargin?: number;
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
  budgetSlabs: DEFAULT_BUDGET_SLABS,
  notes: "बजेट स्लॅब आणि मार्जिन कमिशन नियम: ₹०-२५k (मार्जिन २०%, कमिशन २०%), ₹२५-५०k (मार्जिन २०%, कमिशन २०%), ₹५०k+ (मार्जिन ३०%, कमिशन २०%).",
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
 * Finds the applicable budget slab for a given customer budget
 */
export function findMatchingBudgetSlab(
  budget: number,
  slabs?: BudgetSlab[]
): BudgetSlab | null {
  const allSlabs = slabs && slabs.length > 0 ? slabs : (getLocalCommissionConfig().budgetSlabs || DEFAULT_BUDGET_SLABS);
  const activeSlabs = allSlabs.filter((s) => s.isActive !== false);
  const safeBudget = Math.max(0, Number(budget) || 0);

  const matched = activeSlabs.find((slab) => {
    const min = Number(slab.minBudget) || 0;
    const max = typeof slab.maxBudget === "number" && slab.maxBudget > 0 ? Number(slab.maxBudget) : Infinity;
    return safeBudget >= min && safeBudget <= max;
  });

  return matched || null;
}

/**
 * Validates budget slabs for negative numbers, min > max, and overlapping ranges
 */
export function validateBudgetSlabs(slabs: BudgetSlab[]): { isValid: boolean; error?: string } {
  if (!slabs || slabs.length === 0) {
    return { isValid: false, error: "किमान एक बजेट स्लॅब असणे आवश्यक आहे." };
  }

  for (let i = 0; i < slabs.length; i++) {
    const s = slabs[i];
    const min = Number(s.minBudget) || 0;
    const max = typeof s.maxBudget === "number" && s.maxBudget > 0 ? Number(s.maxBudget) : Infinity;

    if (min < 0) {
      return { isValid: false, error: `स्लॅब ${i + 1}: किमान बजेट ० पेक्षा कमी असू शकत नाही.` };
    }
    if (min > max) {
      return {
        isValid: false,
        error: `स्लॅब ${i + 1}: किमान बजेट (₹${min.toLocaleString("en-IN")}) हे कमाल बजेट (₹${max.toLocaleString("en-IN")}) पेक्षा मोठे असू शकत नाही.`,
      };
    }
    if (s.marginPct < 0 || s.marginPct > 100) {
      return { isValid: false, error: `स्लॅब ${i + 1}: मार्जिन % हे ० ते १०० दरम्यान असावे.` };
    }
    if (s.commissionPct < 0 || s.commissionPct > 100) {
      return { isValid: false, error: `स्लॅब ${i + 1}: कमिशन % हे ० ते १०० दरम्यान असावे.` };
    }
  }

  // Check for overlapping ranges among active slabs
  const activeSlabs = slabs.filter((s) => s.isActive !== false);
  for (let i = 0; i < activeSlabs.length; i++) {
    for (let j = i + 1; j < activeSlabs.length; j++) {
      const s1 = activeSlabs[i];
      const s2 = activeSlabs[j];
      const min1 = Number(s1.minBudget) || 0;
      const max1 = typeof s1.maxBudget === "number" && s1.maxBudget > 0 ? Number(s1.maxBudget) : Infinity;
      const min2 = Number(s2.minBudget) || 0;
      const max2 = typeof s2.maxBudget === "number" && s2.maxBudget > 0 ? Number(s2.maxBudget) : Infinity;

      // Overlap condition: max(min1, min2) <= min(max1, max2)
      if (Math.max(min1, min2) <= Math.min(max1, max2)) {
        return {
          isValid: false,
          error: `बजेट स्लॅब ओव्हरलॅप होत आहेत: (${s1.slabName || `₹${min1.toLocaleString("en-IN")}-₹${max1.toLocaleString("en-IN")}`}) आणि (${s2.slabName || `₹${min2.toLocaleString("en-IN")}-₹${max2.toLocaleString("en-IN")}`}). कृपया रेंज तपासा.`,
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * Calculates the exact split for Telecaller commission vs MyKalakar owner profit
 * IMPORTANT: Commission is strictly calculated on the Gross Margin (Customer Budget - Artist Payout)
 */
export function calculateCommissionSplit(
  bookingAmount: number,
  artistPayout?: number,
  config?: CommissionConfig
): CommissionCalculationResult {
  const cfg = config || getLocalCommissionConfig();
  const safeBooking = Math.max(0, Number(bookingAmount) || 0);
  const matchedSlab = findMatchingBudgetSlab(safeBooking, cfg.budgetSlabs);

  const marginPct = matchedSlab ? matchedSlab.marginPct : 20;
  const commissionPct = matchedSlab ? matchedSlab.commissionPct : (cfg.telecallerPercentage || 20);

  // If artistPayout is not explicitly given, derive from Margin %
  const defaultArtistPayout = safeBooking > 0 ? Math.round(safeBooking * (1 - marginPct / 100)) : 0;
  const safeArtist = typeof artistPayout === "number" && artistPayout > 0 ? Number(artistPayout) : defaultArtistPayout;

  // 1. Gross Margin = Customer Budget - Artist Payout
  const grossMargin = Math.max(0, safeBooking - safeArtist);
  const flatBonus = Number(cfg.flatBonusPerBooking) || 0;

  // 2. Commission Amount = Gross Margin * Commission % / 100
  const telecallerCommission = Math.round((grossMargin * commissionPct) / 100) + flatBonus;

  // 3. Net Margin (Owner Profit) = Gross Margin - Commission Amount
  const ownerProfit = Math.max(0, grossMargin - telecallerCommission);

  return {
    bookingAmount: safeBooking,
    artistPayout: safeArtist,
    grossMargin,
    splitType: "margin_percentage",
    telecallerCommissionPct: commissionPct,
    ownerProfitPct: Math.max(0, 100 - commissionPct),
    telecallerCommission,
    ownerProfit,
    flatBonus,
    matchedSlab: matchedSlab || undefined,
    marginPct,
    commissionPct,
    netMargin: ownerProfit,
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

