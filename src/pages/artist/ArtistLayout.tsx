import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { imageRegistry } from "@/services/ImageRegistryService";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    UserCircle,
    CalendarCheck,
    Star,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronRight,
    BadgeCheck,
    Eye,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const sidebarItems = [
    { label: "Dashboard", href: "/artist/dashboard", icon: LayoutDashboard },
    { label: "Edit Profile", href: "/artist/dashboard/profile", icon: UserCircle },
    { label: "Bookings", href: "/artist/dashboard/bookings", icon: CalendarCheck },
    { label: "Reviews", href: "/artist/dashboard/reviews", icon: Star },
    { label: "Settings", href: "/artist/dashboard/settings", icon: Settings },
];

export default function ArtistLayout() {
    const { artistData, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        toast({ title: "Logged Out", description: "You have been logged out successfully." });
        navigate("/artist-login");
    };

    return (
        <div className="artist-dashboard-layout min-h-screen bg-transparent flex">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:flex flex-col w-64 border-r border-border/50 bg-card/50 backdrop-blur-xl p-4 sticky top-0 h-screen">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 px-3 mb-6">
                    <div className="w-9 h-9 rounded-lg gradient-bg flex items-center justify-center text-primary-foreground font-display font-bold text-lg">
                        M
                    </div>
                    <span className="font-display font-bold text-xl">MyKalakar</span>
                </Link>

                {/* Artist Info */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50 mb-6">
                    <img
                            src={artistData?.profilePhoto || imageRegistry.getUniqueImage({ category: "Default", type: "ui" })}
                        alt={artistData?.name || "Artist"}
                        className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                            <p className="text-sm font-semibold truncate">{artistData?.name || "Artist"}</p>
                            {artistData?.verified && <BadgeCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{artistData?.subcategory || "Artist"}</p>
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 space-y-1">
                    {sidebarItems.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                        ? "gradient-bg text-primary-foreground shadow-md"
                                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                                    }`}
                            >
                                <item.icon className="h-4.5 w-4.5" />
                                {item.label}
                                {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* View Public Profile */}
                {artistData?.id && (
                    <Link to={`/artist/${artistData.id}`} className="mb-2">
                        <Button variant="outline" size="sm" className="w-full">
                            <Eye className="h-4 w-4 mr-2" /> View Public Profile
                        </Button>
                    </Link>
                )}

                {/* Logout */}
                <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" /> Logout
                </Button>
            </aside>

            {/* Mobile Sidebar */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
                    <motion.aside
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        className="absolute left-0 top-0 bottom-0 w-72 bg-background border-r border-border p-4 flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <Link to="/" className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-lg gradient-bg flex items-center justify-center text-primary-foreground font-display font-bold text-lg">
                                    M
                                </div>
                                <span className="font-display font-bold text-xl">MyKalakar</span>
                            </Link>
                            <button onClick={() => setSidebarOpen(false)}>
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50 mb-6">
                            <img
                                    src={artistData?.profilePhoto || imageRegistry.getUniqueImage({ category: "Default", type: "ui" })}
                                alt={artistData?.name || "Artist"}
                                className="w-10 h-10 rounded-lg object-cover"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{artistData?.name || "Artist"}</p>
                                <p className="text-xs text-muted-foreground truncate">{artistData?.subcategory || "Artist"}</p>
                            </div>
                        </div>

                        <nav className="flex-1 space-y-1">
                            {sidebarItems.map((item) => {
                                const isActive = location.pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        to={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                                ? "gradient-bg text-primary-foreground shadow-md"
                                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                                            }`}
                                    >
                                        <item.icon className="h-4.5 w-4.5" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-destructive hover:bg-destructive/10">
                            <LogOut className="h-4 w-4 mr-2" /> Logout
                        </Button>
                    </motion.aside>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top Bar */}
                <header className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-xl flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
                    <div className="flex items-center gap-3">
                        <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                            <Menu className="h-5 w-5" />
                        </button>
                        <h1 className="font-display font-semibold text-lg">
                            {sidebarItems.find((i) => i.href === location.pathname)?.label || "Dashboard"}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to={`/artist/${artistData?.id}`}>
                            <Button variant="outline" size="sm" className="hidden sm:flex">
                                <Eye className="h-4 w-4 mr-2" /> View Profile
                            </Button>
                        </Link>
                        <img
                                src={artistData?.profilePhoto || imageRegistry.getUniqueImage({ category: "Default", type: "ui" })}
                            alt="Profile"
                            className="w-8 h-8 rounded-lg object-cover"
                        />
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
