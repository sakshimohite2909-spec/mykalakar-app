import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  FIREBASE_WRITE_TIMEOUT_MS,
  firebaseErrorMessage,
  getFirebaseErrorCode,
  sanitizePayload,
  withTimeout,
} from "@/lib/firebaseSafe";

type DiagnosticResult = {
  ok: boolean;
  stage: string;
  message: string;
  code?: string;
  details?: unknown;
};

function currentAuthSnapshot() {
  const user = auth.currentUser;
  if (!user) return null;

  return {
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
    isAnonymous: user.isAnonymous,
    providerIds: user.providerData.map((provider) => provider.providerId),
  };
}

function firebaseFailure(stage: string, error: unknown): DiagnosticResult {
  const code = getFirebaseErrorCode(error);
  const message = firebaseErrorMessage(error, `${stage} failed.`);
  console.error(`[Firebase diagnostics] ${stage}`, { code, message, error });
  return { ok: false, stage, code, message, details: error };
}

export function inspectAuthSession(): DiagnosticResult {
  const snapshot = currentAuthSnapshot();
  console.group("[Firebase diagnostics] Auth session");
  console.table(snapshot ? [snapshot] : []);
  console.groupEnd();

  return {
    ok: Boolean(snapshot),
    stage: "auth-session",
    message: snapshot ? "Firebase Auth has an active user session." : "No Firebase Auth user is currently signed in.",
    details: snapshot,
  };
}

export function attachAuthStateDebug() {
  console.info("[Firebase diagnostics] Listening to onAuthStateChanged. Call the returned function to stop.");

  return onAuthStateChanged(
    auth,
    (user) => {
      console.info("[Firebase diagnostics] onAuthStateChanged", {
        uid: user?.uid ?? null,
        email: user?.email ?? null,
        providerIds: user?.providerData.map((provider) => provider.providerId) ?? [],
      });
    },
    (error) => {
      firebaseFailure("auth-state-observer", error);
    }
  );
}

export async function verifyUserProfileDocument(uid = auth.currentUser?.uid): Promise<DiagnosticResult> {
  if (!uid) {
    return {
      ok: false,
      stage: "firestore-read-users",
      message: "Cannot read users/{uid}; no authenticated user is available.",
    };
  }

  try {
    const snap = await withTimeout(
      getDoc(doc(db, "users", uid)),
      FIREBASE_WRITE_TIMEOUT_MS,
      "Reading users profile took too long."
    );
    const details = snap.exists() ? { id: snap.id, ...snap.data() } : null;
    console.group("[Firebase diagnostics] users/{uid} read");
    console.info("Path:", `users/${uid}`);
    console.info("Exists:", snap.exists());
    console.log(details);
    console.groupEnd();

    return {
      ok: snap.exists(),
      stage: "firestore-read-users",
      message: snap.exists() ? "User profile document exists and is readable." : "User profile document does not exist.",
      details,
    };
  } catch (error) {
    return firebaseFailure("firestore-read-users", error);
  }
}

export async function verifyAuthenticatedProfileWrite(uid = auth.currentUser?.uid): Promise<DiagnosticResult> {
  if (!uid) {
    return {
      ok: false,
      stage: "firestore-write-users",
      message: "Cannot write users/{uid}; no authenticated user is available.",
    };
  }

  try {
    const payload = sanitizePayload({
      updatedAt: serverTimestamp(),
      diagnostics: {
        lastVerifiedAt: serverTimestamp(),
        source: "MyKalakarFirebaseDiagnostics.verifyAuthenticatedProfileWrite",
      },
    });

    await withTimeout(
      setDoc(doc(db, "users", uid), payload, { merge: true }),
      FIREBASE_WRITE_TIMEOUT_MS,
      "Writing users profile took too long."
    );

    console.info("[Firebase diagnostics] Firestore write succeeded:", `users/${uid}`);
    return {
      ok: true,
      stage: "firestore-write-users",
      message: "Authenticated Firestore merge write succeeded.",
      details: { path: `users/${uid}` },
    };
  } catch (error) {
    return firebaseFailure("firestore-write-users", error);
  }
}

export async function runFirebaseDiagnostics(): Promise<DiagnosticResult[]> {
  const session = inspectAuthSession();
  const read = await verifyUserProfileDocument();
  const write = await verifyAuthenticatedProfileWrite();
  return [session, read, write];
}

export function installFirebaseDiagnostics() {
  if (typeof window === "undefined") return;

  window.MyKalakarFirebaseDiagnostics = {
    inspectAuthSession,
    attachAuthStateDebug,
    verifyUserProfileDocument,
    verifyAuthenticatedProfileWrite,
    runFirebaseDiagnostics,
  };

  console.info(
    "[Firebase diagnostics] Installed window.MyKalakarFirebaseDiagnostics for local debugging."
  );
}

declare global {
  interface Window {
    MyKalakarFirebaseDiagnostics?: {
      inspectAuthSession: typeof inspectAuthSession;
      attachAuthStateDebug: typeof attachAuthStateDebug;
      verifyUserProfileDocument: typeof verifyUserProfileDocument;
      verifyAuthenticatedProfileWrite: typeof verifyAuthenticatedProfileWrite;
      runFirebaseDiagnostics: typeof runFirebaseDiagnostics;
    };
  }
}
