import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, Clock, MapPin, Phone, Loader2, Calendar } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

export default function ArtistBookings() {
    const { artistData } = useAuth();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!artistData?.id) return;

        const q = query(collection(db, "bookings"), where("artistId", "==", artistData.id));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            // Sort by date, newest first
            data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setBookings(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [artistData?.id]);

    const updateBookingStatus = async (bookingId: string, status: string) => {
        try {
            await updateDoc(doc(db, "bookings", bookingId), { status, updatedAt: serverTimestamp() });
            toast({ title: `Booking ${status === "accepted" ? "Accepted ✅" : "Declined ❌"}` });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not update booking." });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "accepted": return "bg-green-500/10 text-green-600 border-green-500/20";
            case "rejected":
            case "declined": return "bg-red-500/10 text-red-600 border-red-500/20";
            case "completed": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
            default: return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
        }
    };

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="font-display text-2xl font-bold mb-1">Booking Requests</h1>
                <p className="text-sm text-muted-foreground">{bookings.length} total bookings</p>
            </motion.div>

            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : bookings.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                        <CardContent className="p-12 text-center">
                            <CalendarCheck className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-1">No Bookings Yet</h3>
                            <p className="text-muted-foreground text-sm">When someone books you, it will appear here.</p>
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                <div className="grid gap-4">
                    {bookings.map((booking, index) => (
                        <motion.div
                            key={booking.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="hover-lift">
                                <CardContent className="p-5">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold">{booking.clientName || "Client"}</h3>
                                                <Badge className={getStatusColor(booking.status || "pending")}>
                                                    {booking.status || "pending"}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                                {booking.eventType && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3.5 w-3.5" /> {booking.eventType}
                                                    </span>
                                                )}
                                                {booking.eventDate && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3.5 w-3.5" /> {booking.eventDate}
                                                    </span>
                                                )}
                                                {booking.location && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-3.5 w-3.5" /> {booking.location}
                                                    </span>
                                                )}
                                                {booking.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="h-3.5 w-3.5" /> {booking.phone}
                                                    </span>
                                                )}
                                            </div>
                                            {booking.message && (
                                                <p className="text-sm text-muted-foreground">{booking.message}</p>
                                            )}
                                        </div>

                                        {(!booking.status || booking.status === "pending") && (
                                            <div className="flex gap-2 flex-shrink-0">
                                                <Button size="sm" className="gradient-bg border-0 text-primary-foreground" onClick={() => updateBookingStatus(booking.id, "accepted")}>
                                                    Accept
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateBookingStatus(booking.id, "declined")}>
                                                    Decline
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
