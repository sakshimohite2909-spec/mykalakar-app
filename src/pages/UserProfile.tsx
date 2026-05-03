import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, Eye, LayoutDashboard, Loader2, Save, ShieldCheck, UserCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { uploadImageFile } from "@/lib/uploadService";
import { FIREBASE_WRITE_TIMEOUT_MS, firebaseErrorMessage, withTimeout } from "@/lib/firebaseSafe";

function textValue(source: Record<string, unknown> | null, key: string) {
  const value = source?.[key];
  return typeof value === "string" ? value : "";
}

export default function UserProfile() {
  const { currentUser, userProfile, userRole, artistData, refreshRoleProfile, refreshArtistData } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [form, setForm] = useState({
    name: "",
    username: "",
    phone: "",
  });

  const roleLabel = userRole === "admin"
    ? "Admin"
    : userRole === "artist"
      ? artistData?.status === "pending" ? "Artist Pending Review" : "Artist"
      : userRole === "admin_request"
        ? "Admin Request Pending"
        : "Customer";

  const profilePhoto = useMemo(() => {
    if (photoPreview) return photoPreview;
    const artistMedia = typeof artistData?.media === "object" && artistData.media !== null
      ? artistData.media as Record<string, unknown>
      : null;
    return (
      (typeof artistMedia?.profilePhoto === "string" ? artistMedia.profilePhoto : "") ||
      (typeof artistData?.profilePhoto === "string" ? artistData.profilePhoto : "") ||
      textValue(userProfile, "profilePhoto") ||
      ""
    );
  }, [artistData, photoPreview, userProfile]);

  useEffect(() => {
    setForm({
      name: artistData?.name || textValue(userProfile, "name") || currentUser?.displayName || "",
      username: textValue(userProfile, "username") || currentUser?.email?.split("@")[0] || "",
      phone: artistData?.mobileNumber || artistData?.phone || textValue(userProfile, "phone") || "",
    });
  }, [artistData, currentUser, userProfile]);

  useEffect(() => {
    return () => {
      if (photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handlePhotoChange = (file: File | null) => {
    if (!file) return;
    if (photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);

    try {
      const uploadedPhoto = photoFile
        ? await uploadImageFile(photoFile, `avatars/${currentUser.uid}`)
        : profilePhoto;

      if (userRole === "admin") {
        await withTimeout(
          setDoc(doc(db, "admins", currentUser.uid), {
            uid: currentUser.uid,
            name: form.name.trim(),
            username: form.username.trim().toLowerCase(),
            email: currentUser.email || "",
            role: "admin",
            status: textValue(userProfile, "status") || "active",
            profilePhoto: uploadedPhoto,
            updatedAt: serverTimestamp(),
          }, { merge: true }),
          FIREBASE_WRITE_TIMEOUT_MS,
          "Could not save admin profile."
        );
      } else {
        const role = userRole === "artist" ? "artist" : userRole === "admin_request" ? "admin_request" : "customer";
        const status = userRole === "artist"
          ? artistData?.status === "pending" ? "pending" : "active"
          : userRole === "admin_request"
            ? "pending"
          : textValue(userProfile, "status") || "active";

        await withTimeout(
          setDoc(doc(db, "users", currentUser.uid), {
            uid: currentUser.uid,
            name: form.name.trim(),
            username: form.username.trim().toLowerCase(),
            email: currentUser.email || "",
            phone: form.phone.trim(),
            role,
            status,
            profilePhoto: uploadedPhoto,
            updatedAt: serverTimestamp(),
          }, { merge: true }),
          FIREBASE_WRITE_TIMEOUT_MS,
          "Could not save user profile."
        );
      }

      await Promise.allSettled([refreshRoleProfile(), refreshArtistData()]);
      setPhotoFile(null);
      toast({ title: "Profile saved", description: "Your account profile is up to date." });
    } catch (error) {
      toast({ variant: "destructive", title: "Profile not saved", description: firebaseErrorMessage(error, "Could not save your profile.") });
    } finally {
      setSaving(false);
    }
  };

  const canViewPublicArtist = artistData && (artistData.status === "active" || artistData.status === "approved");

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <main className="container mx-auto px-4 pb-16 pt-28">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge variant="secondary" className="mb-3 border-orange-200 bg-orange-50 text-orange-700">
                {roleLabel}
              </Badge>
              <h1 className="font-display text-3xl font-black text-slate-950">My Profile</h1>
              <p className="mt-1 text-sm font-medium text-slate-500">{currentUser?.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {userRole === "admin" ? (
                <Link to="/admin">
                  <Button variant="outline"><ShieldCheck className="mr-2 h-4 w-4" /> Admin Console</Button>
                </Link>
              ) : null}
              {userRole === "artist" ? (
                <Link to="/artist/dashboard">
                  <Button variant="outline"><LayoutDashboard className="mr-2 h-4 w-4" /> Artist Dashboard</Button>
                </Link>
              ) : null}
              {canViewPublicArtist ? (
                <Link to={`/artist/${artistData.uid || artistData.id}`}>
                  <Button className="gradient-bg border-0 text-primary-foreground"><Eye className="mr-2 h-4 w-4" /> View Public Page</Button>
                </Link>
              ) : null}
            </div>
          </div>

          <Card className="border-white/70 bg-white/75 shadow-xl shadow-orange-900/5 backdrop-blur-2xl">
            <CardContent className="grid gap-8 p-6 md:grid-cols-[220px_1fr] md:p-8">
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handlePhotoChange(event.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-orange-100 bg-orange-50"
                >
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <UserCircle className="h-16 w-16 text-orange-300" />
                    </div>
                  )}
                  <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-slate-950/75 px-3 py-3 text-xs font-black uppercase tracking-widest text-white opacity-0 transition group-hover:opacity-100">
                    <Camera className="h-4 w-4" /> Change Photo
                  </span>
                </button>
              </div>

              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">Full Name</Label>
                    <Input id="profile-name" value={form.name} onChange={(event) => updateField("name", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-username">Username</Label>
                    <Input id="profile-username" value={form.username} onChange={(event) => updateField("username", event.target.value)} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profile-phone">Phone</Label>
                    <Input id="profile-phone" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-role">Access</Label>
                    <Input id="profile-role" value={roleLabel} disabled className="bg-slate-50 font-semibold" />
                  </div>
                </div>

                <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="h-12 w-full gradient-bg border-0 font-bold text-primary-foreground md:w-auto md:px-8">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
