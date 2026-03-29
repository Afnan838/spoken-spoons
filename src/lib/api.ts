export interface RecipeData {
  title: string;
  ingredients: string[];
  steps: string[];
  time: string;
  servings: string;
  region: string;
  image?: string;
}

export interface WebSocketMessage {
  type: "transcript" | "partial_recipe" | "final_recipe" | "tts_audio" | "error" | "status";
  data: any;
}

export const API_BASE_URL = "http://localhost:8000";
export const WS_AUDIO_URL = "ws://localhost:8000/ws/audio";
