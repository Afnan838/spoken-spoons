import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcript, language } = await req.json();
    if (!transcript || transcript.trim().length === 0) {
      return new Response(JSON.stringify({ error: "No transcript provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const lang = language || "English";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
            content: `You are an expert Indian recipe parser and culinary assistant that acts like a smart voice assistant (similar to Alexa or Siri). The user speaks in ${lang} or may mix languages. Given a voice transcript describing a recipe or food item, extract and return a structured recipe.

CRITICAL LANGUAGE RULE: You MUST respond in the SAME language as the user's input. If the user speaks in Hindi, output everything in Hindi. If in Kannada, output in Kannada. If in Tamil, output in Tamil. Match the user's language exactly. Only use English if the user spoke in English.

Be thorough with steps, precise with timing, and conversational in tone. Understand regional Indian languages including Hindi, Kannada, Tamil, Malayalam, Telugu, Bengali, Marathi, Gujarati, and Punjabi.

You MUST respond using the suggest_recipe tool. All fields must be in the same language as the user's input.`
          },
          { role: "user", content: transcript },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_recipe",
              description: "Return a fully structured Indian recipe with all details in the user's language.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Recipe name in user's language" },
                  description: { type: "string", description: "Brief 1-2 sentence description in user's language" },
                  ingredients: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of ingredients with quantities in user's language"
                  },
                  steps: {
                    type: "array",
                    items: { type: "string" },
                    description: "Detailed step-by-step cooking instructions in user's language"
                  },
                  time: { type: "string", description: "Total cooking time (e.g., '45 mins') in user's language" },
                  servings: { type: "string", description: "Number of servings in user's language" },
                  region: { type: "string", description: "Indian region this dish originates from in user's language" },
                },
                required: ["title", "description", "ingredients", "steps", "time", "servings", "region"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_recipe" } },
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
      return new Response(JSON.stringify({ error: "AI did not return structured data" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recipe = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ recipe }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("structure-recipe error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
