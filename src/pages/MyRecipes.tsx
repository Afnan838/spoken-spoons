import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChefHat, Clock, MapPin, Grid3X3, List, Filter } from "lucide-react";
import SidebarLayout from "@/components/SidebarLayout";
import { getLocalRecipes, REGIONS } from "@/lib/api";

const MyRecipes = () => {
  const [recipes] = useState(() => getLocalRecipes().filter(r => r.status !== "pending" && r.status !== "rejected"));
  const [activeRegion, setActiveRegion] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = useMemo(
    () => activeRegion === "All" ? recipes : recipes.filter((r) => r.region === activeRegion),
    [recipes, activeRegion]
  );

  return (
    <SidebarLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold">My Recipes</h1>
        <p className="text-sm text-muted-foreground">Browse and manage your recipe collection</p>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <button
            onClick={() => setActiveRegion("All")}
            className={`filter-chip ${activeRegion === "All" ? "filter-chip-active" : "filter-chip-inactive"}`}
          >
            All
          </button>
          {REGIONS.map((region) => (
            <button
              key={region}
              onClick={() => setActiveRegion(region)}
              className={`filter-chip ${activeRegion === region ? "filter-chip-active" : "filter-chip-inactive"}`}
            >
              {region}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">Showing {filtered.length} recipes</p>

      {viewMode === "grid" ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((recipe, i) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link to={`/recipe/${recipe.id}`} className="block recipe-card group">
                <div className="relative aspect-[16/10] overflow-hidden">
                  {recipe.image ? (
                    <img src={recipe.image} alt={recipe.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="h-full w-full bg-secondary flex items-center justify-center">
                      <ChefHat className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  {recipe.time && <span className="time-badge"><Clock className="h-3 w-3" /> {recipe.time}</span>}
                </div>
                <div className="p-4">
                  <h3 className="font-display font-semibold">{recipe.title}</h3>
                  {recipe.region && <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1"><MapPin className="h-3 w-3" /> {recipe.region}</p>}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((recipe) => (
            <Link key={recipe.id} to={`/recipe/${recipe.id}`} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors">
              {recipe.image ? (
                <img src={recipe.image} alt={recipe.title} className="h-16 w-16 rounded-lg object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-secondary flex items-center justify-center"><ChefHat className="h-6 w-6 text-muted-foreground" /></div>
              )}
              <div className="flex-1">
                <h3 className="font-display font-semibold">{recipe.title}</h3>
                <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                  {recipe.region && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {recipe.region}</span>}
                  {recipe.time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {recipe.time}</span>}
                  <span>{recipe.ingredients.length} ingredients</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </SidebarLayout>
  );
};

export default MyRecipes;
