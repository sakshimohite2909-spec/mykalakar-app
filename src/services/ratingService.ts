import { doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { clearDataCache } from "@/services/dataService";
import { calculateRatingAggregate, getArtistRatingSummary, normalizeRatingValue } from "@/services/ratingUtils";

export type SubmittedArtistRating = {
  rating: number;
  averageRating: number;
  totalRatings: number;
  ratingSum: number;
};

export async function getUserArtistRating(artistId: string, userId: string) {
  if (!artistId || !userId) return null;
  const ratingSnap = await getDoc(doc(db, "artists", artistId, "ratings", userId));
  if (!ratingSnap.exists()) return null;
  return normalizeRatingValue(ratingSnap.data().rating);
}

export async function submitArtistRating({
  artistId,
  userId,
  rating,
}: {
  artistId: string;
  userId: string;
  rating: number;
}): Promise<SubmittedArtistRating> {
  if (!artistId) throw new Error("Artist not found.");
  if (!userId) throw new Error("User not authenticated.");

  const nextRating = normalizeRatingValue(rating);
  const artistRef = doc(db, "artists", artistId);
  const ratingRef = doc(db, "artists", artistId, "ratings", userId);

  const result = await runTransaction(db, async (transaction) => {
    const artistSnap = await transaction.get(artistRef);
    if (!artistSnap.exists()) throw new Error("Artist not found.");

    const ratingSnap = await transaction.get(ratingRef);
    const previousRating = ratingSnap.exists() ? normalizeRatingValue(ratingSnap.data().rating) : null;
    const aggregate = calculateRatingAggregate({
      current: getArtistRatingSummary(artistSnap.data() as Record<string, any>),
      nextRating,
      previousRating,
    });

    transaction.set(ratingRef, {
      artistId,
      userId,
      rating: nextRating,
      createdAt: ratingSnap.exists() ? ratingSnap.data().createdAt || serverTimestamp() : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.update(artistRef, {
      averageRating: aggregate.averageRating,
      totalRatings: aggregate.totalRatings,
      ratingSum: aggregate.ratingSum,
      rating: aggregate.averageRating,
      reviews: aggregate.totalRatings,
      "stats.rating": aggregate.averageRating,
      "stats.reviews": aggregate.totalRatings,
      updatedAt: serverTimestamp(),
    });

    return {
      rating: nextRating,
      ...aggregate,
    };
  });

  clearDataCache();
  return result;
}
