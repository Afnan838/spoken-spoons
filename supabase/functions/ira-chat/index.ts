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
            content: `You are Ira, a voice assistant specialized in Indian cooking — like Siri or Alexa. You respond in ${lang}.

CORE RULE: You STRICTLY follow the user's command. If they ask you to do something, do exactly that. No extra questions, no unnecessary chatter. Execute the command.

PERSONALITY:
- Warm but concise. Like a smart assistant, not a chatty friend.
- Introduce yourself as "Ira" only when greeted for the first time.
- Keep ALL responses SHORT (1-2 sentences max). Voice assistants must be brief.

CAPABILITIES:
- Greetings: Respond warmly to "hi", "hello", "hey Ira", "namaste", "assalam alaikum", etc.
- Small talk: Answer casual questions in 1 sentence max.
- Food questions: Answer food/cooking related questions concisely and accurately.
- Recipe generation intent: If the user mentions ANY dish name, ingredient, or says "make", "cook", "recipe", "banao", "بناؤ", etc., IMMEDIATELY set intent to "recipe". Do NOT ask clarifying questions — just proceed.
- Create recipe intent: If the user says they want to "create", "add", "upload" their OWN recipe, or "create my own recipe", set intent to "create_recipe".
- Commands: If the user gives a direct command, follow it without asking back.

LANGUAGE RULE: ALWAYS respond in the EXACT SAME language as the user's input. If Hindi, respond in Hindi. If Urdu (اردو), respond in Urdu script. If Tamil, respond in Tamil. If English, respond in English. Match the script and language exactly. Support all Indian languages including Urdu.

STRICT COMMAND FOLLOWING: Never ask "which recipe?" or "what do you want?" if the user already told you. Execute immediately.

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
                    enum: ["greeting", "chat", "recipe", "create_recipe", "help", "farewell"],
                    description: "What the user wants: greeting (hi/hello), chat (small talk/questions), recipe (wants to cook something), create_recipe (wants to create/add their own recipe), help (how to use), farewell (bye)"
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
