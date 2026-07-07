/**
 * AuthExceptionHandler.ts
 * Deterministic mapping for Firebase Authentication exceptions to user-friendly messages.
 */

export function mapAuthCodeToMessage(errorCode: string): string {
  switch (errorCode) {
    case "auth/too-many-requests":
      return "Access temporarily blocked due to multiple failed attempts. Please try again later.";
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return "Invalid email or password. Please check your credentials.";
    case "auth/email-already-in-use":
      return "An account with this email address already exists. Please log in instead.";
    case "auth/weak-password":
      return "The provided password is too weak. Please use a stronger password.";
    case "auth/invalid-email":
      return "The email address is not valid.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection and try again.";
    case "auth/operation-not-allowed":
      return "This sign-in method is currently disabled.";
    default:
      // Fallback for unexpected errors
      return "An unexpected authentication error occurred. Please try again.";
  }
}
