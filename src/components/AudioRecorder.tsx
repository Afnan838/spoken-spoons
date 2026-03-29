import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioRecorderProps {
  onAudioChunk: (chunk: Blob) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  disabled?: boolean;
}

const AudioRecorder = ({ onAudioChunk, onRecordingStart, onRecordingStop, disabled }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          onAudioChunk(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        onRecordingStop?.();
      };

      mediaRecorder.start(1000); // send chunks every 1s
      setIsRecording(true);
      onRecordingStart?.();
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setPermissionError("Microphone access denied. Please allow mic permissions.");
      } else {
        setPermissionError("Could not access microphone. Please check your device.");
      }
    }
  }, [onAudioChunk, onRecordingStart, onRecordingStop]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
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
          disabled={disabled}
        >
          {isRecording ? (
            <Square className="h-7 w-7 fill-current" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {isRecording ? (
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse-recording" />
            Recording... tap to stop
          </span>
        ) : (
          "Tap to start recording your recipe"
        )}
      </p>

      {permissionError && (
        <p className="text-sm text-destructive max-w-xs text-center">{permissionError}</p>
      )}
    </div>
  );
};

export default AudioRecorder;
