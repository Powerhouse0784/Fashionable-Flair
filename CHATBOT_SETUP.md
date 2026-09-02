# AI Chat Assistant — Setup (Gemini + Supabase Edge Functions, Free Tier)

The app has a floating chat widget backed by Google's Gemini API, scoped
so it only answers questions about Fashionable Flair — products,
ordering, policies, and contact info. It won't answer general-knowledge
questions, even if asked to.

**Important — why this needs a deploy step, unlike everything else in
this project:** your Gemini API key is a real, billable-usage credential,
not like the Supabase anon key (which is safe to ship in the app because
Row Level Security is the actual gate). If the Gemini key were pasted
into `src/config/...` like the Supabase config, anyone could extract it
from the browser or the compiled app and run up usage on your account.
So it lives only on a server — a free Supabase Edge Function — and the
app calls that function, never Gemini directly.

## 1. Get your Gemini API key

If you don't already have one: [aistudio.google.com](https://aistudio.google.com) →
**Get API key** → Create key. Free, no credit card required. Keep it
somewhere safe — you'll paste it once in step 4, nowhere else.

## 2. Install the Supabase CLI

```bash
npm install -g supabase
```

Then log in and link it to your project (find your project ref in
Supabase Dashboard → Project Settings → General → Reference ID):

```bash
supabase login
supabase link --project-ref your-project-ref
```

## 3. Deploy the chat function

The function code is already written — `supabase/functions/chat/index.ts`.
Deploy it as-is:

```bash
supabase functions deploy chat
```

## 4. Set your Gemini key as a server-side secret

```bash
supabase secrets set GEMINI_API_KEY=your-real-gemini-key
```

This is the only place the key exists — not in your repo, not in the app
bundle, not in git history.

## 5. Test it

Open the app, tap the chat bubble (bottom-right on web, bottom-right
above the tab bar on mobile), and ask something like "How do I place an
order?" If you see "Chat isn't configured yet," double check steps 3–4
completed without errors (`supabase functions deploy chat` should print
a green success line).

## What it will and won't do

- **Will:** answer questions about categories, how ordering/Meesho
  handoff works, wishlist, contact details (phone/email/address), and
  general policies — using only the facts written into the function's
  system prompt (see `SYSTEM_INSTRUCTION` in `index.ts`).
- **Won't:** look up a specific order, check real-time stock, answer
  anything unrelated to Fashionable Flair, or be talked into pretending
  to be something else — that's enforced in the prompt, not just
  requested politely.
- **If you update FAQ/Privacy/Terms/contact info later:** update the
  `SYSTEM_INSTRUCTION` text in `supabase/functions/chat/index.ts` to
  match, then re-run `supabase functions deploy chat`. The assistant only
  knows what's written there — it doesn't read the app's other screens.

## Cost

Gemini's free tier (the `gemini-2.5-flash` model this uses) requires no
credit card and covers casual/low-volume use like a small store's
support chat. Supabase Edge Functions are free up to 500,000 invocations/month.
If this app ever gets heavy chat traffic, check current limits at
[ai.google.dev](https://ai.google.dev) and your Supabase project's usage
dashboard.

## Troubleshooting: "The assistant is unavailable right now"

This is a generic message shown to shoppers on purpose — the real cause
is logged to the browser/app console, not shown in the chat bubble
itself. Open devtools (or `npx expo start` logs) and look for a line
starting with "Chat function invoke failed" or "Chat function returned
an error" right after sending a message.

**Most common cause:** if your contact form (Brevo) works but chat
doesn't, it usually means steps 3–4 above haven't been run yet for
*this* function specifically — deploying `contact-form` and `subscribe`
doesn't also deploy `chat`, they're independent:

```bash
supabase functions deploy chat
supabase secrets set GEMINI_API_KEY=your-real-key
```

You can also check directly with:
```bash
supabase functions logs chat
```
which shows the real Gemini API error if the key is set but something
else is wrong (invalid key, region restriction, etc.).

**Seeing `Gemini API error: 404` in the logs specifically?** That means
the model name itself isn't being found — not a key or deployment
problem. Model availability can differ between accounts/regions, and
Google periodically retires specific model versions, so a pinned name
that works today can 404 later. Good news: **Google's error message
tells you exactly what to do** — it includes a line like "model X is no
longer available... use models/Y instead." Whatever it says, use that:

1. Update `GEMINI_MODEL` in `supabase/functions/chat/index.ts` to the
   name from the error message (as of this writing, that's
   `gemini-3.6-flash` — but trust the error message over this doc, since
   Google updates these faster than anyone can document them).
2. Re-deploy: `supabase functions deploy chat`

**Seeing `503 UNAVAILABLE` / "high demand"?** The function already
retries once automatically after a short pause — Google's own message
calls these spikes "usually temporary." If it still fails after the
retry, it's genuine heavy load on Google's end; trying again in a minute
usually works.
