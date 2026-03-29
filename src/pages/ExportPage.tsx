import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Download, FileText, ChefHat, MapPin, Check } from "lucide-react";
import SidebarLayout from "@/components/SidebarLayout";
import { Button } from "@/components/ui/button";
import { getLocalRecipes, type RecipeData } from "@/lib/api";
import { exportRecipeBookPdf } from "@/lib/pdfExport";

const ExportPage = () => {
  const [recipes] = useState(getLocalRecipes());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [includeImages, setIncludeImages] = useState(true);
  const [includeRegional, setIncludeRegional] = useState(true);
  const [addCover, setAddCover] = useState(true);

  const toggleRecipe = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(recipes.map((r) => r.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const handleExport = useCallback(async () => {
    if (selectedIds.size === 0) { toast.error("Select at least one recipe"); return; }
    const selected = recipes.filter((r) => selectedIds.has(r.id));
    await exportRecipeBookPdf(selected, { addCover });
    toast.success(`Exported ${selected.length} recipes as PDF!`);
  }, [selectedIds, recipes, addCover]);

  return (
    <SidebarLayout>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="section-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-semibold text-lg">Select Recipes</h2>
            <div className="flex gap-3">
              <button onClick={selectAll} className="text-sm text-primary font-medium hover:underline">Select All</button>
              <button onClick={deselectAll} className="text-sm text-muted-foreground font-medium hover:underline">Deselect All</button>
            </div>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {recipes.map((recipe) => {
              const isSelected = selectedIds.has(recipe.id);
              return (
                <motion.div
                  key={recipe.id}
                  layout
                  onClick={() => toggleRecipe(recipe.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected ? "border-primary bg-primary/5" : "border-border hover:border-border/80"
                  }`}
                >
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                    isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                  }`}>
                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  {recipe.image ? (
                    <img src={recipe.image} alt={recipe.title} className="h-14 w-14 rounded-lg object-cover" />
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-secondary flex items-center justify-center">
                      <ChefHat className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">{recipe.title}</p>
                    {recipe.region && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3" /> {recipe.region}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="section-card space-y-5">
            <h2 className="font-display font-semibold text-lg">Export Options</h2>

            <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">PDF Format</p>
                <p className="text-xs text-muted-foreground">Professional printable layout</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 text-sm cursor-pointer">
                <input type="checkbox" checked={addCover} onChange={(e) => setAddCover(e.target.checked)} className="h-4 w-4 rounded accent-primary" />
                Add cover page & table of contents
              </label>
              <label className="flex items-center gap-3 text-sm cursor-pointer">
                <input type="checkbox" checked={includeRegional} onChange={(e) => setIncludeRegional(e.target.checked)} className="h-4 w-4 rounded accent-primary" />
                Include regional info
              </label>
            </div>

            <div className="rounded-lg bg-primary/10 p-3">
              <p className="text-sm text-primary font-medium">{selectedIds.size} recipes selected</p>
            </div>

            <Button onClick={handleExport} className="w-full glow-orange" disabled={selectedIds.size === 0}>
              <Download className="h-4 w-4 mr-2" /> Export as PDF
            </Button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default ExportPage;
