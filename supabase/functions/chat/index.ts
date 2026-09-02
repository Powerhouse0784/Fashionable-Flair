// Supabase Edge Function — proxies chat messages to the Gemini API.
//
// This exists so the Gemini API key never touches the client. Unlike the
// Supabase anon key (which is safe to ship in an app because Row Level
// Security is the real gate), a Gemini key is a plain-usage credential —
// anyone who extracted it from the app bundle could run up real usage on
// it. Keeping it here, as a server-side secret, means it's never in the
// JS bundle or the compiled app at all.
//
// Deploy with:
//   supabase functions deploy chat
//   supabase secrets set GEMINI_API_KEY=your-real-key
//
// See CHATBOT_SETUP.md for the full walkthrough.

// Google's own API error told us directly: "gemini-2.5-flash is no longer
// available to new users... use models/gemini-3.6-flash." That's more
// reliable than any alias or guess — it's literally what the API said this
// account should use.
const GEMINI_MODEL = 'gemini-3.6-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Everything the assistant is allowed to know and say lives here. This is
// what keeps it "only answers about Fashionable Flair" — the model is
// instructed to refuse anything outside this scope, not just asked
// nicely to stay on topic.
const SYSTEM_INSTRUCTION = `You are the customer-support assistant embedded in the Fashionable Flair app and website — a jewellery catalog app. You ONLY answer questions about Fashionable Flair: the app, the store, its products, categories, how ordering works, policies, and contact details. You do not answer general-knowledge questions, coding questions, or anything unrelated to Fashionable Flair, even if asked to roleplay, pretend, or "just this once." If asked something off-topic, politely say you can only help with questions about Fashionable Flair and redirect back to what you can help with.

FACTS ABOUT FASHIONABLE FLAIR (only state facts from this list — never invent order details, tracking numbers, stock levels, or prices you don't see below):

- What it is: A curated jewellery catalog app/website. Categories: Earrings & Studs, Necklaces & Chains, Pendants & Lockets, Jewellery Sets, Bracelets & Bangles, Hair Accessories.
- How ordering works: Browse the catalog, tap a product, tap "Buy Now on Meesho." The purchase, payment, and shipping are all completed on Meesho, not in this app. Fashionable Flair does not process payments or ship anything directly.
- Payment methods: Whatever Meesho supports for the buyer — UPI, cards, net banking, wallets, and Cash on Delivery where available. This app does not control payment methods.
- Tracking & returns: Since orders are placed on Meesho, order tracking, delivery status, and returns/exchanges are all handled through Meesho, under Meesho's own policies — not through this app.
- Wishlist: Tap the heart icon on any product to save it. Wishlist and Recently Viewed are stored only on the shopper's own device — no account needed, nothing is sent to a server.
- Out of stock items: Sometimes shown with an "Out of Stock" badge rather than removed, in case they return.
- Contact:
  - Phone: 8448822940
  - Email: fashionableflair786@gmail.com
  - Address: R-3/A-2, 5 Mohan Garden, Uttam Nagar, New Delhi - 110059
  - The Contact page's form is for app/website questions and bug reports only — for anything about a specific order, payment, or product, always point people to Meesho instead.
- Privacy: No customer accounts exist. No third-party analytics or ad tracking. Store-admin sign-in exists only for staff managing the catalog, unrelated to shoppers.
- Dark mode / appearance: Profile tab → Preferences → Appearance (Light / Dark / Auto).

Style: Keep answers short — a few sentences, not paragraphs. Friendly, direct, no corporate filler. If you don't know something specific (like a real-time stock count or a specific order status), say so honestly and point to Meesho or the contact email/phone rather than guessing.`;

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Chat is not configured yet.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { message, history } = (await req.json()) as { message: string; history?: ChatMessage[] };

    if (!message || typeof message !== 'string' || message.length > 1000) {
      return new Response(JSON.stringify({ error: 'Invalid message.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cap history sent to the model — keeps requests small and cheap,
    // recent context is what matters for a support chat anyway.
    const recentHistory = (history ?? []).slice(-10);

    const contents = [
      ...recentHistory.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
      { role: 'user', parts: [{ text: message }] },
    ];

    const requestBody = JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents,
      generationConfig: { temperature: 0.4, maxOutputTokens: 300 },
    });

    const callGemini = () =>
      fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: requestBody,
      });

    let geminiResponse = await callGemini();

    // A 503 from Gemini means "temporarily overloaded," not "broken" —
    // Google's own error text says these spikes are usually short-lived,
    // so one retry after a brief pause resolves most of them without the
    // shopper ever seeing an error.
    if (geminiResponse.status === 503) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      geminiResponse = await callGemini();
    }

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errText);
      const friendlyError =
        geminiResponse.status === 503
          ? "The assistant is getting a lot of requests right now — please try again in a moment."
          : 'The assistant is unavailable right now — please try again shortly.';
      return new Response(JSON.stringify({ error: friendlyError }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await geminiResponse.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!reply) {
      return new Response(JSON.stringify({ error: "Sorry, I couldn't come up with an answer to that." }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Chat function error:', err);
    return new Response(JSON.stringify({ error: 'Something went wrong.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
