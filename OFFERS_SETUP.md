# Offers & Discounts — Setup

A proper store-wide offers system: the admin picks any existing product,
sets a special offer price, and a start/end window — the offer is only
"live" while now falls inside that window. Live offers show up in two
places for shoppers: the Home page's "Offers & Discounts" section, and
the Profile screen's "Offers & Deals" item (which used to just open the
Meesho listing — it now opens an in-app screen of everything currently on
offer).

This reuses the same Supabase project everything else here already uses.

## 1. Create the `offers` table

**SQL Editor → New query**, paste and run:

```sql
create table offers (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references products(id) on delete cascade,
  offer_price numeric not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table offers enable row level security;

-- Anyone (including a signed-out shopper) can read offers — the Home
-- page and Profile screen both need this with no login required, exactly
-- like products themselves.
create policy "Public can read offers"
  on offers for select
  using (true);

-- Only accounts in the `admins` table can create, change or remove an
-- offer — identical rule to products/reviews elsewhere in this app.
create policy "Admins can insert offers"
  on offers for insert
  to authenticated
  with check (exists (select 1 from admins where user_id = auth.uid()));

create policy "Admins can update offers"
  on offers for update
  to authenticated
  using (exists (select 1 from admins where user_id = auth.uid()));

create policy "Admins can delete offers"
  on offers for delete
  to authenticated
  using (exists (select 1 from admins where user_id = auth.uid()));
```

That's the only setup step — no edge function needed, since reading
offers is public and writing them goes through the same RLS-gated
`admins` check every other admin write in this app already uses.

## 2. How "live" is decided

An offer row always exists for its full history (so the admin can see
past/upcoming offers too), but it only counts as **active** — and only
then does it show on the Home page or the in-app Offers screen — when:

```
starts_at <= now()  AND  now() <= ends_at
```

That comparison happens in `src/services/offerService.ts`
(`fetchActiveOffers`), on the client, using each device's own clock —
fine for a feature like this where "a few minutes of clock drift" has no
real consequence, unlike payment verification which is checked
server-side instead.

## 3. Deleted or out-of-stock products

Deleting a product cascades (`on delete cascade`) and removes any offer
on it automatically. An offer on a product that's since been marked out
of stock is left as-is in the table but simply won't be shown to
shoppers — `fetchActiveOffers` filters those out the same way the rest of
the app treats out-of-stock items.

## 4. Test it

In the admin panel: **Offers & Discounts** → pick a product → set an
offer price lower than its normal price → set a start time at or before
now and an end time in the future → Save. It should immediately appear
on the Home page's Offers & Discounts section and in Profile → Offers &
Deals.
