import { doc, serverTimestamp, writeBatch, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sanitizePayload } from "@/lib/firebaseSafe";

type UnifiedProfileUpdate = {
  artistId: string;
  uid: string;
  artistData: DocumentData;
  userData?: DocumentData;
};

export async function updateUnifiedArtistProfile({
  artistId,
  uid,
  artistData,
  userData,
}: UnifiedProfileUpdate) {
  const batch = writeBatch(db);
  const updatedAt = serverTimestamp();

  batch.update(doc(db, "artists", artistId), sanitizePayload({
    ...artistData,
    updatedAt,
  }));

  if (userData) {
    batch.set(
      doc(db, "users", uid),
      sanitizePayload({
        ...userData,
        uid,
        updatedAt,
      }),
      { merge: true }
    );
  }

  await batch.commit();
}
