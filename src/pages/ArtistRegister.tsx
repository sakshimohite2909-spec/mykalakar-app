import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Upload, Send, User, Music, MapPin, Search as SearchIcon, Plus, Trash2, Globe, Youtube, Instagram, Facebook, CreditCard, Building2, Check, ChevronsUpDown, Loader2, X, AtSign, Lock, Eye, EyeOff, IndianRupee, Users, Headphones, MessageSquare, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, getDocs, where } from "firebase/firestore";
import { uploadImageFile } from "@/lib/uploadService";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CreatableSelect from "react-select/creatable";

const categoryOptions = [
  {
    label: "General Categories",
    options: [
      { value: "Actors", label: "Actors" },
      { value: "Singer", label: "Singer" },
      { value: "Karaoke Singers", label: "Karaoke Singers" },
      { value: "Orchestra", label: "Orchestra" },
      { value: "Magicians", label: "Magicians" },
      { value: "Pappate show", label: "Pappate show" },
      { value: "DJ's", label: "DJ's" },
      { value: "Anchors / Hosts", label: "Anchors / Hosts" },
      { value: "Motivational speakers", label: "Motivational speakers" },
      { value: "Photo & Videography", label: "Photo & Videography" },
      { value: "Makeup / Mehndi Artist", label: "Makeup / Mehndi Artist" }
    ]
  },
  {
    label: "Folk Art",
    options: [
      { value: "Folk Art", label: "Folk Art (General)" },
      { value: "Gondhal", label: "Gondhal" },
      { value: "Jagran", label: "Jagran" },
      { value: "Bharud", label: "Bharud" },
      { value: "Shahir & Powada", label: "Shahir & Powada" },
      { value: "Lezim pathak", label: "Lezim pathak" },
      { value: "Zanz pathak", label: "Zanz pathak" },
      { value: "Dhol pathak", label: "Dhol pathak" },
      { value: "Waghya-Murali", label: "Waghya-Murali" },
      { value: "Jalsa & Dashavtar", label: "Jalsa & Dashavtar" },
      { value: "Dhagari & dhol ovi", label: "Dhagari & dhol ovi" },
      { value: "Bahurupiya", label: "Bahurupiya" }
    ]
  },
  {
    label: "Varkari Sampraday",
    options: [
      { value: "Varkari Sampraday", label: "Varkari Sampraday (General)" },
      { value: "Kirtankar", label: "Kirtankar" },
      { value: "Pravachankar", label: "Pravachankar" },
      { value: "Vyaspethchalak", label: "Vyaspethchalak" },
      { value: "Chopdar", label: "Chopdar" },
      { value: "Gayak", label: "Gayak" },
      { value: "Mrudangmani", label: "Mrudangmani" },
      { value: "Bharudkar", label: "Bharudkar" },
      { value: "Soundsystem", label: "Soundsystem" },
      { value: "Mandap & decoration", label: "Mandap & decoration" },
      { value: "Venekari", label: "Venekari" },
      { value: "Taalkari", label: "Taalkari" },
      { value: "Varkari Sanstha", label: "Varkari Sanstha" },
      { value: "Bhajani Mandal", label: "Bhajani Mandal" },
      { value: "Shastriya Bhajan", label: "Shastriya Bhajan" },
      { value: "Tabla vadak", label: "Tabla vadak" },
      { value: "Harmonium vadak", label: "Harmonium vadak" },
      { value: "Dholki vadak", label: "Dholki vadak" }
    ]
  }
];

export default function ArtistRegister() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("artist");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [catOpen, setCatOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [dbStates, setDbStates] = useState<any[]>([]);
  const [stateOpen, setStateOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [username, setUsername] = useState("");
  const USERNAME_REGEX = /^[a-z0-9_]{3,16}$/;
  const usernameValid = username === "" ? null : USERNAME_REGEX.test(username);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // User tab state
  const [userFullName, setUserFullName] = useState("");
  const [userUsername, setUserUsername] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userLoading, setUserLoading] = useState(false);

  const handleUserRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFullName || !userUsername || !userPassword) {
      toast({ variant: "destructive", title: "Error", description: "All fields are required." });
      return;
    }
    const syntheticEmail = `${userUsername.toLowerCase().trim()}@mykalakar.app`;
    setUserLoading(true);
    const result = await authRegister(syntheticEmail, userPassword);
    if (result.success) {
      // Save full name and phone number to the users collection, alongside base user data.
      // role defaults to customer per AuthContext fetching.
      try {
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "users", result.uid), {
          uid: result.uid,
          name: userFullName,
          username: userUsername,
          email: syntheticEmail,
          phone: userPhone,
          role: "customer",
          createdAt: new Date().toISOString()
        }, { merge: true });
        toast({ title: "Account Created! 🎉", description: "You are now logged in." });
        navigate("/artists"); // Redirect to artists
      } catch (err) {
        toast({ variant: "destructive", title: "Error Saving Profile", description: "Account created but failed to save profile details." });
      }
    } else {
      toast({ variant: "destructive", title: "Registration Failed", description: result.message });
    }
    setUserLoading(false);
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let unsubStates: (() => void) | undefined;

    try {
      const q = query(collection(db, "categories"));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDbCategories(data);
      }, (error) => {
        console.warn("Categories snapshot error:", error.message);
      });
    } catch (e) {
      console.warn("Could not subscribe to categories:", e);
    }

    try {
      const qStates = query(collection(db, "states"), orderBy("name"));
      unsubStates = onSnapshot(qStates, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDbStates(data);
      }, (error) => {
        console.warn("States snapshot error:", error.message);
      });
    } catch (e) {
      console.warn("Could not subscribe to states:", e);
    }

    return () => {
      if (unsubscribe) unsubscribe();
      if (unsubStates) unsubStates();
    };
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    brandName: "",
    emergencyNumber: "",
    mobileNumber: "",
    age: "",
    gender: "",
    dob: "",
    travelWillingness: "local",
    state: "",
    district: "",
    experience: "",
    bio: "",
    availability: "available",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    aadharNumber: "",
    // Pricing
    soloPrice: "",
    duoPrice: "",
    teamPrice: "",
    // Assistant support
    hasAssistant: false,
    assistantName: "",
    assistantContact: "",
    liveLink: "",
    needAssistant: "no",
    telecallerName: "",
    professionalName: "",
    capName: "",
    bloodGroup: "",
    // Suggestion/comment
    suggestionComment: "",
    // Fee notes
    feeNotes: "",
  });

  // Real-Time Age Synchronization — only re-run when DOB changes, NOT when age changes
  useEffect(() => {
    if (formData.dob) {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      setFormData(prev => ({ ...prev, age: calculatedAge.toString() }));
    } else {
      setFormData(prev => ({ ...prev, age: "" }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.dob]);

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [customTypeInput, setCustomTypeInput] = useState("");

  // Multiple arts support
  const [artsList, setArtsList] = useState<Array<{
    category: string;
    // Per-category Pricing
    soloPrice: string;
    duoPrice: string;
    teamPrice: string;
    // Per-category Media
    profileFile: File | null;
    profilePreview: string;
    coverFile: File | null;
    coverPreview: string;
    galleryFiles: File[];
    galleryPreviews: string[];
  }>>([{
    coverFile: null, coverPreview: "",
    galleryFiles: [], galleryPreviews: [],
  }]);

  const updateArt = (index: number, field: string, value: any) => {
    setArtsList(prev => prev.map((art, i) => i === index ? { ...art, [field]: value } : art));
  };

  const addArt = () => {
    setArtsList(prev => [...prev, {
      category: "",
      soloPrice: "", duoPrice: "", teamPrice: "",
      profileFile: null, profilePreview: "",
      coverFile: null, coverPreview: "",
      galleryFiles: [], galleryPreviews: [],
    }]);
  };

  const removeArt = (index: number) => {
    if (artsList.length === 1) return;
    setArtsList(prev => prev.filter((_, i) => i !== index));
  };

  // Dynamic file picker per art entry
  const handleArtFileSelect = (index: number, type: 'profile' | 'cover' | 'gallery') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (type === 'gallery') input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;
      if (type === 'profile') {
        const file = files[0];
        const preview = URL.createObjectURL(file);
        updateArt(index, 'profileFile', file);
        updateArt(index, 'profilePreview', preview);
      } else if (type === 'cover') {
        const file = files[0];
        const preview = URL.createObjectURL(file);
        updateArt(index, 'coverFile', file);
        updateArt(index, 'coverPreview', preview);
      } else {
        const current = artsList[index];
        const remaining = 10 - current.galleryFiles.length;
        const newFiles = Array.from(files).slice(0, remaining);
        const newPreviews = newFiles.map(f => URL.createObjectURL(f));
        updateArt(index, 'galleryFiles', [...current.galleryFiles, ...newFiles]);
        updateArt(index, 'galleryPreviews', [...current.galleryPreviews, ...newPreviews]);
      }
    };
    input.click();
  };

  const [socialLinks, setSocialLinks] = useState([{ platform: "youtube", url: "" }]);

  // File states
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [aadharPreview, setAadharPreview] = useState("");

  // Refs for file inputs
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const aadharInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { platform: "youtube", url: "" }]);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const updateSocialLink = (index: number, field: string, value: string) => {
    const newLinks = [...socialLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setSocialLinks(newLinks);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'gallery' | 'aadhar' | 'cover') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === 'profile') {
      const file = files[0];
      setProfileFile(file);
      setProfilePreview(URL.createObjectURL(file));
    } else if (type === 'cover') {
      const file = files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    } else if (type === 'aadhar') {
      const file = files[0];
      setAadharFile(file);
      setAadharPreview(URL.createObjectURL(file));
    } else if (type === 'gallery') {
      const newFiles = Array.from(files);
      setGalleryFiles([...galleryFiles, ...newFiles]);
      const newPreviews = newFiles.map(f => URL.createObjectURL(f));
      setGalleryPreviews([...galleryPreviews, ...newPreviews]);
    }
  };

  const removeGalleryFile = (index: number) => {
    setGalleryFiles(galleryFiles.filter((_, i) => i !== index));
    setGalleryPreviews(galleryPreviews.filter((_, i) => i !== index));
  };

  // Thin wrapper — delegates to the production upload service
  const uploadFile = async (file: File | null | undefined, path: string) => {
    return uploadImageFile(file, path, (pct) => setUploadProgress(pct));
  };

  const getYoutubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artsList[0].category) {
      toast({ variant: "destructive", title: "Missing fields", description: "Please select at least one category." });
      return;
    }

    if (!artsList[0].profileFile) {
      toast({ variant: "destructive", title: "Profile Photo Required", description: "Please upload a profile photo." });
      return;
    }

    if (!username) {
      toast({ variant: "destructive", title: "Username Required", description: "Please enter a username for your account." });
      return;
    }
    if (!USERNAME_REGEX.test(username)) {
      toast({ variant: "destructive", title: "Invalid Username", description: "Username must be 3-16 chars: lowercase letters, numbers, underscores only." });
      return;
    }
    if (!password) {
      toast({ variant: "destructive", title: "Password Required", description: "Please enter a password to create your account." });
      return;
    }

    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Password Mismatch", description: "Passwords do not match." });
      return;
    }

    if (password.length < 6) {
      toast({ variant: "destructive", title: "Weak Password", description: "Password must be at least 6 characters." });
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    try {
      // STEP 0 — Username uniqueness check (both collections)
      const [regSnap, usersSnap] = await Promise.all([
        getDocs(query(collection(db, "pending_registrations"), where("username", "==", username))),
        getDocs(query(collection(db, "users"), where("username", "==", username))),
      ]);
      if (!regSnap.empty || !usersSnap.empty) {
        toast({ variant: "destructive", title: "Username Taken", description: "This username is already registered. Please choose another one." });
        setLoading(false);
        return;
      }

      // STEP 1 — Create Firebase Auth account (username → synthetic email)
      const syntheticEmail = `${username.toLowerCase().trim()}@mykalakar.app`;
      const authResult = await authRegister(syntheticEmail, password);
      if (!authResult.success) {
        toast({ variant: "destructive", title: "Account Error", description: authResult.message });
        setLoading(false);
        return;
      }
      const uid = authResult.uid;

      // STEP 2 — Small delay to let Firebase auth token propagate before Storage uploads.
      // This fixes the storage/unknown CORS-rejection that happens when uploading
      // before the auth session is fully established on the Firebase SDK side.
      await new Promise(resolve => setTimeout(resolve, 400));

      // STEP 3 — Upload profile photo (required)
      const profileUrl = await uploadFile(artsList[0].profileFile, `avatars/${uid}`);

      // STEP 4 — Upload optional cover, aadhar, gallery per art entry
      let coverUrl = "";
      if (artsList[0].coverFile) {
        coverUrl = await uploadFile(artsList[0].coverFile, `covers/${uid}`);
      }

      let aadharUrl = "";
      if (aadharFile) {
        aadharUrl = await uploadFile(aadharFile, `identity/${uid}`);
      }

      const galleryUrls = await Promise.all(
        artsList[0].galleryFiles.map((file: File) => uploadFile(file, `galleries/${uid}`))
      );

      // STEP 5 — Build Firestore registration document
      const registrationPayload = {
        ...formData,
        uid,
        username,
        email: syntheticEmail,
        role: "artist",
        category: artsList[0].category,
        artsList: artsList.map(({ profileFile: _pf, coverFile: _cf, profilePreview: _pp, coverPreview: _cp, galleryFiles: _gf, galleryPreviews: _gp, ...rest }) => rest),
        categories: artsList.map(art => art.category).filter(Boolean),
        socialLinks,
        profilePhoto: profileUrl,
        coverPhoto: coverUrl,
        aadharPhoto: aadharUrl,
        galleryPhotos: galleryUrls,
        status: "pending",
        verified: false,
        trending: false,
        rating: 0,
        reviews: 0,
        followers: 0,
        profileViews: 0,
        totalBookings: 0,
        createdAt: serverTimestamp(),
      };

      // STEP 6 — Write to Firestore in parallel: pending_registrations + users (so auth lookup works)
      const { doc: firestoreDoc, setDoc } = await import("firebase/firestore");
      await Promise.all([
        addDoc(collection(db, "pending_registrations"), registrationPayload),
        setDoc(firestoreDoc(db, "users", uid), {
          uid,
          username,
          email: syntheticEmail,
          name: formData.name,
          role: "artist",
          profilePhoto: profileUrl,
          status: "pending",
          createdAt: new Date().toISOString(),
        }, { merge: true }),
      ]);

      toast({ title: "Registration Submitted! 🎉", description: "Account created! You can login once your profile is approved." });
      setTimeout(() => navigate("/artist-login"), 2500);

      // Reset form
      setFormData({
        name: "", brandName: "", emergencyNumber: "", mobileNumber: "", age: "", gender: "", dob: "", travelWillingness: "local",
        state: "", district: "", experience: "", bio: "", availability: "available",
        accountNumber: "", ifscCode: "", bankName: "", aadharNumber: "",
        soloPrice: "", duoPrice: "", teamPrice: "", feeNotes: "",
        hasAssistant: false, assistantName: "", assistantContact: "", liveLink: "",
        needAssistant: "no", telecallerName: "", professionalName: "", capName: "", bloodGroup: "",
        suggestionComment: "",
      });
      setProfileFile(null); setProfilePreview(""); setCoverFile(null); setCoverPreview("");
      setGalleryFiles([]); setGalleryPreviews([]); setAadharFile(null); setAadharPreview("");
      setSocialLinks([{ platform: "youtube", url: "" }]);
      setArtsList([{ category: "", soloPrice: "", duoPrice: "", teamPrice: "", profileFile: null, profilePreview: "", coverFile: null, coverPreview: "", galleryFiles: [], galleryPreviews: [] }]);
      setUsername(""); setPassword(""); setConfirmPassword("");
    } catch (error: any) {
      console.error("=== FIREBASE REGISTRATION ERROR ===");
      console.error("Error code:", error?.code);
      console.error("Error message:", error?.message);
      console.error("Full error payload:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      toast({
        variant: "destructive",
        title: "Registration Failed ❌",
        description: error?.message || "Could not submit your registration. Please check the console for details.",
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="relative z-10 w-full pt-32 pb-32 flex justify-center items-start">
      <div className="container mx-auto px-4 max-w-2xl w-full">
        <div className="glass-panel border border-white/50 bg-white/60 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-3xl p-6 md:p-8 w-full h-fit flex flex-col space-y-6">
          {/* Back nav & Login */}
          <div className="flex items-center justify-between mb-2">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-orange-600 transition-colors bg-white/50 border border-orange-100 shadow-sm backdrop-blur-md rounded-full px-4 py-2">
              ← Back to Home
            </Link>
            <Link to="/artist-login" className="text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors">
              Login →
            </Link>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center mx-auto mb-5 shadow-[0_8px_32px_rgba(255,107,0,0.3)]">
              <Music className="h-6 w-6 text-foreground" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-black text-[#1A1A1A] mb-2 tracking-tight">Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">MyKalakar</span> as an Artist</h1>
            <p className="text-slate-500 text-sm font-medium">India's premier platform for Artists, Performers & Entertainers.</p>
          </motion.div>

          <Tabs defaultValue="artist" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="bg-orange-50/60 border border-orange-100 shadow-sm backdrop-blur-md flex w-full overflow-x-auto overflow-y-hidden no-scrollbar mb-6 p-1.5 rounded-2xl gap-1.5 sm:grid sm:grid-cols-3">
              <TabsTrigger value="admin" className="min-w-[100px] flex-1 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-700 data-[state=active]:to-slate-900 data-[state=active]:text-foreground text-slate-500 font-bold tracking-wider uppercase text-[10px] sm:text-xs py-3 transition-all duration-300">Admin</TabsTrigger>
              <TabsTrigger value="artist" className="min-w-[100px] flex-1 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-400 data-[state=active]:text-foreground text-slate-500 font-bold tracking-wider uppercase text-[10px] sm:text-xs py-3 transition-all duration-300">Artist</TabsTrigger>
              <TabsTrigger value="user" className="min-w-[100px] flex-1 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-orange-400 data-[state=active]:text-foreground text-slate-500 font-bold tracking-wider uppercase text-[10px] sm:text-xs py-3 transition-all duration-300">User</TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              {activeTab === "artist" && (
                <motion.div key="artist" initial={{ opacity: 0, x: -20, filter: "blur(8px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} exit={{ opacity: 0, x: 20, filter: "blur(8px)" }} transition={{ duration: 0.35, ease: "circOut" }}>
                  <TabsContent value="artist" className="mt-0 outline-none">
                    <form
                      onSubmit={handleSubmit}
                      className="w-full h-fit space-y-6 text-[#1A1A1A]"
                    >
            {/* Login Credentials Section */}
            <div className="flex items-center gap-3 pb-4 border-b border-border/50">
              <Lock className="h-5 w-5 text-primary" />
              <h2 className="font-display font-semibold text-lg">Create Your Login Account</h2>
            </div>

            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
              <p className="text-sm text-muted-foreground">🔐 Choose a unique username and password to log in to your Artist Dashboard.</p>

              {/* Username field with real-time validation */}
              <div>
                <Label htmlFor="reg-username" className="flex items-center gap-2">
                  <AtSign className="h-4 w-4 text-primary" /> Username *
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="reg-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    placeholder="e.g. dj_phoenix99"
                    required
                    maxLength={16}
                    className={`input-glass pr-10 transition-colors ${
                      usernameValid === true
                        ? "border-emerald-500 focus-visible:ring-emerald-500/30 text-emerald-700"
                        : usernameValid === false
                        ? "border-red-400 focus-visible:ring-red-400/30 text-red-700"
                        : "text-[#1A1A1A]"
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameValid === true && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    {usernameValid === false && <XCircle className="h-4 w-4 text-red-400" />}
                  </span>
                </div>
                {usernameValid === false && (
                  <p className="text-xs text-red-400 mt-1">
                    3–16 characters: lowercase letters, numbers, and underscores only.
                  </p>
                )}
                {usernameValid === true && (
                  <p className="text-xs text-emerald-500 mt-1">✓ Username looks good!</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reg-password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" /> Password *
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      required
                      className="input-glass pr-10 text-[#1A1A1A]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="reg-confirm-password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" /> Confirm Password *
                  </Label>
                  <Input
                    id="reg-confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    className="input-glass mt-1 text-[#1A1A1A]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pb-4 border-b border-border/50">
              <User className="h-5 w-5 text-primary" />
              <h2 className="font-display font-semibold text-lg">Personal Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Artist Name *</Label><Input name="name" value={formData.name} onChange={handleChange} placeholder="Your full name" required className="input-glass text-[#1A1A1A]" /></div>
              <div><Label>Nick Name / Brand Name</Label><Input name="brandName" value={formData.brandName} onChange={handleChange} placeholder="Your stage name or brand" className="input-glass text-[#1A1A1A]" /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Mobile Number *</Label><Input name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} placeholder="+91 XXXXX XXXXX" type="tel" required className="input-glass text-[#1A1A1A]" /></div>
              <div><Label>Emergency Number *</Label><Input name="emergencyNumber" value={formData.emergencyNumber} onChange={handleChange} placeholder="+91 XXXXX XXXXX" type="tel" required className="input-glass text-[#1A1A1A]" /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                 <Label className="text-slate-600 font-bold uppercase tracking-wider text-xs">Date of Birth *</Label>
                 <Input className="input-glass mt-1 text-[#1A1A1A] cursor-pointer" name="dob" value={formData.dob} onChange={handleChange} type="date" required />
              </div>
              <div>
                 <Label className="text-slate-600 font-bold uppercase tracking-wider text-xs flex items-center gap-2"><Sparkles className="h-3 w-3 text-orange-500" /> Synced Age Display</Label>
                 <Input className="input-glass mt-1 text-orange-600 font-black cursor-not-allowed select-none bg-white/40" name="age" value={formData.age ? `${formData.age} Years Old` : "Select DOB to auto-calculate"} readOnly tabIndex={-1} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Gender *</Label>
                <Select value={formData.gender} onValueChange={(v) => handleSelectChange("gender", v)}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Travel Willingness *</Label>
                <Select value={formData.travelWillingness} onValueChange={(v) => handleSelectChange("travelWillingness", v)}>
                  <SelectTrigger><SelectValue placeholder="Select travel preference" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local Only</SelectItem>
                    <SelectItem value="state">Within State</SelectItem>
                    <SelectItem value="all">All India</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>



            {/* Arts / Skills Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-orange-100">
                <Label className="text-base font-semibold flex items-center gap-2 text-[#1A1A1A]">🎨 Your Art(s) / Skills *</Label>
                <Button
                  type="button"
                  size="sm"
                  onClick={addArt}
                  className="h-9 text-xs bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-foreground border-0 rounded-xl px-4 shadow-md shadow-orange-200 hover:scale-105 active:scale-95 transition-all font-bold tracking-wider uppercase"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Another Category
                </Button>
              </div>

              {artsList.map((art, index) => {
                const artCatData = dbCategories.find(c => c.name === art.category);
                const artAvailableTypes: string[] = artCatData?.subcategoryTypes?.[art.subcategory] || [];
                return (
                  <div key={index} className="p-4 rounded-xl border border-border bg-secondary/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Art #{index + 1}</span>
                      {artsList.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeArt(index)} className="h-7 w-7 text-destructive hover:text-destructive">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                      {/* Category */}
                      <div className="flex flex-col gap-2">
                        <Label>Category / Art Form *</Label>
                        <CreatableSelect
                          isClearable
                          options={categoryOptions}
                          placeholder="Search or add your art form..."
                          value={art.category ? { label: art.category, value: art.category } : null}
                          onChange={(newValue: any) => updateArt(index, "category", newValue ? newValue.value : "")}
                          formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                          styles={{
                            control: (base) => ({
                              ...base,
                              backgroundColor: "rgba(255, 255, 255, 0.4)",
                              borderColor: "rgba(255, 255, 255, 0.3)",
                              borderRadius: "0.75rem",
                              minHeight: "44px",
                              boxShadow: "none",
                              "&:hover": {
                                borderColor: "#f97316",
                              }
                            }),
                            menu: (base) => ({
                              ...base,
                              backgroundColor: "#ffffff",
                              borderRadius: "0.75rem",
                              overflow: "visible",
                              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                              zIndex: 50,
                            }),
                            menuList: (base) => ({
                              ...base,
                              maxHeight: "240px",
                              overflowY: "auto",
                              overscrollBehavior: "contain",
                              WebkitOverflowScrolling: "touch",
                            }),
                            option: (base, { isFocused, isSelected }) => ({
                              ...base,
                              backgroundColor: isSelected ? "#f97316" : isFocused ? "#fff7ed" : "transparent",
                              color: isSelected ? "white" : "#1a1a1a",
                              cursor: "pointer",
                              "&:active": {
                                backgroundColor: "#f97316",
                              }
                            })
                          }}
                        />
                      </div>
                    </div>

                    {/* ── Performance Pricing ── */}
                    <div className="pt-4 mt-2 border-t border-orange-100 space-y-3">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-primary" />
                        <h3 className="font-bold text-sm text-[#2E3A47] tracking-wide uppercase">Performance Pricing (₹)</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Solo Performance</Label>
                          <Input
                            type="number"
                            value={art.soloPrice}
                            onChange={e => updateArt(index, "soloPrice", e.target.value)}
                            placeholder="e.g. 10000"
                            className="input-glass mt-1 h-10"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Duo Performance</Label>
                          <Input
                            type="number"
                            value={art.duoPrice}
                            onChange={e => updateArt(index, "duoPrice", e.target.value)}
                            placeholder="e.g. 15000"
                            className="input-glass mt-1 h-10"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Team Performance</Label>
                          <Input
                            type="number"
                            value={art.teamPrice}
                            onChange={e => updateArt(index, "teamPrice", e.target.value)}
                            placeholder="e.g. 25000"
                            className="input-glass mt-1 h-10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* ── Media ── */}
                    <div className="pt-4 mt-2 border-t border-orange-100 space-y-4">
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4 text-primary" />
                        <h3 className="font-bold text-sm text-[#2E3A47] tracking-wide uppercase">Media</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Profile Photo */}
                        <div>
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Profile Photo *</Label>
                          <div
                            onClick={() => handleArtFileSelect(index, "profile")}
                            className="mt-1.5 relative h-36 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/30 cursor-pointer hover:bg-orange-50/60 hover:border-orange-400 transition-all overflow-hidden group"
                          >
                            {art.profilePreview ? (
                              <>
                                <img src={art.profilePreview} className="absolute inset-0 w-full h-full object-cover" alt="Profile preview" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Upload className="h-6 w-6 text-foreground" />
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mb-2">
                                  <User className="h-5 w-5 text-orange-400" />
                                </div>
                                <p className="text-xs font-bold text-orange-400">Upload Profile Photo</p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Cover Photo */}
                        <div>
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cover / Background Photo</Label>
                          <div
                            onClick={() => handleArtFileSelect(index, "cover")}
                            className="mt-1.5 relative h-36 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/20 cursor-pointer hover:bg-blue-50/40 hover:border-blue-400 transition-all overflow-hidden group"
                          >
                            {art.coverPreview ? (
                              <>
                                <img src={art.coverPreview} className="absolute inset-0 w-full h-full object-cover" alt="Cover preview" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Upload className="h-6 w-6 text-foreground" />
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                                  <Upload className="h-5 w-5 text-blue-400" />
                                </div>
                                <p className="text-xs font-bold text-blue-400">Upload Background Photo</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Gallery */}
                      <div>
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gallery Photos</Label>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-1.5">
                          {art.galleryPreviews.map((p, gi) => (
                            <div key={gi} className="relative aspect-square rounded-xl overflow-hidden border border-white/60 shadow-sm">
                              <img src={p} className="w-full h-full object-cover" alt={`Gallery ${gi + 1}`} />
                              <button
                                type="button"
                                onClick={() => {
                                  updateArt(index, "galleryFiles", art.galleryFiles.filter((_: File, fi: number) => fi !== gi));
                                  updateArt(index, "galleryPreviews", art.galleryPreviews.filter((_: string, fi: number) => fi !== gi));
                                }}
                                className="absolute top-1 right-1 p-0.5 bg-white/80 rounded-full hover:bg-red-500 hover:text-foreground transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          <div
                              onClick={() => handleArtFileSelect(index, "gallery")}
                              className="aspect-square rounded-xl border-2 border-dashed border-orange-200 bg-orange-50/30 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50/60 hover:border-orange-400 transition-all"
                            >
                              <Plus className="h-5 w-5 text-orange-400 mb-0.5" />
                              <span className="text-[9px] font-bold text-orange-400 uppercase tracking-wider">Add Photo</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1.5">Upload photos of your best work</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>State *</Label>
                <Popover open={stateOpen} onOpenChange={setStateOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={stateOpen} className="justify-between w-full h-10 font-normal">
                      {formData.state || "Select State"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search state..." />
                      <CommandList>
                        <CommandEmpty>No state found.</CommandEmpty>
                        <CommandGroup>
                          {dbStates.map(s => (
                            <CommandItem key={s.id} value={s.name} onSelect={(v) => { handleSelectChange("state", v); handleSelectChange("district", ""); setStateOpen(false); }}>
                              <Check className={cn("mr-2 h-4 w-4", formData.state === s.name ? "opacity-100" : "opacity-0")} />
                              {s.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-col gap-2">
                <Label>District *</Label>
                <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={districtOpen} disabled={!formData.state} className="justify-between w-full h-10 font-normal">
                      {formData.district || (formData.state ? "Select District" : "Select state first")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search district..." />
                      <CommandList>
                        <CommandEmpty>No district found.</CommandEmpty>
                        <CommandGroup>
                          {(dbStates.find(s => s.name === formData.state)?.districts || []).map((d: string) => (
                            <CommandItem key={d} value={d} onSelect={(v) => { handleSelectChange("district", v); setDistrictOpen(false); }}>
                              <Check className={cn("mr-2 h-4 w-4", formData.district === d ? "opacity-100" : "opacity-0")} />
                              {d}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Experience (Years) *</Label>
                <Input name="experience" type="number" value={formData.experience} onChange={handleChange} placeholder="e.g. 5" required className="input-glass text-[#1A1A1A]" />
              </div>
            </div>

            <div><Label>Description / Bio</Label><Textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Tell us about your art, experience, and what makes you unique..." rows={4} className="input-glass text-[#1A1A1A]" /></div>



            <div className="flex items-center gap-3 pb-4 border-b border-border/50 pt-4">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="font-display font-semibold text-lg">Identity Documents</h2>
            </div>

            <div>
              <Label>Aadhar Card Photo</Label>
              <input
                type="file"
                ref={aadharInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'aadhar')}
              />
              <div
                onClick={() => aadharInputRef.current?.click()}
                className="mt-1 border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors relative min-h-[100px] flex flex-col items-center justify-center overflow-hidden"
              >
                {aadharPreview ? (
                  <img src={aadharPreview} className="absolute inset-0 w-full h-full object-contain bg-secondary/20" alt="Aadhar preview" />
                ) : (
                  <>
                    <CreditCard className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Upload Aadhar Card Photo (Front & Back)</p>
                  </>
                )}
              </div>
              <div className="mt-3">
                <Label>Aadhar Number</Label>
                <Input name="aadharNumber" value={formData.aadharNumber} onChange={handleChange} placeholder="XXXX XXXX XXXX" />
              </div>
            </div>

            <div className="flex items-center gap-3 pb-4 border-b border-border/50 pt-4">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="font-display font-semibold text-lg">Bank Account Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Bank Name</Label><Input name="bankName" value={formData.bankName} onChange={handleChange} placeholder="e.g. SBI, HDFC" /></div>
              <div><Label>IFSC Code</Label><Input name="ifscCode" value={formData.ifscCode} onChange={handleChange} placeholder="SBIN00XXXXX" /></div>
            </div>
            <div>
              <Label>Account Number</Label>
              <Input name="accountNumber" value={formData.accountNumber} onChange={handleChange} placeholder="Enter account number" />
            </div>

            <div className="flex items-center gap-3 pb-4 border-b border-border/50 pt-4">
              <Globe className="h-5 w-5 text-primary" />
              <h2 className="font-display font-semibold text-lg">Links & Portfolio</h2>
            </div>

            <div className="space-y-4">
              {socialLinks.map((link, index) => (
                <div key={index} className="space-y-3 p-4 rounded-xl border border-border bg-secondary/20">
                  <div className="flex items-center gap-2">
                    <Select value={link.platform} onValueChange={(v) => updateSocialLink(index, "platform", v)}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube">YouTube</SelectItem>
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

                  {link.platform === "youtube" && getYoutubeEmbedUrl(link.url) && (
                    <div className="aspect-video w-full rounded-lg overflow-hidden border border-border">
                      <iframe
                        width="100%"
                        height="100%"
                        src={getYoutubeEmbedUrl(link.url)!}
                        title="YouTube video player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addSocialLink} className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Add More Links
              </Button>
            </div>

            {/* Live Stream & Assistant Section */}
            <div className="flex items-center gap-3 pb-4 border-b border-border/50 pt-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-display font-semibold text-lg">Additional Details</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Live Stream Link (Optional)</Label>
                <Input name="liveLink" value={formData.liveLink} onChange={handleChange} placeholder="e.g. YouTube Live, Instagram Live URL" className="input-glass text-[#1A1A1A]" />
              </div>

              <div className="space-y-3 p-4 rounded-xl border border-border bg-secondary/20">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.hasAssistant} onChange={(e) => setFormData(prev => ({ ...prev, hasAssistant: e.target.checked }))} className="w-4 h-4 rounded border-border" />
                  <span className="text-sm font-medium">Do you have an assistant/manager?</span>
                </label>
                
                {formData.hasAssistant && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <Label>Assistant/Manager Name</Label>
                      <Input name="assistantName" value={formData.assistantName} onChange={handleChange} placeholder="Their full name" className="input-glass text-[#1A1A1A]" />
                    </div>
                    <div>
                      <Label>Assistant/Manager Contact</Label>
                      <Input name="assistantContact" value={formData.assistantContact} onChange={handleChange} placeholder="Phone number or email" className="input-glass text-[#1A1A1A]" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Suggestion / Comment Box */}
            <div className="flex items-center gap-3 pb-4 border-b border-border/50 pt-4">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h2 className="font-display font-semibold text-lg">Suggestions & Tips</h2>
            </div>

            <div>
              <Label>Any suggestions or tips about your art for us?</Label>
              <p className="text-xs text-muted-foreground mb-2">Share anything you'd like us to know — special requirements, tips about your performance, or suggestions for the company.</p>
              <Textarea
                name="suggestionComment"
                value={formData.suggestionComment}
                onChange={handleChange}
                placeholder="e.g. I need a specific sound setup, I perform best in outdoor venues, suggestions for how to present my art..."
                rows={4}
              />
            </div>

            {/* Upload progress bar */}
            {loading && uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-orange-600">
                  <span>Uploading photos...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-14 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-0 text-foreground font-black text-sm tracking-widest uppercase rounded-2xl shadow-lg shadow-orange-300/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : "Creating Account..."}
                </div>
              ) : (
                <><Send className="h-4 w-4 mr-2" /> Submit My Artist Profile</>
              )}
            </Button>
            </form>
                  </TabsContent>
                </motion.div>
              )}

              {activeTab === "admin" && (
                <motion.div key="admin" initial={{ opacity: 0, x: -20, filter: "blur(10px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} exit={{ opacity: 0, x: 20, filter: "blur(10px)" }} transition={{ duration: 0.4, ease: "circOut" }}>
                  <TabsContent value="admin" className="mt-0 outline-none">
                    <form
                      onSubmit={(e) => { e.preventDefault(); navigate("/admin/dashboard"); }}
                      className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-[#05050580] p-6 md:p-8 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-[32px] saturate-[120%] w-full max-w-2xl"
                    >
                      <div className="flex items-center gap-3 pb-4 border-b border-white/10 mb-6">
                        <Building2 className="h-5 w-5 text-amber-400" />
                        <h2 className="font-display font-semibold text-lg">Admin Access Request</h2>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                           <Label className="flex items-center gap-2 text-foreground/70">Username</Label>
                           <Input className="mt-1 bg-black/40 border-white/10 text-foreground focus-visible:ring-amber-500/50" placeholder="admin_login" required />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                             <Label className="flex items-center gap-2 text-foreground/70">Full Name</Label>
                             <Input className="mt-1 bg-black/40 border-white/10 text-foreground focus-visible:ring-amber-500/50" placeholder="E.g. John Doe" required />
                          </div>
                          <div>
                             <Label className="flex items-center gap-2 text-foreground/70">Cap Name (Nickname)</Label>
                             <Input className="mt-1 bg-black/40 border-white/10 text-foreground focus-visible:ring-amber-500/50" placeholder="E.g. JD" required />
                          </div>
                        </div>
                        <div>
                           <Label className="flex items-center gap-2 text-foreground/70">Blood Group</Label>
                           <Select required>
                             <SelectTrigger className="mt-1 bg-black/40 border-white/10 text-foreground focus-visible:ring-amber-500/50"><SelectValue placeholder="Select Blood Group" /></SelectTrigger>
                             <SelectContent>
                               <SelectItem value="A+">A+</SelectItem><SelectItem value="A-">A-</SelectItem>
                               <SelectItem value="B+">B+</SelectItem><SelectItem value="B-">B-</SelectItem>
                               <SelectItem value="O+">O+</SelectItem><SelectItem value="O-">O-</SelectItem>
                               <SelectItem value="AB+">AB+</SelectItem><SelectItem value="AB-">AB-</SelectItem>
                             </SelectContent>
                           </Select>
                        </div>
                        <div>
                           <Label className="flex items-center gap-2 text-foreground/70">Tell us about yourself</Label>
                           <Textarea className="mt-1 bg-black/40 border-white/10 text-foreground focus-visible:ring-amber-500/50 min-h-[120px]" placeholder="Briefly describe your role and experience..." required />
                        </div>
                        <Button type="submit" className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-black font-semibold tracking-widest mt-4">
                           REQUEST ADMIN ACCESS
                        </Button>
                      </div>
                    </form>
                  </TabsContent>
                </motion.div>
              )}

              {activeTab === "user" && (
                <motion.div key="user" initial={{ opacity: 0, x: -20, filter: "blur(8px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} exit={{ opacity: 0, x: 20, filter: "blur(8px)" }} transition={{ duration: 0.35, ease: "circOut" }}>
                  <TabsContent value="user" className="mt-0 outline-none">
                    <form
                      onSubmit={handleUserRegistration}
                      className="glass-panel rounded-3xl p-6 md:p-8 w-full text-[#1A1A1A]"
                    >
                      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-6">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-amber-400 flex items-center justify-center">
                          <User className="h-4 w-4 text-foreground" />
                        </div>
                        <div>
                          <h2 className="font-display font-bold text-lg text-[#1A1A1A]">User / Connoisseur Account</h2>
                          <p className="text-xs text-slate-500">Book and discover elite artists</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Full Name *</Label>
                          <Input value={userFullName} onChange={(e) => setUserFullName(e.target.value)} className="mt-1.5 input-glass rounded-xl py-3" placeholder="E.g. Sarah Smith" required />
                        </div>
                        <div>
                          <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Username *</Label>
                          <Input type="text" value={userUsername} onChange={(e) => setUserUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} className="mt-1.5 input-glass rounded-xl py-3" placeholder="e.g. sarah_smith" required />
                        </div>
                        <div>
                          <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Phone Number (Optional)</Label>
                          <Input type="tel" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} className="mt-1.5 input-glass rounded-xl py-3" placeholder="+91 XXXXX XXXXX" />
                        </div>
                        <div>
                          <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Password *</Label>
                          <Input type="password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} className="mt-1.5 input-glass rounded-xl py-3" placeholder="Min 8 characters" required />
                        </div>
                        <button type="submit" disabled={userLoading} className="flex items-center justify-center gap-2 btn-glass-primary w-full rounded-xl py-3.5 text-sm font-black uppercase tracking-widest mt-2">
                          {userLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
                        </button>
                        </div>
                      </form>
                    </TabsContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }
