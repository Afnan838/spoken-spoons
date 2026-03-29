import { useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Plus, BookOpen, Mic, Download, Search, Bell, User, ChefHat, LogOut, Shield,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { isAdmin, getUser, logout } from "@/lib/auth";
import { getLocalRecipes } from "@/lib/api";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin", label: "Admin Panel", icon: Shield },
  { to: "/create", label: "Create Recipe", icon: Plus },
  { to: "/recipes", label: "My Recipes", icon: BookOpen },
  { to: "/voice-recipe", label: "Voice Recipe", icon: Mic },
  { to: "/export", label: "Export", icon: Download },
  { to: "/profile", label: "Profile", icon: User },
];

const SidebarLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUser();
  const [searchQuery, setSearchQuery] = useState("");

  const recipes = useMemo(() => getLocalRecipes(), []);
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.region?.toLowerCase().includes(q) ||
        r.ingredients?.some((i) => i.toLowerCase().includes(q))
    );
  }, [searchQuery, recipes]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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
        <div className="px-3 py-4 space-y-2">
          {user && (
            <div className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="sidebar-item sidebar-item-inactive w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4.5 w-4.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-6">
          <div className="flex-1 max-w-md relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50"
              />
            </div>
            {/* Search Results Dropdown */}
            {searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-card shadow-lg overflow-hidden z-50">
                {searchResults.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground text-center">No recipes found</p>
                ) : (
                  <div className="max-h-72 overflow-y-auto">
                    {searchResults.map((recipe) => (
                      <Link
                        key={recipe.id}
                        to={`/recipe/${recipe.id}`}
                        onClick={() => setSearchQuery("")}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors"
                      >
                        {recipe.image ? (
                          <img src={recipe.image} alt="" className="h-9 w-9 rounded-lg object-cover" />
                        ) : (
                          <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                            <ChefHat className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{recipe.title}</p>
                          <p className="text-xs text-muted-foreground">{recipe.region || "Unknown region"}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => toast.info("No new notifications")}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors relative"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
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
