import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Loader2, ChefHat, Clock, Users, MapPin, Globe, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import SidebarLayout from "@/components/SidebarLayout";
import RecipeConfirm from "@/components/RecipeConfirm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type RecipeData, saveLocalRecipe } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

const LANGUAGES = [
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "Hindi (हिन्दी)" },
  { code: "kn-IN", label: "Kannada (ಕನ್ನಡ)" },
  { code: "ta-IN", label: "Tamil (தமிழ்)" },
  { code: "ml-IN", label: "Malayalam (മലയാളം)" },
  { code: "te-IN", label: "Telugu (తెలుగు)" },
  { code: "bn-IN", label: "Bengali (বাংলা)" },
  { code: "mr-IN", label: "Marathi (मराठी)" },
  { code: "gu-IN", label: "Gujarati (ગુજરાતી)" },
  { code: "pa-IN", label: "Punjabi (ਪੰਜਾਬੀ)" },
];

const VoiceRecipe = () => {
  const [transcript, setTranscript] = useState("");
  const [recipe, setRecipe] = useState<Partial<RecipeData> | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en-IN");
  const recognitionRef = useRef<any>(null);

  const speakRecipe = useCallback((recipeData: Partial<RecipeData>) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const text = `Here is your recipe for ${recipeData.title}. ${recipeData.description || ""} You will need ${recipeData.ingredients?.length || 0} ingredients. ${recipeData.ingredients?.join(", ")}. The cooking steps are: ${recipeData.steps?.map((s, i) => `Step ${i + 1}: ${s}`).join(". ")}. Total cooking time is ${recipeData.time || "not specified"}. This serves ${recipeData.servings || "4"}. This dish originates from ${recipeData.region || "India"}.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech Recognition not supported in this browser. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectedLang;

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t + " ";
        } else {
          interim = t;
        }
      }
      setTranscript(finalTranscript + interim);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech") {
        toast.error(`Mic error: ${event.error}`);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setRecipe(null);
    setShowConfirm(false);
    setTranscript("");
  }, [selectedLang]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  const processWithAI = useCallback(async () => {
    if (!transcript.trim()) {
      toast.error("Please record or type a recipe description first.");
      return;
    }

    setIsProcessing(true);
    try {
      const langLabel = LANGUAGES.find(l => l.code === selectedLang)?.label || "English";
      const { data, error } = await supabase.functions.invoke("structure-recipe", {
        body: { transcript: transcript.trim(), language: langLabel },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const structured = data.recipe;
      const fullRecipe = {
        ...structured,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setRecipe(fullRecipe);
      setShowConfirm(true);
      toast.success("Recipe structured by AI!");
      speakRecipe(fullRecipe);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to process recipe with AI");
    } finally {
      setIsProcessing(false);
    }
  }, [transcript]);

  const handleConfirmSave = useCallback(async (confirmedRecipe: RecipeData) => {
    saveLocalRecipe(confirmedRecipe);
    toast.success("Recipe saved!");
    setShowConfirm(false);
    setRecipe(null);
    setTranscript("");
  }, []);

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Voice Recipe Capture</h1>
          <p className="text-sm text-muted-foreground">Speak or type your recipe — AI structures it with ingredients, steps & timing</p>
        </div>

        <AnimatePresence mode="wait">
          {showConfirm && recipe?.title ? (
            <RecipeConfirm
              key="confirm"
              recipe={recipe as RecipeData}
              onConfirm={handleConfirmSave}
              onCancel={() => setShowConfirm(false)}
            />
          ) : (
            <motion.div key="capture" className="grid gap-6 lg:grid-cols-2">
              {/* Left: Input */}
              <div className="space-y-4">
              {/* Language Selector */}
                <div className="section-card">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Voice Language</span>
                  </div>
                  <Select value={selectedLang} onValueChange={setSelectedLang}>
                    <SelectTrigger className="mt-2 bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mic button */}
                <div className="section-card flex flex-col items-center py-10">
                  <div className="relative">
                    {isRecording && (
                      <>
                        <motion.div
                          className="absolute inset-0 rounded-full bg-destructive/20"
                          animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full bg-destructive/10"
                          animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                        />
                      </>
                    )}
                    <Button
                      size="lg"
                      variant={isRecording ? "destructive" : "default"}
                      className={`relative z-10 h-20 w-20 rounded-full ${
                        isRecording ? "" : "bg-primary hover:bg-primary/90 glow-orange"
                      }`}
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isProcessing}
                    >
                      {isRecording ? (
                        <Square className="h-7 w-7 fill-current" />
                      ) : (
                        <Mic className="h-8 w-8" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    {isRecording ? (
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-destructive animate-pulse-recording" />
                        Listening... tap to stop
                      </span>
                    ) : (
                      "Tap to start speaking your recipe"
                    )}
                  </p>
                </div>

                {/* Transcript area */}
                <div className="section-card">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Recipe Description</h3>
                  <Textarea
                    placeholder="Speak or type your recipe here... e.g., 'I want to make chicken biryani with basmati rice and yogurt marinade'"
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    className="min-h-[120px] bg-background border-border resize-none"
                  />
                </div>

                {/* Process button */}
                <Button
                  onClick={processWithAI}
                  disabled={isProcessing || !transcript.trim()}
                  className="w-full glow-orange"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      AI is structuring your recipe...
                    </>
                  ) : (
                    <>
                      <ChefHat className="h-4 w-4 mr-2" />
                      Structure Recipe with AI
                    </>
                  )}
                </Button>

                {/* TTS Control */}
                {isSpeaking && (
                  <Button variant="outline" onClick={stopSpeaking} className="w-full border-destructive/30 text-destructive hover:bg-destructive/10">
                    <VolumeX className="h-4 w-4 mr-2" /> Stop AI Voice
                  </Button>
                )}

                {/* Architecture Info */}
                <div className="section-card text-xs text-muted-foreground space-y-2">
                  <h3 className="font-semibold text-foreground text-sm">How it works</h3>
                  <p>1. <strong>Voice Input</strong> → Browser Speech Recognition captures your words</p>
                  <p>2. <strong>AI Processing</strong> → Transcript sent to AI for structured extraction</p>
                  <p>3. <strong>Structured Output</strong> → Title, ingredients, steps, time, region parsed</p>
                  <p>4. <strong>AI Voice Response</strong> → Text-to-Speech reads the recipe back</p>
                  <p>5. <strong>Review & Save</strong> → Edit the AI output before saving</p>
                </div>
              </div>

              {/* Right: Preview */}
              <div className="space-y-4">
                {recipe ? (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="section-card space-y-5"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-xl font-bold">{recipe.title}</h2>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-9 w-9 ${isSpeaking ? "text-primary animate-pulse" : "text-muted-foreground hover:text-primary"}`}
                        onClick={() => isSpeaking ? stopSpeaking() : speakRecipe(recipe)}
                        title={isSpeaking ? "Stop speaking" : "Read recipe aloud"}
                      >
                        {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                      </Button>
                    </div>
                    {recipe.description && (
                      <p className="text-sm text-muted-foreground">{recipe.description}</p>
                    )}

                    <div className="flex flex-wrap gap-3">
                      {recipe.time && (
                        <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                          <Clock className="h-3 w-3" /> {recipe.time}
                        </span>
                      )}
                      {recipe.servings && (
                        <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                          <Users className="h-3 w-3" /> {recipe.servings}
                        </span>
                      )}
                      {recipe.region && (
                        <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {recipe.region}
                        </span>
                      )}
                    </div>

                    {recipe.ingredients && recipe.ingredients.length > 0 && (
                      <div>
                        <h3 className="font-display font-semibold mb-2">Ingredients</h3>
                        <ul className="space-y-1.5">
                          {recipe.ingredients.map((ing, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                              {ing}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {recipe.steps && recipe.steps.length > 0 && (
                      <div>
                        <h3 className="font-display font-semibold mb-2">Step-by-Step Method</h3>
                        <ol className="space-y-3">
                          {recipe.steps.map((step, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="flex gap-3 text-sm"
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                {i + 1}
                              </span>
                              <p className="text-foreground/80 leading-relaxed pt-0.5">{step}</p>
                            </motion.li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="section-card flex flex-col items-center justify-center py-20 text-center">
                    <ChefHat className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">
                      Your AI-structured recipe will appear here
                    </p>
                    <p className="text-muted-foreground/60 text-xs mt-1">
                      Record or type a recipe description, then click "Structure Recipe"
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SidebarLayout>
  );
};

export default VoiceRecipe;
