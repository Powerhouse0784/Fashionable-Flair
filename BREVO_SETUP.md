# Contact Form & Newsletter Signup — Setup (Brevo + Supabase Edge Functions, Free Tier)

Two features run on Brevo: the **Contact Us form** (sends you an email when
someone submits it, with a confirmation auto-reply to them) and the
**footer newsletter signup** ("notify me about new arrivals").

Same security reasoning as the chat assistant (see `CHATBOT_SETUP.md`):
your Brevo API key is a real, billable credential — it stays a server-side
secret in a Supabase Edge Function, never in the app itself.

## 1. Verify a sender email in Brevo

Brevo refuses to send from an address it hasn't verified. In your Brevo
dashboard: **Senders, Domains & Dedicated IPs → Senders → Add a sender**,
add `fashionableflair786@gmail.com`, and verify it (Brevo emails you a
confirmation link). This only needs doing once.

If you'd rather send from a different address, edit `STORE_EMAIL` in
`supabase/functions/contact-form/index.ts` before deploying, and verify
that address in Brevo instead.

## 2. Install the Supabase CLI (skip if you already did this for chat)

```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
```

## 3. Deploy both functions

```bash
supabase functions deploy contact-form
supabase functions deploy subscribe
```

## 4. Set your Brevo key as a secret

```bash
supabase secrets set BREVO_API_KEY=your-real-brevo-key
```

One secret covers both functions.

## 5. (Optional) Organize newsletter signups into a list

By default, new subscribers land in your Brevo contacts unsorted. To group
them (useful for sending an actual "New Arrivals" campaign later):

1. In Brevo: **Contacts → Lists → Create a list**, name it something like
   "App Newsletter Signups."
2. Copy its numeric ID (shown in the list's URL or details).
3. `supabase secrets set BREVO_LIST_ID=that-number`
4. Re-deploy: `supabase functions deploy subscribe`

## 6. Test it

- **Contact form:** open the app → Contact page → fill in the form → Send.
  Check the inbox for `fashionableflair786@gmail.com` for the notification,
  and the submitter's inbox for the auto-confirmation.
- **Newsletter:** on web, scroll to the footer, enter an email, tap
  Subscribe. Check Brevo's Contacts list to confirm it landed.

If either shows "isn't set up yet," double-check steps 3–4 completed
without errors.

## Cost

Brevo's free tier includes 300 transactional emails/day — plenty for a
contact form and occasional campaign sends on a store this size. Check
current limits at [brevo.com/pricing](https://www.brevo.com/pricing) if
volume grows.
