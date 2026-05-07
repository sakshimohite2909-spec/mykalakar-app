export const FIREBASE_READ_TIMEOUT_MS = 12000;
export const FIREBASE_WRITE_TIMEOUT_MS = 20000;
export const FIREBASE_UPLOAD_TIMEOUT_MS = 45000;

export function getFirebaseErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code ?? "")
    : "";
}

export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  message = "This request is taking too long. Please check your connection and try again."
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function firebaseErrorMessage(error: unknown, fallback: string) {
  const code = getFirebaseErrorCode(error);

  if (code === "permission-denied") {
    return "Firebase rules blocked this action. Please deploy the updated Firestore rules and try again.";
  }
  if (code === "unauthenticated" || code === "auth/user-token-expired") {
    return "Your session expired. Please log in again.";
  }
  if (code === "unavailable" || code === "deadline-exceeded") {
    return "Firebase is taking too long to respond. Please check your internet connection and try again.";
  }
  if (code === "storage/unauthorized") {
    return "Firebase Storage rules blocked this upload. Please deploy the updated Storage rules and try again.";
  }
  if (code === "storage/retry-limit-exceeded" || code === "storage/canceled") {
    return "The upload could not finish. Please try again with a smaller image or a stronger connection.";
  }
  if (code === "auth/network-request-failed") {
    return "Network error while contacting Firebase Authentication. Please check your connection and try again.";
  }
  if (code === "auth/email-already-in-use") {
    return "This username is already registered.";
  }
  if (code === "auth/weak-password") {
    return "Password must be at least 6 characters.";
  }
  if (code === "auth/invalid-credential") {
    return "Invalid username or password.";
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/**
 * Returns true when Firestore throws because a composite index is missing
 * or is still being built in the Firebase Console.
 */
export function isIndexError(error: unknown): boolean {
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error);
  return (
    msg.includes("requires an index") ||
    msg.includes("index is currently building") ||
    msg.includes("FAILED_PRECONDITION")
  );
}

/**
 * Central helper for onSnapshot / getDocs error handlers.
 *
 * • Index / building errors  → soft amber toast ("Optimizing database…")
 * • All other errors         → red destructive toast with the real message
 *
 * Usage:
 *   toastForFirestoreError(error, "Artists unavailable", "Could not load artists.", toast);
 */
export function toastForFirestoreError(
  error: unknown,
  title: string,
  fallback: string,
  toastFn: (opts: {
    variant?: "default" | "destructive";
    title: string;
    description: string;
  }) => void
): void {
  if (isIndexError(error)) {
    toastFn({
      title: "⏳ Optimizing database",
      description:
        "Optimizing for faster loading — please check back in a few minutes.",
    });
    return;
  }
  toastFn({
    variant: "destructive",
    title,
    description: firebaseErrorMessage(error, fallback),
  });
}
