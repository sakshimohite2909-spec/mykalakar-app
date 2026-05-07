import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Edit, Trash2, BadgeCheck, Eye, Loader2, Database, Star, TrendingUp, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, updateDoc, doc, deleteDoc, writeBatch, serverTimestamp, setDoc } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { initialArtists } from "@/data/mockData";
import { firebaseErrorMessage, toastForFirestoreError } from "@/lib/firebaseSafe";
import { getIndiaDistrictsByStateName, getIndiaStates } from "@/lib/indiaLocations";


export default function AdminArtists() {
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryInput, setQueryInput] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<any>(null);
  const [editData, setEditData] = useState({
    rating: 0,
    reviews: 0,
    trending: false,
    verified: false
  });
  const [newArtist, setNewArtist] = useState({
    name: "",
    category: "",
    subcategory: "",
    state: "",
    city: "",
    bio: "",
    contactNumber: "",
    experience: 0,
    services: "",
    profilePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
    availability: "available",
    rating: 0,
    reviews: 0,
    verified: false,
    trending: false
  });

  const stateOptions = useMemo(() => getIndiaStates().map((state) => state.name), []);
  const [districtOptions, setDistrictOptions] = useState<string[]>([]);
  const categories = [
    "Music Artists",
    "Dance Artists",
    "Stage & Entertainment",
    "Creative Artists",
    "Spiritual / Religious",
    "Visual Artists",
    "Cultural Artists",
    "Event Artists",
    "Acting & Media",
    "Traditional Maharashtra"
  ];

  useEffect(() => {
    let active = true;

    if (!newArtist.state) {
      setDistrictOptions([]);
      return () => {
        active = false;
      };
    }

    setDistrictOptions([]);
    getIndiaDistrictsByStateName(newArtist.state)
      .then((options) => {
        if (active) setDistrictOptions(options);
      })
      .catch((error) => {
        console.error("Failed to load districts", error);
        if (active) setDistrictOptions([]);
      });

    return () => {
      active = false;
    };
  }, [newArtist.state]);

  useEffect(() => {
    const q = query(collection(db, "artists"), where("status", "==", "active"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setArtists(data);
      setLoading(false);
    }, (error) => {
      console.error(error);
      toastForFirestoreError(error, "Artists unavailable", "Could not load artists.", toast);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filtered = artists.filter((a) => {
    const q = queryInput.toLowerCase();
    return (
      (a.name?.toLowerCase() ?? "").includes(q) ||
      (a.professionalName?.toLowerCase() ?? "").includes(q) ||
      (a.subcategory?.toLowerCase() ?? "").includes(q) ||
      (a.category?.toLowerCase() ?? "").includes(q)
    );
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this artist?")) return;
    try {
      await deleteDoc(doc(db, "artists", id));
      toast({ title: "Artist Deleted", description: "Artist has been removed." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete artist." });
    }
  };

  const openEditModal = (artist: any) => {
    setEditingArtist(artist);
    setEditData({
      rating: artist.stats?.rating || artist.rating || 0,
      reviews: artist.stats?.reviews || artist.reviews || 0,
      trending: artist.trending || false,
      verified: artist.verified || false
    });
    setEditModalOpen(true);
  };

  const handleUpdateArtist = async () => {
    if (!editingArtist) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "artists", editingArtist.id), {
        "stats.rating": Number(editData.rating),
        "stats.reviews": Number(editData.reviews),
        trending: editData.trending,
        verified: editData.verified,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Artist Updated ✅", description: "Artist details have been saved." });
      setEditModalOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not update artist." });
    } finally {
      setLoading(false);
    }
  };

  const handleAddArtist = async () => {
    if (!newArtist.name || !newArtist.category || !newArtist.state || !newArtist.city) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill in all required fields." });
      return;
    }

    setLoading(true);
    try {
      const servicesArray = newArtist.services.split(',').map(s => s.trim()).filter(Boolean);

      const artistRef = doc(collection(db, "artists"));
      await setDoc(artistRef, {
        uid: artistRef.id,
        name: newArtist.name,
        category: newArtist.category,
        subcategory: newArtist.subcategory,
        categories: [newArtist.category],
        artsList: [{
          category: newArtist.category,
          subcategory: newArtist.subcategory,
          types: [],
          soloPrice: 0,
          duoPrice: 0,
          teamPrice: 0
        }],
        state: newArtist.state,
        district: newArtist.city,
        bio: newArtist.bio,
        mobileNumber: newArtist.contactNumber,
        experience: Number(newArtist.experience),
        services: servicesArray,
        media: {
          profilePhoto: newArtist.profilePhoto,
          coverPhoto: newArtist.profilePhoto,
          galleryPhotos: [newArtist.profilePhoto]
        },
        pricing: {
          soloPrice: 0,
          duoPrice: 0,
          teamPrice: 0,
          feeNotes: ""
        },
        availability: newArtist.availability,
        stats: {
          rating: Number(newArtist.rating),
          reviews: Number(newArtist.reviews),
          followers: 0,
          profileViews: 0,
          totalBookings: 0
        },
        verified: newArtist.verified,
        trending: newArtist.trending,
        socialLinks: [],
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast({ title: "Artist Added ✅", description: `${newArtist.name} has been added successfully.` });
      setAddModalOpen(false);
      setNewArtist({
        name: "",
        category: "",
        subcategory: "",
        state: "",
        city: "",
        bio: "",
        contactNumber: "",
        experience: 0,
        services: "",
        profilePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
        availability: "available",
        rating: 0,
        reviews: 0,
        verified: false,
        trending: false
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not add artist." });
    } finally {
      setLoading(false);
    }
  };

  const seedArtists = async () => {
    if (artists.length > 0) {
      toast({ title: "Artists already exist" });
      return;
    }
    setLoading(true);
    try {
      const batch = writeBatch(db);
      initialArtists.forEach((a) => {
        const docRef = doc(collection(db, "artists"));
        batch.set(docRef, {
          uid: docRef.id,
          ...a,
          status: "active",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();
      toast({ title: "Artists Seeded ✅", description: "Database has been populated with mock artists." });
    } catch (error) {
      toast({ variant: "destructive", title: "Seeding failed" });
    } finally {
      setLoading(false);
    }
  };

  const seedIndianStates = async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const indianStates = getIndiaStates();

      for (const stateInfo of indianStates) {
        const docRef = doc(db, "states", stateInfo.isoCode);
        const districts = await getIndiaDistrictsByStateName(stateInfo.name);

        batch.set(docRef, {
          name: stateInfo.name,
          isoCode: stateInfo.isoCode,
          districts: districts,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      await batch.commit();
      toast({ title: "States Seeded ✅", description: "Indian states and districts have been seeded." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Seeding failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">Manage Artists</h1>
          <p className="text-sm text-muted-foreground">{artists.length} artists on the platform</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAddModalOpen(true)} className="gradient-bg border-0">
            <Plus className="h-4 w-4 mr-2" /> Add Artist
          </Button>
          <Button onClick={seedArtists} variant="outline" size="sm">
            <Database className="h-4 w-4 mr-2" /> Seed Mock Artists
          </Button>
          <Button onClick={seedIndianStates} variant="secondary" size="sm">
            <Database className="h-4 w-4 mr-2" /> Seed States & Districts
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search artists..." value={queryInput} onChange={(e) => setQueryInput(e.target.value)} className="pl-10" />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artist</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No artists found.
                    </TableCell>
                  </TableRow>
                ) : null}
                {filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={a.media?.profilePhoto || a.profilePhoto || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300"}
                          alt={a.name}
                          className="w-9 h-9 rounded-lg object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-sm">{a.name}</span>
                            {a.verified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
                          </div>
                          <span className="text-xs text-muted-foreground">{a.subcategory}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{a.category}</TableCell>
                    <TableCell className="text-sm">{a.district || a.city}</TableCell>
                    <TableCell className="text-sm">⭐ {a.stats?.rating || a.rating || 0}</TableCell>
                    <TableCell>
                      <Badge variant={a.availability === "available" ? "default" : "secondary"} className={a.availability === "available" ? "bg-green-600 text-primary-foreground border-0" : ""}>
                        {a.availability}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/artist/${a.id}`}>
                          <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(a)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Artist - {editingArtist?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Star className="h-4 w-4 text-primary" /> Rating (0-5)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={editData.rating}
                  onChange={(e) => setEditData({ ...editData, rating: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Total Reviews</Label>
                <Input
                  type="number"
                  value={editData.reviews}
                  onChange={(e) => setEditData({ ...editData, reviews: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Trending Status</p>
                  <p className="text-xs text-muted-foreground">Show in featured/top sections</p>
                </div>
              </div>
              <Switch
                checked={editData.trending}
                onCheckedChange={(v) => setEditData({ ...editData, trending: v })}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Verified Badge</p>
                  <p className="text-xs text-muted-foreground">Display blue checkmark</p>
                </div>
              </div>
              <Switch
                checked={editData.verified}
                onCheckedChange={(v) => setEditData({ ...editData, verified: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateArtist} className="gradient-bg border-0 text-primary-foreground font-semibold">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Artist Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Artist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Artist Name *</Label>
                <Input
                  placeholder="Enter artist name"
                  value={newArtist.name}
                  onChange={(e) => setNewArtist({ ...newArtist, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Number</Label>
                <Input
                  placeholder="+91 98765 43210"
                  value={newArtist.contactNumber}
                  onChange={(e) => setNewArtist({ ...newArtist, contactNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={newArtist.category} onValueChange={(v) => setNewArtist({ ...newArtist, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subcategory</Label>
                <Input
                  placeholder="e.g., Classical Singer"
                  value={newArtist.subcategory}
                  onChange={(e) => setNewArtist({ ...newArtist, subcategory: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>State *</Label>
                <Select
                  value={newArtist.state}
                  onValueChange={(v) => setNewArtist({ ...newArtist, state: v, city: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {stateOptions.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>District *</Label>
                <Select
                  value={newArtist.city}
                  onValueChange={(v) => setNewArtist({ ...newArtist, city: v })}
                  disabled={!newArtist.state}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={newArtist.state ? "Select district" : "Select state first"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {districtOptions.map((district) => (
                      <SelectItem key={district} value={district}>{district}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Experience (years)</Label>
                <Input
                  type="number"
                  placeholder="10"
                  value={newArtist.experience}
                  onChange={(e) => setNewArtist({ ...newArtist, experience: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                placeholder="Brief description about the artist..."
                value={newArtist.bio}
                onChange={(e) => setNewArtist({ ...newArtist, bio: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Services (comma separated)</Label>
              <Input
                placeholder="Live Concert, Wedding Ceremony, Private Events"
                value={newArtist.services}
                onChange={(e) => setNewArtist({ ...newArtist, services: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Profile Photo URL</Label>
              <Input
                placeholder="https://..."
                value={newArtist.profilePhoto}
                onChange={(e) => setNewArtist({ ...newArtist, profilePhoto: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Rating (0-5)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={newArtist.rating}
                  onChange={(e) => setNewArtist({ ...newArtist, rating: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Reviews</Label>
                <Input
                  type="number"
                  value={newArtist.reviews}
                  onChange={(e) => setNewArtist({ ...newArtist, reviews: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Availability</Label>
                <Select value={newArtist.availability} onValueChange={(v) => setNewArtist({ ...newArtist, availability: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newArtist.verified}
                  onCheckedChange={(v) => setNewArtist({ ...newArtist, verified: v })}
                />
                <Label>Verified</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newArtist.trending}
                  onCheckedChange={(v) => setNewArtist({ ...newArtist, trending: v })}
                />
                <Label>Trending</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddArtist} className="gradient-bg border-0 text-primary-foreground font-semibold">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Artist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
