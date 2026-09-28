// Supabase Edge Function — verifies a Razorpay Checkout payment really
// happened, THEN extends the signed-in caller's Premium in the
// `profiles` table (see CUSTOMER_ACCOUNTS_SETUP.md). Razorpay's Checkout
// callback fires in the client either way, so trusting it directly would
// let anyone flip "isPremium" on without paying just by calling that
// callback manually — the HMAC signature is what actually proves the
// payment id belongs to a real, completed order, and doing the database
// write here (rather than letting the client write its own
// premium_expires_at) is what stops someone just calling
// `supabase.from('profiles').update(...)` directly from the browser
// console instead.
//
// Deploy with:
//   supabase functions deploy verify-razorpay-payment
//   supabase secrets set RAZORPAY_KEY_SECRET=your-real-key-secret
//
// See RAZORPAY_SETUP.md for the full walkthrough.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keySecret) {
      return new Response(JSON.stringify({ error: 'Premium checkout is not configured yet.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const {
      data: { user },
    } = await callerClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Please log in to subscribe to Premium.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, months } = (await req.json()) as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      months?: number;
    };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Missing payment details.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const expected = await hmacSha256Hex(keySecret, `${razorpay_order_id}|${razorpay_payment_id}`);
    const verified = timingSafeEqual(expected, razorpay_signature);

    if (!verified) {
      return new Response(JSON.stringify({ error: 'Payment could not be verified.', verified: false }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const safeMonths = [1, 3, 12].includes(months as number) ? (months as number) : 1;

    // Extend from whichever is later — "now" for a fresh/expired sub, or
    // the account's existing expiry, so paying again before a period
    // runs out adds on top of it rather than resetting the clock.
    const { data: existing } = await callerClient
      .from('profiles')
      .select('premium_since, premium_expires_at')
      .eq('user_id', user.id)
      .maybeSingle();

    const now = Date.now();
    const currentExpiry = existing?.premium_expires_at ? new Date(existing.premium_expires_at).getTime() : 0;
    const base = Math.max(now, currentExpiry);
    const newExpiresAt = new Date(base + safeMonths * 30 * MS_PER_DAY).toISOString();
    const newSince = existing?.premium_since ?? new Date(now).toISOString();

    const { error: upsertError } = await callerClient.from('profiles').upsert(
      { user_id: user.id, premium_since: newSince, premium_expires_at: newExpiresAt },
      { onConflict: 'user_id' }
    );
    if (upsertError) {
      console.error('Failed to record premium status:', upsertError.message);
      return new Response(
        JSON.stringify({ error: 'Payment succeeded but we couldn\u2019t update your account \u2014 contact us and we\u2019ll sort it out.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ verified: true, months: safeMonths, premiumSince: newSince, premiumExpiresAt: newExpiresAt }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('verify-razorpay-payment error:', err);
    return new Response(JSON.stringify({ error: 'Something went wrong.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
