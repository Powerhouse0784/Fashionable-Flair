# Fashionable Flair — App

React Native (Expo + TypeScript) storefront for your Meesho shop. Browses your
catalog natively, "Buy Now" opens the real Meesho product page in an in-app
WebView so the purchase itself always happens on Meesho.

## 1. Prerequisites
- Node.js 18+ and npm
- Expo Go app on your phone (easiest way to test), or Android Studio / Xcode for emulators

## 2. Create the project shell
Run this once, in an empty folder:

```bash
npx create-expo-app@latest fashionable-flair --template blank-typescript
cd fashionable-flair
```

## 3. Drop in these files
Copy everything from this package into the new `fashionable-flair` folder,
overwriting `App.tsx`, `app.json`, `babel.config.js`, `tsconfig.json`,
`package.json` and adding the whole `src/` folder.

## 4. Install dependencies
```bash
npm install
npx expo install react-native-screens react-native-safe-area-context react-native-webview @react-native-async-storage/async-storage
```
(`expo install` picks the exact versions compatible with your Expo SDK — safer than plain `npm install` for native modules.)

## 5. Run it

**Mobile app:**
```bash
npx expo start
```
Scan the QR code with Expo Go (Android) or the Camera app (iOS).

**Web app (same codebase, no extra project):**
```bash
npx expo start --web
```
Opens in your browser at `localhost:8081` (or similar). This is the *same*
screens, components, and product data — Expo compiles React Native to
React Native Web automatically, so you don't maintain two codebases.

**Deploying the web version** (static export, works on Vercel/Netlify/GitHub Pages):
```bash
npx expo export -p web
```
This outputs a static site to `dist/`. Push that folder to any static host.

## 6. How mobile vs web differ (handled automatically, no extra work needed)
| Behavior | Native app (iOS/Android) | Web app |
|---|---|---|
| "Buy Now" | Opens Meesho product page in an in-app WebView modal | Opens Meesho in a new browser tab (Meesho blocks embedding on desktop browsers) |
| Share button | Native OS share sheet | Browser's native share sheet on mobile web, or copies the link on desktop |
| Product grid | Fixed 2 columns | 2→4 columns depending on how wide the browser window is |
| Product detail page | Full-width image, sticky bottom "Buy Now" bar | Side-by-side image + details, inline "Buy Now" button (no sticky bar) |
| Content width | Full device width | Capped at 1100px and centered on wide monitors |

All of this is driven by `Platform.OS` checks and a `useWindowDimensions`-based
responsive hook (`src/hooks/useResponsive.ts`) — there's no separate web
codebase to keep in sync.

## 7. What's already wired up
- Home, Search, Wishlist, Profile tabs
- 21 real products seeded from your live Meesho shop (names, prices, categories, product URLs)
- Product detail page with sticky "Buy Now on Meesho" button
- Tapping Buy Now opens the real Meesho product page inside the app (WebView modal)
- Wishlist persists on-device via AsyncStorage — no backend needed
- Rose-gold / cream theme matching a jewellery brand

## 8. Next steps (see the 200-feature list)
- Swap placeholder images in `src/data/products.ts` for real photos (export from your Meesho Supplier Panel → Catalog → Products, or your own photos)
- Add the remaining 3 products from page 2 of your shop the same way
- ~~Build an admin panel so products don't need code changes~~ — **done**, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md). Real sign-in, add/edit/delete products with photo upload, instant sync to every device — all on Supabase's free tier.
- Push notifications, dark mode, and the rest of the roadmap are additive on top of this structure — nothing here needs to be rebuilt for them

## Folder structure
```
fashionable-flair/
├── App.tsx
├── app.json
├── babel.config.js
├── tsconfig.json
├── package.json
└── src/
    ├── theme/          # colors, typography, spacing
    ├── types/          # Product & navigation TypeScript types
    ├── data/           # products.ts, categories.ts (your real catalog)
    ├── context/        # WishlistContext (AsyncStorage-backed)
    ├── navigation/      # RootNavigator (stack), BottomTabNavigator
    ├── components/      # ProductCard, CategoryPill, RatingStars, etc.
    ├── screens/         # Home, Search, Wishlist, Profile, ProductDetail,
    │                     # CategoryProducts, MeeshoRedirect (WebView)
    └── utils/           # formatPrice, linking helpers
```
