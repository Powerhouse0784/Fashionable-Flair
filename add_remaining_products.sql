-- Adds the last 3 products from page 2 of your Meesho shop
-- (meesho.com/h6z4l?page=2) directly to your live catalog. Run this once
-- in Supabase SQL Editor. Unlike the original seed script, these three
-- have real photo URLs pulled from Meesho's own product pages — no
-- placeholder art needed for these, they'll show actual photos immediately.
--
-- Safe to re-run — skips any row whose id already exists.

insert into products
  (id, title, subtitle, price, currency, category, rating, "ratingLabel", "meeshoUrl", image, description, material, "isNewArrival", "isBestSeller", "isFeatured", "isAvailable")
values
  ('7c2xyi', 'Pearl Rhinestone Hair Clips', 'Set of 3 Pcs', 262, 'INR', 'hair-accessories', 3.1, '3.1 Star Supplier',
   'https://www.meesho.com/korean-fashion-style-pearl-rhinestone-metal-hair-clips-stylish-hair-pins-hair-accessories-for-women-and-girls-set-of-3-pcs/p/7c2xyi',
   'https://images.meesho.com/images/products/443555946/fpmv0_512.webp?width=512',
   'Korean fashion style pearl rhinestone metal hair clips — elegant and contemporary, adorned with delicate pearls and shimmering rhinestones.',
   'Metal, pearl, rhinestone', false, false, false, true),

  ('bt0w9a', 'Star Moon Rabbit Stud Earrings', NULL, 163, 'INR', 'earrings', 3.1, '3.1 Star Supplier',
   'https://www.meesho.com/zircon-star-moon-rabbit-stud-earrings-for-women-girls-pearl-designer-cute-bunny-earrings-lightweight-party-casual-festive-wear-jewelry/p/bt0w9a',
   'https://images.meesho.com/images/products/713878606/fym9h_512.webp?width=512',
   'Celestial star and moon accents paired with a cute bunny motif — lightweight, gold-plated zircon studs for everyday or festive wear.',
   'Alloy, gold plated, cubic zirconia', false, false, false, true),

  ('7744a5', 'Radha Krishna Jewellery Set', NULL, 273, 'INR', 'jewellery-sets', 3.1, '3.1 Star Supplier',
   'https://www.meesho.com/traditional-indian-jewellery-set-oxidized-necklace-with-radha-krishna-pendant-for-women-girls/p/7744a5',
   'https://images.meesho.com/images/products/435212717/xwkn6_512.webp?width=512',
   'Traditional oxidized necklace featuring an intricately detailed Radha Krishna pendant, paired with matching earrings — antique finish, spiritual elegance.',
   'Silver base, gold plated', false, false, false, true)
on conflict (id) do nothing;
