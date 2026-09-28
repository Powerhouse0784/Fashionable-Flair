# Premium Checkout — Preview Setup (Razorpay TEST Mode + Supabase Edge Functions)

Premium works in **preview / test mode**: you use a Razorpay **test** key
pair, and when a signed-in shopper completes a **test** payment, Premium
switches on for their account — on the **website** (Razorpay's popup) and
in the **mobile app** (the same Razorpay Checkout, shown in an in-app
WebView, so it also works in Expo Go). **No real money ever moves.**

Every payment, on both platforms, is verified on the server before
Premium is granted (`verify-razorpay-payment` checks Razorpay's signature
and writes the account's expiry), so it can't be faked from the app.

Prerequisite: do `CUSTOMER_ACCOUNTS_SETUP.md` first — checkout requires a
logged-in account.

Until you finish the steps below, tapping Subscribe shows "Premium
checkout isn't set up yet" — that's expected, not a bug.

## 1. Get Razorpay TEST keys

Whoever owns the Razorpay account: Dashboard → make sure the toggle at
the top says **Test Mode** → **Account & Settings → API Keys → Generate
Test Key**. You get a **Key ID** (starts with `rzp_test_`) and a **Key
Secret**. Test-mode keys can't take real payments and don't need KYC, so
it's safe to use a shared/test account for this preview.

## 2. Deploy the two functions

```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy create-razorpay-order
supabase functions deploy verify-razorpay-payment
```

## 3. Set the test keys as secrets

```bash
supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
supabase secrets set RAZORPAY_KEY_SECRET=your-test-key-secret
```

## 4. Try it

Profile → Premium card → **Subscribe Now** → log in / create an account →
the Razorpay window opens. Pay with one of Razorpay's
[test cards](https://razorpay.com/docs/payments/payments/test-card-details/)
or the test UPI id `success@razorpay`. You should land back on Profile
with the gold Premium badge and an expiry about a month out; log in on
another device/browser and it's still there.

"Payment could not be verified" almost always means the Key ID and Secret
came from different modes/accounts — set both again from the same test
key pair.

## Price

`PREMIUM_PRICE_INR` in `src/config/premium.ts` **and** the same constant
in `supabase/functions/create-razorpay-order/index.ts` (they run in
different runtimes, so keep both equal). Currently ₹1 for testing.

## How Premium is tracked

It lives in the account's row in the `profiles` table
(`premium_expires_at`), not on the device — so a cleared browser or a new
phone doesn't lose it. It's a one-month pass per payment (no
auto-renewal); paying again extends it.

## If this ever goes to production

This preview setup is deliberately not store-ready: Apple and Google
require their own in-app-purchase billing for unlocking digital features
inside a store-distributed native app, so the mobile WebView payment would
have to be replaced (e.g. `react-native-iap`) and real Razorpay live keys
used only by the actual business owner. None of that is needed to demo
Premium as described above.
