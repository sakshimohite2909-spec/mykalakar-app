import { describe, expect, it } from "vitest";
import {
  FIREBASE_ERROR_MESSAGES,
  firebaseErrorMessage,
  getFirebaseErrorCode,
} from "@/lib/firebaseSafe";

describe("firebaseSafe", () => {
  it.each([
    ["auth/email-already-in-use", "This username is already registered."],
    ["auth/invalid-credential", "Invalid username or password."],
    ["auth/network-request-failed", "Network error while contacting Firebase Authentication. Please check your connection and try again."],
    ["permission-denied", "Firebase rules blocked this action. Please deploy the updated Firestore rules and try again."],
  ])("maps %s to a user-facing message", (code, message) => {
    expect(firebaseErrorMessage({ code }, "fallback")).toBe(message);
    expect(FIREBASE_ERROR_MESSAGES[code]).toBe(message);
  });

  it("falls back to the Error message when Firebase does not provide a known code", () => {
    expect(firebaseErrorMessage(new Error("Something specific failed."), "fallback")).toBe(
      "Something specific failed."
    );
  });

  it("extracts Firebase-style error codes safely", () => {
    expect(getFirebaseErrorCode({ code: "auth/invalid-email" })).toBe("auth/invalid-email");
    expect(getFirebaseErrorCode(null)).toBe("");
  });
});
