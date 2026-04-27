// ─── Admin Query Utilities ────────────────────────────────────────────────────
// Use these in AdminPending.tsx, AdminArtists.tsx, AdminDashboard.tsx

import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";

// ─── Get all pending artist registrations ─────────────────────────────────
export async function getPendingArtists() {
  const snap = await getDocs(
    query(collection(db, "pending_registrations"), where("status", "==", "pending"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── Get all approved artists ─────────────────────────────────────────────
export async function getApprovedArtists() {
  const snap = await getDocs(
    query(collection(db, "pending_registrations"), where("status", "==", "approved"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── Get all users (customers) ────────────────────────────────────────────
export async function getAllUsers() {
  const snap = await getDocs(
    query(collection(db, "users"), where("role", "==", "customer"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── Approve an artist registration ──────────────────────────────────────
// This moves the approved record from pending_registrations to artists collection
export async function approveArtist(pendingDocId: string) {
  const pendingRef = doc(db, "pending_registrations", pendingDocId);
  const pendingSnap = await getDoc(pendingRef);
  if (!pendingSnap.exists()) throw new Error("Pending registration not found");

  const data = pendingSnap.data();
  const uid = data.uid;

  // 1. Update status in pending_registrations
  await updateDoc(pendingRef, {
    status: "approved",
    verified: true,
    approvedAt: serverTimestamp(),
  });

  // 2. Write/upsert into artists collection (uid as key)
  await setDoc(doc(db, "artists", uid), {
    ...data,
    status: "approved",
    verified: true,
    approvedAt: serverTimestamp(),
  }, { merge: true });

  // 3. Update the users document to reflect artist role
  await updateDoc(doc(db, "users", uid), {
    role: "artist",
    status: "approved",
  });
}

// ─── Reject an artist registration ───────────────────────────────────────
export async function rejectArtist(pendingDocId: string, reason = "") {
  await updateDoc(doc(db, "pending_registrations", pendingDocId), {
    status: "rejected",
    rejectedAt: serverTimestamp(),
    rejectionReason: reason,
  });
}

// ─── Delete a user account from Firestore ────────────────────────────────
// Note: Deleting the Firebase Auth account requires Admin SDK (backend).
// This only removes Firestore data.
export async function deleteUserFromFirestore(uid: string) {
  await deleteDoc(doc(db, "users", uid));
  // Also remove from pending if exists
  const snap = await getDocs(
    query(collection(db, "pending_registrations"), where("uid", "==", uid))
  );
  for (const d of snap.docs) {
    await deleteDoc(d.ref);
  }
}

// ─── Get dashboard stats ──────────────────────────────────────────────────
export async function getDashboardStats() {
  const [pending, approved, users] = await Promise.all([
    getDocs(query(collection(db, "pending_registrations"), where("status", "==", "pending"))),
    getDocs(query(collection(db, "pending_registrations"), where("status", "==", "approved"))),
    getDocs(collection(db, "users")),
  ]);
  return {
    pendingCount: pending.size,
    approvedCount: approved.size,
    totalUsers: users.size,
  };
}
