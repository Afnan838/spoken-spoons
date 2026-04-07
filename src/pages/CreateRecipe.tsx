import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Eye, Save, Upload, X, Plus, Image as ImageIcon, Video, Shield } from "lucide-react";
import SidebarLayout from "@/components/SidebarLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { REGIONS, saveLocalRecipe } from "@/lib/api";
import { getUser, isAdmin } from "@/lib/auth";

const CreateRecipe = () => {
  const navigate = useNavigate();
  const user = getUser();
  const adminAccess = user && isAdmin();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("");
  const [servings, setServings] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [ingredients, setIngredients] = useState([""]);
  const [steps, setSteps] = useState([""]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleImageSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const handleSave = useCallback(() => {
    if (!title.trim()) { toast.error("Please enter a recipe title"); return; }
    const recipe = saveLocalRecipe({
      title: title.trim(),
      description: description.trim(),
      region,
      time: time.trim(),
      servings: servings.trim(),
      videoUrl: videoUrl.trim(),
      ingredients: ingredients.filter(Boolean),
      steps: steps.filter(Boolean),
      image: imagePreview || undefined,
    }, adminAccess);
    if (adminAccess) {
      toast.success("Recipe saved!");
    } else {
      toast.success("Recipe submitted for admin approval!");
    }
    navigate(`/recipe/${recipe.id}`);
  }, [title, description, region, time, servings, videoUrl, ingredients, steps, imagePreview, navigate, adminAccess]);

  // Allow all logged-in users to create recipes

  return (
    <SidebarLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold">Create New Recipe</h1>
            <p className="text-sm text-muted-foreground">Share your culinary masterpiece</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/recipe/preview`)}>
              <Eye className="h-4 w-4 mr-2" /> Preview
            </Button>
            <Button onClick={handleSave} className="glow-orange">
              <Save className="h-4 w-4 mr-2" /> Save Recipe
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="section-card space-y-4">
            <h2 className="font-display font-semibold text-lg">Basic Information</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium">Recipe Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Grandma's Special Chicken Biryani" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Region/State</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">Select a region</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cook Time</label>
                <Input value={time} onChange={(e) => setTime(e.target.value)} placeholder="e.g., 45 min" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Servings</label>
                <Input value={servings} onChange={(e) => setServings(e.target.value)} placeholder="e.g., 4-6 servings" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A brief description of this recipe..." rows={3} />
            </div>
          </div>

          {/* Image */}
          <div className="section-card space-y-4">
            <h2 className="font-display font-semibold text-lg">Recipe Image</h2>
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                <Button size="icon" variant="destructive" className="absolute top-2 right-2 h-8 w-8 rounded-full" onClick={() => { setImagePreview(null); setImageFile(null); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => imageInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border/50 py-12 cursor-pointer hover:border-primary/50 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImageSelect(f); }}
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Drag and drop your image here</p>
                <p className="text-xs text-muted-foreground">or</p>
                <Button variant="outline" size="sm" className="border-primary text-primary">Browse Files</Button>
              </div>
            )}
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); }} />
          </div>

          {/* Video */}
          <div className="section-card space-y-4">
            <h2 className="font-display font-semibold text-lg">Recipe Video</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium">Video URL</label>
              <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="e.g., https://www.youtube.com/watch?v=..." />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex-1 h-px bg-border" />
              <span>OR UPLOAD VIDEO</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            {videoPreview ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <video src={videoPreview} controls className="w-full max-h-64 object-contain bg-black" />
                <Button size="icon" variant="destructive" className="absolute top-2 right-2 h-8 w-8 rounded-full" onClick={() => { setVideoPreview(null); setVideoFile(null); if (videoInputRef.current) videoInputRef.current.value = ""; }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/50 py-10 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => videoInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith("video/")) { setVideoFile(f); setVideoPreview(URL.createObjectURL(f)); } }}
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Drag and drop your video here</p>
                <p className="text-xs text-muted-foreground">MP4, WebM or Ogg (max. 50MB)</p>
                <Button variant="outline" size="sm" className="border-primary text-primary mt-1" type="button">Browse Videos</Button>
              </div>
            )}
            <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/ogg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setVideoFile(f); setVideoPreview(URL.createObjectURL(f)); } }} />
          </div>

          {/* Ingredients */}
          <div className="section-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg">Ingredients</h2>
              <Button variant="outline" size="sm" className="border-primary text-primary" onClick={() => setIngredients([...ingredients, ""])}>
                <Plus className="h-3 w-3 mr-1" /> Add Ingredient
              </Button>
            </div>
            {ingredients.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => { const u = [...ingredients]; u[i] = e.target.value; setIngredients(u); }}
                  placeholder="e.g., 2 cups basmati rice"
                  className="flex-1"
                />
                {ingredients.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Steps */}
          <div className="section-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg">Cooking Steps</h2>
              <Button variant="outline" size="sm" className="border-primary text-primary" onClick={() => setSteps([...steps, ""])}>
                <Plus className="h-3 w-3 mr-1" /> Add Step
              </Button>
            </div>
            {steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0 mt-1">
                  {i + 1}
                </span>
                <Textarea
                  value={step}
                  onChange={(e) => { const u = [...steps]; u[i] = e.target.value; setSteps(u); }}
                  placeholder={`Step ${i + 1}...`}
                  className="flex-1 min-h-[60px]"
                />
                {steps.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => setSteps(steps.filter((_, j) => j !== i))} className="shrink-0">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Save button bottom */}
          <div className="flex justify-end gap-3 pb-8">
            <Button variant="outline" onClick={() => navigate("/recipes")}>Cancel</Button>
            <Button onClick={handleSave} className="glow-orange">
              <Save className="h-4 w-4 mr-2" /> Save Recipe
            </Button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default CreateRecipe;
