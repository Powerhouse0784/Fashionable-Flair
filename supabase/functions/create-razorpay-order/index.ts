// Supabase Edge Function — creates a Razorpay order for a Premium
// purchase. Your Razorpay key SECRET is a real, billable/refundable
// credential, so order creation happens here on the server, never in
// the app — the app only ever sees the public key id and an order id.
//
// Requires the caller to be signed in (see CUSTOMER_ACCOUNTS_SETUP.md) —
// Premium is tied to an account, not a device, so there's no anonymous
// checkout path to begin with.
//
// Deploy with:
//   supabase functions deploy create-razorpay-order
//   supabase secrets set RAZORPAY_KEY_ID=your-real-key-id
//   supabase secrets set RAZORPAY_KEY_SECRET=your-real-key-secret
//
// See RAZORPAY_SETUP.md for the full walkthrough (getting keys, testing
// with Razorpay's test mode, going live).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RAZORPAY_ORDERS_URL = 'https://api.razorpay.com/v1/orders';
// Keep this in sync with PREMIUM_PRICE_INR in src/config/premium.ts —
// this Edge Function runs in a separate Deno runtime/deploy from the
// app, so it can't import that file directly. Currently ₹1 for testing
// the checkout flow end-to-end cheaply; change both before real launch.
const PREMIUM_PRICE_INR = 1;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) {
      return new Response(JSON.stringify({ error: 'Premium checkout is not configured yet.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the caller is actually signed in, using their own JWT —
    // Premium purchases only ever belong to an account (see
    // verify-razorpay-payment, which is what actually credits this
    // user's `profiles` row once payment is confirmed).
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

    const body = (await req.json().catch(() => ({}))) as { months?: number };
    // Only 1, 3 or 12 months are offered — anything else is rejected
    // rather than trusting a client-supplied amount.
    const months = [1, 3, 12].includes(body.months as number) ? (body.months as number) : 1;
    const amountPaise = PREMIUM_PRICE_INR * months * 100;

    const auth = 'Basic ' + btoa(`${keyId}:${keySecret}`);
    const orderRes = await fetch(RAZORPAY_ORDERS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: `premium_${Date.now()}`,
        notes: { product: 'Fashionable Flair Premium', months: String(months), user_id: user.id },
      }),
    });

    if (!orderRes.ok) {
      const errText = await orderRes.text();
      console.error('Razorpay order error:', orderRes.status, errText);
      return new Response(JSON.stringify({ error: 'Could not start checkout right now — please try again shortly.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const order = await orderRes.json();
    return new Response(
      JSON.stringify({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId, // public key id — safe for the client, needed to open Checkout
        months,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('create-razorpay-order error:', err);
    return new Response(JSON.stringify({ error: 'Something went wrong.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
