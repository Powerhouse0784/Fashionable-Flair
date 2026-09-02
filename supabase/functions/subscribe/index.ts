// Supabase Edge Function — adds an email to your Brevo contacts, for a
// simple "notify me about new arrivals" signup. Contacts land in your
// Brevo account unsorted (no list assigned) unless you set BREVO_LIST_ID
// below — create a list in Brevo (Contacts → Lists → Create a list),
// copy its numeric ID, and set it as a secret if you want new signups
// automatically organized into a "New Arrivals" list for campaigns.
//
// Deploy with:
//   supabase functions deploy subscribe
//   supabase secrets set BREVO_API_KEY=your-real-key
//   supabase secrets set BREVO_LIST_ID=your-list-id   (optional)

const BREVO_CONTACTS_URL = 'https://api.brevo.com/v3/contacts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('BREVO_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Signup is not configured yet.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email } = (await req.json()) as { email: string };
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailPattern.test(email)) {
      return new Response(JSON.stringify({ error: 'Enter a valid email address.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const listId = Deno.env.get('BREVO_LIST_ID');
    const body: Record<string, unknown> = { email, updateEnabled: true };
    if (listId) body.listIds = [parseInt(listId, 10)];

    const res = await fetch(BREVO_CONTACTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify(body),
    });

    // Brevo returns 204 for a brand-new contact, and 400 "Contact already
    // exist" if updateEnabled didn't apply cleanly — both are fine outcomes
    // from the shopper's point of view (they're subscribed either way).
    if (!res.ok) {
      const errText = await res.text();
      if (!errText.includes('already exist')) {
        console.error('Brevo subscribe error:', res.status, errText);
        return new Response(JSON.stringify({ error: 'Could not subscribe right now — please try again shortly.' }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Subscribe function error:', err);
    return new Response(JSON.stringify({ error: 'Something went wrong.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
