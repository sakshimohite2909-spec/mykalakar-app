import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";

const ARTISTS_COLLECTION = "artists";
const UPLOAD_TIMEOUT_MS = 45000;

const ERROR_MESSAGES = {
  "auth/email-already-in-use": "This email is already registered. Please log in or use another email.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/weak-password": "Please choose a stronger password.",
  "auth/network-request-failed": "Firebase Auth could not be reached. Please check your internet connection.",
  "auth/operation-not-allowed": "Email and password sign-in is not enabled in Firebase.",
  "permission-denied": "You do not have permission to perform this action.",
  unauthenticated: "Please sign in before continuing.",
  unavailable: "Firebase is temporarily unavailable. Please try again in a moment.",
  "deadline-exceeded": "Firebase took too long to respond. Please try again.",
  "storage/unauthorized": "You do not have permission to upload this artist image.",
  "storage/canceled": "The image upload was cancelled. Please try again.",
  "storage/retry-limit-exceeded": "The image upload could not finish. Please try a smaller image or stronger connection.",
};

class FirebaseServiceError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = "FirebaseServiceError";
    this.originalError = originalError;
    this.code = originalError?.code;
  }
}

function getErrorCode(error) {
  return typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
}

function toHumanFirebaseError(error, fallback) {
  const code = getErrorCode(error);
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  if (error instanceof FirebaseServiceError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function throwServiceError(error, fallback) {
  throw new FirebaseServiceError(toHumanFirebaseError(error, fallback), error);
}

function sanitizeFileName(fileName) {
  return String(fileName || "artist-profile.jpg")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 96);
}

function stripUndefinedDeep(value) {
  if (Array.isArray(value)) {
    return value.map(stripUndefinedDeep).filter((item) => item !== undefined);
  }

  if (value && typeof value === "object") {
    if (value instanceof File) return undefined;
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, entryValue]) => [key, stripUndefinedDeep(entryValue)])
        .filter(([, entryValue]) => entryValue !== undefined)
    );
  }

  return value === undefined ? undefined : value;
}

function sanitizePayload(payload) {
  return stripUndefinedDeep(payload);
}

function omitSensitiveFields(data) {
  const {
    password,
    confirmPassword,
    profileImage,
    profilePhotoFile,
    ...safeData
  } = data || {};

  return safeData;
}

function uploadWithTimeout(uploadTask) {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      uploadTask.cancel();
      reject(new Error("The image upload took too long. Please try a smaller file or stronger connection."));
    }, UPLOAD_TIMEOUT_MS);

    uploadTask.on(
      "state_changed",
      undefined,
      (error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          window.clearTimeout(timeoutId);
          resolve({
            downloadUrl,
            fullPath: uploadTask.snapshot.ref.fullPath,
          });
        } catch (error) {
          window.clearTimeout(timeoutId);
          reject(error);
        }
      }
    );
  });
}

async function uploadArtistProfileImage(artistId, file) {
  if (!file) {
    throw new Error("A profile image is required.");
  }

  if (!(file instanceof File)) {
    throw new Error("Please select a valid profile image.");
  }

  const safeFileName = sanitizeFileName(file.name);
  const storageRef = ref(storage, `artists/${artistId}/profile_${safeFileName}`);
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type || "image/jpeg",
    customMetadata: {
      artistId,
      uploadPurpose: "artist-profile",
    },
  });

  return uploadWithTimeout(uploadTask);
}

async function resolveArtistIdentity(data) {
  const suppliedArtistId = data?.artistId || data?.uid;

  if (suppliedArtistId) {
    return {
      artistId: suppliedArtistId,
      email: data?.email || auth.currentUser?.email || "",
      createdAuthUser: false,
    };
  }

  if (!data?.email || !data?.password) {
    throw new Error("Email and password are required to create an artist account.");
  }

  const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);

  return {
    artistId: credential.user.uid,
    email: credential.user.email || data.email,
    createdAuthUser: true,
  };
}

export async function registerArtistProfile(data, file) {
  try {
    const identity = await resolveArtistIdentity(data);
    const uploadedProfile = await uploadArtistProfileImage(identity.artistId, file);
    const safeData = omitSensitiveFields(data);
    const displayName = safeData.stageName || safeData.fullName || safeData.name || "MyKalakar Artist";
    const normalizedDiscipline = safeData.discipline || safeData.mainCategory || "";
    const normalizedArtForm = safeData.artForm || safeData.category || safeData.subcategory || "";

    const payload = sanitizePayload({
      ...safeData,
      id: identity.artistId,
      uid: identity.artistId,
      artistId: identity.artistId,
      name: displayName,
      displayName,
      email: identity.email,
      privateEmail: identity.email,
      phone: safeData.phoneNumber || safeData.phone || "",
      mobileNumber: safeData.phoneNumber || safeData.mobileNumber || "",
      mainCategory: normalizedDiscipline,
      discipline: normalizedDiscipline,
      category: normalizedArtForm,
      artForm: normalizedArtForm,
      subcategory: normalizedArtForm,
      status: safeData.status || "pending",
      applicationStatus: safeData.applicationStatus || "pending",
      verified: Boolean(safeData.verified),
      profilePhoto: uploadedProfile.downloadUrl,
      profileImageUrl: uploadedProfile.downloadUrl,
      media: {
        ...(safeData.media || {}),
        profilePhoto: uploadedProfile.downloadUrl,
        profileStoragePath: uploadedProfile.fullPath,
      },
      storage: {
        ...(safeData.storage || {}),
        profileImagePath: uploadedProfile.fullPath,
      },
      createdAuthUser: identity.createdAuthUser,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, ARTISTS_COLLECTION, identity.artistId), payload);

    return {
      artistId: identity.artistId,
      profileImageUrl: uploadedProfile.downloadUrl,
      storagePath: uploadedProfile.fullPath,
    };
  } catch (error) {
    throwServiceError(error, "Could not complete artist registration. Please try again.");
  }
}

export async function fetchAdminArtistProfile(artistId) {
  try {
    if (!artistId) {
      throw new Error("Artist ID is required.");
    }

    const snapshot = await getDoc(doc(db, ARTISTS_COLLECTION, artistId));

    if (!snapshot.exists()) {
      throw new Error("No artist profile was found for this ID.");
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    };
  } catch (error) {
    throwServiceError(error, "Could not load the artist profile.");
  }
}

export async function updateAdminArtistProfile(artistId, updatedFields) {
  try {
    if (!artistId) {
      throw new Error("Artist ID is required.");
    }

    const { id, createdAt, updatedAt, ...fields } = updatedFields || {};
    const sanitizedFields = sanitizePayload(fields);

    await updateDoc(doc(db, ARTISTS_COLLECTION, artistId), {
      ...sanitizedFields,
      updatedAt: serverTimestamp(),
    });

    return {
      ...sanitizedFields,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    throwServiceError(error, "Could not update the artist profile.");
  }
}

export { FirebaseServiceError, toHumanFirebaseError };
