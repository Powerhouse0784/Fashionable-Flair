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
