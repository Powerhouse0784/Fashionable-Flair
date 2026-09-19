// Supabase Edge Function — sends a push notification to every registered
// device via Expo's push service. Called from the admin dashboard's
// "Notify" section. Native app only (no web push registered here).
//
// Deploy with:
//   supabase functions deploy send-notification
//
// No extra secrets needed — it authenticates the *caller* against your
// existing `admins` table (same rule the rest of the admin panel already
// uses) and reads devices from `push_tokens` using the service role key,
// which bypasses that table's RLS (by design — see SUPABASE_SETUP.md
// section 10 for why anon/authenticated have no select policy on it).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_SIZE = 100; // Expo's push API accepts up to 100 messages per request

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify the caller is a real admin — using their own JWT (never trust
    // a client-supplied "isAdmin" flag), same check the `admins` table's
    // own RLS policies use.
    const authHeader = req.headers.get('Authorization') ?? '';
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await callerClient.auth.getUser();
    if (!user) return json({ error: 'Sign in required.' }, 401);

    const { data: adminRow } = await callerClient.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
    if (!adminRow) return json({ error: 'Admin access required.' }, 403);

    const { title, body } = (await req.json()) as { title?: string; body?: string };
    if (!title?.trim() || !body?.trim()) return json({ error: 'Title and body are both required.' }, 400);
    if (title.length > 120 || body.length > 500) return json({ error: 'Title or body is too long.' }, 400);

    // Service-role client to read every registered device, bypassing
    // push_tokens' RLS (which intentionally has no select policy for
    // anon/authenticated).
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: tokens, error: tokensError } = await adminClient.from('push_tokens').select('token');
    if (tokensError) throw new Error(tokensError.message);
    if (!tokens || tokens.length === 0) return json({ error: 'No devices are registered yet.' }, 400);

    const messages = tokens.map((t: { token: string }) => ({
      to: t.token,
      title: title.trim(),
      body: body.trim(),
      sound: 'default',
    }));

    let sent = 0;
    const errors: string[] = [];
    for (const batch of chunk(messages, EXPO_BATCH_SIZE)) {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(batch),
      });
      if (res.ok) {
        sent += batch.length;
      } else {
        errors.push(await res.text());
      }
    }

    if (errors.length > 0 && sent === 0) {
      console.error('Expo push errors:', errors);
      return json({ error: 'Failed to send — please try again shortly.' }, 502);
    }

    return json({ success: true, sentTo: sent, totalDevices: tokens.length });
  } catch (err) {
    console.error('send-notification function error:', err);
    return json({ error: 'Something went wrong.' }, 500);
  }
});
