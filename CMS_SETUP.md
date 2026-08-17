# Product-Sync CMS — Add/Edit Products Without Touching Code

Your product catalog can live in a Google Sheet instead of `products.ts`.
Edit a row in the sheet, and every device running the app picks it up on
next launch (or instantly if someone pulls-to-refresh or taps "Refresh
Catalog" in Profile). Completely free — no Firebase, no backend, no paid
tier, just a Google account you already have.

## 1. Create the sheet

1. Go to [sheets.google.com](https://sheets.google.com) → Blank spreadsheet.
2. In row 1, add these exact column headers (case-sensitive, this order doesn't matter but the **names** do):

```
id | title | subtitle | price | category | rating | ratingLabel | meeshoUrl | image | description | material | isNewArrival | isBestSeller | isFeatured
```

3. Add one row per product. Reference — what each column means:

| Column | Required? | Example |
|---|---|---|
| `id` | Yes | `773lq8` (use the code from the end of the Meesho product URL) |
| `title` | Yes | `Styles Earrings & Studs` |
| `subtitle` | No | `+2 More` |
| `price` | Yes | `156` (number only, no ₹ symbol) |
| `category` | Yes | one of: `earrings`, `necklaces`, `pendants`, `jewellery-sets`, `bracelets`, `hair-accessories` |
| `rating` | No | `3.1` |
| `ratingLabel` | No | `3.1 Star Supplier` |
| `meeshoUrl` | Yes | full `https://www.meesho.com/...` product link |
| `image` | No | a real photo URL (leave blank to show the designed placeholder) |
| `description` | No | free text |
| `material` | No | `Oxidized silver` |
| `isNewArrival` | No | `TRUE` or `FALSE` |
| `isBestSeller` | No | `TRUE` or `FALSE` |
| `isFeatured` | No | `TRUE` or `FALSE` |

Rows missing `id`, `title`, `price`, a valid `category`, or `meeshoUrl` are
skipped automatically (logged to the console) rather than breaking the app.

## 2. Publish it as CSV

1. In the sheet: **File → Share → Publish to web**.
2. Under "Link", choose the specific sheet/tab (not "Entire Document").
3. Under the format dropdown, choose **Comma-separated values (.csv)**.
4. Click **Publish**, confirm.
5. Copy the generated URL — it looks like:
   `https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv`

## 3. Point the app at it

Open `src/config/sheetConfig.ts` and paste the URL:

```ts
export const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv';
```

That's the only code change — one line, one time. Rebuild/redeploy once
after this, and never again for routine product updates.

## 4. Day-to-day usage

- **Add a product:** add a row in the sheet. Done.
- **Edit a price/photo/description:** edit the cell. Done.
- **Remove a product:** delete the row (or just leave it — nothing forces you to keep unsold items listed).
- The app checks the sheet automatically on launch, and whenever the person
  pulls to refresh on the Home screen or taps **Profile → Refresh Catalog
  Now**. Changes are cached on-device, so the app still works fine offline
  with the last-synced catalog.

## How the fallback works

If `SHEET_CSV_URL` is blank, the sheet is unreachable, or every row fails
validation, the app quietly falls back to the local seed catalog in
`src/data/products.ts` — the app never shows a blank screen because of a
sheet typo or a lost connection.
