import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  Eye,
  MapPin,
  Loader2,
  CreditCard,
  Building2,
  Globe,
  Youtube,
  Phone,
  Upload,
  User,
  Mail,
  Calendar,
  Languages,
  Briefcase,
  ExternalLink,
  ShieldCheck,
  Star,
  Layout
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, updateDoc, doc, onSnapshot } from "firebase/firestore";

export default function AdminPending() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "pending_registrations"), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPending(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, "pending_registrations", id), {
        status: "approved",
        verified: true
      });
      toast({ title: "Artist Verified! ✅", description: "Artist is now live and verified on the platform." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not verify artist." });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateDoc(doc(db, "pending_registrations", id), {
        status: "rejected"
      });
      toast({ title: "Artist Rejected", description: "Registration has been rejected." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not reject artist." });
    }
  };

  const getYoutubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const InfoRow = ({ label, value, icon: Icon }: { label: string; value: any; icon?: any }) => (
    <div className="flex items-start justify-between py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        {Icon && <Icon className="h-4 w-4" />}
        <span>{label}:</span>
      </div>
      <span className="font-medium text-sm text-right max-w-[60%]">{value || "N/A"}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">Pending Approvals</h1>
          <p className="text-sm text-muted-foreground">{pending.length} artists waiting for review</p>
        </div>
        <div className="hidden md:block">
          <Badge variant="outline" className="px-3 py-1 bg-yellow-500/5 text-yellow-600 border-yellow-500/20">
            Manual Review Required
          </Badge>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : pending.length === 0 ? (
        <Card className="border-dashed"><CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
          <Check className="h-8 w-8 text-green-500 mb-2" />
          <p className="text-lg font-semibold">No pending registrations 🎉</p>
          <p className="text-sm text-muted-foreground">All applications have been processed.</p>
        </CardContent></Card>
      ) : null}

      <div className="grid gap-4">
        {pending.map((a) => (
          <Card key={a.id} className="hover-lift overflow-hidden border-l-4 border-l-yellow-500">
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="relative group">
                  <img
                    src={a.profilePhoto || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300"}
                    alt={a.name}
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-background shadow-md"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                    <Eye className="h-6 w-6 text-foreground" />
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-display font-bold text-xl">{a.name}</h3>
                    <Badge className="bg-primary/10 text-primary border-primary/20">{a.subcategory}</Badge>
                    {a.verified && <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Verified</Badge>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" /> {a.email || "No email"}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" /> {a.phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> {a.district}, {a.state}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Briefcase className="h-3.5 w-3.5" /> {a.experience} years experience
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground line-clamp-2 italic">"{a.bio || "No bio provided"}"</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 self-stretch min-w-[160px]">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full group">
                        Review Application <ExternalLink className="ml-2 h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                      <div className="p-6 border-b bg-secondary/20 flex justify-between items-center">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-display">Artist Registration Review</DialogTitle>
                        </DialogHeader>
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={() => handleApprove(a.id)} className="gradient-bg border-0 text-foreground">Approve Now</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReject(a.id)}>Reject</Button>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-6 pt-2">
                        <Tabs defaultValue="form" className="w-full">
                          <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="form" className="flex items-center gap-2">
                              <Layout className="h-4 w-4" /> Full Form Details
                            </TabsTrigger>
                            <TabsTrigger value="preview" className="flex items-center gap-2">
                              <User className="h-4 w-4" /> How Profile Looks
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="form" className="space-y-6">
                            {/* Group 1: Identity & Security */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <Card className="bg-secondary/10">
                                <CardContent className="p-4 space-y-1">
                                  <h4 className="font-bold flex items-center gap-2 text-primary mb-3 pb-2 border-b">
                                    <ShieldCheck className="h-4 w-4" /> Account & Security
                                  </h4>
                                  <InfoRow label="Registration ID" value={a.id.slice(0, 10) + "..."} />
                                  <InfoRow label="Email Address" value={a.email} icon={Mail} />
                                  <InfoRow label="UID" value={a.uid ? "Account Created" : "Not Linked"} icon={Check} />
                                  <InfoRow label="Aadhar Number" value={a.aadharNumber} icon={CreditCard} />
                                  {a.aadharPhoto && (
                                    <div className="mt-4 pt-2 border-t">
                                      <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2">Aadhar Photo</p>
                                      <img src={a.aadharPhoto} className="w-full h-auto rounded-lg border shadow-sm" alt="Aadhar" />
                                    </div>
                                  )}
                                </CardContent>
                              </Card>

                              <Card className="bg-secondary/10">
                                <CardContent className="p-4 space-y-1">
                                  <h4 className="font-bold flex items-center gap-2 text-primary mb-3 pb-2 border-b">
                                    <Building2 className="h-4 w-4" /> Bank Account Info
                                  </h4>
                                  <InfoRow label="Bank Name" value={a.bankName} />
                                  <InfoRow label="Account Number" value={a.accountNumber} />
                                  <InfoRow label="IFSC Code" value={a.ifscCode} />
                                  <InfoRow label="Availability" value={a.availability} />
                                  <div className="p-3 mt-4 bg-primary/5 rounded-lg border border-primary/10">
                                    <p className="text-[10px] text-primary uppercase font-bold mb-1">Internal Note</p>
                                    <p className="text-xs text-muted-foreground italic">Check bank details before processing payouts.</p>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>

                            {/* Group 2: Full Personal Details */}
                            <Card className="bg-secondary/10">
                              <CardContent className="p-4">
                                <h4 className="font-bold flex items-center gap-2 text-primary mb-4 pb-2 border-b">
                                  <User className="h-4 w-4" /> Comprehensive Personal Data
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
                                  <InfoRow label="Full Name" value={a.name} />
                                  <InfoRow label="Primary Phone" value={a.phone} icon={Phone} />
                                  <InfoRow label="Mobile Number" value={a.mobileNumber} />
                                  <InfoRow label="Emergency Contact" value={a.emergencyNumber} />
                                  <InfoRow label="Age" value={a.age} />
                                  <InfoRow label="Gender" value={a.gender} />
                                  <InfoRow label="Date of Birth" value={a.dob} icon={Calendar} />
                                  <InfoRow label="Languages" value={a.languageSpoken?.join(", ")} icon={Languages} />
                                  <InfoRow label="Willingness to Travel" value={a.travelWillingness} />

                                  <InfoRow label="District" value={a.district} />
                                  <InfoRow label="State" value={a.state} />
                                </div>
                              </CardContent>
                            </Card>

                            {/* Group 3: Professional Info */}
                            <Card className="bg-secondary/10">
                              <CardContent className="p-4">
                                <h4 className="font-bold flex items-center gap-2 text-primary mb-4 pb-2 border-b">
                                  <Briefcase className="h-4 w-4" /> Professional Statistics
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
                                  <InfoRow label="Category" value={a.category} />
                                  <InfoRow label="Subcategory" value={a.subcategory} />
                                  <InfoRow label="Experience" value={a.experience + " Years"} />
                                  <InfoRow label="Applied On" value={a.createdAt?.toDate().toLocaleDateString()} />
                                </div>
                                <div className="mt-4">
                                  <p className="text-sm font-semibold mb-2">Detailed Bio:</p>
                                  <div className="p-4 rounded-xl bg-background border text-sm text-muted-foreground leading-relaxed">
                                    {a.bio || "No detailed bio provided."}
                                  </div>
                                </div>
                                {a.types && (
                                  <div className="mt-4">
                                    <p className="text-sm font-semibold mb-2">Specialization Types:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {a.types.map((t: string) => (
                                        <Badge key={t} variant="secondary" className="px-3 py-1">{t}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>

                            {/* Gallery */}
                            {a.galleryPhotos && (
                              <div className="space-y-4">
                                <h4 className="text-lg font-bold flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /> Portfolio Media</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                                  {a.galleryPhotos.map((p: string, i: number) => (
                                    <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border">
                                      <img src={p} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={`Media ${i}`} />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Socials */}
                            {a.socialLinks && (
                              <div className="space-y-4">
                                <h4 className="text-lg font-bold flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Online Presence</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {a.socialLinks.map((link: any, i: number) => (
                                    <div key={i} className="p-4 border rounded-2xl bg-secondary/5 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          {link.platform === "youtube" ? <Youtube className="h-5 w-5 text-red-500" /> : <Globe className="h-5 w-5 text-primary" />}
                                          <span className="font-bold uppercase text-xs">{link.platform}</span>
                                        </div>
                                        <a href={link.url} target="_blank" className="text-[10px] text-blue-500 underline">Open Link</a>
                                      </div>
                                      <p className="text-xs truncate text-muted-foreground">{link.url}</p>
                                      {link.platform === "youtube" && getYoutubeEmbedUrl(link.url) && (
                                        <div className="aspect-video rounded-xl overflow-hidden border">
                                          <iframe width="100%" height="100%" src={getYoutubeEmbedUrl(link.url)!} allowFullScreen></iframe>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="preview" className="pt-4 pb-10">
                            <div className="max-w-3xl mx-auto border rounded-2xl overflow-hidden shadow-2xl bg-background">
                              {/* Fake Profile Header */}
                              <div className="relative h-48 bg-muted">
                                {a.coverPhoto && <img src={a.coverPhoto} className="w-full h-full object-cover" />}
                                <div className="absolute -bottom-12 left-8">
                                  <img
                                    src={a.profilePhoto || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300"}
                                    className="w-32 h-32 rounded-2xl border-4 border-background object-cover shadow-xl"
                                  />
                                </div>
                              </div>
                              <div className="pt-16 px-8 pb-8 space-y-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h2 className="text-3xl font-display font-bold flex items-center gap-2">
                                      {a.name} <Check className="h-6 w-6 text-blue-500 fill-blue-500/10" />
                                    </h2>
                                    <p className="text-muted-foreground">{a.category} • {a.subcategory}</p>
                                  </div>
                                  <div className="text-right">
                                    <div className="flex items-center gap-1 text-yellow-500 font-bold">
                                      <Star className="h-5 w-5 fill-yellow-500" /> 5.0 (Review Preview)
                                    </div>
                                    <p className="text-sm text-muted-foreground">{a.district}, {a.state}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  {a.types?.slice(0, 3).map((t: string) => (
                                    <Badge key={t} variant="outline" className="rounded-full">{t}</Badge>
                                  ))}
                                </div>
                                <div className="p-4 bg-secondary/30 rounded-2xl">
                                  <p className="text-sm leading-relaxed">{a.bio || "No biography provided yet."}</p>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                  {a.galleryPhotos?.slice(0, 4).map((p: string, i: number) => (
                                    <img key={i} src={p} className="aspect-square rounded-xl object-cover hover:opacity-80 cursor-pointer transition-opacity" />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <p className="text-center text-xs text-muted-foreground mt-6 italic">Note: This is an internal preview of how the artist's page will appear to clients.</p>
                          </TabsContent>
                        </Tabs>
                      </div>

                      <div className="p-6 border-t bg-secondary/10 flex gap-3">
                        <Button onClick={() => handleApprove(a.id)} className="flex-1 gradient-bg border-0 text-foreground h-12 text-lg font-display font-semibold">
                          <Check className="mr-2 h-5 w-5" /> Verify & Publish to Marketplace
                        </Button>
                        <Button onClick={() => handleReject(a.id)} variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10 h-12">
                          <X className="mr-2 h-5 w-5" /> Reject Pending
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button onClick={() => handleApprove(a.id)} size="sm" className="gradient-bg border-0 text-foreground w-full">
                    <Check className="h-4 w-4 mr-1" /> Quick Approve
                  </Button>
                  <Button onClick={() => handleReject(a.id)} variant="ghost" size="sm" className="w-full text-destructive hover:bg-destructive/10">
                    <X className="h-4 w-4 mr-1" /> Direct Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
