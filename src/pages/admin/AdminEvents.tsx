import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Calendar, Database, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { firebaseErrorMessage, toastForFirestoreError } from "@/lib/firebaseSafe";

// Define data locally
const events = [
  {
    id: "1",
    name: "Marriage",
    icon: "💒",
    description: "Complete wedding celebration",
    requiredCategories: ["1", "2", "3", "4"]
  },
  {
    id: "2",
    name: "Birthday Party", 
    icon: "🎂",
    description: "Birthday celebrations",
    requiredCategories: ["3", "4"]
  }
];

const categories = [
  { id: "1", name: "Music Artists", icon: "🎵" },
  { id: "2", name: "Dance Artists", icon: "💃" },
  { id: "3", name: "Stage & Entertainment", icon: "🎭" },
  { id: "4", name: "Creative Artists", icon: "📸" },
];

const eventCategoryMappings = [
  { eventId: "1", categoryId: "1", priority: 1 },
  { eventId: "1", categoryId: "2", priority: 1 },
  { eventId: "2", categoryId: "3", priority: 1 },
];

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
  const [categoryList, setCategoryList] = useState(categories);
  const [categoryPriorities, setCategoryPriorities] = useState<Record<string, number>>({});
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", icon: "🎵" });

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
        const category = categories.find(c => c.id === m.categoryId);
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingEvent(null);
                setFormData({ name: "", icon: "", description: "", requiredCategories: [] });
                setCategoryPriorities({});
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col p-0 gap-0">
            <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
              <DialogTitle>{editingEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
              <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Event Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Marriage"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="icon">Icon (Emoji)</Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="e.g., 💒"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the event"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Required Artist Categories</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddCategory(!showAddCategory)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add New Category
                  </Button>
                </div>
                
                {showAddCategory && (
                  <div className="mb-3 p-3 border rounded-lg bg-secondary/20">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Icon (emoji)"
                        value={newCategory.icon}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
                        className="w-20"
                      />
                      <Input
                        placeholder="Category name"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddNewCategory}
                        disabled={!newCategory.name.trim()}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground mb-2">Select categories and set their priority</p>
                <div className="space-y-3 mt-2 max-h-60 no-scrollbar overflow-y-auto border rounded-lg p-4">
                  {categoryList.map((category) => {
                    const isChecked = formData.requiredCategories.includes(category.id);
                    const priority = categoryPriorities[category.id] || 1;
                    
                    return (
                      <div key={category.id} className="flex items-center justify-between p-3 rounded-lg border bg-secondary/20">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={category.id}
                            checked={isChecked}
                            onCheckedChange={(checked) => handleCategoryToggle(category.id, checked as boolean)}
                          />
                          <Label htmlFor={category.id} className="text-sm font-medium cursor-pointer">
                            {category.icon} {category.name}
                          </Label>
                        </div>
                        
                        {isChecked && (
                          <Select 
                            value={priority.toString()} 
                            onValueChange={(v) => handlePriorityChange(category.id, Number(v))}
                          >
                            <SelectTrigger className="w-32">
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
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Essential categories are required, Optional categories are suggestions
                </p>
              </div>

              </div>{/* end scroll body */}
              <div className="flex-shrink-0 flex justify-end gap-2 px-6 py-4 border-t bg-background">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="gradient-bg border-0 text-white">
                  {editingEvent ? 'Update Event' : 'Add Event'}
                </Button>
              </div>
            </form>
          </DialogContent>
          </Dialog>
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
