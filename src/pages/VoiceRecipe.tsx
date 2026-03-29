import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, Volume2, Mic, Square } from "lucide-react";
import { toast } from "sonner";
import SidebarLayout from "@/components/SidebarLayout";
import AudioRecorder from "@/components/AudioRecorder";
import RecipeLiveView from "@/components/RecipeLiveView";
import RecipeConfirm from "@/components/RecipeConfirm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWebSocket, type WebSocketStatus } from "@/hooks/useWebSocket";
import { WS_AUDIO_URL, type RecipeData, saveLocalRecipe } from "@/lib/api";

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

  const handleAudioChunk = useCallback((chunk: Blob) => { send(chunk); }, [send]);

  const handleRecordingStart = useCallback(() => {
    setTranscript("");
    setRecipe({});
    setIsProcessing(true);
    setTtsAudioUrl(null);
    setShowConfirm(false);
    if (status !== "connected") connect();
  }, [status, connect]);

  const playTtsAudio = useCallback(() => {
    if (ttsAudioUrl) { const audio = new Audio(ttsAudioUrl); audio.play(); }
  }, [ttsAudioUrl]);

  const handleConfirmSave = useCallback(async (confirmedRecipe: RecipeData) => {
    saveLocalRecipe(confirmedRecipe);
    toast.success("Recipe saved!");
    setShowConfirm(false);
    setRecipe({});
    setTranscript("");
  }, []);

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Voice Recipe Capture</h1>
          <p className="text-sm text-muted-foreground">Speak your recipe naturally — AI structures it in real time</p>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
            <span className={`h-2 w-2 rounded-full ${statusColors[status]}`} />
            <span className="text-muted-foreground">{statusLabels[status]}</span>
            {status === "connected" ? (
              <WifiOff className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground" onClick={disconnect} />
            ) : (
              <Wifi className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground" onClick={connect} />
            )}
          </div>
          <p className="text-xs text-muted-foreground">WebSocket: {WS_AUDIO_URL}</p>
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
            <motion.div key="capture" className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="section-card flex flex-col items-center py-10">
                  <AudioRecorder onAudioChunk={handleAudioChunk} onRecordingStart={handleRecordingStart} />
                </div>

                <AnimatePresence>
                  {transcript && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="section-card">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Live Transcript</h3>
                      <p className="text-sm text-foreground/80 leading-relaxed">{transcript}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {ttsAudioUrl && (
                  <Button onClick={playTtsAudio} variant="outline" className="w-full border-primary/30 hover:bg-primary/10">
                    <Volume2 className="h-4 w-4 mr-2" /> Play AI Response
                  </Button>
                )}

                {/* Architecture Info */}
                <div className="section-card text-xs text-muted-foreground space-y-2">
                  <h3 className="font-semibold text-foreground text-sm">Architecture</h3>
                  <p>1. <strong>Voice Input</strong> → MediaRecorder API captures audio chunks</p>
                  <p>2. <strong>WebSocket Stream</strong> → Audio sent to FastAPI backend in real-time</p>
                  <p>3. <strong>Speech-to-Text</strong> → Whisper / mock STT converts audio → transcript</p>
                  <p>4. <strong>LLM Processing</strong> → System prompt extracts structured JSON</p>
                  <p>5. <strong>Text-to-Speech</strong> → AI response played back as audio</p>
                  <p>6. <strong>Structured Output</strong> → Recipe JSON displayed live on UI</p>
                </div>
              </div>

              <RecipeLiveView recipe={recipe} isStreaming={isProcessing} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SidebarLayout>
  );
};

export default VoiceRecipe;
