import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  PhoneCall,
  LayoutDashboard,
  Users,
  CalendarDays,
  LogOut,
  PlusCircle,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  Search,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { STATIC_IMAGES } from "@/services/ImageRegistryService";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Dashboard / Workbench", href: "/telecaller", icon: LayoutDashboard },
  { label: "Phone Inquiries & Leads", href: "/telecaller/leads", icon: PhoneCall },
  { label: "Artist Search Directory", href: "/telecaller/artists", icon: Users },
];

export default function TelecallerLayout() {
  const { currentUser, logout, userRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="telecaller-layout min-h-screen bg-[#FDFBF7] text-stone-900 flex flex-col md:flex-row antialiased">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-stone-200/80 bg-white p-5 sticky top-0 h-screen shrink-0 shadow-sm">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 mb-8">
          <img src={STATIC_IMAGES.logo} alt="MyKalakar" className="h-9 w-auto object-contain" />
          <span className="rounded-full bg-orange-100 border border-orange-200 px-2 py-0.5 text-[10px] font-black uppercase text-orange-600">
            Telecaller
          </span>
        </Link>

        {/* User Info Badge */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-orange-50/60 border border-orange-100 mb-6">
          <div className="h-9 w-9 rounded-full bg-orange-600 flex items-center justify-center font-black text-sm text-white shadow-sm">
            TC
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold truncate text-stone-900">telecaller12@gmail.com</p>
            <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Telecaller Executive</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/telecaller" && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                  isActive
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                    : "text-stone-600 hover:text-stone-950 hover:bg-stone-100/80"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="pt-4 border-t border-stone-200/80 space-y-2">
          <Link to="/" className="w-full">
            <Button variant="outline" size="sm" className="w-full justify-start border-stone-200 text-stone-700 hover:bg-stone-100 hover:text-stone-900 text-xs font-bold rounded-xl">
              <ShieldCheck className="h-3.5 w-3.5 mr-2 text-orange-600" /> Back to Main Site
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-bold rounded-xl"
          >
            <LogOut className="h-3.5 w-3.5 mr-2" /> Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-stone-200 sticky top-0 z-30 shadow-sm">
        <Link to="/" className="flex items-center gap-2">
          <img src={STATIC_IMAGES.logo} alt="MyKalakar" className="h-7 w-auto object-contain" />
          <span className="text-xs font-extrabold text-orange-600">Telecaller CRM</span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-stone-700">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-stone-200 p-4 space-y-2 z-20 shadow-md">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-stone-700 hover:bg-orange-50 hover:text-orange-600"
            >
              <item.icon className="h-4 w-4 text-orange-600" />
              {item.label}
            </Link>
          ))}
          <Button onClick={handleLogout} variant="ghost" size="sm" className="w-full justify-start text-red-600 text-xs mt-2 font-bold">
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      )}

      {/* Main Workbench View */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl">
        <Outlet />
      </main>
    </div>
  );
}
