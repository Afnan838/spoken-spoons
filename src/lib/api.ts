import recipeCard1 from "@/assets/recipe-card-1.jpg";
import recipeCard2 from "@/assets/recipe-card-2.jpg";
import recipeCard3 from "@/assets/recipe-card-3.jpg";
import recipeSamosa from "@/assets/recipe-samosa.jpg";
import recipeDal from "@/assets/recipe-dal.jpg";
import recipeTandoori from "@/assets/recipe-tandoori.jpg";

export interface RecipeData {
  id: string;
  title: string;
  description?: string;
  ingredients: string[];
  steps: string[];
  time: string;
  servings: string;
  region: string;
  image?: string;
  videoUrl?: string;
  createdAt: string;
  userId?: string;
}

export interface WebSocketMessage {
  type: "transcript" | "partial_recipe" | "final_recipe" | "tts_audio" | "error" | "status";
  data: any;
}

export const API_BASE_URL = "http://localhost:8000";
export const WS_AUDIO_URL = "ws://localhost:8000/ws/audio";

export const REGIONS = ["Kerala", "Punjab", "Tamil Nadu", "Gujarat", "Maharashtra", "Karnataka", "Hyderabad", "Rajasthan", "Bengal", "Goa"];

// Demo recipes
export const DEMO_RECIPES: RecipeData[] = [
  {
    id: "1",
    title: "Chicken Biryani",
    description: "A traditional Hyderabadi biryani recipe passed down through generations, featuring fragrant basmati rice layered with succulent chicken pieces and aromatic spices.",
    ingredients: ["2 cups basmati rice", "500g chicken, cut into pieces", "1 cup yogurt", "2 large onions, sliced", "4 tomatoes, chopped", "2 tbsp ginger-garlic paste", "1 tsp turmeric powder", "2 tsp red chili powder", "1 tsp garam masala", "Fresh coriander and mint leaves", "Saffron strands soaked in warm milk", "Ghee for cooking", "Salt to taste"],
    steps: ["Marinate chicken with yogurt, turmeric, chili powder, and salt for 30 minutes.", "Fry sliced onions in ghee until golden brown. Remove half for garnishing.", "To the remaining onions, add ginger-garlic paste and sauté for 2 minutes. Add chicken pieces and cook on high heat for 5 minutes.", "Mix in yogurt, tomatoes, turmeric, red chili powder, and salt. Cook until chicken is tender and oil separates.", "In another pot, boil water with whole spices (bay leaves, cinnamon, cardamom). Add soaked rice and cook until 70% done.", "Layer the partially cooked rice over the chicken. Sprinkle fried onions, fresh herbs, and saffron milk on top.", "Cover with a tight lid and cook on low heat for 20 minutes. Let it rest for 5 minutes before serving.", "Gently mix the biryani and serve hot with raita and pickle."],
    time: "45 min",
    servings: "4-6 servings",
    region: "Hyderabad",
    image: recipeCard2,
    createdAt: "2026-03-28T10:00:00Z",
  },
  {
    id: "2",
    title: "Masala Dosa",
    description: "Crispy South Indian crepe filled with spiced potato filling, served with coconut chutney and sambar.",
    ingredients: ["2 cups rice", "1 cup urad dal", "4 potatoes, boiled", "2 onions, chopped", "1 tsp mustard seeds", "Curry leaves", "1 tsp turmeric", "Green chilies", "Oil for cooking", "Salt to taste"],
    steps: ["Soak rice and urad dal separately for 6 hours.", "Grind to a smooth batter. Ferment overnight.", "For filling: sauté mustard seeds, curry leaves, onions, then add mashed potatoes and turmeric.", "Spread thin batter on hot tawa, drizzle oil.", "Place potato filling and fold.", "Serve with coconut chutney and sambar."],
    time: "30 min",
    servings: "4 servings",
    region: "Karnataka",
    image: recipeCard3,
    createdAt: "2026-03-27T14:00:00Z",
  },
  {
    id: "3",
    title: "Punjabi Samosa",
    description: "Golden fried pastry pockets stuffed with spiced potato and pea filling.",
    ingredients: ["2 cups all-purpose flour", "3 potatoes, boiled and mashed", "1/2 cup green peas", "1 tsp cumin seeds", "1 tsp garam masala", "1 tsp amchur powder", "Green chilies", "Oil for deep frying", "Salt to taste"],
    steps: ["Make dough with flour, salt, oil and water. Rest 30 min.", "Prepare filling with mashed potatoes, peas, cumin, garam masala.", "Roll dough into semi-circles, form cones, fill with potato mixture.", "Seal edges with water.", "Deep fry on medium heat until golden and crispy.", "Serve hot with green chutney and tamarind chutney."],
    time: "40 min",
    servings: "12 pieces",
    region: "Punjab",
    image: recipeSamosa,
    createdAt: "2026-03-26T09:00:00Z",
  },
  {
    id: "4",
    title: "Butter Chicken",
    description: "Creamy tomato-based curry with tender tandoori chicken pieces.",
    ingredients: ["500g chicken", "1 cup tomato puree", "1/2 cup cream", "2 tbsp butter", "1 tbsp ginger-garlic paste", "1 tsp garam masala", "1 tsp kashmiri chili", "Kasuri methi", "Salt to taste"],
    steps: ["Marinate chicken with yogurt and spices. Grill or pan-fry.", "Sauté ginger-garlic paste in butter.", "Add tomato puree, cook until oil separates.", "Add spices, cream, and grilled chicken.", "Simmer for 10 minutes. Garnish with kasuri methi and cream."],
    time: "45 min",
    servings: "4 servings",
    region: "Punjab",
    image: recipeCard1,
    createdAt: "2026-03-25T16:00:00Z",
  },
  {
    id: "5",
    title: "Dal Makhani",
    description: "Rich and creamy black lentil curry slow-cooked to perfection.",
    ingredients: ["1 cup whole black urad dal", "1/4 cup rajma", "2 tbsp butter", "1 cup tomato puree", "1/2 cup cream", "1 tbsp ginger-garlic paste", "1 tsp cumin seeds", "1 tsp garam masala", "Kasuri methi", "Salt to taste"],
    steps: ["Soak dal and rajma overnight. Pressure cook until soft.", "In a pan, heat butter, add cumin seeds and ginger-garlic paste.", "Add tomato puree and cook until thick.", "Add cooked dal, cream, and spices.", "Simmer on low heat for 30 minutes, stirring occasionally.", "Garnish with cream and kasuri methi."],
    time: "60 min",
    servings: "4 servings",
    region: "Punjab",
    image: recipeDal,
    createdAt: "2026-03-24T12:00:00Z",
  },
  {
    id: "6",
    title: "Tandoori Chicken",
    description: "Marinated chicken cooked in traditional clay oven style with bold spices.",
    ingredients: ["1 whole chicken, cut into pieces", "1 cup yogurt", "2 tbsp tandoori masala", "1 tbsp ginger-garlic paste", "1 tsp kashmiri chili", "Lemon juice", "Oil", "Salt to taste"],
    steps: ["Make deep cuts in chicken pieces.", "Mix yogurt, tandoori masala, ginger-garlic paste, chili powder, lemon juice, and salt.", "Marinate chicken for at least 4 hours.", "Preheat oven to 220°C or prepare a grill.", "Cook for 25-30 minutes, basting with oil.", "Serve with onion rings, lemon wedges, and mint chutney."],
    time: "35 min",
    servings: "4 servings",
    region: "Punjab",
    image: recipeTandoori,
    createdAt: "2026-03-23T18:00:00Z",
  },
];

// Local storage helpers
const STORAGE_KEY = "recipeai_recipes";

export function getLocalRecipes(): RecipeData[] {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return stored.length > 0 ? stored : DEMO_RECIPES;
  } catch {
    return DEMO_RECIPES;
  }
}

export function saveLocalRecipe(recipe: Partial<RecipeData>): RecipeData {
  const recipes = getLocalRecipes();
  const newRecipe: RecipeData = {
    id: crypto.randomUUID(),
    title: recipe.title || "Untitled Recipe",
    description: recipe.description || "",
    ingredients: recipe.ingredients || [],
    steps: recipe.steps || [],
    time: recipe.time || "",
    servings: recipe.servings || "",
    region: recipe.region || "",
    image: recipe.image,
    videoUrl: recipe.videoUrl,
    createdAt: new Date().toISOString(),
  };
  recipes.unshift(newRecipe);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
  return newRecipe;
}

export function deleteLocalRecipe(id: string): void {
  const recipes = getLocalRecipes().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

// API calls (will use backend when available, fallback to local)
export async function saveRecipe(recipe: RecipeData, imageFile?: File): Promise<RecipeData> {
  try {
    const formData = new FormData();
    formData.append("recipe", JSON.stringify(recipe));
    if (imageFile) formData.append("image", imageFile);
    const res = await fetch(`${API_BASE_URL}/recipes/save`, { method: "POST", body: formData });
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return saveLocalRecipe(recipe);
  }
}

export async function deleteRecipe(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE_URL}/recipes/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error();
  } catch {
    deleteLocalRecipe(id);
  }
}

export async function exportRecipePdf(id: string): Promise<Blob> {
  const res = await fetch(`${API_BASE_URL}/recipes/export/pdf/${id}`);
  if (!res.ok) throw new Error("PDF export failed");
  return res.blob();
}

export async function exportRecipeBookPdf(ids: string[]): Promise<Blob> {
  const res = await fetch(`${API_BASE_URL}/recipes/export/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipe_ids: ids }),
  });
  if (!res.ok) throw new Error("Book export failed");
  return res.blob();
}
