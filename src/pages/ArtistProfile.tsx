import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, BadgeCheck, Clock, Phone, Heart, Share2, Calendar, ChevronLeft, Play, Loader2, Instagram, Facebook, Globe, User, Users } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import BookingModal from "@/components/BookingModal";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";
import { getExternalUrl, getYoutubeEmbedUrl } from "@/lib/youtube";
import { FIREBASE_READ_TIMEOUT_MS, FIREBASE_WRITE_TIMEOUT_MS, firebaseErrorMessage, withTimeout } from "@/lib/firebaseSafe";

export default function ArtistProfile() {
  const { id } = useParams();
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const { currentUser } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchArtist = async () => {
      if (!id) return;
      try {
        const resolveImageUrl = async (urlStr: string) => {
          if (!urlStr) return urlStr;
          if (!urlStr.startsWith("http") && !urlStr.startsWith("blob:") && !urlStr.startsWith("data:")) {
            try {
              return await getDownloadURL(ref(storage, urlStr));
            } catch (e) {
              console.warn("Storage path resolve failed:", urlStr, e);
              return urlStr;
            }
          }
          return urlStr;
        };

        const buildArtist = async (docId: string, data: any) => {
          const profilePhoto = await resolveImageUrl(data.media?.profilePhoto || data.profilePhoto || data.profilePicUrl || "");
          const coverPhoto = await resolveImageUrl(data.media?.coverPhoto || data.coverPhoto || data.coverImages?.[0] || "");
          const rawGallery: string[] = data.media?.galleryPhotos || data.galleryPhotos || [];
          const galleryPhotos = await Promise.all(rawGallery.map(resolveImageUrl));
          return { id: docId, ...data, profilePhoto, coverPhoto, galleryPhotos };
        };

        // 1. Try artists/{id} first (approved artists with uid as doc ID)
        let artistDoc = null;
        if (!id.startsWith("demo-")) {
          const snap = await withTimeout(getDoc(doc(db, "artists", id)), FIREBASE_READ_TIMEOUT_MS, "");
          if (snap.exists()) {
            artistDoc = await buildArtist(snap.id, snap.data());
            // Increment profile views
            updateDoc(doc(db, "artists", id), {
              "stats.profileViews": (snap.data().stats?.profileViews || 0) + 1,
              updatedAt: serverTimestamp(),
            }).catch(() => {});
          }
        }

        // 2. Fallback: try artist_applications/{id}
        if (!artistDoc && !id.startsWith("demo-")) {
          try {
            const appSnap = await withTimeout(getDoc(doc(db, "artist_applications", id)), FIREBASE_READ_TIMEOUT_MS, "");
            if (appSnap.exists()) {
              artistDoc = await buildArtist(appSnap.id, appSnap.data());
            }
          } catch {
            // ignore
          }
        }

        setArtist(artistDoc);

        // Check if saved
        if (artistDoc && currentUser) {
          const savedRef = doc(db, "users", currentUser.uid, "savedArtists", artistDoc.id);
          const savedSnap = await withTimeout(getDoc(savedRef), FIREBASE_READ_TIMEOUT_MS, "").catch(() => null);
          if (savedSnap?.exists()) setIsSaved(true);
        }
      } catch (error) {
        console.error("Error fetching artist:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArtist();
  }, [id, currentUser]);

  /**
   * Scroll-hijack prevention for YouTube iframes.
   * While the user is wheeling the page, a transparent overlay sits on top of
   * each iframe (pointer-events-auto) so the iframe never captures the event.
   * After 500ms of scroll idle the overlay steps back (pointer-events-none).
   */
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const onWheel = () => {
      setIsScrolling(true);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => setIsScrolling(false), 500);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchmove", onWheel, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onWheel);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, []);

  const handleSaveArtist = async () => {
    if (!currentUser) {
      toast({ title: "Login Required", description: "Please log in to save artists." });
      return;
    }
    if (!artist) return;
    setIsSaving(true);
    try {
      const savedRef = doc(db, "users", currentUser.uid, "savedArtists", artist.id);
      if (isSaved) {
        await withTimeout(deleteDoc(savedRef), FIREBASE_WRITE_TIMEOUT_MS, "Could not remove this saved artist.");
        setIsSaved(false);
        toast({ title: "Removed", description: `${artist.name} removed from saved.` });
      } else {
        await withTimeout(setDoc(savedRef, {
          artistId: artist.id,
          name: artist.name,
          category: artist.category || artist.subcategory || "",
          profilePhoto: artist.profilePhoto || "",
          savedAt: serverTimestamp()
        }), FIREBASE_WRITE_TIMEOUT_MS, "Could not save this artist.");
        setIsSaved(true);
        toast({ title: "Saved! 🎉", description: `${artist.name} has been saved.` });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: firebaseErrorMessage(err, "Failed to save artist.") });
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (!artist) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `MyKalakar | ${artist.name}`,
          text: artist.bio?.slice(0, 100) || `Check out ${artist.name} on MyKalakar!`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: "Link Copied!", description: "Profile link copied to clipboard." });
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent">
        <Navbar />
        <div className="pt-40 flex justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-transparent">
        <Navbar />
        <div className="pt-24 text-center">
          <h1 className="text-2xl font-display font-bold">Artist not found</h1>
          <p className="text-muted-foreground mt-2 mb-4">This artist profile does not exist or has not been approved yet.</p>
          <Link to="/artists" className="text-primary mt-4 inline-block">← Back to Artists</Link>
        </div>
      </div>
    );
  }

  const socialLinks = Array.isArray(artist.socialLinks)
    ? artist.socialLinks.filter((link: any) =>
        String(link?.platform).toLowerCase() === "youtube"
        && typeof link?.url === "string"
        && link.url.trim().length > 0
      )
    : [];
  const socialLinkUrls = new Set(socialLinks.map((link: any) => link.url.trim()));
  const youtubeLinks = Array.isArray(artist.youtubeLinks)
    ? artist.youtubeLinks.filter((link: string) => typeof link === "string" && link.trim().length > 0 && !socialLinkUrls.has(link.trim()))
    : [];
  const hasPerformanceLinks = socialLinks.length > 0 || youtubeLinks.length > 0 || Boolean(artist.videoLink);

  return (
    <div className="min-h-screen bg-transparent">
      <Helmet>
        <title>MyKalakar | {artist.name} - {artist.category || artist.subcategory || "Artist"}</title>
        <meta property="og:title" content={`MyKalakar | ${artist.name} - ${artist.category || "Artist"}`} />
        <meta property="og:description" content={artist.bio?.slice(0, 160) || `Check out ${artist.name}'s profile on MyKalakar!`} />
        {artist.profilePhoto && <meta property="og:image" content={artist.profilePhoto} />}
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <Navbar />

      {/* Cover */}
      <div className="relative h-64 md:h-80 lg:h-96">
        <img
          src={artist.coverPhoto || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200"}
          alt={artist.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <Link to="/artists" className="absolute top-20 left-4 z-10">
          <Button variant="secondary" size="sm" className="glass-card"><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
        </Link>
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
            <div className="glass-card rounded-2xl p-6 md:p-8 mb-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <img
                  src={artist.profilePhoto || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300"}
                  alt={artist.name}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-background shadow-lg"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <h1 className="font-display text-2xl md:text-3xl font-bold">{artist.name}</h1>
                      {artist.verified && <BadgeCheck className="h-6 w-6 text-primary" />}
                    </div>
                    {artist.liveLink && (
                      <a href={artist.liveLink} target="_blank" rel="noopener noreferrer" className="animate-pulse bg-red-600 text-white font-bold text-xs uppercase px-3 py-1 rounded-full flex items-center shadow-md">
                        <span className="w-2 h-2 bg-white rounded-full mr-2 animate-ping" />
                        🔴 LIVE NOW
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    {artist.category && <Badge variant="secondary">{artist.category}</Badge>}
                    {artist.subcategory && <Badge variant="outline">{artist.subcategory}</Badge>}
                    {artist.district && <span className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {artist.district}</span>}
                    {artist.state && <span className="flex items-center gap-1 text-sm text-muted-foreground">{artist.state}</span>}
                    {artist.experience != null && <span className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {artist.experience} yrs exp</span>}
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <span className="font-semibold">{artist.stats?.rating || artist.rating || 0}</span>
                      <span className="text-sm text-muted-foreground">({artist.stats?.reviews || artist.reviews || 0} reviews)</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{artist.stats?.followers || artist.followers || 0} followers</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full ${artist.availability === "available" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    ● {artist.availability === "available" ? "Available for Booking" : "Currently Busy"}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio */}
            {artist.bio && (
              <div className="glass-card rounded-2xl p-6 mb-6">
                <h2 className="font-display text-lg font-semibold mb-3">About</h2>
                <p className="text-muted-foreground leading-relaxed">{artist.bio}</p>
              </div>
            )}

            {/* Services */}
            {artist.services && artist.services.length > 0 && (
              <div className="glass-card rounded-2xl p-6 mb-6">
                <h2 className="font-display text-lg font-semibold mb-3">Services</h2>
                <div className="flex flex-wrap gap-2">
                  {artist.services.map((s: string) => <Badge key={s} variant="outline" className="px-3 py-1">{s}</Badge>)}
                </div>
              </div>
            )}

            {/* Gallery */}
            {artist.galleryPhotos && artist.galleryPhotos.length > 0 && (
              <div className="glass-card rounded-2xl p-6 mb-6">
                <h2 className="font-display text-lg font-semibold mb-4">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {artist.galleryPhotos.map((p: string, i: number) => (
                    <motion.img key={i} src={p} alt="Gallery" className="rounded-xl h-40 w-full object-cover hover:scale-105 transition-transform cursor-pointer" loading="lazy" />
                  ))}
                </div>
              </div>
            )}

            {/* Videos & Social Links */}
            {hasPerformanceLinks && (
              <div className="glass-card rounded-2xl p-6 mb-6">
                <h2 className="font-display text-lg font-semibold mb-4">Performance & Links</h2>
                <div className="grid gap-6">
                  {youtubeLinks.map((link: string, i: number) => (
                    <div key={`yt-${i}`}>
                      {getYoutubeEmbedUrl(link) ? (
                        {/* Anti scroll-hijack wrapper: overlay blocks iframe pointer events while scrolling */}
                        <div className="aspect-video w-full rounded-xl overflow-hidden border border-border relative">
                          <iframe
                            width="100%" height="100%"
                            src={getYoutubeEmbedUrl(link)!}
                            title={`Performance ${i + 1}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            loading="lazy"
                            className="block will-change-transform"
                          />
                          {/* Transparent scroll-guard overlay */}
                          <div
                            aria-hidden="true"
                            className={`absolute inset-0 z-10 transition-none ${
                              isScrolling ? "pointer-events-auto" : "pointer-events-none"
                            }`}
                          />
                        </div>
                      ) : (
                        <a href={getExternalUrl(link)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary">
                          <Play className="h-5 w-5" /> Video Link {i + 1}
                        </a>
                      )}
                    </div>
                  ))}
                  {socialLinks.map((link: any, i: number) => (
                    <div key={`social-${i}`}>
                      {getYoutubeEmbedUrl(link.url) ? (
                        <div className="space-y-2">
                          <span className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Play className="h-4 w-4" /> YouTube Performance</span>
                          {/* Anti scroll-hijack wrapper */}
                          <div className="aspect-video w-full rounded-xl overflow-hidden border border-border shadow-sm relative">
                            <iframe
                              width="100%" height="100%"
                              src={getYoutubeEmbedUrl(link.url)!}
                              title="YouTube video player"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              loading="lazy"
                              className="block will-change-transform"
                            />
                            <div
                              aria-hidden="true"
                              className={`absolute inset-0 z-10 transition-none ${
                                isScrolling ? "pointer-events-auto" : "pointer-events-none"
                              }`}
                            />
                          </div>
                        </div>
                      ) : (
                        <a href={getExternalUrl(link.url)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors border border-border/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center text-primary-foreground">
                              {String(link.platform).toLowerCase() === "instagram" ? <Instagram className="h-5 w-5" /> :
                                String(link.platform).toLowerCase() === "facebook" ? <Facebook className="h-5 w-5" /> :
                                  <Globe className="h-5 w-5" />}
                            </div>
                            <div>
                              <p className="text-sm font-semibold capitalize">{link.platform}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{link.url}</p>
                            </div>
                          </div>
                          <span className="text-xs font-medium text-primary">View Profile →</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="glass-card rounded-2xl p-6 sticky top-24">
              <h3 className="font-display text-lg font-semibold mb-4">Inquiry for Artist</h3>

              {/* Pricing */}
              {(artist.pricing?.soloPrice || artist.pricing?.teamPrice || artist.pricing?.duoPrice) && (
                <div className="mb-4 p-3 rounded-xl bg-secondary/50 border border-border/50 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pricing</p>
                  {artist.pricing?.soloPrice > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground flex items-center gap-1"><User className="h-3.5 w-3.5" /> Solo</span>
                      <span className="font-semibold">₹{Number(artist.pricing.soloPrice).toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {artist.pricing?.duoPrice > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Duo</span>
                      <span className="font-semibold">₹{Number(artist.pricing.duoPrice).toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {artist.pricing?.teamPrice > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Team</span>
                      <span className="font-semibold text-primary">₹{Number(artist.pricing.teamPrice).toLocaleString("en-IN")}</span>
                    </div>
                  )}
                </div>
              )}

              <Button onClick={() => setBookingOpen(true)} className="w-full gradient-bg border-0 h-14 text-primary-foreground font-bold text-lg mb-3 shadow-lg hover:scale-105 transition-transform">
                <Calendar className="h-5 w-5 mr-2" /> Inquiry Now
              </Button>
              <Button variant="outline" className="w-full h-12 mb-3">
                <Phone className="h-4 w-4 mr-2" /> Contact Artist
              </Button>
              <div className="flex gap-2">
                <Button
                  variant={isSaved ? "default" : "secondary"}
                  className="flex-1 transition-all"
                  onClick={handleSaveArtist}
                  disabled={isSaving}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isSaved ? "fill-current text-white" : ""}`} />
                  {isSaved ? "Saved" : "Save"}
                </Button>
                <Button variant="secondary" className="flex-1 transition-all hover:bg-orange-100/50" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2 text-primary" /> Share
                </Button>
              </div>

              {/* Assistant info */}
              {artist.assistant?.hasAssistant && artist.assistant?.name && artist.assistant?.contact && (
                <div className="mt-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Contact Assistant/Manager</p>
                  <p className="text-sm font-semibold">{artist.assistant.name}</p>
                  <p className="text-sm text-muted-foreground">{artist.assistant.contact}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mt-12" />
      <Footer />
      <BookingModal open={bookingOpen} onOpenChange={setBookingOpen} artistName={artist.name} artistId={artist.id} />
    </div>
  );
}
