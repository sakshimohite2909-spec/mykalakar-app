import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { imageRegistry } from "@/services/ImageRegistryService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { uploadImageFile } from "@/lib/uploadService";
import { FIREBASE_WRITE_TIMEOUT_MS, firebaseErrorMessage, logFirebaseError, withTimeout } from "@/lib/firebaseSafe";
import { getArtistArtForms } from "@/constants/artistSystem";
import { getYoutubeVideoId } from "@/lib/youtube";
import { updateUnifiedArtistProfile } from "@/services/UnifiedProfileService";
import {
    DateOfBirthSelect,
    INDIAN_BANK_OPTIONS,
    SearchableLanguageSelect,
    SearchableSingleSelect,
} from "@/components/artist/ArtistProfileInputs";
import {
    Save,
    Loader2,
    Upload,
    User,
    MapPin,
    Music,
    Camera,
    X,
    Plus,
    Trash2,
    Youtube,
    Building2,
    Phone,
} from "lucide-react";

const BIO_MAX_LENGTH = 1000;

export default function ArtistEditProfile() {
    const { artistData, refreshArtistData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);

    // Form state - pre-filled from existing data
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        mobileNumber: "",
        emergencyNumber: "",
        age: "",
        dob: "",
        gender: "",
        bio: "",
        state: "",
        district: "",
        experience: "",
        availability: "available",
        travelWillingness: "local",
        languageSpoken: [] as string[],
        bankName: "",
        ifscCode: "",
        accountNumber: "",
    });

    const [socialLinks, setSocialLinks] = useState<Array<{ platform: string; url: string }>>([]);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

    const profileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const getValidYoutubeLinks = () =>
        socialLinks
            .map((link) => link.url.trim())
            .filter((url) => url && getYoutubeVideoId(url));

    const getCurrentProfileImage = () =>
        artistData?.media?.profilePhoto ||
        artistData?.media?.profileImageUrl ||
        artistData?.profilePhoto ||
        artistData?.profileImageUrl ||
        artistData?.artistProfile?.profileImage ||
        "";

    const getCurrentCoverImage = () =>
        artistData?.media?.coverPhoto ||
        artistData?.media?.coverImageUrl ||
        artistData?.coverPhoto ||
        artistData?.coverImageUrl ||
        artistData?.artistProfile?.coverImage ||
        "";

    const buildArtistProfile = (mediaOverrides: { profileImage?: string; coverImage?: string } = {}) => ({
        artForms: getArtistArtForms(artistData || {}),
        experience: Number(formData.experience) || 0,
        bio: formData.bio || "",
        location: [formData.district || artistData?.district, formData.state || artistData?.state].filter(Boolean).join(", "),
        profileImage: mediaOverrides.profileImage || getCurrentProfileImage(),
        coverImage: mediaOverrides.coverImage || getCurrentCoverImage(),
        youtubeLinks: getValidYoutubeLinks(),
    });

    // Pre-fill form data when artistData loads
    useEffect(() => {
        if (artistData) {
            setFormData({
                name: artistData.name || "",
                phone: artistData.phone || "",
                mobileNumber: artistData.mobileNumber || "",
                emergencyNumber: artistData.emergencyNumber || "",
                age: artistData.age || "",
                dob: artistData.dob || "",
                gender: artistData.gender || "",
                bio: artistData.bio || "",
                state: artistData.state || "",
                district: artistData.district || "",
                experience: artistData.experience || "",
                availability: artistData.availability || "available",
                travelWillingness: artistData.travelWillingness || "local",
                languageSpoken: artistData.languageSpoken || artistData.languagesSpoken || artistData.languages || [],
                bankName: artistData.bankDetails?.bankName || artistData.bankName || "",
                ifscCode: artistData.bankDetails?.ifscCode || artistData.ifscCode || "",
                accountNumber: artistData.bankDetails?.accountNumber || artistData.accountNumber || "",
            });
            const existingYoutubeLinks = Array.isArray(artistData.youtubeLinks)
                ? artistData.youtubeLinks.map((url: string) => ({ platform: "youtube", url }))
                : [];
            setSocialLinks(artistData.socialLinks?.length ? artistData.socialLinks : existingYoutubeLinks.length ? existingYoutubeLinks : [{ platform: "youtube", url: "" }]);
            setGalleryPreviews(
                artistData.media?.galleryPhotos ||
                (Array.isArray(artistData.galleryPhotos) ? artistData.galleryPhotos : []) ||
                []
            );
        }
    }, [artistData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        if (name === "languageSpoken") {
            setFormData((prev) => {
                const languages = prev.languageSpoken.includes(value)
                    ? prev.languageSpoken.filter((l) => l !== value)
                    : [...prev.languageSpoken, value];
                return { ...prev, languageSpoken: languages };
            });
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    // Upload a file to Firebase Storage
    const uploadFile = async (file: File, path: string) => {
        return uploadImageFile(file, path);
    };

    // Handle profile/cover photo change
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "profile" | "cover") => {
        const file = e.target.files?.[0];
        if (!file || !artistData) return;

        setUploadingPhoto(type);
        try {
            const ownerId = artistData.uid || artistData.id;
            if (!ownerId) throw new Error("User not authenticated");
            const url = await uploadFile(file, type === "profile" ? `avatars/${ownerId}` : `covers/${ownerId}`);
            const updateData = type === "profile"
                ? { "media.profilePhoto": url, "media.profileImageUrl": url, "artistProfile.profileImage": url, profilePhoto: url, profileImageUrl: url }
                : { "media.coverPhoto": url, "media.coverImageUrl": url, "artistProfile.coverImage": url, coverPhoto: url, coverImageUrl: url };
            await withTimeout(
                updateUnifiedArtistProfile({
                    artistId: artistData.id,
                    uid: ownerId,
                    artistData: updateData,
                    userData: type === "profile"
                        ? {
                            name: artistData.name || "",
                            email: artistData.email || "",
                            phone: artistData.mobileNumber || artistData.phone || "",
                            profilePhoto: url,
                            artistProfile: buildArtistProfile({ profileImage: url }),
                        }
                        : undefined,
                }),
                FIREBASE_WRITE_TIMEOUT_MS,
                "Could not save this photo."
            );
            await refreshArtistData();
            toast({ title: `${type === "profile" ? "Profile" : "Cover"} photo updated` });
        } catch (error: any) {
            logFirebaseError(error);
            toast({ variant: "destructive", title: "Error", description: firebaseErrorMessage(error, "Could not upload photo.") });
            throw error;
        } finally {
            setUploadingPhoto(null);
        }
    };

    // Handle gallery photo add
    const handleGalleryAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || !artistData) return;

        const currentPhotos = artistData.media?.galleryPhotos ?? (Array.isArray(artistData.galleryPhotos) ? artistData.galleryPhotos : []);
        if (currentPhotos.length + files.length > 10) {
            toast({ variant: "destructive", title: "Limit Exceeded", description: "Maximum 10 gallery photos allowed." });
            return;
        }

        setUploadingPhoto("gallery");
        try {
            const ownerId = artistData.uid || artistData.id;
            if (!ownerId) throw new Error("User not authenticated");
            const newUrls = await Promise.all(Array.from(files).map((f) => uploadFile(f, `galleries/${ownerId}`)));
            const updatedGallery = [...currentPhotos, ...newUrls];
            if (!ownerId) throw new Error("User not authenticated");
            await withTimeout(
                updateUnifiedArtistProfile({
                    artistId: artistData.id,
                    uid: ownerId,
                    artistData: {
                        "media.galleryPhotos": updatedGallery,
                        galleryPhotos: updatedGallery,
                    },
                }),
                FIREBASE_WRITE_TIMEOUT_MS,
                "Could not save gallery photos."
            );
            await refreshArtistData();
            setGalleryPreviews(updatedGallery);
            toast({ title: "Gallery updated" });
        } catch (error: any) {
            logFirebaseError(error);
            toast({ variant: "destructive", title: "Error", description: firebaseErrorMessage(error, "Could not upload gallery photos.") });
            throw error;
        } finally {
            setUploadingPhoto(null);
        }
    };

    // Remove gallery photo
    const removeGalleryPhoto = async (index: number) => {
        if (!artistData) return;
        const updatedGallery = [...(artistData.media?.galleryPhotos ?? (artistData.galleryPhotos as string[]) ?? [])];
        updatedGallery.splice(index, 1);

        try {
            if (!(artistData.uid || artistData.id)) throw new Error("User not authenticated");
            await withTimeout(
                updateUnifiedArtistProfile({
                    artistId: artistData.id,
                    uid: artistData.uid || artistData.id,
                    artistData: {
                        "media.galleryPhotos": updatedGallery,
                        galleryPhotos: updatedGallery,
                    },
                }),
                FIREBASE_WRITE_TIMEOUT_MS,
                "Could not remove this photo."
            );
            await refreshArtistData();
            setGalleryPreviews(updatedGallery);
            toast({ title: "Photo Removed" });
        } catch (error: any) {
            logFirebaseError(error);
            toast({ variant: "destructive", title: "Error", description: firebaseErrorMessage(error, "Could not remove photo.") });
            throw error;
        }
    };

    // Social links
    const addSocialLink = () => setSocialLinks([...socialLinks, { platform: "youtube", url: "" }]);
    const removeSocialLink = (index: number) => setSocialLinks(socialLinks.filter((_, i) => i !== index));
    const updateSocialLink = (index: number, field: string, value: string) => {
        const newLinks = [...socialLinks];
        newLinks[index] = { ...newLinks[index], platform: "youtube", [field]: value };
        setSocialLinks(newLinks);
    };

    // Save all text fields
    const handleSave = async () => {
        if (!artistData) return;
        const invalidYoutubeLink = socialLinks.find((link) => link.url.trim() && !getYoutubeVideoId(link.url));
        if (invalidYoutubeLink) {
            toast({ variant: "destructive", title: "Invalid YouTube link", description: "Please use a valid YouTube video, Shorts, Live, or youtu.be URL." });
            return;
        }
        const validYoutubeLinks = getValidYoutubeLinks();

        setLoading(true);
        try {
            const ownerId = artistData.uid || artistData.id;
            await withTimeout(
                updateUnifiedArtistProfile({
                    artistId: artistData.id,
                    uid: ownerId,
                    artistData: {
                    name: formData.name,
                    phone: formData.phone,
                    mobileNumber: formData.mobileNumber,
                    emergencyNumber: formData.emergencyNumber,
                    age: Number(formData.age),
                    dob: formData.dob,
                    gender: formData.gender,
                    bio: formData.bio,
                    experience: Number(formData.experience),
                    availability: formData.availability,
                    travelWillingness: formData.travelWillingness,
                    languageSpoken: formData.languageSpoken,
                    languages: formData.languageSpoken,
                    languagesSpoken: formData.languageSpoken,
                    "bankDetails.bankName": formData.bankName,
                    "bankDetails.ifscCode": formData.ifscCode,
                    "bankDetails.accountNumber": formData.accountNumber,
                    socialLinks,
                    youtubeLinks: validYoutubeLinks,
                    portfolioUrl: validYoutubeLinks[0] || "",
                    videos: validYoutubeLinks.map((url) => ({ platform: "youtube", url })),
                    artistProfile: buildArtistProfile(),
                    },
                    userData: {
                        name: formData.name,
                        email: artistData.email || "",
                        phone: formData.mobileNumber || formData.phone,
                        profilePhoto: artistData.media?.profilePhoto,
                        artistProfile: buildArtistProfile(),
                    },
                }),
                FIREBASE_WRITE_TIMEOUT_MS,
                "Could not save profile changes."
            );
            await refreshArtistData();
            toast({ title: "Profile updated", description: "Your changes have been saved." });
        } catch (error: any) {
            logFirebaseError(error);
            toast({ variant: "destructive", title: "Error", description: firebaseErrorMessage(error, "Could not save changes.") });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    if (!artistData) return null;

    return (
        <div className="space-y-6 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="font-display text-2xl font-bold mb-1">Edit Your Profile</h1>
                <p className="text-sm text-muted-foreground">Update your information to attract more bookings</p>
            </motion.div>

            {/* Profile & Cover Photos */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <Card>
                    <CardContent className="p-6 space-y-6">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Camera className="h-5 w-5 text-primary" /> Photos
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Profile Photo */}
                            <div>
                                <Label className="text-sm mb-2 block">Profile Photo</Label>
                                <input
                                    type="file"
                                    ref={profileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handlePhotoUpload(e, "profile")}
                                />
                                <div
                                    onClick={() => profileInputRef.current?.click()}
                                    className="relative border-2 border-dashed border-border rounded-xl h-44 cursor-pointer hover:border-primary/50 transition-colors overflow-hidden group"
                                >
                                    <img
                                        src={getCurrentProfileImage() || imageRegistry.getUniqueImage({ category: "Default", type: "ui" })}
                                        className="w-full h-full object-cover"
                                        alt="Profile"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        {uploadingPhoto === "profile" ? (
                                            <Loader2 className="h-8 w-8 text-foreground animate-spin" />
                                        ) : (
                                            <div className="text-foreground text-center">
                                                <Camera className="h-8 w-8 mx-auto mb-1" />
                                                <p className="text-sm">Change Photo</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Cover Photo */}
                            <div>
                                <Label className="text-sm mb-2 block">Cover Photo</Label>
                                <input
                                    type="file"
                                    ref={coverInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handlePhotoUpload(e, "cover")}
                                />
                                <div
                                    onClick={() => coverInputRef.current?.click()}
                                    className="relative border-2 border-dashed border-border rounded-xl h-44 cursor-pointer hover:border-primary/50 transition-colors overflow-hidden group"
                                >
                                    {getCurrentCoverImage() ? (
                                        <img src={getCurrentCoverImage()} className="w-full h-full object-cover" alt="Cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="text-center text-muted-foreground">
                                                <Upload className="h-8 w-8 mx-auto mb-1" />
                                                <p className="text-sm">Upload Cover Photo</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        {uploadingPhoto === "cover" ? (
                                            <Loader2 className="h-8 w-8 text-foreground animate-spin" />
                                        ) : (
                                            <div className="text-foreground text-center">
                                                <Camera className="h-8 w-8 mx-auto mb-1" />
                                                <p className="text-sm">Change Cover</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Gallery Photos */}
                        <div>
                            <Label className="text-sm mb-2 block">Gallery Photos ({galleryPreviews.length}/10)</Label>
                            <input
                                type="file"
                                ref={galleryInputRef}
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={handleGalleryAdd}
                            />
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                {galleryPreviews.map((p, i) => (
                                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border group">
                                        <img src={p} className="w-full h-full object-cover" alt={`Gallery ${i + 1}`} />
                                        <button
                                            type="button"
                                            onClick={() => removeGalleryPhoto(i)}
                                            className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3 text-foreground" />
                                        </button>
                                    </div>
                                ))}
                                {galleryPreviews.length < 10 && (
                                    <div
                                        onClick={() => galleryInputRef.current?.click()}
                                        className="border-2 border-dashed border-border rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                                    >
                                        {uploadingPhoto === "gallery" ? (
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        ) : (
                                            <>
                                                <Plus className="h-6 w-6 text-muted-foreground" />
                                                <span className="text-[10px] text-muted-foreground mt-1">Add</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Personal Information */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" /> Personal Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Artist Name *</Label>
                                <Input name="name" value={formData.name} onChange={handleChange} placeholder="Your full name" />
                            </div>
                            <div>
                                <Label>Phone Number *</Label>
                                <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Mobile Number</Label>
                                <Input name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} placeholder="+91 XXXXX XXXXX" />
                            </div>
                            <div>
                                <Label>Emergency Number</Label>
                                <Input name="emergencyNumber" value={formData.emergencyNumber} onChange={handleChange} placeholder="+91 XXXXX XXXXX" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label>Age</Label>
                                <Input name="age" type="number" value={formData.age} onChange={handleChange} placeholder="25" />
                            </div>
                            <div>
                                <Label>Date of Birth</Label>
                                <DateOfBirthSelect
                                    label=""
                                    value={formData.dob}
                                    onChange={(value) => setFormData((prev) => ({ ...prev, dob: value }))}
                                />
                            </div>
                            <div>
                                <Label>Gender</Label>
                                <Select value={formData.gender} onValueChange={(v) => handleSelectChange("gender", v)}>
                                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Travel Willingness</Label>
                                <Select value={formData.travelWillingness} onValueChange={(v) => handleSelectChange("travelWillingness", v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="local">Local Only</SelectItem>
                                        <SelectItem value="state">Within State</SelectItem>
                                        <SelectItem value="all">All India</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Languages Spoken</Label>
                                <div className="mt-2">
                                    <SearchableLanguageSelect
                                        label=""
                                        values={formData.languageSpoken}
                                        onChange={(values) => setFormData((prev) => ({ ...prev, languageSpoken: values }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Professional Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Music className="h-5 w-5 text-primary" /> Professional Details
                        </h3>

                        <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-1">
                            <p className="text-sm"><strong>Category:</strong> {artistData.category || "Not set"}</p>
                            <p className="text-sm"><strong>Subcategory:</strong> {artistData.subcategory || "Not set"}</p>
                            {artistData.types && artistData.types.length > 0 && (
                                <p className="text-sm"><strong>Types:</strong> {artistData.types.join(", ")}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">⚠️ Category changes require admin approval. Contact support.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>State</Label>
                                <Input name="state" value={formData.state} disabled className="bg-secondary/20" />
                            </div>
                            <div>
                                <Label>District</Label>
                                <Input name="district" value={formData.district} disabled className="bg-secondary/20" />
                            </div>
                            <p className="text-[10px] text-muted-foreground col-span-2 italic">Note: Only admins can change State/District to maintain data integrity.</p>
                        </div>
                        <div>
                            <Label>Experience (Years)</Label>
                            <Input name="experience" type="number" value={formData.experience} onChange={handleChange} placeholder="5" />
                        </div>

                        <div>
                            <Label>Availability</Label>
                            <Select value={formData.availability} onValueChange={(v) => handleSelectChange("availability", v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="available">✅ Available for Booking</SelectItem>
                                    <SelectItem value="busy">🔴 Currently Busy</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Bio / Description</Label>
                            <Textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                placeholder="Tell about your art, experience, and what makes you unique..."
                                maxLength={BIO_MAX_LENGTH}
                                rows={4}
                            />
                            <p className="mt-1 text-xs text-muted-foreground">{formData.bio.length}/{BIO_MAX_LENGTH}</p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Social Links */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Youtube className="h-5 w-5 text-red-500" /> YouTube Links & Portfolio
                        </h3>

                        {socialLinks.map((link, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="flex h-10 w-32 shrink-0 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-semibold text-[#1A1A1A]">
                                    <Youtube className="h-4 w-4 text-red-500" />
                                    YouTube
                                </div>
                                <Input
                                    placeholder="Paste YouTube link here..."
                                    value={link.url}
                                    onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                                    className="text-[#1A1A1A] placeholder:text-slate-500"
                                />
                                {socialLinks.length > 1 && (
                                    <Button variant="ghost" size="icon" onClick={() => removeSocialLink(index)} className="text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={addSocialLink} className="w-full">
                            <Plus className="h-4 w-4 mr-2" /> Add More Links
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Bank Details */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" /> Bank Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <SearchableSingleSelect
                                    label="Bank Name"
                                    value={formData.bankName}
                                    options={INDIAN_BANK_OPTIONS}
                                    placeholder="Search Indian bank"
                                    allowCustom
                                    onChange={(value) => setFormData((prev) => ({ ...prev, bankName: value }))}
                                />
                            </div>
                            <div>
                                <Label>IFSC Code</Label>
                                <Input name="ifscCode" value={formData.ifscCode} onChange={handleChange} placeholder="SBIN00XXXXX" />
                            </div>
                        </div>
                        <div>
                            <Label>Account Number</Label>
                            <Input name="accountNumber" value={formData.accountNumber} onChange={handleChange} placeholder="Enter account number" />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Save Button */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Button
                    onClick={handleSave}
                    className="w-full h-12 gradient-bg border-0 text-primary-foreground font-semibold text-base"
                    disabled={loading}
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" /> Saving Changes...
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Save className="h-5 w-5" /> Save All Changes
                        </div>
                    )}
                </Button>
            </motion.div>
        </div>
    );
}


