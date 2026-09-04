import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";

export type CommissionSplitType = "margin_percentage" | "total_booking_percentage";

export interface CommissionConfig {
  splitType: CommissionSplitType;
  telecallerPercentage: number;   // e.g., 20%
  ownerPercentage: number;        // e.g., 80% (100 - telecallerPercentage or custom)
  flatBonusPerBooking: number;    // Flat extra incentive per confirmed booking in INR (e.g., 100)
  minimumBookingThreshold: number;// Minimum booking amount to trigger commission
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

const SETTINGS_DOC_PATH = "system_settings";
const SETTINGS_DOC_ID = "commission_config";
const LOCAL_COMMISSION_CONFIG_KEY = "mykalakar_commission_config";

export const DEFAULT_COMMISSION_CONFIG: CommissionConfig = {
  splitType: "margin_percentage",
  telecallerPercentage: 20,
  ownerPercentage: 80,
  flatBonusPerBooking: 0,
  minimumBookingThreshold: 1000,
  notes: "डिफॉल्ट कमिशन: नफ्याच्या (मार्जिन) २०% टेलिकॉलरला आणि ८०% मायकलाकार ओनरकडे.",
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
  } catch (err) {
    console.warn("Could not fetch remote commission config, using local fallback:", err);
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
  } catch (err) {
    console.warn("Could not persist commission config to Firestore:", err);
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
        console.warn("Commission config subscription warning:", error);
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
