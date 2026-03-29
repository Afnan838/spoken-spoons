import { useCallback } from "react";
import { motion } from "framer-motion";
import { Download, Trash2, Clock, MapPin, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { RecipeData } from "@/lib/api";
import { isAdmin } from "@/lib/auth";

interface RecipeCardProps {
  recipe: RecipeData;
  onDelete?: (id: string) => void;
  onExportPdf?: (id: string) => void;
  onView?: (recipe: RecipeData) => void;
  showActions?: boolean;
}

const RecipeCard = ({ recipe, onDelete, onExportPdf, onView, showActions = true }: RecipeCardProps) => {
  const adminAccess = isAdmin();
  const handleExport = useCallback(() => {
    if (recipe.id) onExportPdf?.(recipe.id);
  }, [recipe.id, onExportPdf]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <Card className="border-border/30 bg-card/60 overflow-hidden group hover:border-primary/30 transition-all">
        {recipe.image && (
          <div className="aspect-video overflow-hidden">
            <img
              src={recipe.image}
              alt={recipe.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        <CardContent className="pt-4 space-y-3">
          <h3 className="font-display font-semibold text-lg truncate">{recipe.title}</h3>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {recipe.region && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-primary" /> {recipe.region}
              </span>
            )}
            {recipe.time && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-primary" /> {recipe.time}
              </span>
            )}
            <span>{recipe.ingredients.length} ingredients</span>
            <span>{recipe.steps.length} steps</span>
          </div>
          {showActions && (
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => onView?.(recipe)}>
                <Eye className="h-3.5 w-3.5 mr-1" /> View
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-3.5 w-3.5" />
              </Button>
              {adminAccess && onDelete && recipe.id && (
                <Button variant="ghost" size="sm" onClick={() => onDelete(recipe.id!)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RecipeCard;
