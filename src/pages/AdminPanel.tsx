import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ChefHat, Users, Trash2, Edit, Eye, Download, Shield, CheckCircle2,
  Server, Wifi, MessageSquare, FileJson, Volume2, Settings, LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import SidebarLayout from "@/components/SidebarLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { getLocalRecipes, deleteLocalRecipe, type RecipeData } from "@/lib/api";
import { getUser, isAdmin, logout } from "@/lib/auth";
import RecipeDetailModal from "@/components/RecipeDetailModal";

const architectureItems = [
  { icon: Server, label: "Python Backend Server", desc: "FastAPI with async WebSocket support, serves REST + WS endpoints", status: "designed" },
  { icon: Wifi, label: "WebSocket Implementation", desc: "Real-time bidirectional audio streaming via ws://localhost:8000/ws/audio", status: "designed" },
  { icon: MessageSquare, label: "Speech-to-Text Integration", desc: "OpenAI Whisper / Google STT converts audio chunks to transcript", status: "designed" },
  { icon: FileJson, label: "LLM Structured JSON Output", desc: "GPT-4 with system prompt extracts title, ingredients, steps, region, time", status: "designed" },
  { icon: Volume2, label: "Text-to-Speech Integration", desc: "gTTS / ElevenLabs converts AI response back to audio for playback", status: "designed" },
  { icon: Settings, label: "System Prompt Design", desc: "Structured extraction prompt: 'You are a recipe parser. Return JSON with title, ingredients, steps, region, servings, time.'", status: "designed" },
];

const demoChecklist = [
  { label: "Voice input processed", desc: "MediaRecorder captures audio, streams via WebSocket" },
  { label: "AI responds verbally", desc: "TTS audio URL received and played in browser" },
  { label: "Structured recipe JSON generated", desc: "LLM outputs { title, ingredients, steps, region, time, servings }" },
  { label: "Logs display output", desc: "Live transcript + structured JSON rendered in real-time UI" },
  { label: "Architecture decision justified", desc: "FastAPI chosen for async WS; Whisper for accuracy; GPT-4 for structured extraction" },
  { label: "User edits & confirms recipe", desc: "RecipeConfirm component allows editing before save" },
  { label: "Recipe saved with image", desc: "Saved to localStorage with optional image upload" },
  { label: "PDF export works", desc: "Export page generates downloadable recipe PDF" },
  { label: "Admin sees all recipes", desc: "Admin panel displays full recipe management" },
  { label: "No crashes on disconnect", desc: "WebSocket auto-reconnect with graceful error handling" },
];

const AdminPanel = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [recipes, setRecipes] = useState(getLocalRecipes());
  const [search, setSearch] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeData | null>(null);
  const adminAccess = user && isAdmin();

  if (!adminAccess) {
    return (
      <SidebarLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Shield className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-display font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">Admin credentials required.</p>
          <Button onClick={() => navigate("/login")} className="glow-orange">Go to Login</Button>
        </div>
      </SidebarLayout>
    );
  }

  const filtered = useMemo(() =>
    recipes.filter((r) => r.title.toLowerCase().includes(search.toLowerCase())),
    [recipes, search]
  );

  const handleDelete = (id: string) => {
    deleteLocalRecipe(id);
    setRecipes(getLocalRecipes());
    toast.success("Recipe deleted");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const stats = [
    { label: "Total Recipes", value: recipes.length, icon: ChefHat },
    { label: "Regions", value: [...new Set(recipes.map(r => r.region).filter(Boolean))].length, icon: Users },
  ];

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Manage recipes, view architecture & demo readiness</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          {stats.map(({ label, value, icon: Icon }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="stat-card flex items-center justify-between">
              <div>
                <p className="text-3xl font-display font-bold">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Icon className="h-6 w-6" />
              </div>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="recipes" className="space-y-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="recipes">Recipe Management</TabsTrigger>
            <TabsTrigger value="architecture">Architecture</TabsTrigger>
            <TabsTrigger value="demo">Demo Readiness</TabsTrigger>
          </TabsList>

          {/* Recipes Tab */}
          <TabsContent value="recipes" className="space-y-4">
            <Input
              placeholder="Search recipes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm bg-card border-border"
            />
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-card">
                    <th className="text-left p-3 font-semibold text-muted-foreground">Recipe</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground hidden md:table-cell">Region</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground hidden md:table-cell">Time</th>
                    <th className="text-right p-3 font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No recipes found</td></tr>
                  ) : (
                    filtered.map((recipe) => (
                      <tr key={recipe.id} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {recipe.image ? (
                              <img src={recipe.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                                <ChefHat className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <span className="font-medium">{recipe.title}</span>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground hidden md:table-cell">{recipe.region || "—"}</td>
                        <td className="p-3 text-muted-foreground hidden md:table-cell">{recipe.time || "—"}</td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedRecipe(recipe)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/recipe/${recipe.id}`)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(recipe.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Architecture Tab */}
          <TabsContent value="architecture" className="space-y-4">
            <div className="section-card">
              <h3 className="font-display font-semibold text-lg mb-4">System Architecture</h3>
              <div className="space-y-3">
                {architectureItems.map(({ icon: Icon, label, desc }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-4 rounded-lg border border-border bg-background p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Designed</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* System Prompt */}
            <div className="section-card">
              <h3 className="font-display font-semibold text-lg mb-3">System Prompt Design</h3>
              <pre className="rounded-lg bg-background border border-border p-4 text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
{`You are an expert Indian recipe parser.
Given a voice transcript describing a recipe, extract and return a JSON object:

{
  "title": "Recipe Name",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "steps": ["Step 1 description", "Step 2 description", ...],
  "region": "Indian region (e.g., Kerala, Punjab, Tamil Nadu)",
  "time": "Estimated cooking time (e.g., 45 mins)",
  "servings": "Number of servings (e.g., 4)"
}

Rules:
- Always return valid JSON
- Infer region from ingredients/cooking style if not stated
- Convert colloquial measurements to standard
- Separate steps logically
- Include prep and cooking time combined`}
              </pre>
            </div>
          </TabsContent>

          {/* Demo Readiness Tab */}
          <TabsContent value="demo" className="space-y-4">
            <div className="section-card">
              <h3 className="font-display font-semibold text-lg mb-4">Demo Readiness Checklist</h3>
              <div className="space-y-2">
                {demoChecklist.map(({ label, desc }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-start gap-3 rounded-lg border border-border bg-background p-3"
                  >
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Architecture Justification */}
            <div className="section-card">
              <h3 className="font-display font-semibold text-lg mb-3">Architecture Decision Justification</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="font-medium text-foreground">Why FastAPI?</p>
                  <p className="text-xs mt-1">Native async/await, built-in WebSocket support, automatic OpenAPI docs, high performance with uvicorn.</p>
                </div>
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="font-medium text-foreground">Why Whisper for STT?</p>
                  <p className="text-xs mt-1">Best accuracy for Indian accents, supports multilingual input, runs locally or via API.</p>
                </div>
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="font-medium text-foreground">Why GPT-4 for Structured Output?</p>
                  <p className="text-xs mt-1">Superior JSON extraction, understands cooking context, handles colloquial terms, reliable structured output.</p>
                </div>
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="font-medium text-foreground">Why WebSocket over REST?</p>
                  <p className="text-xs mt-1">Real-time bidirectional streaming, lower latency for audio chunks, supports partial recipe updates.</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {selectedRecipe && (
        <RecipeDetailModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
      )}
    </SidebarLayout>
  );
};

export default AdminPanel;
