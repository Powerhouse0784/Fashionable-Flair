# Product-Sync CMS — Supabase Setup (Admin Panel, Free Tier)

The app now has a real admin panel built in — sign in, add/edit/delete
products, upload photos, and every device syncs instantly (no manual
refresh, no editing a spreadsheet). This is powered by Supabase, on their
free tier (500MB database, 1GB file storage, 50k monthly active auth
users, 2GB bandwidth/month) — plenty of headroom for a store like this.

This is a one-time, ~10 minute setup.

## 1. Create the project

1. Go to [supabase.com](https://supabase.com) → sign in with GitHub or email (free).
2. **New Project** → name it, set a database password (save it somewhere — you likely won't need it again, but keep it), pick the region closest to your users.
3. Wait ~2 minutes for provisioning.

## 2. Create the products table

> **⚠️ Already ran the SQL below once before, and admin login says "This
> account doesn't have store management access"?** That's this exact bug —
> run this one line in SQL Editor and it's fixed immediately, no need to
> redo anything else:
> ```sql
> create policy "Users can check their own admin status"
>   on admins for select
>   to authenticated
>   using (user_id = auth.uid());
> ```
>
> **Also already ran it and need the "In Stock" toggle column?** Run this
> too:
> ```sql
> alter table products add column if not exists "isAvailable" boolean default true;
> ```
>
> **Also already set up and want multiple photos per product?** Run this:
> ```sql
> alter table products add column if not exists images text[];
> ```
> The app already falls back gracefully — existing products with only the
> old single `image` field keep working exactly as before, no data migration
> needed.
>
> **Also already set up and want discount pricing + customer reviews?**
> Jump to [section 9](#9-add-discount-pricing-and-customer-reviews) below —
> it's two small additions, not a full re-setup.
>
> Otherwise, continue below for the full first-time setup.

In the Supabase dashboard: **SQL Editor → New query**, paste and run:

```sql
create table products (
  id text primary key,
  title text not null,
  subtitle text,
  price numeric not null,
  currency text default 'INR',
  category text not null,
  rating numeric default 0,
  "ratingLabel" text,
  "meeshoUrl" text not null,
  image text,
  description text,
  material text,
  "isNewArrival" boolean default false,
  "isBestSeller" boolean default false,
  "isFeatured" boolean default false,
  "isAvailable" boolean default true,
  images text[],
  "createdAt" timestamptz default now()
);

-- Row Level Security: public can READ products, but only allow-listed
-- admins can write. This is deliberately NOT "any logged-in user can
-- write" — if someone ever found a way to create an account, a blanket
-- "authenticated" policy would hand them admin rights. This ties write
-- access to a specific admins table instead.
alter table products enable row level security;

create table admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table admins enable row level security;

-- CRITICAL: without this, RLS blocks everyone from reading the admins
-- table — including an admin checking their own membership, and every
-- policy below that references `admins` in a subquery. This one policy
-- is what makes the whole admin system actually work, not just exist.
create policy "Users can check their own admin status"
  on admins for select
  to authenticated
  using (user_id = auth.uid());

create policy "Public can read products"
  on products for select
  using (true);

create policy "Admins can insert products"
  on products for insert
  to authenticated
  with check (exists (select 1 from admins where user_id = auth.uid()));

create policy "Admins can update products"
  on products for update
  to authenticated
  using (exists (select 1 from admins where user_id = auth.uid()));

create policy "Admins can delete products"
  on products for delete
  to authenticated
  using (exists (select 1 from admins where user_id = auth.uid()));
```

## 3. Create the storage bucket for photos

> **⚠️ This step is required before uploading any product photo.** If you
> skip it, the admin form will fail with "Storage bucket 'product-images'
> doesn't exist yet" the moment you try to save a photo — text-only
> products (no photo) will still work fine either way, which is why this
> is easy to miss if you tested without a photo first.

1. **Storage** (left sidebar) → **New bucket** → name it exactly `product-images` → toggle **Public bucket** ON → Create.
2. Back in **SQL Editor**, run:

```sql
create policy "Public can view product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Admins can upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and exists (select 1 from admins where user_id = auth.uid()));

create policy "Admins can update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and exists (select 1 from admins where user_id = auth.uid()));

create policy "Admins can delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and exists (select 1 from admins where user_id = auth.uid()));
```

## 4. Turn off public sign-ups

**Authentication → Providers → Email** → turn **"Allow new users to sign
up"** OFF. This app has no customer accounts at all — shoppers just
browse, wishlist, and buy on Meesho — so the only accounts that should
ever exist are the admin ones you create yourself in step 5. Leaving
sign-ups on would mean anyone could create a Supabase Auth account,
even though the `admins` table check would still stop them from writing
products — better to close it at the source.

## 5. Create your admin login

**Authentication → Users → Add user** → enter an email + password (this
does NOT need to be a real inbox — pick something like
`admin@fashionableflair.app` — just remember it). Click **Create user**.

Then copy that user's **UID** (shown in the users list), go back to
**SQL Editor**, and run (replacing the UUID):

```sql
insert into admins (user_id) values ('paste-the-uid-here');
```

This is the account you'll actually sign in with inside the app.

## 6. Connect the app

**Project Settings → API** → copy the **Project URL** and the **anon
public** key.

Copy `.env.example` to a new file named `.env` in the project root, and
fill in both values:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
```

`.env` is gitignored — it will never be committed, even though the app
itself is happy to be public. Restart `npx expo start` after editing it
(env vars are only read at start-up, a hot reload won't pick them up).

If you're deploying the web build (`npx expo export -p web`) via a host
like Vercel/Netlify, set the same two variables in that host's dashboard
under Environment Variables, using the exact same `EXPO_PUBLIC_` names.

## 7. Accessing the admin panel

Regular shoppers never see any admin UI anywhere in the app — that's
deliberate, since this is a live app real customers use. There are two
ways in:

- **On web:** go to `yoursite.com/admin` directly (bookmark it).
- **In the mobile app:** open the **Profile** tab, scroll to the very
  bottom, and tap the "Fashionable Flair · v1.0.0" footer text **5 times
  quickly**. This opens the same sign-in screen.

Either way, sign in with the account from step 5. Once signed in, a
"Store Management" section appears in Profile too, for quick access on
that device going forward (the session persists — no need to repeat the
tap gesture every time).

## 8. Using it day-to-day

- **Add a product:** Admin Dashboard → **Add New Product** → fill in the form → tap the photo strip to add up to 6 photos (first one is the cover photo shown on cards) → Save.
- **Reorder photos:** remove and re-add in the order you want — the first photo in the strip is always the cover. (Drag-to-reorder isn't built yet.)
- **Edit:** tap the pencil icon on any product row.
- **Mark sold out without deleting:** open the product, turn off "In Stock" — it shows an "Out of Stock" badge to shoppers and disables its Buy Now button, but stays in the catalog.
- **Delete:** trash icon, with a confirmation prompt.
- Every change appears on **every device instantly** — Home, Search, Wishlist, everywhere — via Supabase Realtime, and a toast confirms the action succeeded.

Only accounts listed in the `admins` table can write. Give a client
access by creating them a Supabase Auth user (step 5) and adding their
UID to `admins` — you don't have to share your own login.

## How the fallback still works

If Supabase isn't configured yet, is unreachable, or errors out, the app
quietly falls back to the local seed catalog in `src/data/products.ts` —
it never shows a blank screen because of a bad connection. The last
successfully-synced catalog is also cached on-device, so the app keeps
working offline.

**Important:** this fallback only applies when Supabase can't be reached
at all. Once it's connected, Supabase is the source of truth completely —
including a genuinely empty catalog. If you delete your only product, the
storefront shows an empty state, not the old placeholder catalog. (An
earlier version of this app treated "empty" the same as "unreachable" and
silently showed the placeholder catalog instead — which looked exactly
like a delete not working. Fixed.)

## 9. Add discount pricing and customer reviews

Two independent additions — run whichever you need, or both. Neither
requires touching any existing data.

**Discount ("was/now") pricing** — lets a product show a struck-through
original price with a "% OFF" badge, set from the product edit form's new
"Compare-at price" field:

```sql
alter table products add column if not exists "compareAtPrice" numeric;
```

**Customer reviews** — a product's detail page shows admin-added reviews
instead of just a bare star rating. Reviews aren't collected from in-app
purchases (checkout happens on Meesho, not here) — add genuine ones
yourself from the product's real Meesho reviews via the new "Reviews"
icon (top-right of the product edit screen).

```sql
create table reviews (
  id uuid primary key default gen_random_uuid(),
  "productId" text not null references products(id) on delete cascade,
  "authorName" text not null,
  rating numeric not null check (rating >= 1 and rating <= 5),
  body text not null,
  "createdAt" timestamptz default now()
);

alter table reviews enable row level security;

create policy "Public can read reviews"
  on reviews for select
  using (true);

create policy "Admins can insert reviews"
  on reviews for insert
  to authenticated
  with check (exists (select 1 from admins where user_id = auth.uid()));

create policy "Admins can delete reviews"
  on reviews for delete
  to authenticated
  using (exists (select 1 from admins where user_id = auth.uid()));
```

## 10. Push notifications

Lets you send a broadcast notification (e.g. "New arrivals are live!") to
everyone who has the Android/iOS app installed, from a new "Notify"
section in the admin dashboard. Native app only — there's no web push
here, since browser push works completely differently.

**Step 1 — table for registered devices:**

```sql
create table push_tokens (
  token text primary key,
  platform text not null,
  "updatedAt" timestamptz default now()
);

alter table push_tokens enable row level security;

-- Any app user (even signed out) can register their own device.
create policy "Anyone can register a push token"
  on push_tokens for insert
  to anon, authenticated
  with check (true);

create policy "Anyone can refresh their own token"
  on push_tokens for update
  to anon, authenticated
  using (true);

-- Deliberately no select policy for anon/authenticated — only the
-- send-notification Edge Function (using the service role key, which
-- bypasses RLS entirely) ever reads the token list back out.
```

**Step 2 — deploy the Edge Function** (from `supabase/functions/send-notification`):

```bash
supabase functions deploy send-notification
```

That's it — no extra secrets needed, since it calls Expo's push service
directly with the tokens already in your database. Sending a notification
costs nothing beyond your existing Supabase plan.

## 11. Testimonials (no login required)

The Testimonials screen (linked from Profile → Testimonials, and from the
"Loved by Shoppers Like You" block on Home) ships with ~20 bundled launch
reviews so it never looks empty — those are plain text in
`src/data/testimonialsSeed.ts`, not stored here, and aren't affected by
anything below. This section is what powers the real "Share Your
Experience" form, letting any shopper add their own without creating an
account.

Since there's no login system, "can this person edit/delete this
testimonial later" is answered by a random `ownerToken` generated once on
their device and stored locally — never shown anywhere, closer to a
secret edit-link than a real identity. That's why the update/delete logic
below lives in two Postgres functions instead of a normal RLS policy: a
plain "anyone can update/delete" policy would let anyone who inspects a
network request edit *any* testimonial, not just their own, once they
know its id. Routing those two actions through a function means the token
match happens on the server, every time, no matter how the request is made.

```sql
create table testimonials (
  id uuid primary key default gen_random_uuid(),
  "ownerToken" uuid not null,
  name text not null,
  city text,
  rating numeric not null check (rating >= 1 and rating <= 5),
  product text,
  body text not null,
  "avatarIndex" integer not null check ("avatarIndex" between 1 and 50),
  "createdAt" timestamptz default now()
);

alter table testimonials enable row level security;

create policy "Public can read testimonials"
  on testimonials for select
  using (true);

create policy "Public can add testimonials"
  on testimonials for insert
  to anon, authenticated
  with check (true);

-- Admin moderation (the "Testimonials" icon in the admin dashboard) goes
-- through this policy directly, since an admin's session is already a
-- real, verified identity — no token needed.
create policy "Admins can delete any testimonial"
  on testimonials for delete
  to authenticated
  using (exists (select 1 from admins where user_id = auth.uid()));

-- A shopper editing/deleting their own testimonial instead goes through
-- these two functions, which check the private ownerToken before
-- touching anything. SECURITY DEFINER lets them bypass RLS internally —
-- but only after the token check passes, so this isn't a backdoor.
create or replace function update_own_testimonial(
  p_id uuid,
  p_owner_token uuid,
  p_name text,
  p_city text,
  p_rating numeric,
  p_product text,
  p_body text,
  p_avatar_index integer
) returns testimonials
language plpgsql
security definer
set search_path = public
as $$
declare
  updated testimonials;
begin
  update testimonials
  set name = p_name,
      city = p_city,
      rating = p_rating,
      product = p_product,
      body = p_body,
      "avatarIndex" = p_avatar_index
  where id = p_id and "ownerToken" = p_owner_token
  returning * into updated;

  if updated.id is null then
    raise exception 'Not found, or not yours to edit.';
  end if;

  return updated;
end;
$$;

create or replace function delete_own_testimonial(
  p_id uuid,
  p_owner_token uuid
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from testimonials where id = p_id and "ownerToken" = p_owner_token;
  return found;
end;
$$;

grant execute on function update_own_testimonial to anon, authenticated;
grant execute on function delete_own_testimonial to anon, authenticated;

-- Server-side backstop for the "2 testimonials per device" limit shown
-- in the app — without this, the limit is only a UI nicety that a direct
-- API call could skip straight past.
create or replace function enforce_testimonial_limit() returns trigger
language plpgsql as $$
begin
  if (select count(*) from testimonials where "ownerToken" = new."ownerToken") >= 2 then
    raise exception 'Maximum of 2 testimonials per device.';
  end if;
  return new;
end;
$$;

create trigger testimonial_limit_trigger
before insert on testimonials
for each row execute function enforce_testimonial_limit();
```

No storage bucket needed — avatars are 50 preset illustrations bundled
with the app itself (`src/assets/avatars`), picked by index rather than
uploaded.


