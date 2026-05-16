import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Calendar, Database, Loader2, ChevronDown, ChevronUp, Layers } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { firebaseErrorMessage, logFirebaseError, requireAuthUid, sanitizePayload, toastForFirestoreError } from "@/lib/firebaseSafe";
import { CATEGORY_GROUP_OPTIONS, normalizeCategoryKey } from "@/constants/artistSystem";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeArtForm, notifyArtistsForApprovedEvent, type EventStatus, type PerformanceType } from "@/lib/eventMatching";

const AdminEvents = () => {
  const { currentUser } = useAuth();
  const [eventList, setEventList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    icon: "",
    description: "",
    requiredCategories: [] as string[],
    artType: "",
    performanceType: "group" as PerformanceType,
    requirements: "",
    budget: "",
    location: "",
    eventDate: "",
    status: "APPROVED" as EventStatus,
  });

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "events")),
      (snapshot) => {
        setEventList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        toastForFirestoreError(error, "Events unavailable", "Could not load events.", toast);
      }
    );
    return unsub;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const uid = requireAuthUid(currentUser);
      const payload = sanitizePayload({
        title: formData.name,
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        artType: formData.artType || formData.requiredCategories[0] || "",
        performanceType: formData.performanceType,
        requirements: formData.requirements || formData.description,
        budget: Number(formData.budget) || 0,
        location: formData.location,
        eventDate: formData.eventDate,
        requiredCategories: formData.requiredCategories,
        status: formData.status,
        updatedAt: serverTimestamp(),
      });

      if (editingEvent) {
        await updateDoc(doc(db, "events", editingEvent.id), payload);
        toast({ title: "Event Updated" });
      } else {
        await addDoc(collection(db, "events"), {
          ...payload,
          createdAt: serverTimestamp(),
          createdBy: uid,
          applicationsCount: 0,
        });
        toast({ title: "Event Created" });
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      logFirebaseError(error);
      toast({ variant: "destructive", title: "Error saving event", description: firebaseErrorMessage(error, "Could not save this event.") });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (cat: string) => {
    setFormData(prev => ({
      ...prev,
      requiredCategories: prev.requiredCategories.includes(cat) 
        ? prev.requiredCategories.filter(c => c !== cat) 
        : [...prev.requiredCategories, cat]
    }));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-8 rounded-[32px] shadow-sm border border-stone-100">
        <div>
          <h1 className="text-4xl font-black text-stone-950">Event Governance</h1>
          <p className="text-stone-500 font-bold mt-2 uppercase tracking-widest text-[10px]">Orchestrate production-grade cultural requirements</p>
        </div>
        <Button onClick={() => { setEditingEvent(null); setFormData({ name: "", icon: "✨", description: "", requiredCategories: [], artType: "", performanceType: "group", requirements: "", budget: "", location: "", eventDate: "", status: "APPROVED" }); setIsDialogOpen(true); }} className="h-14 px-8 rounded-2xl bg-orange-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-orange-200">
          <Plus className="mr-2 h-5 w-5" /> Add Requirement
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {eventList.map(event => (
          <Card key={event.id} className="rounded-[32px] border-stone-100 shadow-xl overflow-hidden group">
            <CardHeader className="bg-stone-50/50 border-b border-stone-100">
              <div className="flex justify-between items-start">
                <span className="text-4xl">{event.icon}</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => { setEditingEvent(event); setFormData({ ...event, budget: String(event.budget || "") }); setIsDialogOpen(true); }} className="rounded-full hover:bg-white hover:text-orange-600 shadow-sm"><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteDoc(doc(db, "events", event.id))} className="rounded-full hover:bg-white hover:text-red-600 shadow-sm"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <CardTitle className="text-2xl font-black mt-4">{event.title || event.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-2 mb-6">
                {event.requiredCategories?.map((cat: string) => (
                  <Badge key={cat} variant="secondary" className="bg-orange-50 text-orange-700 border-none font-bold text-[9px] uppercase tracking-widest px-3 py-1">{cat}</Badge>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-stone-50 pt-4 mt-auto">
                <div className="flex items-center gap-2 text-stone-400 font-bold text-[10px] uppercase tracking-widest">
                  <Layers className="h-3.5 w-3.5" /> {event.performanceType}
                </div>
                <div className="text-orange-600 font-black text-lg">₹{event.budget}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/80 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-4xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-stone-100 flex justify-between items-center shrink-0">
              <h2 className="text-3xl font-black">{editingEvent ? "Refine Requirement" : "New Requirement"}</h2>
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-full h-12 w-12 text-2xl">×</Button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Essential Details</Label>
                  <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Event Name (e.g. Royal Wedding)" className="h-14 rounded-2xl border-stone-100 bg-stone-50 font-bold" required />
                  <Input value={formData.budget} onChange={e => setFormData(p => ({ ...p, budget: e.target.value.replace(/\D/g, "") }))} placeholder="Total Budget (₹)" className="h-14 rounded-2xl border-stone-100 bg-stone-50 font-bold" required />
                  <Input value={formData.icon} onChange={e => setFormData(p => ({ ...p, icon: e.target.value }))} placeholder="Icon Emoji (e.g. 🎭)" className="h-14 rounded-2xl border-stone-100 bg-stone-50 font-bold" />
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Logistics</Label>
                  <Input value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} placeholder="Location (e.g. Pune, Maharashtra)" className="h-14 rounded-2xl border-stone-100 bg-stone-50 font-bold" />
                  <Input type="date" value={formData.eventDate} onChange={e => setFormData(p => ({ ...p, eventDate: e.target.value }))} className="h-14 rounded-2xl border-stone-100 bg-stone-50 font-bold" />
                  <select value={formData.performanceType} onChange={e => setFormData(p => ({ ...p, performanceType: e.target.value as any }))} className="h-14 w-full rounded-2xl border-none bg-stone-100 px-6 font-bold">
                    <option value="solo">Solo Performance</option>
                    <option value="group">Group Performance</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Target Categories</Label>
                <div className="grid gap-6 md:grid-cols-2">
                  {CATEGORY_GROUP_OPTIONS.map(group => (
                    <div key={group.id} className="p-6 rounded-3xl bg-stone-50 border border-stone-100">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl">{group.icon}</span>
                        <span className="text-xs font-black uppercase tracking-widest">{group.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {group.subcategories.map(sub => (
                          <button key={sub} type="button" onClick={() => toggleCategory(sub)} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${formData.requiredCategories.includes(sub) ? "bg-orange-600 text-white shadow-lg shadow-orange-100" : "bg-white text-stone-500 border border-stone-100 hover:border-orange-200"}`}>
                            {sub}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Professional Requirements</Label>
                <Textarea value={formData.requirements} onChange={e => setFormData(p => ({ ...p, requirements: e.target.value }))} placeholder="Describe specific skills, equipment, or rituals needed..." className="min-h-[120px] rounded-3xl border-stone-100 bg-stone-50 p-6 font-medium" />
              </div>

              <div className="pt-10 flex gap-4">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-14 flex-1 rounded-2xl font-black uppercase tracking-widest text-xs">Cancel</Button>
                <Button type="submit" disabled={loading} className="h-14 flex-[2] rounded-2xl bg-stone-950 text-white font-black uppercase tracking-widest text-xs hover:bg-orange-600 transition-colors shadow-2xl">
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : editingEvent ? "Publish Changes" : "Post Requirement"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
