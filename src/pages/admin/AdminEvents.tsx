import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Calendar, Database, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { firebaseErrorMessage, toastForFirestoreError } from "@/lib/firebaseSafe";
import { CATEGORY_GROUP_OPTIONS } from "@/constants/artistSystem";

// Define data locally
const events = [
  {
    id: "1",
    name: "Marriage",
    icon: "💒",
    description: "Complete wedding celebration",
    requiredCategories: ["Music Artists", "Dance Artists", "Stage & Entertainment", "Creative Artists"]
  },
  {
    id: "2",
    name: "Birthday Party", 
    icon: "🎂",
    description: "Birthday celebrations",
    requiredCategories: ["Stage & Entertainment", "Creative Artists", "Event Artists"]
  }
];

const categories = CATEGORY_GROUP_OPTIONS.map((category) => ({
  id: category.name,
  name: category.name,
  icon: category.icon,
}));

const eventCategoryMappings = events.flatMap((event) =>
  event.requiredCategories.map((categoryId) => ({
    eventId: event.id,
    categoryId,
    priority: 1,
  }))
);

const AdminEvents = () => {
  const [eventList, setEventList] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    icon: "",
    description: "",
    requiredCategories: [] as string[]
  });
  const [categoryList, setCategoryList] = useState(
    CATEGORY_GROUP_OPTIONS.map((category) => ({
      id: category.name,
      name: category.name,
      icon: category.icon,
      categories: category.subcategories,
    })),
  );
  const [categoryPriorities, setCategoryPriorities] = useState<Record<string, number>>({});
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", icon: "🎵" });
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategoryList = (direction: "up" | "down") => {
    categoryScrollRef.current?.scrollBy({
      top: direction === "down" ? 180 : -180,
      behavior: "smooth",
    });
  };

  // Load events and mappings from Firestore
  useEffect(() => {
    const eventsQuery = query(collection(db, "events"));
    const unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEventList(data);
      setLoading(false);
    }, (error) => {
      console.error(error);
      toastForFirestoreError(error, "Events unavailable", "Could not load events.", toast);
      setLoading(false);
    });

    const mappingsQuery = query(collection(db, "event_category_mappings"));
    const unsubMappings = onSnapshot(mappingsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMappings(data);
    }, (error) => {
      console.error(error);
      toastForFirestoreError(error, "Event mappings unavailable", "Could not load event mappings.", toast);
    });

    return () => {
      unsubEvents();
      unsubMappings();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingEvent) {
        // Update existing event in Firestore
        await updateDoc(doc(db, "events", editingEvent.id), {
          name: formData.name,
          slug: formData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
          icon: formData.icon,
          description: formData.description,
          requiredCategories: formData.requiredCategories,
          updatedAt: serverTimestamp()
        });
        
        // Delete old mappings
        const oldMappings = mappings.filter(m => m.eventId === editingEvent.id);
        const batch = writeBatch(db);
        oldMappings.forEach(m => {
          if (m.id) batch.delete(doc(db, "event_category_mappings", m.id));
        });
        
        // Add new mappings
        formData.requiredCategories.forEach(catId => {
          const docRef = doc(collection(db, "event_category_mappings"));
          batch.set(docRef, {
            eventId: editingEvent.id,
            categoryId: catId,
            priority: categoryPriorities[catId] || 1,
            createdAt: serverTimestamp()
          });
        });
        
        await batch.commit();
        toast({ title: "Event Updated ✅" });
      } else {
        // Add new event to Firestore
        const eventDoc = await addDoc(collection(db, "events"), {
          name: formData.name,
          slug: formData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
          icon: formData.icon,
          description: formData.description,
          requiredCategories: formData.requiredCategories,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // Add mappings
        const batch = writeBatch(db);
        formData.requiredCategories.forEach(catId => {
          const docRef = doc(collection(db, "event_category_mappings"));
          batch.set(docRef, {
            eventId: eventDoc.id,
            categoryId: catId,
            priority: categoryPriorities[catId] || 1,
            createdAt: serverTimestamp()
          });
        });
        
        await batch.commit();
        toast({ title: "Event Added ✅" });
      }

      // Reset form
      setFormData({ name: "", icon: "", description: "", requiredCategories: [] });
      setCategoryPriorities({});
      setEditingEvent(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Could not save event" });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      icon: event.icon,
      description: event.description,
      requiredCategories: event.requiredCategories
    });
    
    // Load priorities from mappings
    const priorities: Record<string, number> = {};
    mappings
      .filter(m => m.eventId === event.id)
      .forEach(m => {
        priorities[m.categoryId] = m.priority;
      });
    setCategoryPriorities(priorities);
    
    setIsDialogOpen(true);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Delete this event?")) return;
    setLoading(true);
    
    try {
      // Delete event
      await deleteDoc(doc(db, "events", eventId));
      
      // Delete associated mappings
      const eventMappings = mappings.filter(m => m.eventId === eventId);
      const batch = writeBatch(db);
      eventMappings.forEach(m => {
        if (m.id) batch.delete(doc(db, "event_category_mappings", m.id));
      });
      await batch.commit();
      
      toast({ title: "Event Deleted" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setLoading(false);
    }
  };

  const seedEvents = async () => {
    if (eventList.length > 0) {
      toast({ title: "Events already exist", description: "Delete them first if you want to re-seed." });
      return;
    }
    
    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      // Add events
      const eventIds: Record<string, string> = {};
      events.forEach((event) => {
        const docRef = doc(collection(db, "events"));
        eventIds[event.id] = docRef.id;
        batch.set(docRef, {
          name: event.name,
          slug: event.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
          icon: event.icon,
          description: event.description,
          requiredCategories: event.requiredCategories,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      
      // Add mappings
      eventCategoryMappings.forEach((mapping) => {
        const docRef = doc(collection(db, "event_category_mappings"));
        batch.set(docRef, {
          eventId: eventIds[mapping.eventId],
          categoryId: mapping.categoryId,
          priority: mapping.priority,
          createdAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      toast({ title: "Events Seeded ✅", description: "Default events have been added to Firestore." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Seeding failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewCategory = () => {
    if (!newCategory.name.trim()) return;
    
    const newCat = {
      id: Date.now().toString(),
      name: newCategory.name,
      icon: newCategory.icon
    };
    
    setCategoryList(prev => [...prev, newCat]);
    setNewCategory({ name: "", icon: "🎵" });
    setShowAddCategory(false);
  };

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        requiredCategories: [...prev.requiredCategories, categoryId]
      }));
      setCategoryPriorities(prev => ({ ...prev, [categoryId]: 1 }));
    } else {
      setFormData(prev => ({
        ...prev,
        requiredCategories: prev.requiredCategories.filter(id => id !== categoryId)
      }));
      setCategoryPriorities(prev => {
        const newPriorities = { ...prev };
        delete newPriorities[categoryId];
        return newPriorities;
      });
    }
  };

  const handlePriorityChange = (categoryId: string, priority: number) => {
    setCategoryPriorities(prev => ({ ...prev, [categoryId]: priority }));
  };

  const getEventCategories = (eventId: string) => {
    return mappings
      .filter(m => m.eventId === eventId)
      .map(m => {
        const category = categoryList.find(c => c.id === m.categoryId || c.name === m.categoryId);
        return { ...category, priority: m.priority };
      })
      .filter(Boolean);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Event Management</h1>
          <p className="text-muted-foreground">Manage event types and their required artist categories</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={seedEvents} variant="outline" size="sm" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Database className="h-4 w-4 mr-2" />}
            Seed Events
          </Button>
          <Button onClick={() => {
            setEditingEvent(null);
            setFormData({ name: "", icon: "", description: "", requiredCategories: [] });
            setCategoryPriorities({});
            setIsDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
          {isDialogOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm pointer-events-auto">
              <div className="flex min-h-full items-start justify-center py-6 sm:items-center">
                <div className="relative flex h-[min(92vh,820px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.35)]">
                  <button
                    type="button"
                    onClick={() => setIsDialogOpen(false)}
                    className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    aria-label="Close event modal"
                  >
                    ×
                  </button>
            <div className="shrink-0 border-b border-slate-200/80 bg-white/95 px-6 py-5">
              <h2 className="text-2xl font-bold text-slate-950">{editingEvent ? "Edit Event" : "Add New Event"}</h2>
            </div>
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pointer-events-auto px-6 py-5 pb-28 space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name" className="text-sm font-bold text-slate-800">Event Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Marriage"
                    className="mt-2 h-12 rounded-xl border-slate-200 bg-white text-slate-950 shadow-inner placeholder:text-slate-400 focus-visible:ring-orange-300"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="icon" className="text-sm font-bold text-slate-800">Icon (Emoji)</Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="e.g., 💒"
                    className="mt-2 h-12 rounded-xl border-slate-200 bg-white text-slate-950 shadow-inner placeholder:text-slate-400 focus-visible:ring-orange-300"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description" className="text-sm font-bold text-slate-800">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the event"
                  className="mt-2 min-h-28 rounded-xl border-slate-200 bg-white text-slate-950 shadow-inner placeholder:text-slate-400 focus-visible:ring-orange-300"
                  required
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-bold text-slate-900">Required Artist Categories</Label>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-orange-600 ring-1 ring-orange-100">
                    Centralized
                  </span>
                </div>
                
                <p className="text-xs text-muted-foreground mb-2">Select categories and set their priority</p>
                <div className="relative mt-3">
                <div
                  ref={categoryScrollRef}
                  className="max-h-56 overflow-y-auto custom-scrollbar pointer-events-auto space-y-3 rounded-2xl border border-slate-200 bg-white p-3 pr-12 shadow-inner"
                >
                  {categoryList.map((category) => {
                    const isChecked = formData.requiredCategories.includes(category.id);
                    const priority = categoryPriorities[category.id] || 1;
                    
                    return (
                      <div
                        key={category.id}
                        className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition-all ${
                          isChecked
                            ? "border-orange-200 bg-orange-50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/40"
                        }`}
                      >
                        <div className="flex min-w-0 items-center space-x-3">
                          <Checkbox
                            id={category.id}
                            checked={isChecked}
                            onCheckedChange={(checked) => handleCategoryToggle(category.id, checked as boolean)}
                          />
                          <Label htmlFor={category.id} className="cursor-pointer truncate text-sm font-bold text-slate-800">
                            {category.icon} {category.name}
                          </Label>
                        </div>
                        
                        {isChecked && (
                          <Select 
                            value={priority.toString()} 
                            onValueChange={(v) => handlePriorityChange(category.id, Number(v))}
                          >
                            <SelectTrigger className="h-10 w-32 rounded-xl border-orange-100 bg-white text-xs font-bold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">
                                <Badge variant="destructive" className="text-xs">Essential</Badge>
                              </SelectItem>
                              <SelectItem value="2">
                                <Badge variant="secondary" className="text-xs">Optional</Badge>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => scrollCategoryList("up")}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-100 bg-white/95 text-orange-600 shadow-md transition hover:bg-orange-50"
                    aria-label="Scroll categories up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCategoryList("down")}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-100 bg-white/95 text-orange-600 shadow-md transition hover:bg-orange-50"
                    aria-label="Scroll categories down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Essential categories are required, Optional categories are suggestions
                </p>
              </div>

              </div>{/* end scroll body */}
              <div className="shrink-0 flex justify-end gap-3 border-t border-slate-200/80 bg-white/95 px-6 py-4 shadow-[0_-12px_30px_rgba(15,23,42,0.05)]">
                <Button type="button" variant="outline" className="h-12 rounded-xl px-6 font-bold" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="gradient-bg h-12 rounded-xl border-0 px-7 font-bold text-white shadow-lg shadow-orange-200">
                  {editingEvent ? 'Update Event' : 'Add Event'}
                </Button>
              </div>
            </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : eventList.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Events Yet</h3>
            <p className="text-muted-foreground mb-4">Get started by adding your first event or seed default events</p>
            <Button onClick={seedEvents} variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Seed Default Events
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {eventList.map((event) => {
            const eventCategories = getEventCategories(event.id);
            const essentialCategories = eventCategories.filter(c => c.priority === 1);
            const optionalCategories = eventCategories.filter(c => c.priority === 2);

            return (
              <Card key={event.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{event.icon}</div>
                      <div>
                        <CardTitle className="text-xl">{event.name}</CardTitle>
                        <p className="text-muted-foreground text-sm mt-1">{event.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(event)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(event.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {essentialCategories.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">Essential Categories</h4>
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {essentialCategories.map((category) => (
                            <Badge key={category?.id} variant="outline">
                              {category?.icon} {category?.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {optionalCategories.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">Optional Categories</h4>
                          <Badge variant="secondary" className="text-xs">Optional</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {optionalCategories.map((category) => (
                            <Badge key={category?.id} variant="outline">
                              {category?.icon} {category?.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
