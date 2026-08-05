import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

export type LeadStatus =
  | "new"
  | "contacting_artists"
  | "artist_confirmed"
  | "quote_sent"
  | "booked"
  | "cancelled";

export type ArtistCallOutcome =
  | "pending"
  | "agreed"
  | "busy_booked"
  | "no_answer"
  | "price_too_high"
  | "rejected";

export type MatchedArtistCall = {
  artistId: string;
  artistName: string;
  artistPhone: string;
  category: string;
  subCategory: string;
  callOutcome: ArtistCallOutcome;
  quotedPrice?: number;
  callNotes?: string;
  updatedAt?: string;
};

export type TelecallerLead = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  eventType: string;
  category: string;
  subCategory: string;
  eventDate: string;
  eventLocation: string;
  district?: string;
  budget: number;
  specialNotes?: string;
  assignedTelecallerId?: string;
  assignedTelecallerName?: string;
  status: LeadStatus;
  matchedArtists: MatchedArtistCall[];
  confirmedArtistId?: string;
  confirmedArtistName?: string;
  confirmedPrice?: number;
  source: "website_inquiry" | "manual_phone_call";
  createdAt?: string | Date;
};

const LEADS_COLLECTION = "telecaller_leads";

export function subscribeTelecallerLeads(callback: (leads: TelecallerLead[]) => void) {
  try {
    const q = query(collection(db, LEADS_COLLECTION), orderBy("createdAt", "desc"), limit(50));
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as TelecallerLead[];
        callback(list);
      },
      (error) => {
        console.warn("Realtime leads subscription error:", error);
        callback([]);
      }
    );
  } catch (err) {
    console.warn("Could not subscribe to leads:", err);
    callback([]);
    return () => {};
  }
}

export async function saveCustomerInquiryLead(inquiry: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  eventType: string;
  category?: string;
  subCategory?: string;
  eventDate: string;
  eventLocation: string;
  budget?: number;
  message?: string;
  artistId?: string;
  artistName?: string;
}): Promise<void> {
  try {
    const newLead: Omit<TelecallerLead, "id"> = {
      customerName: inquiry.customerName || "Customer",
      customerPhone: inquiry.customerPhone || "",
      customerEmail: inquiry.customerEmail || "",
      eventType: inquiry.eventType || "General Event",
      category: inquiry.category || inquiry.eventType || "General Event",
      subCategory: inquiry.subCategory || (inquiry.artistName ? `Artist Booking (${inquiry.artistName})` : "General Inquiry"),
      eventDate: inquiry.eventDate || "",
      eventLocation: inquiry.eventLocation || "",
      budget: Number(inquiry.budget || 0),
      specialNotes: inquiry.message || "",
      status: "new",
      matchedArtists: inquiry.artistName
        ? [
            {
              artistId: inquiry.artistId || inquiry.artistName,
              artistName: inquiry.artistName,
              artistPhone: "",
              category: inquiry.eventType || "",
              subCategory: inquiry.subCategory || "",
              callOutcome: "pending",
            },
          ]
        : [],
      source: "website_inquiry",
    };

    await addDoc(collection(db, LEADS_COLLECTION), {
      ...newLead,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn("Failed to save customer inquiry lead to telecaller_leads:", error);
  }
}

export async function fetchTelecallerLeads(): Promise<TelecallerLead[]> {
  try {
    const q = query(collection(db, LEADS_COLLECTION), orderBy("createdAt", "desc"), limit(50));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as TelecallerLead[];
  } catch (error) {
    console.warn("Could not fetch leads from Firestore:", error);
    return [];
  }
}

export async function createManualLead(leadData: Omit<TelecallerLead, "id" | "createdAt" | "status" | "matchedArtists">): Promise<TelecallerLead> {
  const newLead: Omit<TelecallerLead, "id"> = {
    ...leadData,
    status: "new",
    matchedArtists: [],
    source: "manual_phone_call",
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = await addDoc(collection(db, LEADS_COLLECTION), {
      ...newLead,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...newLead };
  } catch (error) {
    console.warn("Error saving lead to Firestore, generating local lead ID:", error);
    return { id: `lead_${Date.now()}`, ...newLead };
  }
}

export async function updateLeadStatus(leadId: string, status: LeadStatus, confirmedArtist?: { artistId: string; artistName: string; price: number }): Promise<void> {
  try {
    const docRef = doc(db, LEADS_COLLECTION, leadId);
    const updatePayload: Record<string, any> = {
      status,
      updatedAt: serverTimestamp(),
    };
    if (confirmedArtist) {
      updatePayload.confirmedArtistId = confirmedArtist.artistId;
      updatePayload.confirmedArtistName = confirmedArtist.artistName;
      updatePayload.confirmedPrice = confirmedArtist.price;
    }
    await updateDoc(docRef, updatePayload);
  } catch (error) {
    console.warn(`Local lead status updated for ${leadId} -> ${status}`, error);
  }
}

export async function logArtistCall(
  leadId: string,
  artistCall: MatchedArtistCall,
  existingMatchedArtists: MatchedArtistCall[]
): Promise<MatchedArtistCall[]> {
  const updatedList = existingMatchedArtists.filter(
    (item) => item.artistId !== artistCall.artistId
  );
  updatedList.push({
    ...artistCall,
    updatedAt: new Date().toISOString(),
  });

  try {
    const docRef = doc(db, LEADS_COLLECTION, leadId);
    await updateDoc(docRef, {
      matchedArtists: updatedList,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn(`Local call outcome logged for lead ${leadId}`, error);
  }

  return updatedList;
}
