import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcript, language, history } = await req.json();
    if (!transcript || transcript.trim().length === 0) {
      return new Response(JSON.stringify({ error: "No input provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lang = language || "English";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const conversationHistory = (history || []).map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are Ira, a friendly and warm Indian recipe voice assistant — like Siri or Alexa but specialized in Indian cooking. You respond in ${lang}.

PERSONALITY:
- You are cheerful, warm, and conversational. Use a friendly tone like talking to a friend.
- You introduce yourself as "Ira" when greeted.
- You use food-related humor and cultural references naturally.
- Keep responses SHORT (1-3 sentences max) for greetings and small talk — voice assistants should be concise.

CAPABILITIES:
- Greetings: Respond warmly to "hi", "hello", "hey Ira", "namaste", etc.
- Small talk: Answer casual questions briefly ("How are you?", "What can you do?", "Tell me a joke")
- Food questions: Answer food/cooking related questions concisely
- Recipe intent: If the user is clearly describing a recipe or asking to make a dish, set intent to "recipe"

LANGUAGE RULE: ALWAYS respond in the SAME language as the user. If they speak Hindi, respond in Hindi. If Tamil, respond in Tamil. Match exactly.

You MUST use the ira_respond tool for EVERY response.`
          },
          ...conversationHistory,
          { role: "user", content: transcript },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "ira_respond",
              description: "Ira's response to the user with intent classification",
              parameters: {
                type: "object",
                properties: {
                  reply: { type: "string", description: "Ira's spoken response text in the user's language" },
                  intent: {
                    type: "string",
                    enum: ["greeting", "chat", "recipe", "help", "farewell"],
                    description: "What the user wants: greeting (hi/hello), chat (small talk/questions), recipe (wants to cook something), help (how to use), farewell (bye)"
                  },
                  emoji: { type: "string", description: "A single emoji that fits the mood" },
                },
                required: ["reply", "intent", "emoji"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "ira_respond" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI processing failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "Ira could not respond" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ira-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
