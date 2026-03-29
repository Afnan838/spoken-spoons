import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, Clock, Users, MapPin, Utensils } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecipeData } from "@/lib/api";

interface RecipeLiveViewProps {
  recipe: Partial<RecipeData>;
  isStreaming?: boolean;
}

const RecipeLiveView = ({ recipe, isStreaming }: RecipeLiveViewProps) => {
  const hasContent = recipe.title || (recipe.ingredients?.length ?? 0) > 0 || (recipe.steps?.length ?? 0) > 0;

  if (!hasContent) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <ChefHat className="h-12 w-12 mb-4 opacity-40" />
          <p className="text-lg">Your recipe will appear here</p>
          <p className="text-sm mt-1">Start speaking to create a recipe</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur overflow-hidden">
      {isStreaming && (
        <div className="h-1 bg-secondary overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: "40%" }}
          />
        </div>
      )}

      <CardHeader className="pb-4">
        <AnimatePresence mode="wait">
          {recipe.title && (
            <motion.div
              key={recipe.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <CardTitle className="text-2xl font-display text-gradient-orange">
                {recipe.title}
              </CardTitle>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {recipe.time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-primary" /> {recipe.time}
                  </span>
                )}
                {recipe.servings && (
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-primary" /> {recipe.servings}
                  </span>
                )}
                {recipe.region && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-primary" /> {recipe.region}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Ingredients */}
        {(recipe.ingredients?.length ?? 0) > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-display font-semibold">
              <Utensils className="h-5 w-5 text-primary" /> Ingredients
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recipe.ingredients!.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-2 text-sm text-secondary-foreground"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Steps */}
        {(recipe.steps?.length ?? 0) > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-display font-semibold">
              <ChefHat className="h-5 w-5 text-primary" /> Steps
            </h3>
            <ol className="space-y-3">
              {recipe.steps!.map((step, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex gap-3 text-sm"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-secondary-foreground leading-relaxed pt-0.5">{step}</span>
                </motion.li>
              ))}
            </ol>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecipeLiveView;
