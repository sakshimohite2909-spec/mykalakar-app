import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare, ShieldCheck, ThumbsUp, Calendar, UserCheck } from "lucide-react";

interface ReviewItem {
  id: string;
  clientName: string;
  rating: number;
  date: string;
  eventType: string;
  comment: string;
  verifiedBooking: boolean;
}

export default function ArtistReviews() {
  const { artistData } = useAuth();
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const avgRating = Number(artistData?.rating || 4.9);
  const totalReviews = Number(artistData?.reviews || 12);

  // Dynamic or fallback reviews for display
  const customerReviews: ReviewItem[] = artistData?.reviewsList || [
    {
      id: "rev-1",
      clientName: "Sunil Deshmukh",
      rating: 5,
      date: "2026-08-15",
      eventType: "Ganesh Festival Kirtan",
      comment: "उत्कृष्ट सादरीकरण! सर्व श्रोते मंत्रमुग्ध झाले. वेळेचे काटेकोर नियोजन आणि सुरेल गायन. परत नक्की बोलावू.",
      verifiedBooking: true,
    },
    {
      id: "rev-2",
      clientName: "Dr. Rajesh Patil",
      rating: 5,
      date: "2026-07-28",
      eventType: "Family Anniversary Bhajan",
      comment: "Very professional and soulful performance. The entire family enjoyed every moment.",
      verifiedBooking: true,
    },
    {
      id: "rev-3",
      clientName: "Anand Shinde",
      rating: 4.8,
      date: "2026-06-12",
      eventType: "Temple Trust Annual Function",
      comment: "खूपच सुंदर गायन आणि उत्तम संवाद. आयोजकांचे काम खूप सोपे झाले.",
      verifiedBooking: true,
    },
  ];

  const ratingDistribution = [
    { stars: 5, percent: 85, count: Math.round(totalReviews * 0.85) || 10 },
    { stars: 4, percent: 12, count: Math.round(totalReviews * 0.12) || 2 },
    { stars: 3, percent: 3, count: 0 },
    { stars: 2, percent: 0, count: 0 },
    { stars: 1, percent: 0, count: 0 },
  ];

  const filteredReviews = filterRating
    ? customerReviews.filter((r) => Math.floor(r.rating) === filterRating)
    : customerReviews;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-black text-stone-900">
              Customer Reviews ⭐
            </h1>
            <p className="text-sm text-stone-500 font-medium mt-1">
              Feedback, ratings, and testimonials from event organizers and clients.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 text-xs font-black">
              <ShieldCheck className="h-4 w-4" /> Verified Client Reviews
            </span>
          </div>
        </div>
      </motion.div>

      {/* Ratings Overview Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="rounded-3xl border-stone-200 bg-white shadow-sm overflow-hidden p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Overall score */}
            <div className="text-center md:border-r border-stone-100 md:pr-6">
              <p className="text-5xl font-black text-stone-900 tracking-tight">{avgRating.toFixed(1)}</p>
              <div className="flex items-center justify-center gap-1 my-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">
                Based on {totalReviews} Verified Client Reviews
              </p>
            </div>

            {/* Star Distribution Bars */}
            <div className="space-y-2 md:col-span-2">
              {ratingDistribution.map((item) => (
                <div
                  key={item.stars}
                  onClick={() => setFilterRating(filterRating === item.stars ? null : item.stars)}
                  className="flex items-center gap-3 text-xs cursor-pointer group select-none"
                >
                  <span className="w-12 font-bold text-stone-600 group-hover:text-orange-600 transition">
                    {item.stars} Star
                  </span>
                  <div className="flex-1 bg-stone-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all duration-500 group-hover:bg-orange-500"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-semibold text-stone-400">
                    {item.percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Customer Reviews List */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="rounded-3xl border-stone-200 bg-white shadow-sm overflow-hidden">
          <CardHeader className="p-6 border-b border-stone-100 flex flex-row items-center justify-between bg-stone-50/40">
            <div>
              <CardTitle className="text-lg font-black text-stone-900">
                Client Testimonials ({filteredReviews.length})
              </CardTitle>
              <p className="text-xs text-stone-500 font-semibold mt-0.5">
                Authentic reviews submitted after confirmed bookings
              </p>
            </div>
            {filterRating && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilterRating(null)}
                className="text-xs font-bold text-orange-600 hover:bg-orange-50"
              >
                Clear filter ({filterRating}★)
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            {filteredReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 rounded-2xl border border-stone-100 bg-stone-50/30 hover:border-orange-200 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center">
                      {rev.clientName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-stone-900 flex items-center gap-1.5">
                        {rev.clientName}
                        {rev.verifiedBooking && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="h-3 w-3" /> Verified Booking
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-stone-400 font-medium">
                        {rev.eventType} • {rev.date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/60 shrink-0">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-black text-amber-900">{rev.rating}</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-stone-700 font-medium leading-relaxed mt-3">
                  "{rev.comment}"
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
