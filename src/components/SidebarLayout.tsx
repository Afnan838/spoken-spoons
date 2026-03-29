import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Plus, BookOpen, Mic, Download, Search, Bell, User, ChefHat,
} from "lucide-react";
import { Input } from "@/components/ui/input";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/create", label: "Create Recipe", icon: Plus },
  { to: "/recipes", label: "My Recipes", icon: BookOpen },
  { to: "/voice-recipe", label: "Voice Recipe", icon: Mic },
  { to: "/export", label: "Export", icon: Download },
];

const SidebarLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-[hsl(var(--sidebar-bg))]">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-3 px-5 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <ChefHat className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display text-base font-bold text-foreground">Native Indian</p>
            <p className="text-xs text-muted-foreground">Recipe Platform</p>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 pt-2">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to || (to === "/dashboard" && location.pathname === "/");
            return (
              <Link
                key={to}
                to={to}
                className={`sidebar-item ${isActive ? "sidebar-item-active" : "sidebar-item-inactive"}`}
              >
                <Icon className="h-4.5 w-4.5" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4">
          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Preserve traditional recipes for future generations
            </p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search recipes..."
                className="pl-10 bg-secondary/50 border-border/50"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary">
              <User className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default SidebarLayout;
