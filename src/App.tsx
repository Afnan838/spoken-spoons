import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import CreateRecipe from "./pages/CreateRecipe";
import MyRecipes from "./pages/MyRecipes";
import VoiceRecipe from "./pages/VoiceRecipe";
import ExportPage from "./pages/ExportPage";
import RecipeDetail from "./pages/RecipeDetail";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create" element={<CreateRecipe />} />
          <Route path="/recipes" element={<MyRecipes />} />
          <Route path="/voice-recipe" element={<VoiceRecipe />} />
          <Route path="/export" element={<ExportPage />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
