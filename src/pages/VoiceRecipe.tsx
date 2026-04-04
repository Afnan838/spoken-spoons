import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Loader2, ChefHat, Clock, Users, MapPin, Globe, Volume2, VolumeX, Zap, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import SidebarLayout from "@/components/SidebarLayout";
import RecipeConfirm from "@/components/RecipeConfirm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type RecipeData, saveLocalRecipe } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";

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

type ChatMessage = {
  id: string;
  role: "user" | "ira";
  text: string;
  emoji?: string;
  intent?: string;
  timestamp: Date;
};

const VoiceRecipe = () => {
  const [transcript, setTranscript] = useState("");
  const [recipe, setRecipe] = useState<Partial<RecipeData> | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en-IN");
  const [handsFree, setHandsFree] = useState(true);
  const [statusText, setStatusText] = useState(`Say "Hey ${ASSISTANT_NAME}" to start`);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "ira",
      text: `Hi! I'm ${ASSISTANT_NAME}, your personal voice chef! 🍳 Tap the mic and talk to me — say hello, ask me anything about cooking, or just tell me what you want to eat!`,
      emoji: "👋",
      intent: "greeting",
      timestamp: new Date(),
    },
  ]);
  const [conversationHistory, setConversationHistory] = useState<{ role: string; content: string }[]>([]);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  const speak = useCallback((text: string, langCode: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const ttsLang = LANGUAGES.find(l => l.code === langCode)?.ttsLang || "en-IN";
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = ttsLang;
    utterance.rate = 0.95;
    utterance.pitch = 1.1;

    // Select a female voice for Ira
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v =>
      v.lang.startsWith(ttsLang.split("-")[0]) &&
      (/female/i.test(v.name) || /woman/i.test(v.name) || /zira/i.test(v.name) || /samantha/i.test(v.name) || /google.*female/i.test(v.name))
    ) || voices.find(v =>
      v.lang.startsWith(ttsLang.split("-")[0]) &&
      !(/male/i.test(v.name) && !/female/i.test(v.name))
    );
    if (femaleVoice) utterance.voice = femaleVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setStatusText(`🔊 ${ASSISTANT_NAME} is speaking...`);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setStatusText(`Tap mic to talk to ${ASSISTANT_NAME}`);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
    };
    speechSynthesis.speak(utterance);
  }, []);

  const speakRecipe = useCallback((recipeData: Partial<RecipeData>, langCode: string) => {
    const text = `${recipeData.title}. ${recipeData.description || ""} ${recipeData.ingredients?.join(", ")}. ${recipeData.steps?.map((s, i) => `${i + 1}. ${s}`).join(". ")}`;
    speak(text, langCode);
  }, [speak]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setStatusText(`Tap mic to talk to ${ASSISTANT_NAME}`);
  }, []);

  const addChatMessage = useCallback((role: "user" | "ira", text: string, emoji?: string, intent?: string) => {
    setChatMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role,
      text,
      emoji,
      intent,
      timestamp: new Date(),
    }]);
  }, []);

  const processWithAI = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Add user message to chat
    addChatMessage("user", text.trim());

    setIsProcessing(true);
    setStatusText(`🧠 ${ASSISTANT_NAME} is thinking...`);

    try {
      const langLabel = LANGUAGES.find(l => l.code === selectedLang)?.label || "English";

      // Step 1: Ask Ira to classify intent and respond conversationally
      const { data: chatData, error: chatError } = await supabase.functions.invoke("ira-chat", {
        body: {
          transcript: text.trim(),
          language: langLabel,
          history: conversationHistory,
        },
      });

      if (chatError) throw chatError;
      if (chatData?.error) throw new Error(chatData.error);

      const { reply, intent, emoji } = chatData;

      // Update conversation history
      setConversationHistory(prev => [
        ...prev,
        { role: "user", content: text.trim() },
        { role: "assistant", content: reply },
      ]);

      // Add Ira's conversational reply
      addChatMessage("ira", reply, emoji, intent);
      speak(reply, selectedLang);

      // Step 2: If intent is "recipe", also structure the recipe
      if (intent === "recipe") {
        setStatusText(`🍳 ${ASSISTANT_NAME} is structuring your recipe...`);

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
        toast.success(`${ASSISTANT_NAME} structured your recipe!`);
      } else {
        setStatusText(`Tap mic to talk to ${ASSISTANT_NAME}`);
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg = "Oops, I didn't catch that. Can you try again?";
      addChatMessage("ira", errorMsg, "😅", "chat");
      speak(errorMsg, selectedLang);
      toast.error(err.message || "Failed to process with AI");
      setStatusText("❌ Error — try again");
    } finally {
      setIsProcessing(false);
    }
  }, [selectedLang, speak, addChatMessage, conversationHistory]);

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech Recognition not supported. Try Chrome.");
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
      setStatusText(`👂 ${ASSISTANT_NAME} is listening...`);

      if (handsFree) {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (finalTranscript.trim().length > 2) {
            recognition.stop();
            setIsRecording(false);
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
    setTranscript("");
    transcriptRef.current = "";
    setStatusText(`👂 ${ASSISTANT_NAME} is listening... speak naturally`);
  }, [selectedLang, handsFree, processWithAI]);

  const stopRecording = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    recognitionRef.current?.stop();
    setIsRecording(false);

    if (transcriptRef.current.trim().length > 2) {
      processWithAI(transcriptRef.current.trim());
    } else {
      setStatusText(`Tap mic to talk to ${ASSISTANT_NAME}`);
    }
  }, [processWithAI]);

  const handleConfirmSave = useCallback(async (confirmedRecipe: RecipeData) => {
    saveLocalRecipe(confirmedRecipe);
    const msg = "Recipe saved to your collection! Want to cook something else?";
    addChatMessage("ira", msg, "✅", "chat");
    speak(msg, selectedLang);
    toast.success("Recipe saved!");
    setShowConfirm(false);
    setRecipe(null);
    setTranscript("");
    setStatusText(`✅ Saved! Talk to ${ASSISTANT_NAME} for another recipe`);
  }, [addChatMessage, speak, selectedLang]);

  const handleTextSubmit = useCallback(() => {
    if (transcript.trim()) {
      processWithAI(transcript.trim());
      setTranscript("");
    }
  }, [transcript, processWithAI]);

  return (
    <SidebarLayout>
      <div className="space-y-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              {ASSISTANT_NAME} — Voice Recipe Assistant
            </h1>
            <p className="text-sm text-muted-foreground">Talk to {ASSISTANT_NAME} like Siri or Alexa — say hi, ask questions, or describe a recipe</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={handsFree ? "default" : "outline"}
              size="sm"
              onClick={() => setHandsFree(!handsFree)}
              className="text-xs"
            >
              <Zap className="h-3 w-3 mr-1" />
              {handsFree ? "Hands-Free ON" : "Hands-Free OFF"}
            </Button>
            <Select value={selectedLang} onValueChange={setSelectedLang}>
              <SelectTrigger className="w-[160px] bg-background border-border">
                <Globe className="h-3.5 w-3.5 mr-1.5 text-primary" />
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
        </div>

        <AnimatePresence mode="wait">
          {showConfirm && recipe?.title ? (
            <RecipeConfirm
              key="confirm"
              recipe={recipe as RecipeData}
              onConfirm={handleConfirmSave}
              onCancel={() => { setShowConfirm(false); setStatusText(`Talk to ${ASSISTANT_NAME}`); }}
            />
          ) : (
            <motion.div key="chat" className="grid gap-4 lg:grid-cols-[1fr,340px] flex-1 min-h-0">
              {/* Chat Area */}
              <div className="section-card flex flex-col min-h-[500px]">
                {/* Status bar */}
                <motion.div
                  className="text-center py-2 border-b border-border mb-3"
                  animate={{
                    borderColor: isRecording ? "hsl(var(--primary))" : "hsl(var(--border))",
                  }}
                >
                  <p className="text-xs font-medium text-muted-foreground">{statusText}</p>
                </motion.div>

                {/* Messages */}
                <ScrollArea className="flex-1 pr-2">
                  <div className="space-y-3 pb-2">
                    {chatMessages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-secondary text-foreground rounded-bl-md"
                          }`}
                        >
                          {msg.role === "ira" && (
                            <span className="text-xs font-semibold text-primary block mb-0.5">
                              {msg.emoji} {ASSISTANT_NAME}
                            </span>
                          )}
                          <p className="leading-relaxed">{msg.text}</p>
                          <span className="text-[10px] opacity-50 mt-1 block">
                            {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                    {isProcessing && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3 text-sm">
                          <span className="text-xs font-semibold text-primary block mb-1">{ASSISTANT_NAME}</span>
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                          </span>
                        </div>
                      </motion.div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>

                {/* Input area */}
                <div className="border-t border-border pt-3 mt-2 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Textarea
                      placeholder={`Type a message to ${ASSISTANT_NAME}...`}
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      className="min-h-[44px] max-h-[88px] bg-background border-border resize-none pr-10 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleTextSubmit();
                        }
                      }}
                    />
                  </div>

                  {/* Mic Button */}
                  <div className="relative">
                    {isRecording && (
                      <>
                        <motion.div
                          className="absolute inset-0 rounded-full bg-primary/20"
                          animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 1.2, repeat: Infinity }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full bg-primary/10"
                          animate={{ scale: [1, 2.2, 1], opacity: [0.3, 0, 0.3] }}
                          transition={{ duration: 1.8, repeat: Infinity, delay: 0.2 }}
                        />
                      </>
                    )}
                    <Button
                      size="icon"
                      variant={isRecording ? "destructive" : "default"}
                      className={`relative z-10 h-11 w-11 rounded-full ${
                        isRecording ? "" : "glow-orange"
                      }`}
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : isRecording ? (
                        <Square className="h-4 w-4 fill-current" />
                      ) : (
                        <Mic className="h-5 w-5" />
                      )}
                    </Button>
                  </div>

                  {isSpeaking && (
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-11 w-11 rounded-full border-destructive/30 text-destructive"
                      onClick={stopSpeaking}
                    >
                      <VolumeX className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Right: Recipe Preview or Tips */}
              <div className="space-y-4">
                {recipe ? (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="section-card space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-lg font-bold">{recipe.title}</h2>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${isSpeaking ? "text-primary animate-pulse" : "text-muted-foreground hover:text-primary"}`}
                        onClick={() => isSpeaking ? stopSpeaking() : speakRecipe(recipe, selectedLang)}
                      >
                        {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                    </div>
                    {recipe.description && <p className="text-sm text-muted-foreground">{recipe.description}</p>}
                    <div className="flex flex-wrap gap-2">
                      {recipe.time && (
                        <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          <Clock className="h-3 w-3" /> {recipe.time}
                        </span>
                      )}
                      {recipe.servings && (
                        <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          <Users className="h-3 w-3" /> {recipe.servings}
                        </span>
                      )}
                      {recipe.region && (
                        <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {recipe.region}
                        </span>
                      )}
                    </div>
                    {recipe.ingredients && recipe.ingredients.length > 0 && (
                      <div>
                        <h3 className="font-display font-semibold text-sm mb-1.5">Ingredients</h3>
                        <ul className="space-y-1">
                          {recipe.ingredients.map((ing, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                              {ing}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {recipe.steps && recipe.steps.length > 0 && (
                      <div>
                        <h3 className="font-display font-semibold text-sm mb-1.5">Steps</h3>
                        <ol className="space-y-2">
                          {recipe.steps.map((step, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.04 }}
                              className="flex gap-2 text-xs"
                            >
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
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
                  <div className="section-card space-y-4">
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="relative mb-3">
                        <MessageCircle className="h-12 w-12 text-muted-foreground/20" />
                        <Mic className="h-5 w-5 text-primary absolute -bottom-1 -right-1" />
                      </div>
                      <p className="text-muted-foreground text-sm font-medium">
                        "Hey {ASSISTANT_NAME}, make me biryani..."
                      </p>
                      <p className="text-muted-foreground/60 text-xs mt-1">
                        {ASSISTANT_NAME} understands natural conversation
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1.5 border-t border-border pt-3">
                      <h3 className="font-semibold text-foreground text-sm mb-2">💬 Try saying:</h3>
                      <p className="bg-secondary/50 rounded-lg px-3 py-1.5">"Hi Ira, how are you?"</p>
                      <p className="bg-secondary/50 rounded-lg px-3 py-1.5">"What can you do?"</p>
                      <p className="bg-secondary/50 rounded-lg px-3 py-1.5">"Make me paneer butter masala"</p>
                      <p className="bg-secondary/50 rounded-lg px-3 py-1.5">"नमस्ते इरा, दाल बनाओ"</p>
                      <p className="bg-secondary/50 rounded-lg px-3 py-1.5">"ಹೆಲೋ ಇರಾ, ಬಿಸಿಬೇಳೆಬಾತ್ ಮಾಡಿ"</p>
                    </div>
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
