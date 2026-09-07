// Supabase Edge Function — proxies chat messages to the Gemini API.

const GEMINI_MODEL = "gemini-3.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_INSTRUCTION = `You are Fashionable Flair assistant. Answer ONLY about jewellery app, products, ordering via Meesho, policies, contact. Keep answers 1-2 sentences.

Contact: 8448822940, fashionableflair786@gmail.com
Categories: Earrings, Necklaces, Pendants, Sets, Bracelets, Hair Accessories
Buying: Tap "Buy Now on Meesho"
Wishlist: Stored locally on device`;

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

// Total max time for this edge function (must be < Supabase/Cloudflare limit)
const FUNCTION_TIMEOUT_MS = 12000; // 12s
// Time we allow Gemini to respond
const GEMINI_TIMEOUT_MS = 8000; // 8s

Deno.serve({ timeout: FUNCTION_TIMEOUT_MS }, async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error("GEMINI_API_KEY not set");
      return new Response(JSON.stringify({ error: "Chat is not configured yet." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { message, history, healthCheck } = body;

    if (healthCheck) {
      return new Response(JSON.stringify({ reply: "ok" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (message.length > 1000) {
      return new Response(
        JSON.stringify({ error: "Message too long (max 1000 characters)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const recentHistory = (history ?? []).slice(-5) as ChatMessage[];

    const contents = [
      ...recentHistory.map((m: ChatMessage) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }],
      })),
      { role: "user", parts: [{ text: message.trim() }] },
    ];

    // Minimal, fast request body
    const requestBody = JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 256, // smaller = faster
        topP: 0.9,
        topK: 30,
      },
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    const start = Date.now();

    try {
      const geminiResponse = await fetch(GEMINI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: requestBody,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const elapsed = Date.now() - start;
      console.log("Gemini response time:", elapsed, "ms, status:", geminiResponse.status);

      if (!geminiResponse.ok) {
        const errText = await geminiResponse.text();
        console.error("Gemini API error:", geminiResponse.status, errText);

        let errorMessage = "Assistant busy. Try again.";
        if (geminiResponse.status === 429) {
          errorMessage = "Too many requests. Wait a moment.";
        } else if (geminiResponse.status === 503) {
          errorMessage = "Service unavailable. Try again.";
        } else if (geminiResponse.status === 404) {
          errorMessage = "Model not available. Contact support.";
        }

        return new Response(JSON.stringify({ error: errorMessage }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await geminiResponse.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!reply) {
        return new Response(JSON.stringify({ error: "No response generated." }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ reply }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === "AbortError" || String(fetchError).includes("timeout")) {
        console.warn("Gemini request timed out after", GEMINI_TIMEOUT_MS, "ms");
        return new Response(
          JSON.stringify({ error: "Request timeout. Please try again." }),
          {
            status: 504,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.error("Fetch error:", fetchError);
      return new Response(JSON.stringify({ error: "Network error. Try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err: any) {
    console.error("Chat function error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});