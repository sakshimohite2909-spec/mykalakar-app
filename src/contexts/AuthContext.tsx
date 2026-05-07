import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { auth, db } from "@/lib/firebase";
import {
  FIREBASE_WRITE_TIMEOUT_MS,
  firebaseErrorMessage,
  getFirebaseErrorCode,
  withTimeout,
} from "@/lib/firebaseSafe";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  limit,
} from "firebase/firestore";

export type UserRole = "admin" | "artist" | "customer" | "admin_request" | null;
export type ApplicationStatus = "pending" | "approved" | "rejected" | "active" | "hidden" | "suspended" | null;

export interface ArtistData {
  id: string;
  uid: string;
  name: string;
  email: string;
  status: ApplicationStatus;
  applicationId?: string;
  [key: string]: unknown;
}

interface AuthContextType {
  currentUser: User | null;
  artistData: ArtistData | null;
  userRole: UserRole;
  userProfile: Record<string, unknown> | null;
  applicationStatus: ApplicationStatus;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; uid: string; message: string }>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  refreshArtistData: () => void;
  refreshRoleProfile: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [artistData, setArtistData] = useState<ArtistData | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userProfile, setUserProfile] = useState<Record<string, unknown> | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>(null);
  const [loading, setLoading] = useState(true);

  // Refs to hold active Firestore unsubscribe functions
  const unsubUserRef = useRef<(() => void) | null>(null);
  const unsubAdminRef = useRef<(() => void) | null>(null);
  const unsubArtistRef = useRef<(() => void) | null>(null);
  const unsubAppRef = useRef<(() => void) | null>(null);

  // Combined role/profile state refs for cross-listener coordination
  const userDocRef = useRef<Record<string, unknown> | null>(null);
  const adminDocRef = useRef<Record<string, unknown> | null>(null);
  const artistDocRef = useRef<Record<string, unknown> | null>(null);
  const appDocRef = useRef<Record<string, unknown> | null>(null);

  const resolveRoleAndProfile = useCallback(() => {
    const userProfile = userDocRef.current;
    const adminProfile = adminDocRef.current;
    const artistProfile = artistDocRef.current;
    const appProfile = appDocRef.current;

    const adminActive = adminProfile?.status === "active";
    const userAdmin = userProfile?.role === "admin" && userProfile?.status === "active";

    if (adminActive && userAdmin) {
      setUserRole("admin");
      setUserProfile({ ...userProfile, ...adminProfile, role: "admin", status: "active" });
      setArtistData(null);
      setApplicationStatus(null);
      return;
    }

    if (userProfile) {
      const role = userProfile.role as string;
      if (role === "artist" && (userProfile.status === "active" || userProfile.status === "approved")) {
        // Artist is approved — use artistProfile or fallback to userProfile
        const merged = artistProfile
          ? { id: artistProfile.id as string, ...artistProfile }
          : { id: userProfile.id as string, ...userProfile };
        setArtistData(merged as ArtistData);
        setUserRole("artist");
        setUserProfile(userProfile);
        setApplicationStatus("approved");
        return;
      }

      if (role === "admin_request") {
        setUserRole("admin_request");
        setUserProfile(userProfile);
        setArtistData(null);
        setApplicationStatus(null);
        return;
      }

      // Could be a pending artist (role still "artist" but status pending)
      if (role === "artist") {
        // Check application status
        const appStatus = (appProfile?.status ?? "pending") as ApplicationStatus;
        setApplicationStatus(appStatus);

        if (appStatus === "approved" || appStatus === "active") {
          const merged = artistProfile
            ? { id: artistProfile.id as string, ...artistProfile }
            : { id: userProfile.id as string, ...userProfile };
          setArtistData(merged as ArtistData);
          setUserRole("artist");
        } else {
          // Still pending or rejected — use app data as artistData so route guards show correct screen
          const pendingData = appProfile
            ? { id: appProfile.id as string, ...appProfile, status: appStatus }
            : { id: userProfile.id as string, ...userProfile, status: appStatus };
          setArtistData(pendingData as ArtistData);
          setUserRole("artist");
        }
        setUserProfile(userProfile);
        return;
      }

      // Default: customer
      setUserRole("customer");
      setUserProfile(userProfile);
      setArtistData(null);
      setApplicationStatus(null);
      return;
    }

    // No user doc — check if artist doc exists (legacy path)
    if (artistProfile) {
      setUserRole("artist");
      setArtistData({ id: artistProfile.id as string, ...artistProfile } as ArtistData);
      setUserProfile(artistProfile as Record<string, unknown>);
      setApplicationStatus((artistProfile.status as ApplicationStatus) ?? "active");
      return;
    }

    // No data at all
    setUserRole(null);
    setUserProfile(null);
    setArtistData(null);
    setApplicationStatus(null);
  }, []);

  const cleanupListeners = useCallback(() => {
    unsubUserRef.current?.();
    unsubAdminRef.current?.();
    unsubArtistRef.current?.();
    unsubAppRef.current?.();
    unsubUserRef.current = null;
    unsubAdminRef.current = null;
    unsubArtistRef.current = null;
    unsubAppRef.current = null;
    userDocRef.current = null;
    adminDocRef.current = null;
    artistDocRef.current = null;
    appDocRef.current = null;
  }, []);

  const setupListeners = useCallback(
    (uid: string) => {
      cleanupListeners();

      let initialised = false;
      let pendingCount = 4; // 4 listeners to wait for before clearing loading

      const onReady = () => {
        pendingCount--;
        if (pendingCount <= 0 && !initialised) {
          initialised = true;
          resolveRoleAndProfile();
          setLoading(false);
        }
      };

      // ── 1. users/{uid} ─────────────────────────────────────────────────────
      unsubUserRef.current = onSnapshot(
        doc(db, "users", uid),
        (snap) => {
          userDocRef.current = snap.exists() ? { id: snap.id, ...snap.data() } : null;
          if (initialised) resolveRoleAndProfile();
          else onReady();
        },
        (err) => {
          console.warn("users listener error:", err);
          userDocRef.current = null;
          if (initialised) resolveRoleAndProfile();
          else onReady();
        }
      );

      // ── 2. admins/{uid} ────────────────────────────────────────────────────
      unsubAdminRef.current = onSnapshot(
        doc(db, "admins", uid),
        (snap) => {
          adminDocRef.current = snap.exists() ? { id: snap.id, ...snap.data() } : null;
          if (initialised) resolveRoleAndProfile();
          else onReady();
        },
        (err) => {
          console.warn("admins listener error:", err);
          adminDocRef.current = null;
          if (initialised) resolveRoleAndProfile();
          else onReady();
        }
      );

      // ── 3. artists/{uid} ───────────────────────────────────────────────────
      unsubArtistRef.current = onSnapshot(
        doc(db, "artists", uid),
        (snap) => {
          artistDocRef.current = snap.exists() ? { id: snap.id, ...snap.data() } : null;
          if (initialised) resolveRoleAndProfile();
          else onReady();
        },
        (err) => {
          console.warn("artists listener error:", err);
          artistDocRef.current = null;
          if (initialised) resolveRoleAndProfile();
          else onReady();
        }
      );

      // ── 4. artist_applications — query by uid ──────────────────────────────
      const appQuery = query(
        collection(db, "artist_applications"),
        where("uid", "==", uid),
        limit(1)
      );
      unsubAppRef.current = onSnapshot(
        appQuery,
        (snap) => {
          if (!snap.empty) {
            const d = snap.docs[0];
            appDocRef.current = { id: d.id, ...d.data() };
          } else {
            appDocRef.current = null;
          }
          if (initialised) resolveRoleAndProfile();
          else onReady();
        },
        (err) => {
          console.warn("artist_applications listener error:", err);
          appDocRef.current = null;
          if (initialised) resolveRoleAndProfile();
          else onReady();
        }
      );
    },
    [cleanupListeners, resolveRoleAndProfile]
  );

  // ── Auth State Change Listener ──────────────────────────────────────────────
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setLoading(true);
        setupListeners(user.uid);
      } else {
        cleanupListeners();
        setArtistData(null);
        setUserRole(null);
        setUserProfile(null);
        setApplicationStatus(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      cleanupListeners();
    };
  }, [setupListeners, cleanupListeners]);

  // ── Auth Actions ────────────────────────────────────────────────────────────
  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      await withTimeout(
        signInWithEmailAndPassword(auth, email, password),
        FIREBASE_WRITE_TIMEOUT_MS,
        "Login is taking too long. Please check your connection and try again."
      );
      return { success: true, message: "Login successful!" };
    } catch (error: unknown) {
      console.error("Firebase Auth Login Error:", error);
      const errorCode = getFirebaseErrorCode(error);
      let message = firebaseErrorMessage(error, "Login failed. Please try again.");
      if (errorCode === "auth/user-not-found") message = "No account found with this email.";
      else if (errorCode === "auth/wrong-password") message = "Incorrect password.";
      else if (errorCode === "auth/invalid-email") message = "Invalid email address.";
      else if (errorCode === "auth/invalid-credential") message = "Invalid email or password.";
      else if (errorCode === "auth/too-many-requests") message = "Too many attempts. Please try again later.";
      return { success: false, message };
    }
  };

  const register = async (email: string, password: string): Promise<{ success: boolean; uid: string; message: string }> => {
    try {
      const result = await withTimeout(
        createUserWithEmailAndPassword(auth, email, password),
        FIREBASE_WRITE_TIMEOUT_MS,
        "Account creation is taking too long. Please check your connection and try again."
      );
      return { success: true, uid: result.user.uid, message: "Account created!" };
    } catch (error: unknown) {
      console.error("Firebase Auth Registration Error:", error);
      const errorCode = getFirebaseErrorCode(error);
      let message = firebaseErrorMessage(error, "Registration failed. Please try again.");
      if (errorCode === "auth/email-already-in-use") message = "This email is already registered.";
      else if (errorCode === "auth/weak-password") message = "Password must be at least 6 characters.";
      else if (errorCode === "auth/invalid-email") message = "Invalid email address.";
      else if (errorCode === "auth/operation-not-allowed") {
        message = "Email/Password sign-in is not enabled in Firebase. Please enable it in Firebase Console.";
      } else if (errorCode === "auth/configuration-not-found") {
        message = "Firebase Auth configuration is missing.";
      }
      return { success: false, uid: "", message };
    }
  };

  const logout = async () => {
    await withTimeout(
      signOut(auth),
      FIREBASE_WRITE_TIMEOUT_MS,
      "Logout is taking too long. Please refresh the page if it does not complete."
    );
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      if (!currentUser || !currentUser.email) return { success: false, message: "Not logged in." };
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      return { success: true, message: "Password updated successfully!" };
    } catch (error: unknown) {
      if (getFirebaseErrorCode(error) === "auth/wrong-password")
        return { success: false, message: "Current password is incorrect." };
      return { success: false, message: "Could not change password. Please try again." };
    }
  };

  // These are now no-ops since listeners handle everything automatically,
  // but kept for backward compat with existing code that calls them.
  const refreshArtistData = useCallback(() => {
    if (currentUser) resolveRoleAndProfile();
  }, [currentUser, resolveRoleAndProfile]);

  const refreshRoleProfile = useCallback(() => {
    if (currentUser) resolveRoleAndProfile();
  }, [currentUser, resolveRoleAndProfile]);

  const value: AuthContextType = useMemo(
    () => ({
      currentUser,
      artistData,
      userRole,
      userProfile,
      applicationStatus,
      loading,
      login,
      register,
      logout,
      changePassword,
      refreshArtistData,
      refreshRoleProfile,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [artistData, currentUser, loading, userProfile, userRole, applicationStatus]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
