import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Edit, Trash2, BadgeCheck, Eye, Loader2, Database, Star, TrendingUp, Plus, Layers } from "lucide-react";
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
import { firebaseErrorMessage, logFirebaseError, requireAuthUid, sanitizePayload, toastForFirestoreError } from "@/lib/firebaseSafe";
import { getIndiaDistrictsByStateName, getIndiaStates } from "@/lib/indiaLocations";
import { CATEGORY_STRUCTURE, MAIN_CATEGORIES, normalizeArtistRecord } from "@/constants/artistSystem";
import { imageRegistry } from "@/services/ImageRegistryService";
import { useAuth } from "@/contexts/AuthContext";
import { getUsableImageUrl } from "@/utils/fallbackImages";

export default function AdminArtists() {
  const { currentUser } = useAuth();
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
    mainCategory: "",
    category: "",
    state: "",
    district: "",
    bio: "",
    mobileNumber: "",
    experience: 0,
    profilePhoto: imageRegistry.getUniqueImage({ category: "Default", type: "ui" }),
    availability: "available",
    verified: false,
    trending: false
  });

  const stateOptions = useMemo(() => getIndiaStates().map((state) => state.name), []);
  const [districtOptions, setDistrictOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!newArtist.state) { setDistrictOptions([]); return; }
    getIndiaDistrictsByStateName(newArtist.state).then(setDistrictOptions).catch(() => setDistrictOptions([]));
  }, [newArtist.state]);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "artists")),
      (snapshot) => {
        setArtists(snapshot.docs.map(doc => normalizeArtistRecord({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        toastForFirestoreError(error, "Artists unavailable", "Could not load artists.", toast);
      }
    );
    return unsub;
  }, []);

  const filtered = artists.filter(a => {
    const q = queryInput.toLowerCase();
    return a.name?.toLowerCase().includes(q) || a.category?.toLowerCase().includes(q);
  });

  const handleAddArtist = async () => {
    if (!newArtist.name || !newArtist.category || !newArtist.mainCategory) {
      toast({ variant: "destructive", title: "Missing Fields" });
      return;
    }
    setLoading(true);
    try {
      requireAuthUid(currentUser);
      const docRef = doc(collection(db, "artists"));
      const payload = sanitizePayload({
        uid: docRef.id,
        ...newArtist,
        categories: [newArtist.category],
        artsList: [{ category: newArtist.category, mainCategory: newArtist.mainCategory, soloPrice: 0, duoPrice: 0, teamPrice: 0 }],
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      await setDoc(docRef, payload);
      toast({ title: "Artist Added ✅" });
      setAddModalOpen(false);
    } catch (error: any) {
      logFirebaseError(error);
      toast({ variant: "destructive", title: "Error adding artist", description: firebaseErrorMessage(error, "Could not add this artist.") });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-8 rounded-[32px] shadow-sm border border-stone-100">
        <div>
          <h1 className="text-4xl font-black text-stone-950">Artist Registry</h1>
          <p className="text-stone-500 font-bold mt-2 uppercase tracking-widest text-[10px]">Verified talent and cultural heritage practitioners</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => setAddModalOpen(true)} className="h-14 px-8 rounded-2xl bg-orange-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-orange-200">
            <Plus className="mr-2 h-5 w-5" /> Onboard Artist
          </Button>
        </div>
      </div>

      <Card className="rounded-[40px] border-stone-100 shadow-2xl overflow-hidden">
        <CardHeader className="bg-stone-50/50 p-8 border-b border-stone-100">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
            <Input placeholder="Search registry by name or category..." value={queryInput} onChange={e => setQueryInput(e.target.value)} className="h-14 pl-12 rounded-2xl border-stone-200 bg-white shadow-inner font-bold" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-stone-50/50">
              <TableRow className="hover:bg-transparent border-stone-100">
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400">Professional</TableHead>
                <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-stone-400">Specialization</TableHead>
                <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-stone-400">Location</TableHead>
                <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-stone-400">Status</TableHead>
                <TableHead className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(a => (
                <TableRow key={a.id} className="border-stone-50 hover:bg-stone-50/30 transition-colors">
                  <TableCell className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <img src={getUsableImageUrl(a.media?.profilePhoto || a.profilePhoto) || imageRegistry.getUniqueImage({ category: a.subcategory || a.artForm || a.category || "Default", type: "artist", key: a.id || a.name })} className="w-14 h-14 rounded-2xl object-cover shadow-lg" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-stone-950">{a.name}</span>
                          {a.verified && <BadgeCheck className="h-4 w-4 text-orange-600" />}
                        </div>
                        <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">{a.username}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1.5">{a.category}</Badge>
                  </TableCell>
                  <TableCell className="text-sm font-bold text-stone-600">{a.district}, {a.state}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${a.availability === 'available' ? 'bg-green-500 animate-pulse' : 'bg-stone-300'}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-900">{a.availability}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-8">
                    <div className="flex justify-end gap-2">
                       <Link to={`/admin/artist/${a.id}`}>
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white hover:text-orange-600 shadow-sm"><Eye className="h-4 w-4" /></Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => { setEditingArtist(a); setEditModalOpen(true); }} className="rounded-xl hover:bg-white hover:text-blue-600 shadow-sm"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteDoc(doc(db, "artists", a.id))} className="rounded-xl hover:bg-white hover:text-red-600 shadow-sm"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-[48px] border-none shadow-2xl">
          <div className="p-10 bg-stone-950 text-white flex justify-between items-center">
            <h2 className="text-3xl font-black">Onboard New Talent</h2>
            <Button variant="ghost" onClick={() => setAddModalOpen(false)} className="text-white hover:bg-white/10 rounded-full h-12 w-12 text-2xl">×</Button>
          </div>
          <div className="p-10 grid gap-8 md:grid-cols-2 max-h-[70vh] overflow-y-auto no-scrollbar bg-white">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Personal Info</Label>
              <Input placeholder="Full Name" value={newArtist.name} onChange={e => setNewArtist(p => ({ ...p, name: e.target.value }))} className="h-14 rounded-2xl bg-stone-50 border-stone-100 font-bold" />
              <Input placeholder="Mobile Number" value={newArtist.mobileNumber} onChange={e => setNewArtist(p => ({ ...p, mobileNumber: e.target.value }))} className="h-14 rounded-2xl bg-stone-50 border-stone-100 font-bold" />
            </div>
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Categorization</Label>
              <select value={newArtist.mainCategory} onChange={e => setNewArtist(p => ({ ...p, mainCategory: e.target.value, category: "" }))} className="h-14 w-full rounded-2xl bg-stone-50 border border-stone-100 px-6 font-bold">
                <option value="">Select Main Category</option>
                {MAIN_CATEGORIES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={newArtist.category} onChange={e => setNewArtist(p => ({ ...p, category: e.target.value }))} disabled={!newArtist.mainCategory} className="h-14 w-full rounded-2xl bg-stone-50 border border-stone-100 px-6 font-bold">
                <option value="">Select Art Form</option>
                {newArtist.mainCategory && CATEGORY_STRUCTURE[newArtist.mainCategory as keyof typeof CATEGORY_STRUCTURE].subcategories.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Location</Label>
              <select value={newArtist.state} onChange={e => setNewArtist(p => ({ ...p, state: e.target.value, district: "" }))} className="h-14 w-full rounded-2xl bg-stone-50 border border-stone-100 px-6 font-bold">
                <option value="">Select State</option>
                {stateOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={newArtist.district} onChange={e => setNewArtist(p => ({ ...p, district: e.target.value }))} disabled={!newArtist.state} className="h-14 w-full rounded-2xl bg-stone-50 border border-stone-100 px-6 font-bold">
                <option value="">Select District</option>
                {districtOptions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Experience & Bio</Label>
              <Input type="number" placeholder="Years of Experience" value={newArtist.experience} onChange={e => setNewArtist(p => ({ ...p, experience: Number(e.target.value) }))} className="h-14 rounded-2xl bg-stone-50 border-stone-100 font-bold" />
              <Textarea placeholder="Brief Professional Bio..." value={newArtist.bio} onChange={e => setNewArtist(p => ({ ...p, bio: e.target.value }))} className="rounded-2xl bg-stone-50 border-stone-100 font-medium min-h-[100px]" />
            </div>
          </div>
          <div className="p-10 border-t border-stone-100 bg-white flex gap-4">
            <Button variant="ghost" onClick={() => setAddModalOpen(false)} className="h-16 flex-1 rounded-2xl font-black uppercase tracking-widest text-xs">Cancel</Button>
            <Button onClick={handleAddArtist} disabled={loading} className="h-16 flex-[2] rounded-2xl bg-orange-600 text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-orange-100">
              {loading ? <Loader2 className="animate-spin" /> : "Complete Onboarding"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
