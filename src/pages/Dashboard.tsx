import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChefHat, TrendingUp, Clock, Plus, MapPin } from "lucide-react";
import SidebarLayout from "@/components/SidebarLayout";
import { Button } from "@/components/ui/button";
import { getLocalRecipes } from "@/lib/api";

const Dashboard = () => {
  const [recipes] = useState(getLocalRecipes());

  const stats = useMemo(() => {
    const regionMap: Record<string, number> = {};
    let totalTime = 0;
    recipes.forEach((r) => {
      if (r.region) regionMap[r.region] = (regionMap[r.region] || 0) + 1;
      const mins = parseInt(r.time) || 0;
      totalTime += mins;
    });
    return {
      total: recipes.length,
      newThisWeek: Math.min(recipes.length, 8),
      avgTime: recipes.length ? Math.round(totalTime / recipes.length) : 0,
    };
  }, [recipes]);

  const statCards = [
    { label: "Total Recipes", value: stats.total, icon: ChefHat, color: "text-primary" },
    { label: "New This Week", value: `+${stats.newThisWeek}`, icon: TrendingUp, color: "text-yellow-500" },
    { label: "Avg Cook Time", value: `${stats.avgTime} min`, icon: Clock, color: "text-emerald-500" },
  ];

  return (
    <SidebarLayout>
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="stat-card flex items-center justify-between"
          >
            <div>
              <p className="text-2xl font-display font-bold">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-secondary ${color}`}>
              <Icon className="h-6 w-6" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Your Recipes */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Your Recipes</h1>
          <p className="text-sm text-muted-foreground">Manage and explore your culinary collection</p>
        </div>
        <Button asChild className="glow-orange">
          <Link to="/create">
            <Plus className="h-4 w-4 mr-2" /> Create New Recipe
          </Link>
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {recipes.slice(0, 6).map((recipe, i) => (
          <motion.div
            key={recipe.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link to={`/recipe/${recipe.id}`} className="block recipe-card group">
              <div className="relative aspect-[16/10] overflow-hidden">
                {recipe.image ? (
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-secondary flex items-center justify-center">
                    <ChefHat className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                {recipe.time && (
                  <span className="time-badge">
                    <Clock className="h-3 w-3" /> {recipe.time}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-display font-semibold text-base">{recipe.title}</h3>
                {recipe.region && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" /> {recipe.region}
                  </p>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </SidebarLayout>
  );
};

export default Dashboard;
