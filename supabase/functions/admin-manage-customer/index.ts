// Supabase Edge Function — the admin Customers screen's "block", "unblock"
// and "delete" actions. All three need the service-role key (blocking and
// deleting a user are Auth Admin API calls the client can never make
// directly), so this follows the same shape as admin-list-customers:
// verify the caller is a real admin via their own JWT, then act with the
// service-role client.
//
// Deploy with:
//   supabase functions deploy admin-manage-customer

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Supabase's ban_duration has no literal "forever" — a 100-year ban is the
// documented way to block a user indefinitely until explicitly unbanned.
const INDEFINITE_BAN = '876000h';

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

    const { action, userId } = (await req.json()) as {
      action?: 'block' | 'unblock' | 'delete';
      userId?: string;
    };
    if (!userId) return json({ error: 'userId is required.' }, 400);
    if (!action || !['block', 'unblock', 'delete'].includes(action)) {
      return json({ error: 'action must be block, unblock or delete.' }, 400);
    }
    if (userId === user.id) return json({ error: "You can't do that to your own admin account." }, 400);

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (action === 'delete') {
      // `profiles` and `testimonials` both reference auth.users with
      // on-delete-cascade, so deleting the auth user cleans those up too.
      const { error } = await adminClient.auth.admin.deleteUser(userId);
      if (error) throw new Error(error.message);
      return json({ success: true });
    }

    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: action === 'block' ? INDEFINITE_BAN : 'none',
    });
    if (error) throw new Error(error.message);
    return json({ success: true });
  } catch (err) {
    console.error('admin-manage-customer function error:', err);
    return json({ error: 'Something went wrong.' }, 500);
  }
});
