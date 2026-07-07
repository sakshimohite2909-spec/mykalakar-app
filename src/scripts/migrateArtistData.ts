/**
 * Migration Script: Sync Approved Artist Applications → artists Collection
 *
 * Run this once in the browser console or as a one-shot script while logged
 * in as an admin. It reads all artist_applications with status "approved"
 * and ensures artists/{uid} exists with the correct data.
 *
 * HOW TO RUN:
 *   1. Open the app in Chrome while logged in as an admin
 *   2. Open DevTools → Console
 *   3. The script is auto-available via the admin dashboard "Migrate Data" button
 *      OR you can manually import and call migrateApprovedArtists()
 */

import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { getArtistArtForms, normalizeArtistType } from "@/constants/artistSystem";

const numberOrZero = (value: unknown) => Number(value) || 0;

function toArtistDoc(applicationId: string, data: Record<string, any>) {
  const primaryArt = Array.isArray(data.artsList) ? data.artsList[0] || {} : {};
  const rawArts = Array.isArray(data.artsList) ? data.artsList : [];
  const normalizedArts = rawArts.map((art: any) => ({
    ...art,
    category: normalizeArtistType(art?.category) ?? String(art?.category ?? "").trim(),
  }));
  const normalizedPrimaryCategory =
    normalizeArtistType(data.category) ??
    normalizeArtistType(primaryArt.category) ??
    normalizedArts[0]?.category ??
    "";
  const normalizedCategories = Array.from(new Set([
    ...normalizedArts.map((art: any) => art.category),
    ...(Array.isArray(data.categories) ? data.categories.map((category: any) => normalizeArtistType(category) ?? String(category ?? "").trim()) : []),
    normalizedPrimaryCategory,
  ].filter(Boolean)));
  const media = data.media || {
    profilePhoto: data.profilePhoto || "",
    coverPhoto: data.coverPhoto || "",
    galleryPhotos: data.galleryPhotos || [],
  };
  const artistProfile = {
    artForms: getArtistArtForms({
      ...data,
      category: normalizedPrimaryCategory,
      categories: normalizedCategories,
      artsList: normalizedArts,
    }),
    experience: numberOrZero(data.experience),
    bio: data.bio || "",
    location: data.location || data.district || data.city || data.state || "",
    profileImage: media.profilePhoto || data.profilePhoto || "",
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
    category: normalizedPrimaryCategory,
    subcategory: data.subcategory || primaryArt.subcategory || "",
    categories: normalizedCategories,
    artsList: normalizedArts,
    artistProfile,
    services: Array.isArray(data.services) ? data.services : [],
    types: Array.isArray(data.types) ? data.types : primaryArt.types || [],
    pricing: data.pricing || {
      soloPrice: numberOrZero(data.soloPrice ?? primaryArt.soloPrice),
      duoPrice: numberOrZero(data.duoPrice ?? primaryArt.duoPrice),
      teamPrice: numberOrZero(data.teamPrice ?? primaryArt.teamPrice),
      feeNotes: data.feeNotes || "",
    },
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
    approvedAt: data.approvedAt || serverTimestamp(),
    createdAt: data.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export interface MigrationResult {
  total: number;
  created: number;
  skipped: number;
  errors: string[];
}

export async function migrateApprovedArtists(): Promise<MigrationResult> {
  const result: MigrationResult = { total: 0, created: 0, skipped: 0, errors: [] };

  console.log("🔄 Starting artist migration...");

  // Get all approved applications
  const appsSnap = await getDocs(
    query(collection(db, "artist_applications"), where("status", "==", "approved"))
  );

  result.total = appsSnap.size;
  console.log(`📋 Found ${result.total} approved applications`);

  if (result.total === 0) {
    console.log("✅ Nothing to migrate.");
    return result;
  }

  // Process in batches of 20 (Firestore batch limit is 500 but keep small)
  const docs = appsSnap.docs;
  const batchSize = 20;

  for (let i = 0; i < docs.length; i += batchSize) {
    const chunk = docs.slice(i, i + batchSize);
    const batch = writeBatch(db);
    let batchHasWrites = false;

    for (const appDoc of chunk) {
      const data = appDoc.data();
      const uid = data.uid;

      if (!uid) {
        result.errors.push(`Application ${appDoc.id} has no uid`);
        continue;
      }

      // Check if artist doc already exists with correct status
      const artistRef = doc(db, "artists", uid);
      const artistSnap = await getDoc(artistRef);

      if (artistSnap.exists() && artistSnap.data()?.status === "active") {
        console.log(`⏭ Skipping ${data.name} — already active in artists collection`);
        result.skipped++;
        continue;
      }

      // Create/update artists/{uid}
      batch.set(artistRef, toArtistDoc(appDoc.id, data), { merge: true });

      // Ensure users/{uid} has correct role/status
      batch.set(
        doc(db, "users", uid),
        {
          uid,
          name: data.name || "",
          username: data.username || "",
          email: data.email || "",
          phone: data.mobileNumber || data.phone || "",
          profilePhoto: data.media?.profilePhoto || data.profilePhoto || "",
          artistProfile: {
            artForms: getArtistArtForms(data),
            experience: numberOrZero(data.experience),
            bio: data.bio || "",
            location: data.location || data.district || data.city || data.state || "",
            profileImage: data.media?.profilePhoto || data.profilePhoto || "",
          },
          role: "artist",
          status: "active",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      batchHasWrites = true;
      result.created++;
      console.log(`✅ Queued migration for: ${data.name} (${uid})`);
    }

    if (batchHasWrites) {
      await batch.commit();
      console.log(`💾 Committed batch ${Math.ceil(i / batchSize) + 1}`);
    }
  }

  console.log(`\n✅ Migration complete!`);
  console.log(`   Total:   ${result.total}`);
  console.log(`   Created: ${result.created}`);
  console.log(`   Skipped: ${result.skipped}`);
  if (result.errors.length > 0) {
    console.error(`   Errors:`, result.errors);
  }

  return result;
}

/**
 * Also migrate any artists in the legacy "pending_registrations" collection
 * that were approved but never moved to artists/
 */
export async function migrateLegacyRegistrations(): Promise<MigrationResult> {
  const result: MigrationResult = { total: 0, created: 0, skipped: 0, errors: [] };

  try {
    const snap = await getDocs(
      query(collection(db, "pending_registrations"), where("status", "==", "approved"))
    );
    result.total = snap.size;
    if (result.total === 0) return result;

    const batch = writeBatch(db);
    for (const d of snap.docs) {
      const data = d.data();
      const uid = data.uid;
      if (!uid) { result.errors.push(d.id); continue; }

      const artistSnap = await getDoc(doc(db, "artists", uid));
      if (artistSnap.exists()) { result.skipped++; continue; }

      batch.set(doc(db, "artists", uid), toArtistDoc(d.id, data), { merge: true });
      result.created++;
    }
    await batch.commit();
  } catch (e) {
    console.warn("Legacy migration skipped:", e);
  }

  return result;
}
