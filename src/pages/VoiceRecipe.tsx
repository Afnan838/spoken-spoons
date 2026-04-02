import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Loader2, ChefHat, Clock, Users, MapPin, Globe, Volume2, VolumeX, Zap } from "lucide-react";
import { toast } from "sonner";
import SidebarLayout from "@/components/SidebarLayout";
import RecipeConfirm from "@/components/RecipeConfirm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type RecipeData, saveLocalRecipe } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

const ASSISTANT_NAME = "Ira";

const LANGUAGES = [
  { code: "en-IN", label: "English", ttsLang: "en-IN" },
  { code: "hi-IN", label: "Hindi (हिन्दी)", ttsLang: "hi-IN" },
  { code: "kn-IN", label: "Kannada (ಕನ್ನಡ)", ttsLang: "kn-IN" },
  { code: "ta-IN", label: "Tamil (தமிழ்)", ttsLang: "ta-IN" },
  { code: "ml-IN", label: "Malayalam (മലയാളം)", ttsLang: "ml-IN" },
  { code: "te-IN", label: "Telugu (తెలుగు)", ttsLang: "te-IN" },
  { code: "bn-IN", label: "Bengali (বাংলা)", ttsLang: "bn-IN" },
  { code: "mr-IN", label: "Marathi (मराठी)", ttsLang: "mr-IN" },
  { code: "gu-IN", label: "Gujarati (ગુજરાતી)", ttsLang: "gu-IN" },
  { code: "pa-IN", label: "Punjabi (ਪੰਜਾਬੀ)", ttsLang: "pa-IN" },
  { code: "ur-IN", label: "Urdu (اردو)", ttsLang: "ur-IN" },
];

const VoiceRecipe = () => {
  const [transcript, setTranscript] = useState("");
  const [recipe, setRecipe] = useState<Partial<RecipeData> | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en-IN");
  const [handsFree, setHandsFree] = useState(true);
  const [statusText, setStatusText] = useState("Tap the mic to start");
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef("");

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  const speakRecipe = useCallback((recipeData: Partial<RecipeData>, langCode: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const ttsLang = LANGUAGES.find(l => l.code === langCode)?.ttsLang || "en-IN";

    const text = `${recipeData.title}. ${recipeData.description || ""} ${recipeData.ingredients?.join(", ")}. ${recipeData.steps?.map((s, i) => `${i + 1}. ${s}`).join(". ")}. ${recipeData.time || ""}. ${recipeData.servings || ""}. ${recipeData.region || ""}.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = ttsLang;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onstart = () => {
      setIsSpeaking(true);
      setStatusText("🔊 Reading recipe aloud...");
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setStatusText("✅ Done! Tap mic to try another recipe");
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setStatusText("Ready");
    };
    speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setStatusText("Ready");
  }, []);

  const processWithAI = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setIsProcessing(true);
    setStatusText("🧠 AI is thinking...");
    try {
      const langLabel = LANGUAGES.find(l => l.code === selectedLang)?.label || "English";
      const { data, error } = await supabase.functions.invoke("structure-recipe", {
        body: { transcript: text.trim(), language: langLabel },
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
      setStatusText("✨ Recipe ready!");
      toast.success("Recipe structured by AI!");
      speakRecipe(fullRecipe, selectedLang);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to process recipe with AI");
      setStatusText("❌ Error — try again");
    } finally {
      setIsProcessing(false);
    }
  }, [selectedLang, speakRecipe]);

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
      const combined = finalTranscript + interim;
      setTranscript(combined);
      transcriptRef.current = finalTranscript;
      setStatusText("👂 Listening...");

      // Hands-free: auto-process after 2.5s of silence
      if (handsFree) {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (finalTranscript.trim().length > 5) {
            recognition.stop();
            setIsRecording(false);
            setStatusText("🛑 Processing your voice...");
            processWithAI(finalTranscript.trim());
          }
        }, 2500);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech") {
        toast.error(`Mic error: ${event.error}`);
      }
      setIsRecording(false);
      setStatusText("Tap to try again");
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setRecipe(null);
    setShowConfirm(false);
    setTranscript("");
    transcriptRef.current = "";
    setStatusText("👂 Listening... speak your recipe");
  }, [selectedLang, handsFree, processWithAI]);

  const stopRecording = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    recognitionRef.current?.stop();
    setIsRecording(false);

    // If hands-free and has transcript, auto-process
    if (handsFree && transcriptRef.current.trim().length > 5) {
      processWithAI(transcriptRef.current.trim());
    } else {
      setStatusText("Tap 'Structure Recipe' to process");
    }
  }, [handsFree, processWithAI]);

  const handleConfirmSave = useCallback(async (confirmedRecipe: RecipeData) => {
    saveLocalRecipe(confirmedRecipe);
    toast.success("Recipe saved!");
    setShowConfirm(false);
    setRecipe(null);
    setTranscript("");
    setStatusText("✅ Saved! Tap mic for another recipe");
  }, []);

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            {ASSISTANT_NAME} — Voice Recipe Assistant
          </h1>
          <p className="text-sm text-muted-foreground">Speak naturally like talking to Alexa or Siri — your recipe is structured instantly in your language</p>
        </div>

        <AnimatePresence mode="wait">
          {showConfirm && recipe?.title ? (
            <RecipeConfirm
              key="confirm"
              recipe={recipe as RecipeData}
              onConfirm={handleConfirmSave}
              onCancel={() => { setShowConfirm(false); setStatusText("Ready"); }}
            />
          ) : (
            <motion.div key="capture" className="grid gap-6 lg:grid-cols-2">
              {/* Left: Input */}
              <div className="space-y-4">
                {/* Language + Hands-Free Controls */}
                <div className="section-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Voice Language</span>
                    </div>
                    <Button
                      variant={handsFree ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHandsFree(!handsFree)}
                      className="text-xs"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      {handsFree ? "Hands-Free ON" : "Hands-Free OFF"}
                    </Button>
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
                  {handsFree && (
                    <p className="text-xs text-primary/70 mt-2">
                      ⚡ Hands-free mode: Speak and pause — AI auto-processes after you stop talking
                    </p>
                  )}
                </div>

                {/* Status Indicator */}
                <motion.div
                  className="section-card text-center py-3"
                  animate={{
                    borderColor: isRecording ? "hsl(var(--primary))" : isProcessing ? "hsl(var(--accent))" : "hsl(var(--border))",
                  }}
                >
                  <p className="text-sm font-medium">{statusText}</p>
                </motion.div>

                {/* Mic button — large and prominent like Alexa */}
                <div className="section-card flex flex-col items-center py-12">
                  <div className="relative">
                    {isRecording && (
                      <>
                        <motion.div
                          className="absolute inset-0 rounded-full bg-primary/20"
                          animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full bg-primary/10"
                          animate={{ scale: [1, 2.4, 1], opacity: [0.3, 0, 0.3] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full bg-primary/5"
                          animate={{ scale: [1, 3, 1], opacity: [0.2, 0, 0.2] }}
                          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                        />
                      </>
                    )}
                    {isProcessing && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-primary/40 border-t-primary"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        style={{ width: "120px", height: "120px", top: "-10px", left: "-10px" }}
                      />
                    )}
                    <Button
                      size="lg"
                      variant={isRecording ? "destructive" : "default"}
                      className={`relative z-10 h-24 w-24 rounded-full text-lg ${
                        isRecording ? "" : "bg-primary hover:bg-primary/90 glow-orange"
                      }`}
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-10 w-10 animate-spin" />
                      ) : isRecording ? (
                        <Square className="h-8 w-8 fill-current" />
                      ) : (
                        <Mic className="h-10 w-10" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-5">
                    {isProcessing ? (
                      `${ASSISTANT_NAME} is structuring your recipe...`
                    ) : isRecording ? (
                      <span className="flex items-center gap-2 text-primary">
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        {ASSISTANT_NAME} is listening... {handsFree ? "pause to auto-process" : "tap to stop"}
                      </span>
                    ) : (
                      "Tap to start — speak naturally in any language"
                    )}
                  </p>
                </div>

                {/* Transcript area */}
                <div className="section-card">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">What I heard</h3>
                  <Textarea
                    placeholder="Your voice input appears here... or type a recipe description manually"
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    className="min-h-[100px] bg-background border-border resize-none"
                  />
                </div>

                {/* Manual process button (visible when hands-free is off) */}
                {!handsFree && (
                  <Button
                    onClick={() => processWithAI(transcript)}
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
                )}

                {/* TTS Control */}
                {isSpeaking && (
                  <Button variant="outline" onClick={stopSpeaking} className="w-full border-destructive/30 text-destructive hover:bg-destructive/10">
                    <VolumeX className="h-4 w-4 mr-2" /> Stop Voice
                  </Button>
                )}

                {/* How it works */}
                <div className="section-card text-xs text-muted-foreground space-y-2">
                  <h3 className="font-semibold text-foreground text-sm">🎙️ Meet {ASSISTANT_NAME} — Your Voice Chef</h3>
                  <p>1. <strong>Say "Hey {ASSISTANT_NAME}"</strong> or tap mic and speak naturally in any language</p>
                  <p>2. <strong>Pause speaking</strong> — {ASSISTANT_NAME} auto-detects silence and starts processing</p>
                  <p>3. <strong>{ASSISTANT_NAME} structures</strong> your recipe with ingredients, steps & timing</p>
                  <p>4. <strong>Reads it back</strong> to you in your language via text-to-speech</p>
                  <p>5. <strong>Review & save</strong> — edit before saving to your collection</p>
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
                        onClick={() => isSpeaking ? stopSpeaking() : speakRecipe(recipe, selectedLang)}
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
                    <div className="relative mb-4">
                      <ChefHat className="h-16 w-16 text-muted-foreground/20" />
                      <Mic className="h-6 w-6 text-primary absolute -bottom-1 -right-1" />
                    </div>
                    <p className="text-muted-foreground text-sm font-medium">
                      "Hey {ASSISTANT_NAME}, make me a chicken biryani..."
                    </p>
                    <p className="text-muted-foreground/60 text-xs mt-2">
                      Just speak naturally — I'll structure the entire recipe for you
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
