import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ChefHat, Users, MapPin, Trash2, Download, BookOpen, BarChart3,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  type RecipeData,
  fetchAdminStats,
  fetchRecipes,
  getLocalRecipes,
  deleteRecipe,
  deleteLocalRecipe,
  exportRecipeBookPdf,
} from "@/lib/api";

interface AdminStats {
  totalRecipes: number;
  totalUsers: number;
  topRegions: { region: string; count: number }[];
  recentRecipes: RecipeData[];
}

const fallbackStats = (recipes: RecipeData[]): AdminStats => {
  const regionMap: Record<string, number> = {};
  recipes.forEach((r) => {
    if (r.region) regionMap[r.region] = (regionMap[r.region] || 0) + 1;
  });
  const topRegions = Object.entries(regionMap)
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalRecipes: recipes.length,
    totalUsers: 1,
    topRegions,
    recentRecipes: recipes.slice(0, 10),
  };
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recipes, setRecipes] = useState<RecipeData[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, r] = await Promise.all([fetchAdminStats(), fetchRecipes()]);
        setStats(s);
        setRecipes(r);
      } catch {
        const local = getLocalRecipes();
        setRecipes(local);
        setStats(fallbackStats(local));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try { await deleteRecipe(id); } catch { deleteLocalRecipe(id); }
    setRecipes((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      setStats(fallbackStats(updated));
      return updated;
    });
    toast.success("Recipe deleted");
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCompileBook = useCallback(async () => {
    if (selectedIds.size === 0) {
      toast.error("Select at least one recipe");
      return;
    }
    try {
      const blob = await exportRecipeBookPdf(Array.from(selectedIds));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "recipe-book.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Recipe book exported!");
    } catch {
      toast.error("Book export failed — backend may be offline");
    }
  }, [selectedIds]);

  const statCards = stats
    ? [
        { label: "Total Recipes", value: stats.totalRecipes, icon: ChefHat },
        { label: "Total Users", value: stats.totalUsers, icon: Users },
        { label: "Top Region", value: stats.topRegions[0]?.region || "—", icon: MapPin },
      ]
    : [];

  return (
    <AppLayout>
      <div className="container py-12 space-y-8">
        <h1 className="text-4xl font-display font-bold text-gradient-orange">Admin Dashboard</h1>

        {/* Stats */}
        {!loading && stats && (
          <div className="grid gap-4 md:grid-cols-3">
            {statCards.map(({ label, value, icon: Icon }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-border/30 bg-card/60">
                  <CardContent className="flex items-center gap-4 pt-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-display font-bold">{value}</p>
                      <p className="text-sm text-muted-foreground">{label}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Region Analytics */}
        {stats && stats.topRegions.length > 0 && (
          <Card className="border-border/30 bg-card/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <BarChart3 className="h-5 w-5 text-primary" /> Recipes by Region
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topRegions.map(({ region, count }) => {
                  const maxCount = stats.topRegions[0]?.count || 1;
                  return (
                    <div key={region} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{region}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / maxCount) * 100}%` }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recipe Management */}
        <Card className="border-border/30 bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-display">
              <BookOpen className="h-5 w-5 text-primary" /> All Recipes
            </CardTitle>
            <Button size="sm" onClick={handleCompileBook} disabled={selectedIds.size === 0}>
              <Download className="h-4 w-4 mr-1" /> Compile Book ({selectedIds.size})
            </Button>
          </CardHeader>
          <CardContent>
            {recipes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No recipes found</p>
            ) : (
              <div className="divide-y divide-border/30">
                {recipes.map((recipe) => (
                  <div key={recipe.id} className="flex items-center gap-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(recipe.id || "")}
                      onChange={() => toggleSelect(recipe.id || "")}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    {recipe.image && (
                      <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{recipe.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {recipe.region || "Unknown"} · {recipe.ingredients.length} ingredients
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(recipe.id!)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
