import { Link, useLocation } from "react-router-dom";
import { ChefHat, Mic, Home, BookOpen, Shield } from "lucide-react";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/voice-recipe", label: "Voice Recipe", icon: Mic },
  { to: "/recipes", label: "Recipes", icon: BookOpen },
  { to: "/admin", label: "Admin", icon: Shield },
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ChefHat className="h-7 w-7 text-primary" />
            <span className="font-display text-xl font-bold text-gradient-orange">RecipeAI</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/30 py-6">
        <div className="container text-center text-xs text-muted-foreground">
          © 2026 RecipeAI — AI-Powered Indian Recipe Platform
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
