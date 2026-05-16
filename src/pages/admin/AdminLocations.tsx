import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ChevronDown, ChevronRight, Loader2, MapPin, X, Search, Database } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, orderBy, writeBatch } from "firebase/firestore";
import { firebaseErrorMessage, toastForFirestoreError } from "@/lib/firebaseSafe";
import { getDefaultIndiaStateDocuments } from "@/lib/indiaLocations";

export default function AdminLocations() {
    const [states, setStates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Add State Dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newStateName, setNewStateName] = useState("");
    const [newDistrictInput, setNewDistrictInput] = useState("");
    const [newDistricts, setNewDistricts] = useState<string[]>([]);

    // Add more districts to existing state
    const [addDistrictInput, setAddDistrictInput] = useState("");

    useEffect(() => {
        let mounted = true;
        const useDefaultLocations = async () => {
            const defaults = await getDefaultIndiaStateDocuments();
            if (mounted) setStates(defaults);
        };

        const q = query(collection(db, "states"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            if (data.length > 0) {
                setStates(data);
            } else {
                void useDefaultLocations();
            }
            setLoading(false);
        }, (error) => {
            console.error(error);
            toastForFirestoreError(error, "Locations unavailable", "Could not load states and districts.", toast);
            void useDefaultLocations();
            setLoading(false);
        });
        return () => {
            mounted = false;
            unsubscribe();
        };
    }, []);

    // --- Add State Flow ---
    const handleAddDistrictToList = () => {
        const raw = newDistrictInput.trim();
        if (!raw) return;
        // Support comma, newline, or semicolon separated input
        const names = raw.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
        const duplicates: string[] = [];
        const added: string[] = [];
        setNewDistricts(prev => {
            const updated = [...prev];
            names.forEach(name => {
                if (updated.includes(name)) {
                    duplicates.push(name);
                } else {
                    updated.push(name);
                    added.push(name);
                }
            });
            return updated.sort();
        });
        if (duplicates.length > 0) {
            toast({ variant: "destructive", title: "Duplicates Skipped", description: `${duplicates.join(", ")} already added.` });
        }
        if (added.length > 0) {
            toast({ title: `${added.length} district(s) added` });
        }
        setNewDistrictInput("");
    };

    const handleRemoveDistrictFromList = (district: string) => {
        setNewDistricts(prev => prev.filter(d => d !== district));
    };

    const handleCreateState = async () => {
        if (!newStateName.trim()) {
            toast({ variant: "destructive", title: "State Name Required", description: "Please enter the state name." });
            return;
        }
        setLoading(true);
        try {
            await addDoc(collection(db, "states"), {
                name: newStateName.trim(),
                districts: newDistricts,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            toast({ title: "State Added ✅", description: `${newStateName} with ${newDistricts.length} districts saved.` });
            setNewStateName("");
            setNewDistricts([]);
            setNewDistrictInput("");
            setDialogOpen(false);
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "Could not add state." });
        } finally {
            setLoading(false);
        }
    };

    // --- Existing State: Add/Remove District ---
    const handleAddDistrictToState = async (stateId: string) => {
        const raw = addDistrictInput.trim();
        if (!raw) return;
        const state = states.find(s => s.id === stateId);
        if (!state) return;
        if (state.localFallback) {
            toast({ title: "Default location", description: "Seed locations to Firebase before editing this state." });
            return;
        }
        // Support comma, newline, or semicolon separated input
        const names = raw.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
        const existing = state.districts || [];
        const duplicates = names.filter(n => existing.includes(n));
        const toAdd = names.filter(n => !existing.includes(n));
        if (toAdd.length === 0) {
            toast({ variant: "destructive", title: "All Duplicates", description: "All districts already exist." });
            return;
        }
        try {
            const updatedDistricts = [...existing, ...toAdd].sort();
            await updateDoc(doc(db, "states", stateId), { districts: updatedDistricts, updatedAt: serverTimestamp() });
            toast({ title: `${toAdd.length} district(s) added to ${state.name}` });
            if (duplicates.length > 0) {
                toast({ variant: "destructive", title: "Duplicates Skipped", description: `${duplicates.join(", ")} already existed.` });
            }
            setAddDistrictInput("");
        } catch (error) {
            toast({ variant: "destructive", title: "Error" });
        }
    };

    const handleRemoveDistrictFromState = async (stateId: string, district: string) => {
        const state = states.find(s => s.id === stateId);
        if (!state) return;
        if (state.localFallback) {
            toast({ title: "Default location", description: "Seed locations to Firebase before editing this state." });
            return;
        }
        try {
            const updatedDistricts = state.districts.filter((d: string) => d !== district);
            await updateDoc(doc(db, "states", stateId), { districts: updatedDistricts, updatedAt: serverTimestamp() });
            toast({ title: "District Removed" });
        } catch (error) {
            toast({ variant: "destructive", title: "Error" });
        }
    };

    const handleDeleteState = async (id: string) => {
        const state = states.find(s => s.id === id);
        if (state?.localFallback) {
            toast({ title: "Default location", description: "Seed locations to Firebase before editing or deleting this state." });
            return;
        }
        if (!confirm("Delete this state and all its districts?")) return;
        try {
            await deleteDoc(doc(db, "states", id));
            toast({ title: "State Deleted" });
        } catch (error) {
            toast({ variant: "destructive", title: "Error" });
        }
    };

    const handleSeedDefaultLocations = async () => {
        setLoading(true);
        try {
            const defaults = await getDefaultIndiaStateDocuments();
            const batch = writeBatch(db);
            defaults.forEach(({ localFallback, ...state }) => {
                batch.set(doc(db, "states", state.isoCode), {
                    ...state,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                }, { merge: true });
            });
            await batch.commit();
            toast({ title: "Locations seeded", description: "All Indian states and districts are now saved in Firebase." });
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Seeding failed", description: firebaseErrorMessage(error, "Could not seed locations.") });
        } finally {
            setLoading(false);
        }
    };

    const filteredStates = states.filter(s =>
        s.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="font-display text-2xl font-bold mb-1">States & Districts</h1>
                    <p className="text-sm text-muted-foreground">{states.length} states · Add Indian states and their districts</p>
                </div>
                <div className="flex gap-2">
                <Button onClick={handleSeedDefaultLocations} variant="secondary" size="sm">
                    <Database className="h-4 w-4 mr-2" /> Seed India Defaults
                </Button>
                <Dialog open={dialogOpen} onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) { setNewStateName(""); setNewDistricts([]); setNewDistrictInput(""); }
                }}>
                    <DialogTrigger asChild>
                        <Button className="gradient-bg border-0 text-primary-foreground font-semibold">
                            <Plus className="h-4 w-4 mr-2" /> Add State
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar">
                        <DialogHeader>
                            <DialogTitle className="font-display text-xl">Add New State</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-5 pt-2">
                            {/* State Name */}
                            <div className="space-y-2">
                                <Label className="font-semibold">State Name *</Label>
                                <Input
                                    value={newStateName}
                                    onChange={(e) => setNewStateName(e.target.value)}
                                    placeholder="e.g. Maharashtra"
                                    className="h-11"
                                />
                            </div>

                            {/* Districts Input */}
                            <div className="space-y-2">
                                <Label className="font-semibold">Districts</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={newDistrictInput}
                                        onChange={(e) => setNewDistrictInput(e.target.value)}
                                        placeholder="e.g. Pune, Mumbai, Nagpur (comma separated)"
                                        className="h-10"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddDistrictToList();
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleAddDistrictToList}
                                        disabled={!newDistrictInput.trim()}
                                        className="gradient-bg border-0 h-10 px-4"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">Type multiple districts separated by commas, then press Enter or click +</p>
                            </div>

                            {/* District List */}
                            {newDistricts.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                                        Added Districts ({newDistricts.length})
                                    </Label>
                                    <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-secondary/30 border max-h-48 overflow-y-auto no-scrollbar">
                                        {newDistricts.map((dist) => (
                                            <Badge key={dist} variant="secondary" className="pl-3 pr-1 py-1.5 text-sm flex items-center gap-1 group">
                                                {dist}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveDistrictFromList(dist)}
                                                    className="ml-1 p-0.5 rounded-full hover:bg-destructive hover:text-foreground transition-colors"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Save Button */}
                            <Button
                                onClick={handleCreateState}
                                disabled={loading || !newStateName.trim()}
                                className="w-full h-11 gradient-bg border-0 text-primary-foreground font-semibold"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
                                Save State with {newDistricts.length} Districts
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search states..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            )}

            {/* Empty State */}
            {!loading && states.length === 0 && (
                <Card>
                    <CardContent className="py-10 text-center">
                        <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No States Added Yet</h3>
                        <p className="text-muted-foreground mb-4">Click "Add State" to start adding Indian states and their districts.</p>
                    </CardContent>
                </Card>
            )}

            {/* State List */}
            <div className="grid gap-3">
                {filteredStates.map((state) => (
                    <Card key={state.id} className="hover-lift overflow-hidden">
                        <CardContent className="p-0">
                            {/* State Header */}
                            <div className="flex items-center justify-between p-4">
                                <button
                                    onClick={() => setExpanded(expanded === state.id ? null : state.id)}
                                    className="flex items-center gap-3 text-left flex-1"
                                >
                                    {expanded === state.id ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4" />}
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="font-semibold text-base">{state.name}</span>
                                        <p className="text-xs text-muted-foreground">{state.districts?.length || 0} districts</p>
                                    </div>
                                </button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteState(state.id)} className="text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Expanded: Districts */}
                            {expanded === state.id && (
                                <div className="px-4 pb-5 pt-2 border-t bg-secondary/10">
                                    {/* Existing Districts */}
                                    <div className="mb-4">
                                        <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
                                            Districts ({state.districts?.length || 0})
                                        </Label>
                                        <div className="flex flex-wrap gap-2">
                                            {state.districts?.map((dist: string) => (
                                                <Badge key={dist} variant="secondary" className="pl-3 pr-1 py-1.5 text-sm flex items-center gap-1 group">
                                                    {dist}
                                                    <button
                                                        onClick={() => handleRemoveDistrictFromState(state.id, dist)}
                                                        className="ml-1 p-0.5 rounded-full hover:bg-destructive hover:text-foreground transition-colors opacity-50 group-hover:opacity-100"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                            {(!state.districts || state.districts.length === 0) && (
                                                <span className="text-sm text-muted-foreground italic">No districts added yet.</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Add More Districts */}
                                    <div className="flex gap-2 max-w-md">
                                        <Input
                                            placeholder="Add districts (comma separated)..."
                                            value={addDistrictInput}
                                            onChange={(e) => setAddDistrictInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddDistrictToState(state.id);
                                                }
                                            }}
                                            className="h-9 text-sm"
                                        />
                                        <Button
                                            size="sm"
                                            onClick={() => handleAddDistrictToState(state.id)}
                                            disabled={!addDistrictInput.trim()}
                                            className="gradient-bg border-0 h-9 px-4"
                                        >
                                            <Plus className="h-4 w-4 mr-1" /> Add
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
