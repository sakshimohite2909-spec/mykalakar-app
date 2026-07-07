import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { app, auth, db, storage } from "@/lib/firebase";

export const ARTISTS_COLLECTION = "artists";
export const ACCEPTED_PROFILE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_PROFILE_IMAGE_SIZE_BYTES = 12 * 1024 * 1024;

const UPLOAD_TIMEOUT_MS = 120000;

const FIREBASE_ERROR_MESSAGES = {
  "auth/email-already-in-use": "This email is already registered. Please sign in or use another email.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/network-request-failed": "Firebase Auth could not be reached. Please check your internet connection.",
  "auth/operation-not-allowed": "Email and password sign-in is not enabled in Firebase.",
  "auth/weak-password": "Please choose a stronger password.",
  "cancelled": "The Firebase request was cancelled. Please try again.",
  "deadline-exceeded": "Firebase took too long to respond. Please try again.",
  "not-found": "No artist profile was found for this ID.",
  "permission-denied": "You do not have permission to perform this action.",
  "storage/canceled": "The image upload was cancelled. Please try again.",
  "storage/retry-limit-exceeded": "The image upload could not finish. Please try a smaller image or stronger connection.",
  "storage/unauthorized": "You do not have permission to upload this artist image.",
  "unauthenticated": "Please sign in before continuing.",
  "unavailable": "Firebase is temporarily unavailable. Please try again in a moment.",
};

export class FirebaseServiceError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = "FirebaseServiceError";
    this.code = originalError?.code || "";
    this.originalError = originalError;
  }
}

function getErrorCode(error) {
  if (error && typeof error === "object" && "code" in error) {
    return String(error.code);
  }

  return "";
}

export function toHumanFirebaseError(error, fallbackMessage) {
  if (error instanceof FirebaseServiceError) return error.message;

  const code = getErrorCode(error);
  if (code && FIREBASE_ERROR_MESSAGES[code]) return FIREBASE_ERROR_MESSAGES[code];

  if (error instanceof Error && error.message) return error.message;
  return fallbackMessage;
}

function throwServiceError(error, fallbackMessage) {
  throw new FirebaseServiceError(toHumanFirebaseError(error, fallbackMessage), error);
}

export function ensureFirebaseServicesReady() {
  if (!app || !db || !storage || !auth) {
    throw new FirebaseServiceError(
      "Firebase is not initialized. Check your Firebase environment variables and app bootstrap."
    );
  }
}

function isBrowserFile(value) {
  return typeof File !== "undefined" && value instanceof File;
}

function isFirestoreTimestamp(value) {
  return value && typeof value === "object" && typeof value.toDate === "function";
}

function isPlainObject(value) {
  if (!value || typeof value !== "object") return false;
  if (value instanceof Date) return false;
  if (isBrowserFile(value)) return false;
  if (isFirestoreTimestamp(value)) return false;
  return Object.getPrototypeOf(value) === Object.prototype;
}

function sanitizeFileName(fileName) {
  const safeName = String(fileName || "artist-profile.jpg")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 96);

  return safeName || "artist-profile.jpg";
}

function stripUndefinedDeep(value) {
  if (value === undefined) return undefined;
  if (isBrowserFile(value)) return undefined;
  if (value instanceof Date || isFirestoreTimestamp(value)) return value;

  if (Array.isArray(value)) {
    return value.map(stripUndefinedDeep).filter((entry) => entry !== undefined);
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, entryValue]) => [key, stripUndefinedDeep(entryValue)])
        .filter(([, entryValue]) => entryValue !== undefined)
    );
  }

  return value;
}

function omitUnsafeProfileFields(data) {
  const {
    confirmPassword,
    password,
    profileImage,
    profileImageFile,
    profilePhotoFile,
    ...safeData
  } = data || {};

  return safeData;
}

function sanitizeProfilePayload(data) {
  return stripUndefinedDeep(omitUnsafeProfileFields(data));
}

export function validateProfileImageFile(file) {
  if (!file) {
    return { valid: false, message: "Profile image is required." };
  }

  if (!isBrowserFile(file)) {
    return { valid: false, message: "Please select a valid profile image file." };
  }

  if (!ACCEPTED_PROFILE_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, message: "Upload a JPG, PNG, or WebP image." };
  }

  if (file.size > MAX_PROFILE_IMAGE_SIZE_BYTES) {
    return { valid: false, message: "Image must be 12MB or smaller." };
  }

  return { valid: true, message: "" };
}

export function createArtistDocumentId() {
  ensureFirebaseServicesReady();
  return doc(collection(db, ARTISTS_COLLECTION)).id;
}

export async function uploadArtistProfileImage(file, artistId, onProgress) {
  try {
    ensureFirebaseServicesReady();

    if (!artistId) {
      throw new Error("Artist ID is required before uploading a profile image.");
    }

    const validation = validateProfileImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    const safeFileName = sanitizeFileName(file.name);
    const storagePath = `artists/${artistId}/profile/${Date.now()}_${safeFileName}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        artistId,
        uploadPurpose: "artist-profile",
      },
    });

    return await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        uploadTask.cancel();
        reject(new Error("The image upload took too long. Please try a smaller file or stronger connection."));
      }, UPLOAD_TIMEOUT_MS);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          if (typeof onProgress === "function") {
            const progress = snapshot.totalBytes
              ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
              : 0;

            onProgress({
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              progress,
              state: snapshot.state,
            });
          }
        },
        (error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            clearTimeout(timeoutId);
            resolve({
              downloadUrl,
              storagePath: uploadTask.snapshot.ref.fullPath,
            });
          } catch (error) {
            clearTimeout(timeoutId);
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    throwServiceError(error, "Could not upload the profile image to Firebase Storage.");
  }
}

export async function saveNewArtistProfile(profileData, artistId) {
  try {
    ensureFirebaseServicesReady();

    const resolvedArtistId = artistId || profileData?.artistId || profileData?.uid || createArtistDocumentId();
    const artistRef = doc(db, ARTISTS_COLLECTION, resolvedArtistId);
    const safeData = sanitizeProfilePayload(profileData);
    const displayName = safeData.stageName || safeData.fullName || safeData.name || "MyKalakar Artist";
    const discipline = safeData.discipline || safeData.mainCategory || "";
    const artForm = safeData.artForm || safeData.category || safeData.subcategory || "";

    const payload = {
      ...safeData,
      id: safeData.id || resolvedArtistId,
      uid: safeData.uid || resolvedArtistId,
      artistId: resolvedArtistId,
      name: displayName,
      displayName,
      privateEmail: safeData.privateEmail || safeData.email || "",
      phone: safeData.phone || safeData.phoneNumber || safeData.mobileNumber || "",
      mobileNumber: safeData.mobileNumber || safeData.phoneNumber || "",
      mainCategory: discipline,
      discipline,
      category: artForm,
      artForm,
      subcategory: artForm,
      status: safeData.status || "pending",
      applicationStatus: safeData.applicationStatus || "pending",
      verified: Boolean(safeData.verified),
      createdAt: safeData.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(artistRef, stripUndefinedDeep(payload));

    return {
      artistId: resolvedArtistId,
      documentId: resolvedArtistId,
      ...payload,
    };
  } catch (error) {
    throwServiceError(error, "Could not save the artist profile to Firestore.");
  }
}

export async function fetchCompleteArtistProfileById(artistId) {
  try {
    ensureFirebaseServicesReady();

    if (!artistId) {
      throw new Error("Artist ID is required.");
    }

    const snapshot = await getDoc(doc(db, ARTISTS_COLLECTION, artistId));

    if (!snapshot.exists()) {
      throw new Error("No artist profile was found for this ID.");
    }

    const data = snapshot.data();

    return {
      documentId: snapshot.id,
      id: data.id || snapshot.id,
      ...data,
    };
  } catch (error) {
    throwServiceError(error, "Could not load the artist profile from Firestore.");
  }
}

export async function updateExistingArtistProfile(artistId, updatedFields) {
  try {
    ensureFirebaseServicesReady();

    if (!artistId) {
      throw new Error("Artist ID is required.");
    }

    const safeFields = sanitizeProfilePayload(updatedFields);
    delete safeFields.documentId;

    const payload = stripUndefinedDeep({
      ...safeFields,
      adminLastSavedAt: serverTimestamp(),
      ...(Object.prototype.hasOwnProperty.call(safeFields, "updatedAt")
        ? {}
        : { updatedAt: serverTimestamp() }),
    });

    await updateDoc(doc(db, ARTISTS_COLLECTION, artistId), payload);

    return {
      artistId,
      updatedFields: safeFields,
      clientSavedAt: new Date().toISOString(),
    };
  } catch (error) {
    throwServiceError(error, "Could not update the artist profile in Firestore.");
  }
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

  if (data?.email && data?.password) {
    const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);

    return {
      artistId: credential.user.uid,
      email: credential.user.email || data.email,
      createdAuthUser: true,
    };
  }

  return {
    artistId: createArtistDocumentId(),
    email: data?.email || "",
    createdAuthUser: false,
  };
}

export async function registerArtistProfile(formData, imageFile, onProgress) {
  try {
    ensureFirebaseServicesReady();

    const identity = await resolveArtistIdentity(formData);
    const uploadedImage = await uploadArtistProfileImage(imageFile, identity.artistId, onProgress);
    const safeData = sanitizeProfilePayload(formData);

    const savedProfile = await saveNewArtistProfile(
      {
        ...safeData,
        email: identity.email || safeData.email || "",
        privateEmail: identity.email || safeData.email || "",
        profileImageUrl: uploadedImage.downloadUrl,
        imageUrl: uploadedImage.downloadUrl,
        profilePhoto: uploadedImage.downloadUrl,
        media: {
          ...(safeData.media || {}),
          profilePhoto: uploadedImage.downloadUrl,
          profileImageUrl: uploadedImage.downloadUrl,
          profileStoragePath: uploadedImage.storagePath,
        },
        storage: {
          ...(safeData.storage || {}),
          profileImagePath: uploadedImage.storagePath,
        },
        createdAuthUser: identity.createdAuthUser,
      },
      identity.artistId
    );

    return {
      artistId: identity.artistId,
      profile: savedProfile,
      profileImageUrl: uploadedImage.downloadUrl,
      storagePath: uploadedImage.storagePath,
    };
  } catch (error) {
    throwServiceError(error, "Could not complete artist registration. Please try again.");
  }
}

export const fetchAdminArtistProfile = fetchCompleteArtistProfileById;
export const updateAdminArtistProfile = updateExistingArtistProfile;
