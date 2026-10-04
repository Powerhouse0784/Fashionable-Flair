# Customer Accounts — Setup (Supabase Auth, Free Tier)

Browsing, wishlisting and everything else in the app still works exactly
as before with **no login at all** — that's unchanged. The one thing that
now asks a shopper to sign in is **buying Premium**, and here's why:
without an account, "Premium" could only ever be a flag saved on that one
device/browser — clear your history, switch phones, or reinstall, and a
real purchase would just vanish with no way to prove you'd paid.
An account fixes that: Premium (and your name/bio/avatar) live in
Supabase against your email, so they follow you to any device you log
into.

This is a one-time, ~5 minute setup, and it reuses the same Supabase
project you already set up in `SUPABASE_SETUP.md` — don't create a new one.

## 1. Turn on email sign-ups

In the Supabase dashboard: **Authentication → Providers → Email** — make
sure it's enabled (it is by default on a new project, so this is usually
just a check, not a change).

Also under **Authentication → Settings**: if you'd rather shoppers not
have to click a confirmation link before their first Premium purchase,
turn **Confirm email** off. Leaving it on is more secure but adds a step;
either is fine, it's your call.

## 2. Create the `profiles` table

**SQL Editor → New query**, paste and run:

```sql
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  bio text,
  avatar_index integer,
  premium_since timestamptz,
  premium_expires_at timestamptz,
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

-- A shopper can only ever read or write their OWN row — never anyone else's.
create policy "Users can read their own profile"
  on profiles for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert their own profile"
  on profiles for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own profile"
  on profiles for update
  to authenticated
  using (user_id = auth.uid());
```

Nothing else needed here — the app creates a shopper's row automatically
the first time they sign in (carrying over whatever guest name/bio/avatar
they'd already set locally), and `verify-razorpay-payment`
(see `RAZORPAY_SETUP.md`) is what actually extends `premium_expires_at`
once a real payment is verified, using that same shopper's own login, so
RLS applies to it exactly like any other request — there's no separate
service-role bypass to keep track of.

## 3. Test it

Open the app → Profile → Account section → **Create Account** → sign up
with a real email. You should land back on Profile signed in. Edit your
name/bio, then in Supabase **Table Editor → profiles** you should see a
row with that shopper's `user_id` and the values you just set.

Log out, log back in (or open the site in a private/incognito window and
log into the same account) — your name/bio/avatar and Premium status
(once purchased) should both be exactly as you left them.

## Notes

- This table intentionally has **no email/phone column** — Supabase's own
  `auth.users` table already has the email, and duplicating it here would
  just be one more place for it to go stale. Look up `auth.users` (visible
  under **Authentication → Users** in the dashboard) if you ever need to
  match a `profiles` row back to an email address.
- A shopper who signs up and never buys Premium still gets a `profiles`
  row (with `premium_expires_at` left `null`) — that's expected, it's the
  same row that also stores their name/bio/avatar.

## 4. Reviews now require an account too

Writing a testimonial used to be fully anonymous (a random per-device
`ownerToken`, see the old wording in `SUPABASE_SETUP.md § 11`). It now
requires the same login as Premium — so a real, non-refreshable "2 free
reviews" limit is actually enforceable per person, not per device, and a
shopper's own reviews follow them if they switch phones. Run this once,
**after** section 2 above (it references the `profiles` table):

```sql
alter table testimonials add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table testimonials alter column "ownerToken" drop not null;

-- Replaces "Public can add testimonials" — writing a review now needs a
-- real, logged-in account, and only ever under that account's own id.
drop policy if exists "Public can add testimonials" on testimonials;
create policy "Signed-in users can add their own testimonial"
  on testimonials for insert
  to authenticated
  with check (auth.uid() = user_id);

-- New: a shopper can now edit/delete their own review through plain RLS
-- instead of the old update_own_testimonial/delete_own_testimonial
-- functions (those two functions are left in the database, unused by
-- the app now, in case you'd rather keep them for the legacy rows below).
create policy "Users can update their own testimonial"
  on testimonials for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete their own testimonial"
  on testimonials for delete
  to authenticated
  using (auth.uid() = user_id);

-- Replaces the old per-device "2 testimonials" trigger with an
-- account- and Premium-aware one: 2 for a regular account, 4 for Premium.
create or replace function enforce_testimonial_limit() returns trigger
language plpgsql as $$
declare
  is_premium boolean;
  current_count integer;
  allowed integer;
begin
  select exists (
    select 1 from profiles
    where user_id = new.user_id and premium_expires_at > now()
  ) into is_premium;

  allowed := case when is_premium then 4 else 2 end;

  select count(*) into current_count from testimonials where user_id = new.user_id;

  if current_count >= allowed then
    raise exception 'Maximum of % testimonials per account.', allowed;
  end if;

  return new;
end;
$$;
```

(The trigger itself — `testimonial_limit_trigger before insert on
testimonials` — doesn't need re-creating; it already points at this
function by name, so replacing the function's body is enough.)

**What happens to reviews written before this migration:** they keep
their `ownerToken` and have `user_id: null`. They still display totally
normally to everyone — reading testimonials was never gated — but since
nothing signed-in has a `user_id` of `null`, nobody can edit or delete
them through the app anymore. That's an acceptable trade-off for a
pre-launch app with only test data; if you already have real reviews
you'd like to preserve edit access for, that's a manual, one-off
`update testimonials set user_id = '...' where id = '...'` per row
(look up the right account's id in **Authentication → Users**) rather
than something this migration can do automatically, since nothing links
an old `ownerToken` back to a specific person's new account.

## 5. Admin Customers screen (list, block, delete)

The admin panel's **Customers** screen shows every signed-up shopper —
Premium or not — with their join date, last sign-in, review count, and
Block/Delete actions. None of that can come from the client directly:
there's no table the anon/authenticated client can query to list
`auth.users`, and blocking or deleting a user are both privileged Auth
Admin API calls. Two edge functions do this instead, using the same
"verify the caller is an admin via their own JWT, then act with the
service-role key" pattern as `send-notification`.

**Deploy both:**

```
supabase functions deploy admin-list-customers
supabase functions deploy admin-manage-customer
```

No new secrets or tables needed — both reuse `SUPABASE_URL`,
`SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` (already set for
`send-notification`) and the existing `admins` table.

**How blocking works:** there's no "blocked" column anywhere — blocking
calls Supabase's own Auth Admin API (`updateUserById` with a
`ban_duration`) so a blocked shopper genuinely cannot sign in anymore,
not just "looks blocked" in the admin UI. Supabase has no literal
"forever" ban, so blocking sets a 100-year ban (`876000h`); unblocking
sets it back to `'none'`. `admin-list-customers` reads each user's
`banned_until` straight from `auth.users` to show the current state, so
it's always accurate even if a ban was set some other way.

**How delete works:** deleting a customer deletes their `auth.users` row
via the Admin API. Their `profiles` row and any `testimonials` they wrote
both have `on delete cascade` back to `auth.users(id)`, so they're
removed automatically — no separate cleanup step.

**Note:** an admin can't block or delete their own admin account through
this screen (the function rejects it) — sign in as a different admin, or
do it directly in the Supabase dashboard, if that's ever genuinely needed.
