// Supabase Edge Function — sends the Contact Us form via Brevo's
// transactional email API. Same reasoning as the chat function: a Brevo
// API key is a real, billable credential, so it stays a server-side
// secret and is never bundled into the app.
//
// Deploy with:
//   supabase functions deploy contact-form
//   supabase secrets set BREVO_API_KEY=your-real-key
//
// See CHATBOT_SETUP.md's sibling doc, BREVO_SETUP.md, for the full walkthrough.

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

// This address must be added and verified as a Sender in your Brevo
// account (Senders & Domains → Add a sender) before this will work —
// Brevo rejects sends from unverified senders.
const STORE_EMAIL = 'fashionableflair786@gmail.com';
const STORE_NAME = 'Fashionable Flair';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('BREVO_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Contact form is not configured yet.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { name, email, message } = (await req.json()) as { name: string; email: string; message: string };

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return new Response(JSON.stringify({ error: 'Name, email, and message are all required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email) || message.length > 3000 || name.length > 200) {
      return new Response(JSON.stringify({ error: 'Please check your details and try again.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Notify the store — reply-to is the customer's own email, so hitting
    // "Reply" in the inbox goes straight back to them.
    const notifyRes = await fetch(BREVO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify({
        sender: { email: STORE_EMAIL, name: STORE_NAME },
        to: [{ email: STORE_EMAIL, name: STORE_NAME }],
        replyTo: { email, name },
        subject: `App/Website contact form — from ${name}`,
        htmlContent: `<p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p><p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>`,
      }),
    });

    if (!notifyRes.ok) {
      const errText = await notifyRes.text();
      console.error('Brevo notify error:', notifyRes.status, errText);
      return new Response(JSON.stringify({ error: 'Could not send your message right now — please try again shortly.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Best-effort confirmation to the customer — if this leg fails, the
    // store still got the message, so don't fail the whole request over it.
    fetch(BREVO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify({
        sender: { email: STORE_EMAIL, name: STORE_NAME },
        to: [{ email, name }],
        subject: "We've received your message — Fashionable Flair",
        htmlContent: `<p>Hi ${escapeHtml(name)},</p><p>Thanks for reaching out — we've received your message and will get back to you soon.</p><p style="color:#7A6E68;font-size:13px">This is an automated confirmation; no need to reply to this email.</p>`,
      }),
    }).catch((err) => console.warn('Confirmation email failed (non-fatal):', err));

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Contact form function error:', err);
    return new Response(JSON.stringify({ error: 'Something went wrong.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
