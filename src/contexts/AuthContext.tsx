import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth, db } from "@/lib/firebase";
import {
    FIREBASE_READ_TIMEOUT_MS,
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
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

type UserRole = "admin" | "artist" | "customer" | "admin_request" | null;

interface ArtistData {
    id: string;
    uid: string;
    name: string;
    email: string;
    status: "pending" | "approved" | "rejected" | "active" | "hidden" | "suspended";
    [key: string]: unknown;
}

interface AuthContextType {
    currentUser: User | null;
    artistData: ArtistData | null;
    userRole: UserRole;
    userProfile: Record<string, unknown> | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
    register: (email: string, password: string) => Promise<{ success: boolean; uid: string; message: string }>;
    logout: () => Promise<void>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
    refreshArtistData: () => Promise<void>;
    refreshRoleProfile: () => Promise<void>;
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
    const [loading, setLoading] = useState(true);

    // Fetch artist data from Firestore by UID
    const fetchArtistData = async (uid: string) => {
        try {
            const artistDoc = await withTimeout(
                getDoc(doc(db, "artists", uid)),
                FIREBASE_READ_TIMEOUT_MS,
                "Could not load artist profile."
            );
            if (artistDoc.exists()) {
                setArtistData({ id: artistDoc.id, ...artistDoc.data() } as ArtistData);
                return;
            }

            const qActive = query(collection(db, "artists"), where("uid", "==", uid));
            const snapActive = await withTimeout(
                getDocs(qActive),
                FIREBASE_READ_TIMEOUT_MS,
                "Could not load artist profile."
            );
            if (!snapActive.empty) {
                const docData = snapActive.docs[0];
                setArtistData({ id: docData.id, ...docData.data() } as ArtistData);
                return;
            }

            const qApp = query(collection(db, "artist_applications"), where("uid", "==", uid));
            const snapApp = await withTimeout(
                getDocs(qApp),
                FIREBASE_READ_TIMEOUT_MS,
                "Could not load artist application."
            );
            if (!snapApp.empty) {
                const docData = snapApp.docs[0];
                setArtistData({ id: docData.id, ...docData.data() } as ArtistData);
            } else {
                setArtistData(null);
            }
        } catch (error) {
            console.error("Error fetching artist data:", error);
            setArtistData(null);
        }
    };

    const fetchRoleProfile = async (uid: string) => {
        try {
            const adminDoc = await withTimeout(
                getDoc(doc(db, "admins", uid)),
                FIREBASE_READ_TIMEOUT_MS,
                "Could not load admin profile."
            );
            if (adminDoc.exists()) {
                setUserRole("admin");
                setUserProfile({ id: adminDoc.id, ...adminDoc.data() });
                return;
            }

            const artistDoc = await withTimeout(
                getDoc(doc(db, "artists", uid)),
                FIREBASE_READ_TIMEOUT_MS,
                "Could not load artist profile."
            );
            if (artistDoc.exists()) {
                setUserRole("artist");
                setUserProfile({ id: artistDoc.id, ...artistDoc.data() });
                return;
            }

            const userDoc = await withTimeout(
                getDoc(doc(db, "users", uid)),
                FIREBASE_READ_TIMEOUT_MS,
                "Could not load user profile."
            );
            if (userDoc.exists()) {
                const profile = { id: userDoc.id, ...userDoc.data() } as Record<string, unknown>;
                const role = profile.role === "artist"
                    ? "artist"
                    : profile.role === "admin_request"
                        ? "admin_request"
                        : "customer";
                setUserRole(role);
                setUserProfile(profile);
                return;
            }

            setUserRole(null);
            setUserProfile(null);
        } catch (error) {
            console.error("Error fetching role profile:", error);
            setUserRole(null);
            setUserProfile(null);
        }
    };

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setLoading(true);
            setCurrentUser(user);
            if (user) {
                try {
                    await withTimeout(
                        Promise.allSettled([fetchArtistData(user.uid), fetchRoleProfile(user.uid)]),
                        FIREBASE_READ_TIMEOUT_MS + 3000,
                        "Profile loading took too long."
                    );
                } catch (error) {
                    console.warn("Auth profile load timed out:", error);
                }
            } else {
                setArtistData(null);
                setUserRole(null);
                setUserProfile(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    // Login function
    const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
        try {
            const result = await withTimeout(
                signInWithEmailAndPassword(auth, email, password),
                FIREBASE_WRITE_TIMEOUT_MS,
                "Login is taking too long. Please check your connection and try again."
            );
            try {
                await withTimeout(
                    Promise.allSettled([fetchArtistData(result.user.uid), fetchRoleProfile(result.user.uid)]),
                    FIREBASE_READ_TIMEOUT_MS + 3000,
                    "Profile loading took too long."
                );
            } catch (profileError) {
                console.warn("Login profile load timed out:", profileError);
            }
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

    // Register function (creates Firebase Auth account)
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
                message = "Firebase Auth configuration is missing. Please ensure you have clicked 'Get Started' in the Firebase Authentication console and enabled Email/Password.";
            }
            return { success: false, uid: "", message };
        }
    };

    // Logout function
    const logout = async () => {
        await withTimeout(
            signOut(auth),
            FIREBASE_WRITE_TIMEOUT_MS,
            "Logout is taking too long. Please refresh the page if it does not complete."
        );
        setArtistData(null);
        setUserRole(null);
        setUserProfile(null);
    };

    // Change password
    const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
        try {
            if (!currentUser || !currentUser.email) return { success: false, message: "Not logged in." };
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
            await reauthenticateWithCredential(currentUser, credential);
            await updatePassword(currentUser, newPassword);
            return { success: true, message: "Password updated successfully!" };
        } catch (error: unknown) {
            if (getFirebaseErrorCode(error) === "auth/wrong-password") return { success: false, message: "Current password is incorrect." };
            return { success: false, message: "Could not change password. Please try again." };
        }
    };

    // Refresh artist data
    const refreshArtistData = async () => {
        if (currentUser) {
            await fetchArtistData(currentUser.uid);
        }
    };

    const refreshRoleProfile = async () => {
        if (currentUser) {
            await fetchRoleProfile(currentUser.uid);
        }
    };

    const value: AuthContextType = {
        currentUser,
        artistData,
        userRole,
        userProfile,
        loading,
        login,
        register,
        logout,
        changePassword,
        refreshArtistData,
        refreshRoleProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
