import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { db, storage } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
    Globe,
    Youtube,
    Building2,
    Phone,
} from "lucide-react";

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
                languageSpoken: artistData.languageSpoken || [],
                bankName: artistData.bankName || "",
                ifscCode: artistData.ifscCode || "",
                accountNumber: artistData.accountNumber || "",
            });
            setSocialLinks(artistData.socialLinks || [{ platform: "youtube", url: "" }]);
            setGalleryPreviews(artistData.galleryPhotos || []);
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
        const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    };

    // Handle profile/cover photo change
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "profile" | "cover") => {
        const file = e.target.files?.[0];
        if (!file || !artistData) return;

        setUploadingPhoto(type);
        try {
            const url = await uploadFile(file, type === "profile" ? "profiles" : "covers");
            const updateField = type === "profile" ? "profilePhoto" : "coverPhoto";
            await updateDoc(doc(db, "pending_registrations", artistData.id), {
                [updateField]: url,
                updatedAt: serverTimestamp(),
            });
            await refreshArtistData();
            toast({ title: `${type === "profile" ? "Profile" : "Cover"} Photo Updated! 📸` });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not upload photo." });
        } finally {
            setUploadingPhoto(null);
        }
    };

    // Handle gallery photo add
    const handleGalleryAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || !artistData) return;

        const currentPhotos = artistData.galleryPhotos || [];
        if (currentPhotos.length + files.length > 10) {
            toast({ variant: "destructive", title: "Limit Exceeded", description: "Maximum 10 gallery photos allowed." });
            return;
        }

        setUploadingPhoto("gallery");
        try {
            const newUrls = await Promise.all(Array.from(files).map((f) => uploadFile(f, "galleries")));
            const updatedGallery = [...currentPhotos, ...newUrls];
            await updateDoc(doc(db, "pending_registrations", artistData.id), {
                galleryPhotos: updatedGallery,
                updatedAt: serverTimestamp(),
            });
            await refreshArtistData();
            setGalleryPreviews(updatedGallery);
            toast({ title: "Gallery Updated! 🖼️" });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not upload gallery photos." });
        } finally {
            setUploadingPhoto(null);
        }
    };

    // Remove gallery photo
    const removeGalleryPhoto = async (index: number) => {
        if (!artistData) return;
        const updatedGallery = [...(artistData.galleryPhotos || [])];
        updatedGallery.splice(index, 1);

        try {
            await updateDoc(doc(db, "pending_registrations", artistData.id), {
                galleryPhotos: updatedGallery,
                updatedAt: serverTimestamp(),
            });
            await refreshArtistData();
            setGalleryPreviews(updatedGallery);
            toast({ title: "Photo Removed" });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not remove photo." });
        }
    };

    // Social links
    const addSocialLink = () => setSocialLinks([...socialLinks, { platform: "youtube", url: "" }]);
    const removeSocialLink = (index: number) => setSocialLinks(socialLinks.filter((_, i) => i !== index));
    const updateSocialLink = (index: number, field: string, value: string) => {
        const newLinks = [...socialLinks];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setSocialLinks(newLinks);
    };

    // Save all text fields
    const handleSave = async () => {
        if (!artistData) return;

        setLoading(true);
        try {
            await updateDoc(doc(db, "pending_registrations", artistData.id), {
                ...formData,
                socialLinks,
                updatedAt: serverTimestamp(),
            });
            await refreshArtistData();
            toast({ title: "Profile Updated! ✅", description: "Your changes have been saved." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not save changes." });
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
                                        src={artistData.profilePhoto || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300"}
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
                                    {artistData.coverPhoto ? (
                                        <img src={artistData.coverPhoto} className="w-full h-full object-cover" alt="Cover" />
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
                                <Input name="dob" type="date" value={formData.dob} onChange={handleChange} />
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
                                <div className="flex gap-3 mt-2">
                                    {["Hindi", "Marathi", "English"].map((lang) => (
                                        <label key={lang} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.languageSpoken.includes(lang)}
                                                onChange={() => handleSelectChange("languageSpoken", lang)}
                                                className="w-4 h-4 rounded border-border"
                                            />
                                            <span className="text-sm">{lang}</span>
                                        </label>
                                    ))}
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
                                rows={4}
                            />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Social Links */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Globe className="h-5 w-5 text-primary" /> Social Links & Portfolio
                        </h3>

                        {socialLinks.map((link, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Select value={link.platform} onValueChange={(v) => updateSocialLink(index, "platform", v)}>
                                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="youtube">YouTube</SelectItem>
                                        <SelectItem value="instagram">Instagram</SelectItem>
                                        <SelectItem value="facebook">Facebook</SelectItem>
                                        <SelectItem value="website">Website</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    placeholder="Paste link here..."
                                    value={link.url}
                                    onChange={(e) => updateSocialLink(index, "url", e.target.value)}
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
                                <Label>Bank Name</Label>
                                <Input name="bankName" value={formData.bankName} onChange={handleChange} placeholder="e.g. SBI, HDFC" />
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
