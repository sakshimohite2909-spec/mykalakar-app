import { Outlet, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, FolderOpen, CalendarDays, UserPlus, Settings, LogOut, Menu, X, MapPin, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Artists", href: "/admin/artists", icon: Users },
  { label: "Pending Artists", href: "/admin/pending", icon: UserPlus },
  { label: "Categories", href: "/admin/categories", icon: FolderOpen },
  { label: "Events", href: "/admin/events", icon: CalendarDays },
  { label: "Inquiries", href: "/admin/bookings", icon: CalendarDays },
  { label: "Locations", href: "/admin/locations", icon: MapPin },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-transparent flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 border-r border-border/50 bg-card/50 backdrop-blur-xl p-4 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="mb-6 flex items-center justify-between px-3">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg gradient-bg flex items-center justify-center text-primary-foreground font-display font-bold text-lg">M</div>
            <div>
              <span className="block font-display font-bold text-xl leading-none">MyKalakar</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Admin</span>
            </div>
          </Link>
          <button className="lg:hidden rounded-lg p-2 transition hover:bg-secondary/50" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
        </div>

        <div className="mb-6 flex items-center gap-3 rounded-xl border border-border/50 bg-secondary/40 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/70 text-primary shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Admin Workspace</p>
            <p className="truncate text-xs text-muted-foreground">Manage platform content</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {sidebarItems.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active ? "gradient-bg text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border/50 pt-3">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground">
            <LogOut className="h-4 w-4" /> Back to Website
          </Link>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-slate-900/35 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-xl flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button className="lg:hidden rounded-lg p-2 transition hover:bg-secondary/50" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /></button>
            <h2 className="font-display font-semibold text-lg">
              {sidebarItems.find((i) => i.href === location.pathname)?.label || "Admin"}
            </h2>
          </div>
          <Link to="/" className="hidden rounded-xl border border-border/60 bg-white/50 px-3 py-2 text-xs font-bold text-muted-foreground transition hover:bg-white/80 hover:text-foreground sm:inline-flex">
            Website
          </Link>
        </header>
        <main className="flex-1 p-4 lg:p-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={location.pathname}>
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
