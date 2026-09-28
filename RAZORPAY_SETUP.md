# Premium Subscription Checkout — Setup (Razorpay + Supabase Edge Functions)

Premium (price set in `src/config/premium.ts` — currently ₹1 for testing, ₹20/month planned) is sold through **Razorpay Checkout on the website**,
verified by two Supabase Edge Functions. This only covers the **web**
build — see "Why web-only?" below before you assume it also charges
people inside the native Android/iOS app, because it deliberately
doesn't.

Until you complete the steps below, tapping "Subscribe" on web will show
"Premium checkout isn't set up yet" instead of opening a payment window —
that's expected, not a bug.

## 1. Create a Razorpay account

Sign up at [razorpay.com](https://razorpay.com) and complete their KYC
(needed before you can accept **live** payments — you can build and test
everything below first using their free **Test Mode**, no KYC required
for that).

## 2. Grab your API keys

In the Razorpay Dashboard: **Settings → API Keys → Generate Key**. You'll
get a **Key ID** (safe to expose to the browser) and a **Key Secret**
(never expose this — it's what lets someone forge a fake "payment
succeeded" signal if it leaks). Test Mode has its own separate pair of
keys from Live Mode — use the Test ones while you're trying this out.

## 3. Install the Supabase CLI (skip if you already did this for chat/contact-form)

```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
```

## 4. Deploy both functions

```bash
supabase functions deploy create-razorpay-order
supabase functions deploy verify-razorpay-payment
```

## 5. Set your Razorpay keys as secrets

```bash
supabase secrets set RAZORPAY_KEY_ID=your-key-id
supabase secrets set RAZORPAY_KEY_SECRET=your-key-secret
```

Both functions read the same two secrets — one `secrets set` covers them.

## 6. Test it (Test Mode)

Open the app on **web** → Profile → the Premium card → Subscribe Now →
log in or create an account if you haven't already (see
`CUSTOMER_ACCOUNTS_SETUP.md` — this has to be done first, both functions
reject anyone not signed in). Razorpay's Checkout window opens; pay with
one of their
[published test cards](https://razorpay.com/docs/payments/payments/test-card-details/)
(no real money moves in Test Mode). On success, the Profile screen should
show the gold Premium badge and an expiry date about a month out.

If it instead shows "Payment could not be verified," double check both
secrets were set with the values from the **same mode** (Test keys with
a Test order, Live keys with a Live order) — mixing them is the most
common cause.

## 7. Go live

Switch to your **Live** Key ID/Secret from the dashboard (after KYC is
approved) and re-run step 5 with the live values. That's the only change
needed — the same two functions handle both modes.

## Why web-only?

Apple's App Store and Google Play both require digital subscriptions that
unlock features **inside** a native app to go through their own
in-app-purchase systems (StoreKit / Play Billing) — not a third-party
gateway like Razorpay. Wiring Razorpay directly into the native app to
unlock Premium there risks the app being rejected on submission, or
pulled later. So for now, the native app's Premium screen links out to
your website to subscribe instead of charging in-app directly (see
`WEBSITE_URL` in `src/config/socialLinks.ts` — set this to your real
deployed site once you have one). Adding true native billing later means
adding the `react-native-iap` library and configuring subscription
products in App Store Connect and the Play Console — a separate, bigger
piece of work, deliberately not attempted here.

## A note on how "Premium" is tracked

Buying Premium requires a real account — see `CUSTOMER_ACCOUNTS_SETUP.md`
first if you haven't already, since `create-razorpay-order` and
`verify-razorpay-payment` both reject an anonymous caller with a 401.
Once paid, `verify-razorpay-payment` writes `premium_expires_at` straight
into that account's row in the `profiles` table using the signature
check above — not a device-local flag — so it genuinely survives a
cleared browser, a reinstall, or logging in on a different phone.

## Cost

Razorpay charges a percentage per transaction (around 2% for standard
domestic cards/UPI at the time of writing — check
[razorpay.com/pricing](https://razorpay.com/pricing) for current rates).
There's no monthly fee just for having an account.
