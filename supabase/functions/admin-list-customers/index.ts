// Supabase Edge Function — lists every signed-up customer for the admin
// Customers screen. The anon/authenticated client can never list
// `auth.users` directly (there's no table for it to query), so this is the
// one privileged place that does it: verify the caller is a real admin
// (same `admins` table check every other admin function uses), then use
// the service-role key to call the Auth Admin API and merge in each
// shopper's `profiles` row (name, avatar, Premium dates) and a couple of
// handy counts (reviews written, whether Premium is currently active).
//
// Deploy with:
//   supabase functions deploy admin-list-customers

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Verify the caller is a real admin, using their own JWT — never trust
    // a client-supplied "isAdmin" flag.
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

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // auth.admin.listUsers() is paginated (1000/page by default) — walk
    // every page so a growing customer base doesn't silently get cut off.
    const allUsers: any[] = [];
    let page = 1;
    while (true) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error(error.message);
      allUsers.push(...data.users);
      if (data.users.length < 1000) break;
      page += 1;
      if (page > 50) break; // safety valve, 50k users
    }

    const { data: profiles } = await adminClient
      .from('profiles')
      .select('user_id, name, bio, avatar_index, premium_since, premium_expires_at, updated_at');
    const profileByUserId = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    // Review counts, one query, grouped client-side — testimonials is small
    // enough per store that this is cheaper than N queries.
    const { data: reviewRows } = await adminClient.from('testimonials').select('user_id');
    const reviewCounts = new Map<string, number>();
    for (const r of reviewRows || []) {
      if (!r.user_id) continue;
      reviewCounts.set(r.user_id, (reviewCounts.get(r.user_id) || 0) + 1);
    }

    const now = Date.now();
    const customers = allUsers.map((u) => {
      const profile = profileByUserId.get(u.id);
      const premiumExpiresAt = profile?.premium_expires_at ?? null;
      const isPremium = !!premiumExpiresAt && new Date(premiumExpiresAt).getTime() > now;
      const bannedUntil = u.banned_until ? new Date(u.banned_until).getTime() : 0;
      const isBlocked = bannedUntil > now;
      return {
        id: u.id,
        email: u.email ?? null,
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
        name: profile?.name ?? null,
        bio: profile?.bio ?? null,
        avatarIndex: profile?.avatar_index ?? null,
        isPremium,
        premiumSince: profile?.premium_since ?? null,
        premiumExpiresAt,
        isBlocked,
        reviewCount: reviewCounts.get(u.id) || 0,
      };
    });

    // Newest sign-ups first.
    customers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return json({ customers });
  } catch (err) {
    console.error('admin-list-customers function error:', err);
    return json({ error: 'Something went wrong.' }, 500);
  }
});
