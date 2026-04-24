import { useState, useMemo, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Plus, BookOpen, Mic, Download, Search, Bell, User, UtensilsCrossed, LogOut, Shield, Menu, X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { isAdmin, getUser, logout } from "@/lib/auth";
import { getRecipes, RecipeData } from "@/lib/api";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin", label: "Admin Panel", icon: Shield },
  { to: "/create", label: "Create Recipe", icon: Plus },
  { to: "/recipes", label: "My Recipes", icon: BookOpen },
  { to: "/voice-recipe", label: "Ira (Voice Chef)", icon: Mic },
  { to: "/export", label: "Export", icon: Download },
  { to: "/profile", label: "Profile", icon: User },
];

const SidebarLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [recipes, setRecipes] = useState<RecipeData[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    getRecipes().then(setRecipes).catch(console.error);
  }, []);

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
    <div className="flex min-h-screen relative overflow-hidden lg:overflow-visible">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-0 card m-4 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-6">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-display text-base font-bold text-foreground">Zestify</p>
              <p className="text-xs text-muted-foreground">Indian Recipe Platform</p>
            </div>
          </Link>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 pt-2">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to || (to === "/dashboard" && location.pathname === "/");
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setIsSidebarOpen(false)}
                className={`group flex items-center gap-x-3 rounded-xl p-3 text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? "gradient-btn shadow-md hover:-translate-y-0.5"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </Link>
            );
          })}
          </nav>

        {/* Footer */}
        <div className="p-4 space-y-2">
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
            className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-[19.5rem] pr-0 lg:pr-4 py-4 min-h-screen w-full max-w-full flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-4 lg:px-6 gap-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-6 w-6" />
          </button>
          
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
                            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
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

        <main className="mx-auto max-w-6xl w-full flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-6 fade-in h-full flex flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout;
