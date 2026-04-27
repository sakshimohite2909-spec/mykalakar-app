import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth, db } from "@/lib/firebase";
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
import { doc, getDoc, collection, query, where, getDocs, setDoc } from "firebase/firestore";

type UserRole = "admin" | "artist" | "customer" | null;

interface ArtistData {
    id: string;
    uid: string;
    name: string;
    email: string;
    status: "pending" | "approved" | "rejected";
    [key: string]: any;
}

interface AuthContextType {
    currentUser: User | null;
    artistData: ArtistData | null;
    userRole: UserRole;
    userProfile: Record<string, any> | null;
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
    const [userProfile, setUserProfile] = useState<Record<string, any> | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch artist data from Firestore by UID
    const fetchArtistData = async (uid: string) => {
        try {
            const q = query(collection(db, "pending_registrations"), where("uid", "==", uid));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const docData = snapshot.docs[0];
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
            const adminDoc = await getDoc(doc(db, "admins", uid));
            if (adminDoc.exists()) {
                setUserRole("admin");
                setUserProfile({ id: adminDoc.id, ...adminDoc.data() });
                return;
            }

            const artistDoc = await getDoc(doc(db, "artists", uid));
            if (artistDoc.exists()) {
                setUserRole("artist");
                setUserProfile({ id: artistDoc.id, ...artistDoc.data() });
                return;
            }

            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                setUserRole("customer");
                setUserProfile({ id: userDoc.id, ...userDoc.data() });
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

    const syncUserToFirestore = async (user: User) => {
        try {
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) {
                await setDoc(userRef, {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || user.email?.split('@')[0] || "User",
                    createdAt: new Date().toISOString()
                }, { merge: true });
            }
        } catch (error) {
            console.error("Error syncing user to Firestore:", error);
        }
    };

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                syncUserToFirestore(user);
                await Promise.all([fetchArtistData(user.uid), fetchRoleProfile(user.uid)]);
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
            const result = await signInWithEmailAndPassword(auth, email, password);
            await fetchArtistData(result.user.uid);
            return { success: true, message: "Login successful!" };
        } catch (error: any) {
            console.error("Firebase Auth Login Error:", error);
            let message = "Login failed. Please try again.";
            if (error.code === "auth/user-not-found") message = "No account found with this email.";
            else if (error.code === "auth/wrong-password") message = "Incorrect password.";
            else if (error.code === "auth/invalid-email") message = "Invalid email address.";
            else if (error.code === "auth/invalid-credential") message = "Invalid email or password.";
            else if (error.code === "auth/too-many-requests") message = "Too many attempts. Please try again later.";
            return { success: false, message };
        }
    };

    // Register function (creates Firebase Auth account)
    const register = async (email: string, password: string): Promise<{ success: boolean; uid: string; message: string }> => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            return { success: true, uid: result.user.uid, message: "Account created!" };
        } catch (error: any) {
            console.error("Firebase Auth Registration Error:", error);
            let message = "Registration failed. Please try again.";
            if (error.code === "auth/email-already-in-use") message = "This email is already registered.";
            else if (error.code === "auth/weak-password") message = "Password must be at least 6 characters.";
            else if (error.code === "auth/invalid-email") message = "Invalid email address.";
            else if (error.code === "auth/operation-not-allowed") {
                message = "Email/Password sign-in is not enabled in Firebase. Please enable it in Firebase Console.";
            } else if (error.code === "auth/configuration-not-found") {
                message = "Firebase Auth configuration is missing. Please ensure you have clicked 'Get Started' in the Firebase Authentication console and enabled Email/Password.";
            }
            return { success: false, uid: "", message };
        }
    };

    // Logout function
    const logout = async () => {
        await signOut(auth);
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
        } catch (error: any) {
            if (error.code === "auth/wrong-password") return { success: false, message: "Current password is incorrect." };
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
