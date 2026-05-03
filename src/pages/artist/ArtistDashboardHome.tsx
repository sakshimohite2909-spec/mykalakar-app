import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
    Eye,
    Star,
    CalendarCheck,
    Users,
    TrendingUp,
    BadgeCheck,
    Edit,
    ArrowRight,
    Music,
    MapPin,
    Phone,
    Clock,
    Settings,
} from "lucide-react";

export default function ArtistDashboard() {
    const { artistData } = useAuth();

    if (!artistData) return null;

    // Calculate profile completion
    const requiredFields = [
        artistData.name,
        artistData.mobileNumber || artistData.phone,
        artistData.bio,
        artistData.media?.profilePhoto || artistData.profilePhoto,
        artistData.subcategory || artistData.category,
        artistData.district || artistData.city,
        artistData.experience,
    ];
    const filledFields = requiredFields.filter(Boolean);
    const completionPercent = Math.round((filledFields.length / requiredFields.length) * 100);

    const stats = [
        { label: "Profile Views", value: artistData.stats?.profileViews || artistData.profileViews || 0, icon: Eye, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Rating", value: `${artistData.rating || 0} ⭐`, icon: Star, color: "text-yellow-500", bg: "bg-yellow-500/10" },
        { label: "Total Bookings", value: artistData.stats?.totalBookings || artistData.totalBookings || 0, icon: CalendarCheck, color: "text-green-500", bg: "bg-green-500/10" },
        { label: "Followers", value: artistData.stats?.followers || artistData.followers || 0, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
    ];

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="font-display text-2xl md:text-3xl font-bold">
                            Welcome back, <span className="gradient-text">{artistData.name?.split(" ")[0]}!</span> 👋
                        </h1>
                        <p className="text-muted-foreground mt-1">Here's what's happening with your profile</p>
                    </div>
                    <Link to="/artist/dashboard/profile">
                        <Button className="gradient-bg border-0 text-primary-foreground">
                            <Edit className="h-4 w-4 mr-2" /> Edit Profile
                        </Button>
                    </Link>
                </div>
            </motion.div>

            {/* Profile Completion */}
            {completionPercent < 100 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="font-semibold text-sm">Complete Your Profile</p>
                                    <p className="text-xs text-muted-foreground">A complete profile gets 5x more visibility</p>
                                </div>
                                <span className="text-2xl font-bold text-primary">{completionPercent}%</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2.5">
                                <div
                                    className="gradient-bg h-2.5 rounded-full transition-all duration-500"
                                    style={{ width: `${completionPercent}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                    >
                        <Card className="hover-lift">
                            <CardContent className="p-5">
                                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                                <p className="text-2xl font-bold">{stat.value}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Profile Preview Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
                            <Music className="h-5 w-5 text-primary" /> Your Profile Preview
                        </h3>
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Photo */}
                            <div className="flex-shrink-0">
                                <img
                                    src={artistData.media?.profilePhoto || artistData.profilePhoto || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300"}
                                    alt={artistData.name}
                                    className="w-28 h-28 rounded-2xl object-cover border-2 border-border"
                                />
                            </div>

                            {/* Info */}
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                    <h2 className="font-display text-xl font-bold">{artistData.name}</h2>
                                    {artistData.verified && <BadgeCheck className="h-5 w-5 text-primary" />}
                                    {artistData.trending && (
                                        <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                                            <TrendingUp className="h-3 w-3 mr-1" /> Trending
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Music className="h-3.5 w-3.5" /> {artistData.category} / {artistData.subcategory}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5" /> {artistData.district || artistData.city}, {artistData.state}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" /> {artistData.experience} yrs exp
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Phone className="h-3.5 w-3.5" /> {artistData.mobileNumber || artistData.phone}
                                    </span>
                                </div>

                                <p className="text-sm text-muted-foreground line-clamp-2">{artistData.bio || "No bio added yet."}</p>

                                <div className="flex items-center gap-2 text-sm">
                                    <span
                                        className={`inline-flex items-center gap-1 font-medium px-2.5 py-1 rounded-full ${artistData.availability === "available"
                                                ? "bg-green-500/10 text-green-600"
                                                : "bg-red-500/10 text-red-600"
                                            }`}
                                    >
                                        ● {artistData.availability === "available" ? "Available" : "Busy"}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                                        {artistData.stats?.rating || artistData.rating || 0} ({artistData.stats?.reviews || artistData.reviews || 0} reviews)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Gallery Preview */}
                        {(artistData.media?.galleryPhotos || artistData.galleryPhotos)?.length > 0 && (
                            <div className="mt-5">
                                <p className="text-sm font-medium mb-2">Gallery ({(artistData.media?.galleryPhotos || artistData.galleryPhotos).length} photos)</p>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {(artistData.media?.galleryPhotos || artistData.galleryPhotos).slice(0, 6).map((p: string, i: number) => (
                                        <img
                                            key={i}
                                            src={p}
                                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0 border"
                                            alt={`Gallery ${i + 1}`}
                                        />
                                    ))}
                                    {(artistData.media?.galleryPhotos || artistData.galleryPhotos).length > 6 && (
                                        <div className="w-20 h-20 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 border text-sm font-medium">
                                            +{(artistData.media?.galleryPhotos || artistData.galleryPhotos).length - 6}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 mt-5 pt-4 border-t border-border/50">
                            <Link to="/artist/dashboard/profile" className="flex-1">
                                <Button variant="outline" className="w-full">
                                    <Edit className="h-4 w-4 mr-2" /> Edit Profile
                                </Button>
                            </Link>
                            <Link to={`/artist/${artistData.id}`} className="flex-1">
                                <Button variant="outline" className="w-full">
                                    <Eye className="h-4 w-4 mr-2" /> View Public Page
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link to="/artist/dashboard/profile">
                        <Card className="hover-lift cursor-pointer group">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Edit className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">Update Profile</p>
                                        <p className="text-xs text-muted-foreground">Edit your details</p>
                                    </div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </CardContent>
                        </Card>
                    </Link>

                    <Link to="/artist/dashboard/bookings">
                        <Card className="hover-lift cursor-pointer group">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                        <CalendarCheck className="h-5 w-5 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">Booking Requests</p>
                                        <p className="text-xs text-muted-foreground">Manage inquiries</p>
                                    </div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </CardContent>
                        </Card>
                    </Link>

                    <Link to="/artist/dashboard/settings">
                        <Card className="hover-lift cursor-pointer group">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                        <Settings className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">Account Settings</p>
                                        <p className="text-xs text-muted-foreground">Password & email</p>
                                    </div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
