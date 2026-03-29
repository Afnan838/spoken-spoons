import { useState, useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import RecipeCard from "@/components/RecipeCard";
import RecipeDetailModal from "@/components/RecipeDetailModal";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import {
  type RecipeData,
  fetchRecipes,
  getLocalRecipes,
  deleteLocalRecipe,
  deleteRecipe,
  exportRecipePdf,
} from "@/lib/api";

const Recipes = () => {
  const [recipes, setRecipes] = useState<RecipeData[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchRecipes();
        setRecipes(data);
      } catch {
        // Fallback to local
        setRecipes(getLocalRecipes());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteRecipe(id);
    } catch {
      deleteLocalRecipe(id);
    }
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    toast.success("Recipe deleted");
  }, []);

  const handleExportPdf = useCallback(async (id: string) => {
    try {
      const blob = await exportRecipePdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "recipe.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("PDF export failed — backend may be offline");
    }
  }, []);

  return (
    <AppLayout>
      <div className="container py-12">
        <h1 className="text-4xl font-display font-bold text-gradient-orange mb-8">Recipe Library</h1>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-border/30 bg-card/30 animate-pulse h-64" />
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <BookOpen className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">No recipes yet</p>
              <p className="text-sm mt-1">Record your first recipe using Voice Capture to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onDelete={handleDelete}
                onExportPdf={handleExportPdf}
                onView={setSelectedRecipe}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedRecipe && (
          <RecipeDetailModal
            recipe={selectedRecipe}
            onClose={() => setSelectedRecipe(null)}
            onExportPdf={handleExportPdf}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  );
};

export default Recipes;
