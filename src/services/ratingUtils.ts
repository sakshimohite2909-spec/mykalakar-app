export type ArtistRatingSummary = {
  averageRating: number;
  totalRatings: number;
  ratingSum: number;
};

function safeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundRating(value: number) {
  return Math.round(value * 10) / 10;
}

export function normalizeRatingValue(value: unknown) {
  const rating = Number(value);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }
  return Math.round(rating);
}

export function getArtistRatingSummary(artist: Record<string, any> | null | undefined): ArtistRatingSummary {
  const totalRatings = Math.max(0, Math.round(safeNumber(artist?.totalRatings, 0)));
  const averageRating = totalRatings > 0 ? Math.min(5, Math.max(0, safeNumber(artist?.averageRating, 0))) : 0;
  const fallbackSum = averageRating * totalRatings;
  const ratingSum = totalRatings > 0 ? Math.max(0, safeNumber(artist?.ratingSum, fallbackSum)) : 0;

  return {
    averageRating: totalRatings > 0 ? roundRating(averageRating) : 0,
    totalRatings,
    ratingSum,
  };
}

export function calculateRatingAggregate({
  current,
  nextRating,
  previousRating,
}: {
  current: ArtistRatingSummary;
  nextRating: number;
  previousRating?: number | null;
}): ArtistRatingSummary {
  const rating = normalizeRatingValue(nextRating);
  const hasPreviousRating = previousRating !== null && previousRating !== undefined;
  const previous = hasPreviousRating ? normalizeRatingValue(previousRating) : 0;
  const totalRatings = hasPreviousRating ? current.totalRatings : current.totalRatings + 1;
  const ratingSum = Math.max(0, current.ratingSum - previous + rating);
  const averageRating = totalRatings > 0 ? roundRating(ratingSum / totalRatings) : 0;

  return {
    averageRating,
    totalRatings,
    ratingSum,
  };
}

export function hasRatings(summary: Pick<ArtistRatingSummary, "totalRatings" | "averageRating">) {
  return summary.totalRatings > 0 && summary.averageRating > 0;
}
