export const FIREBASE_READ_TIMEOUT_MS = 12000;
export const FIREBASE_WRITE_TIMEOUT_MS = 20000;
export const FIREBASE_UPLOAD_TIMEOUT_MS = 45000;

export const sanitizePayload = (payload: any) =>
  Object.fromEntries(
    Object.entries(payload).filter(([_, v]) => v !== undefined)
  );

export const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "This username is already registered.",
  "auth/invalid-email": "Invalid email address.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/operation-not-allowed": "Email/password sign-in is not enabled in Firebase Console.",
  "auth/configuration-not-found": "Firebase Auth configuration is missing.",
  "auth/invalid-credential": "Invalid username or password.",
  "auth/user-not-found": "No account found with this username.",
  "auth/wrong-password": "Incorrect password.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/network-request-failed": "Network error while contacting Firebase Authentication. Please check your connection and try again.",
  "auth/user-token-expired": "Your session expired. Please log in again.",
  "permission-denied": "Firebase rules blocked this action. Please deploy the updated Firestore rules and try again.",
  unauthenticated: "Your session expired. Please log in again.",
  unavailable: "Firebase is taking too long to respond. Please check your internet connection and try again.",
  "deadline-exceeded": "Firebase is taking too long to respond. Please check your internet connection and try again.",
  "storage/unauthorized": "Firebase Storage rules blocked this upload. Please deploy the updated Storage rules and try again.",
  "storage/retry-limit-exceeded": "The upload could not finish. Please try again with a smaller image or a stronger connection.",
  "storage/canceled": "The upload could not finish. Please try again with a smaller image or a stronger connection.",
};

export function requireAuthUid(currentUser?: { uid?: string } | null) {
  if (!currentUser?.uid) {
    throw new Error("User not authenticated");
  }
  return currentUser.uid;
}

export function getFirebaseErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code ?? "")
    : "";
}

export function firebaseErrorMessage(error: unknown, fallback: string) {
  const code = getFirebaseErrorCode(error);

  if (code && FIREBASE_ERROR_MESSAGES[code]) return FIREBASE_ERROR_MESSAGES[code];
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function logFirebaseError(error: any, context = "Firebase operation") {
  console.group(`Firebase error: ${context}`);
  console.error("Code:", getFirebaseErrorCode(error) || "unknown");
  console.error("Message:", firebaseErrorMessage(error, "Unknown Firebase error."));
  console.error("Full:", error);
  console.groupEnd();
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
  logFirebaseError(error);
  if (isIndexError(error)) {
    toastFn({
      title: "Optimizing database",
      description: "Optimizing for faster loading. Please check back in a few minutes.",
    });
    return;
  }
  toastFn({
    variant: "destructive",
    title,
    description: firebaseErrorMessage(error, fallback),
  });
}
