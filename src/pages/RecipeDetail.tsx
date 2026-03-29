import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Users, MapPin, ChefHat, Utensils, ArrowLeft } from "lucide-react";
import SidebarLayout from "@/components/SidebarLayout";
import { Button } from "@/components/ui/button";
import { getLocalRecipes } from "@/lib/api";

const RecipeDetail = () => {
  const { id } = useParams();
  const recipes = getLocalRecipes();
  const recipe = recipes.find((r) => r.id === id);

  if (!recipe) {
    return (
      <SidebarLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-xl font-display font-bold mb-4">Recipe not found</p>
          <Button asChild variant="outline"><Link to="/recipes">Back to Recipes</Link></Button>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto">
        <Button asChild variant="ghost" className="mb-4">
          <Link to="/recipes"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Link>
        </Button>

        {/* Hero */}
        {recipe.image && (
          <div className="relative rounded-xl overflow-hidden mb-8 aspect-[21/9]">
            <img src={recipe.image} alt={recipe.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              {recipe.region && (
                <span className="inline-block rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-primary-foreground mb-3">
                  {recipe.region}
                </span>
              )}
              <h1 className="text-3xl lg:text-4xl font-display font-bold italic">{recipe.title}</h1>
              <div className="flex gap-4 mt-2 text-sm text-foreground/80">
                {recipe.time && <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {recipe.time}</span>}
                {recipe.servings && <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {recipe.servings}</span>}
              </div>
            </div>
          </div>
        )}

        {!recipe.image && (
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold">{recipe.title}</h1>
            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
              {recipe.region && <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-primary" /> {recipe.region}</span>}
              {recipe.time && <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-primary" /> {recipe.time}</span>}
              {recipe.servings && <span className="flex items-center gap-1"><Users className="h-4 w-4 text-primary" /> {recipe.servings}</span>}
            </div>
          </div>
        )}

        {/* Description */}
        {recipe.description && (
          <p className="text-base text-foreground/80 leading-relaxed mb-8">{recipe.description}</p>
        )}

        {/* Ingredients */}
        <div className="mb-8">
          <h2 className="text-xl font-display font-bold mb-1">Ingredients</h2>
          <div className="h-0.5 w-16 bg-primary rounded mb-4" />
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recipe.ingredients.map((item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-start gap-2 text-sm"
              >
                <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                {item}
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div className="mb-8">
          <h2 className="text-xl font-display font-bold mb-1">Cooking Instructions</h2>
          <div className="h-0.5 w-16 bg-primary rounded mb-6" />
          <ol className="space-y-6">
            {recipe.steps.map((step, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex gap-4"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed pt-1">{step}</p>
              </motion.li>
            ))}
          </ol>
        </div>

        {/* Traditional Note */}
        <div className="rounded-xl border-l-4 border-emerald-500 bg-emerald-500/5 p-5 mb-8">
          <h3 className="font-display font-semibold text-emerald-400 mb-2">Traditional Recipe Note</h3>
          <p className="text-sm text-foreground/70 leading-relaxed">
            This authentic {recipe.region || "Indian"} recipe has been preserved and passed down through generations, maintaining the traditional cooking methods and spice combinations that make it truly special.
          </p>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default RecipeDetail;
