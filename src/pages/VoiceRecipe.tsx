import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, Volume2 } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import AudioRecorder from "@/components/AudioRecorder";
import RecipeLiveView from "@/components/RecipeLiveView";
import RecipeConfirm from "@/components/RecipeConfirm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWebSocket, type WebSocketStatus } from "@/hooks/useWebSocket";
import { WS_AUDIO_URL, type RecipeData, saveRecipe, saveLocalRecipe } from "@/lib/api";

const statusLabels: Record<WebSocketStatus, string> = {
  idle: "Disconnected",
  connecting: "Connecting...",
  connected: "Connected",
  error: "Connection Error",
  disconnected: "Disconnected",
};

const statusColors: Record<WebSocketStatus, string> = {
  idle: "bg-muted-foreground",
  connecting: "bg-yellow-500",
  connected: "bg-emerald-500",
  error: "bg-destructive",
  disconnected: "bg-muted-foreground",
};

const VoiceRecipe = () => {
  const [transcript, setTranscript] = useState("");
  const [recipe, setRecipe] = useState<Partial<RecipeData>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleMessage = useCallback((data: any) => {
    switch (data.type) {
      case "transcript":
        setTranscript((prev) => prev + " " + data.data);
        break;
      case "partial_recipe":
        setRecipe(data.data);
        break;
      case "final_recipe":
        setRecipe(data.data);
        setIsProcessing(false);
        setShowConfirm(true);
        break;
      case "tts_audio":
        setTtsAudioUrl(data.data);
        break;
      case "error":
        setIsProcessing(false);
        toast.error(data.data || "Processing error");
        break;
    }
  }, []);

  const { status, connect, disconnect, send } = useWebSocket({
    url: WS_AUDIO_URL,
    onMessage: handleMessage,
  });

  const handleAudioChunk = useCallback(
    (chunk: Blob) => { send(chunk); },
    [send]
  );

  const handleRecordingStart = useCallback(() => {
    setTranscript("");
    setRecipe({});
    setIsProcessing(true);
    setTtsAudioUrl(null);
    setShowConfirm(false);
    if (status !== "connected") connect();
  }, [status, connect]);

  const playTtsAudio = useCallback(() => {
    if (ttsAudioUrl) {
      const audio = new Audio(ttsAudioUrl);
      audio.play();
    }
  }, [ttsAudioUrl]);

  const handleConfirmSave = useCallback(async (confirmedRecipe: RecipeData, imageFile?: File) => {
    try {
      await saveRecipe(confirmedRecipe, imageFile);
      toast.success("Recipe saved successfully!");
    } catch {
      // Fallback to local storage if backend offline
      saveLocalRecipe(confirmedRecipe);
      toast.success("Recipe saved locally (backend offline)");
    }
    setShowConfirm(false);
    setRecipe({});
    setTranscript("");
  }, []);

  return (
    <AppLayout>
      <div className="container py-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-display font-bold text-gradient-orange">
            Voice Recipe Capture
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Speak your recipe naturally — our AI will structure it into a beautiful format in real time.
          </p>
        </div>

        {/* Connection Status */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-4 py-2 text-sm">
            <span className={`h-2 w-2 rounded-full ${statusColors[status]}`} />
            <span className="text-muted-foreground">{statusLabels[status]}</span>
            {status === "connected" ? (
              <WifiOff className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground" onClick={disconnect} />
            ) : (
              <Wifi className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground" onClick={connect} />
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {showConfirm && recipe.title ? (
            <RecipeConfirm
              key="confirm"
              recipe={recipe as RecipeData}
              onConfirm={handleConfirmSave}
              onCancel={() => setShowConfirm(false)}
            />
          ) : (
            <motion.div key="capture" className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <Card className="border-border/50 bg-card/80 backdrop-blur">
                  <CardContent className="py-10">
                    <AudioRecorder onAudioChunk={handleAudioChunk} onRecordingStart={handleRecordingStart} />
                  </CardContent>
                </Card>

                <AnimatePresence>
                  {transcript && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="border-border/50 bg-card/50 backdrop-blur">
                        <CardContent className="py-4">
                          <h3 className="text-sm font-semibold text-muted-foreground mb-2">Live Transcript</h3>
                          <p className="text-sm text-foreground/80 leading-relaxed">{transcript}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                {ttsAudioUrl && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Button onClick={playTtsAudio} variant="outline" className="w-full border-primary/30 hover:bg-primary/10">
                      <Volume2 className="h-4 w-4 mr-2" /> Play AI Response
                    </Button>
                  </motion.div>
                )}
              </div>

              <RecipeLiveView recipe={recipe} isStreaming={isProcessing} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default VoiceRecipe;
