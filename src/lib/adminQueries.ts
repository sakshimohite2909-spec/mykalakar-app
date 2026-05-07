import { db } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { FIREBASE_READ_TIMEOUT_MS, FIREBASE_WRITE_TIMEOUT_MS, withTimeout } from "@/lib/firebaseSafe";

const numberOrZero = (value: unknown) => Number(value) || 0;

function toArtistDocument(applicationId: string, data: Record<string, any>) {
  const primaryArt = Array.isArray(data.artsList) ? data.artsList[0] || {} : {};
  const pricing = data.pricing || {
    soloPrice: numberOrZero(data.soloPrice ?? primaryArt.soloPrice),
    duoPrice: numberOrZero(data.duoPrice ?? primaryArt.duoPrice),
    teamPrice: numberOrZero(data.teamPrice ?? primaryArt.teamPrice),
    feeNotes: data.feeNotes || "",
  };
  const media = data.media || {
    profilePhoto: data.profilePhoto || "",
    coverPhoto: data.coverPhoto || "",
    galleryPhotos: data.galleryPhotos || [],
  };

  return {
    uid: data.uid,
    applicationId,
    username: data.username || "",
    name: data.name || "",
    brandName: data.brandName || "",
    professionalName: data.professionalName || "",
    email: data.email || "",
    mobileNumber: data.mobileNumber || data.phone || "",
    emergencyNumber: data.emergencyNumber || "",
    state: data.state || "",
    district: data.district || data.city || "",
    bio: data.bio || "",
    experience: numberOrZero(data.experience),
    availability: data.availability || "available",
    category: data.category || primaryArt.category || "",
    subcategory: data.subcategory || primaryArt.subcategory || "",
    categories: Array.isArray(data.categories) ? data.categories : [data.category].filter(Boolean),
    artsList: Array.isArray(data.artsList) ? data.artsList : [],
    services: Array.isArray(data.services) ? data.services : [],
    types: Array.isArray(data.types) ? data.types : primaryArt.types || [],
    pricing,
    media,
    socialLinks: Array.isArray(data.socialLinks) ? data.socialLinks : [],
    liveLink: data.liveLink || "",
    assistant: data.assistant || {
      hasAssistant: Boolean(data.hasAssistant),
      name: data.assistantName || "",
      contact: data.assistantContact || "",
    },
    stats: {
      rating: numberOrZero(data.stats?.rating ?? data.rating),
      reviews: numberOrZero(data.stats?.reviews ?? data.reviews),
      followers: numberOrZero(data.stats?.followers ?? data.followers),
      profileViews: numberOrZero(data.stats?.profileViews ?? data.profileViews),
      totalBookings: numberOrZero(data.stats?.totalBookings ?? data.totalBookings),
    },
    status: "active",
    verified: true,
    trending: Boolean(data.trending),
    approvedAt: serverTimestamp(),
    createdAt: data.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function bookingFromInquiry(inquiryId: string, data: Record<string, any>) {
  return {
    inquiryId,
    artistId: data.artistId || "",
    artistUid: data.artistUid || data.artistId || "",
    customerId: data.customerId || "",
    clientName: data.customerName || "",
    phone: data.customerPhone || "",
    eventType: data.eventType || "",
    eventDate: data.eventDate || "",
    location: data.eventLocation || "",
    message: data.message || "",
    quotedPrice: numberOrZero(data.quotedPrice),
    advanceAmount: numberOrZero(data.advanceAmount),
    paymentStatus: data.paymentStatus || "unpaid",
    status: "pending",
    createdAt: data.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export async function getPendingArtists() {
  const snap = await withTimeout(
    getDocs(query(collection(db, "artist_applications"), where("status", "==", "pending"), orderBy("createdAt", "desc"))),
    FIREBASE_READ_TIMEOUT_MS,
    "Could not load pending artists."
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getApprovedArtists() {
  const snap = await withTimeout(
    getDocs(query(collection(db, "artists"), where("status", "==", "active"), orderBy("createdAt", "desc"))),
    FIREBASE_READ_TIMEOUT_MS,
    "Could not load approved artists."
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAllUsers() {
  const snap = await withTimeout(
    getDocs(query(collection(db, "users"), where("role", "==", "customer"), orderBy("createdAt", "desc"))),
    FIREBASE_READ_TIMEOUT_MS,
    "Could not load users."
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function approveArtist(applicationId: string) {
  const appRef = doc(db, "artist_applications", applicationId);
  const appSnap = await withTimeout(getDoc(appRef), FIREBASE_READ_TIMEOUT_MS, "Could not load this application.");
  if (!appSnap.exists()) throw new Error("Application not found");

  const data = appSnap.data();
  const uid = data.uid;
  if (!uid) throw new Error("Application is missing uid");

  const batch = writeBatch(db);
  batch.update(appRef, {
    status: "approved",
    verified: true,
    reviewedAt: serverTimestamp(),
    approvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, "artists", uid), toArtistDocument(applicationId, data), { merge: true });
  batch.set(
    doc(db, "users", uid),
    {
      uid,
      name: data.name || "",
      username: data.username || "",
      email: data.email || "",
      phone: data.mobileNumber || data.phone || "",
      profilePhoto: data.media?.profilePhoto || data.profilePhoto || "",
      role: "artist",
      status: "active",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await withTimeout(batch.commit(), FIREBASE_WRITE_TIMEOUT_MS, "Could not approve this artist.");
}

export async function rejectArtist(applicationId: string, reason = "") {
  await withTimeout(
    updateDoc(doc(db, "artist_applications", applicationId), {
      status: "rejected",
      rejectedAt: serverTimestamp(),
      rejectionReason: reason,
      updatedAt: serverTimestamp(),
    }),
    FIREBASE_WRITE_TIMEOUT_MS,
    "Could not reject this artist."
  );
}

export async function getPendingAdminRequests() {
  const snap = await withTimeout(
    getDocs(query(collection(db, "admin_requests"), where("status", "==", "pending"), orderBy("requestedAt", "desc"))),
    FIREBASE_READ_TIMEOUT_MS,
    "Could not load admin requests."
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function approveAdminRequest(requestId: string) {
  const requestRef = doc(db, "admin_requests", requestId);
  const requestSnap = await withTimeout(getDoc(requestRef), FIREBASE_READ_TIMEOUT_MS, "Could not load this admin request.");
  if (!requestSnap.exists()) throw new Error("Admin request not found");

  const data = requestSnap.data();
  const uid = data.uid;
  if (!uid) throw new Error("Admin request is missing uid");

  const batch = writeBatch(db);
  batch.update(requestRef, {
    status: "approved",
    approvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(
    doc(db, "admins", uid),
    {
      uid,
      name: data.name || "",
      username: data.username || "",
      email: data.email || "",
      mobileNumber: data.mobileNumber || "",
      capName: data.capName || "",
      bloodGroup: data.bloodGroup || "",
      about: data.about || "",
      role: "admin",
      status: "active",
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  batch.set(
    doc(db, "users", uid),
    {
      uid,
      name: data.name || "",
      username: data.username || "",
      email: data.email || "",
      phone: data.mobileNumber || "",
      role: "admin",
      status: "active",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await withTimeout(batch.commit(), FIREBASE_WRITE_TIMEOUT_MS, "Could not approve this admin.");
}

export async function rejectAdminRequest(requestId: string, reason = "") {
  const requestRef = doc(db, "admin_requests", requestId);
  const requestSnap = await withTimeout(getDoc(requestRef), FIREBASE_READ_TIMEOUT_MS, "Could not load this admin request.");
  if (!requestSnap.exists()) throw new Error("Admin request not found");
  const data = requestSnap.data();

  const batch = writeBatch(db);
  batch.update(requestRef, {
    status: "rejected",
    rejectionReason: reason,
    rejectedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  if (data.uid) {
    batch.set(
      doc(db, "users", data.uid),
      {
        role: "customer",
        status: "active",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  await withTimeout(batch.commit(), FIREBASE_WRITE_TIMEOUT_MS, "Could not reject this admin.");
}

export async function deleteUserFromFirestore(uid: string) {
  await withTimeout(deleteDoc(doc(db, "users", uid)), FIREBASE_WRITE_TIMEOUT_MS, "Could not delete this user.");
  const appSnap = await withTimeout(
    getDocs(query(collection(db, "artist_applications"), where("uid", "==", uid))),
    FIREBASE_READ_TIMEOUT_MS,
    "Could not load this user's applications."
  );
  for (const d of appSnap.docs) {
    await withTimeout(deleteDoc(d.ref), FIREBASE_WRITE_TIMEOUT_MS, "Could not delete an application.");
  }
  await withTimeout(deleteDoc(doc(db, "artists", uid)), FIREBASE_WRITE_TIMEOUT_MS, "Could not delete this artist.");
}

export async function confirmInquiry(inquiryId: string) {
  const inquiryRef = doc(db, "inquiries", inquiryId);
  const inquirySnap = await withTimeout(getDoc(inquiryRef), FIREBASE_READ_TIMEOUT_MS, "Could not load this inquiry.");
  if (!inquirySnap.exists()) throw new Error("Inquiry not found");

  const inquiry = inquirySnap.data();
  const batch = writeBatch(db);
  batch.update(inquiryRef, {
    status: "confirmed",
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, "bookings", inquiryId), bookingFromInquiry(inquiryId, inquiry), { merge: true });
  await withTimeout(batch.commit(), FIREBASE_WRITE_TIMEOUT_MS, "Could not confirm this inquiry.");
}

export async function cancelInquiry(inquiryId: string) {
  await withTimeout(
    updateDoc(doc(db, "inquiries", inquiryId), {
      status: "cancelled",
      updatedAt: serverTimestamp(),
    }),
    FIREBASE_WRITE_TIMEOUT_MS,
    "Could not cancel this inquiry."
  );
}

export async function getDashboardStats() {
  const [pending, approved, users] = await withTimeout(
    Promise.all([
      getDocs(query(collection(db, "artist_applications"), where("status", "==", "pending"))),
      getDocs(query(collection(db, "artists"), where("status", "==", "active"))),
      getDocs(collection(db, "users")),
    ]),
    FIREBASE_READ_TIMEOUT_MS,
    "Could not load dashboard stats."
  );
  return {
    pendingCount: pending.size,
    approvedCount: approved.size,
    totalUsers: users.size,
  };
}
