import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";

export interface PaymentConfig {
  upiId: string;
  upiName: string;
  qrImageUrl: string;
  websiteUrl?: string;
  notes?: string;
  updatedAt?: string | Date;
  updatedBy?: string;
}

const SETTINGS_DOC_PATH = "system_settings";
const SETTINGS_DOC_ID = "payment_config";
const LOCAL_PAYMENT_CONFIG_KEY = "mykalakar_payment_config";

export const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  upiId: "mykalakar@icici",
  upiName: "MyKalakar Events & Entertainment",
  qrImageUrl: "https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=upi%3A%2F%2Fpay%3Fpa%3Dmykalakar%40icici%26pn%3DMyKalakar%26cu%3DINR",
  websiteUrl: "https://mykalakar.com",
  notes: "अधिकृत कंपनी खात्यावर पेमेंट करा.",
};

export function getLocalPaymentConfig(): PaymentConfig {
  try {
    const raw = localStorage.getItem(LOCAL_PAYMENT_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PAYMENT_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn("Could not read local payment config:", e);
  }
  return DEFAULT_PAYMENT_CONFIG;
}

export function saveLocalPaymentConfig(config: PaymentConfig): void {
  try {
    localStorage.setItem(LOCAL_PAYMENT_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn("Could not save local payment config:", e);
  }
}

export async function fetchPaymentConfig(): Promise<PaymentConfig> {
  const local = getLocalPaymentConfig();
  try {
    const snap = await getDoc(doc(db, SETTINGS_DOC_PATH, SETTINGS_DOC_ID));
    if (snap.exists()) {
      const data = snap.data() as PaymentConfig;
      const merged = { ...DEFAULT_PAYMENT_CONFIG, ...data };
      saveLocalPaymentConfig(merged);
      return merged;
    }
  } catch (err) {
    console.warn("Could not fetch remote payment config, using local cache:", err);
  }
  return local;
}

export async function updatePaymentConfig(config: Partial<PaymentConfig>, updatedBy = "telecaller"): Promise<PaymentConfig> {
  const current = getLocalPaymentConfig();
  const updated: PaymentConfig = {
    ...current,
    ...config,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  saveLocalPaymentConfig(updated);

  try {
    await setDoc(doc(db, SETTINGS_DOC_PATH, SETTINGS_DOC_ID), {
      ...updated,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn("Could not persist payment config to Firestore:", err);
  }

  window.dispatchEvent(new CustomEvent("mykalakar_payment_config_updated", { detail: updated }));
  return updated;
}

export function subscribePaymentConfig(callback: (config: PaymentConfig) => void): () => void {
  callback(getLocalPaymentConfig());

  let unsubFirestore = () => {};
  try {
    unsubFirestore = onSnapshot(
      doc(db, SETTINGS_DOC_PATH, SETTINGS_DOC_ID),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as PaymentConfig;
          const merged = { ...DEFAULT_PAYMENT_CONFIG, ...data };
          saveLocalPaymentConfig(merged);
          callback(merged);
        }
      },
      (error) => {
        console.warn("Payment config subscription warning:", error);
      }
    );
  } catch {
    // Firestore offline fallback
  }

  const handleCustomEvent = (e: any) => {
    if (e.detail) {
      callback(e.detail);
    }
  };
  window.addEventListener("mykalakar_payment_config_updated", handleCustomEvent);

  return () => {
    unsubFirestore();
    window.removeEventListener("mykalakar_payment_config_updated", handleCustomEvent);
  };
}
