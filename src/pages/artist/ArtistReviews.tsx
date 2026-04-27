import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MessageSquare } from "lucide-react";

export default function ArtistReviews() {
    const { artistData } = useAuth();

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="font-display text-2xl font-bold mb-1">Reviews & Ratings</h1>
                <p className="text-sm text-muted-foreground">See what clients say about you</p>
            </motion.div>

            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <div className="grid grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="p-5 text-center">
                            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-3">
                                <Star className="h-6 w-6 text-yellow-500" />
                            </div>
                            <p className="text-3xl font-bold">{artistData?.rating || 0}</p>
                            <p className="text-sm text-muted-foreground">Average Rating</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5 text-center">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                                <MessageSquare className="h-6 w-6 text-blue-500" />
                            </div>
                            <p className="text-3xl font-bold">{artistData?.reviews || 0}</p>
                            <p className="text-sm text-muted-foreground">Total Reviews</p>
                        </CardContent>
                    </Card>
                </div>
            </motion.div>

            {/* Placeholder */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                    <CardContent className="p-12 text-center">
                        <MessageSquare className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-1">No Reviews Yet</h3>
                        <p className="text-muted-foreground text-sm">
                            Reviews from clients will appear here once you start getting bookings.
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
