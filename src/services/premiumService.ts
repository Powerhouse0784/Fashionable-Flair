import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Real ₹-money checkout for Premium, via Razorpay — see RAZORPAY_SETUP.md
 * for what needs to be filled in before this actually charges anyone.
 *
 * Requires a signed-in account (see CUSTOMER_ACCOUNTS_SETUP.md) — both
 * edge functions this calls reject an anonymous caller with a 401, since
 * Premium is tracked against an account, never a bare device. The
 * paywall UI is what's responsible for getting someone logged in first;
 * this function assumes that's already true by the time it's called.
 *
 * Web only, and deliberately so: Apple and Google both require digital
 * subscriptions unlocked *inside* a native app to go through their own
 * in-app-purchase systems (App Store/Play Billing), not a third-party
 * gateway like Razorpay — wiring Razorpay directly into the native app
 * for this would risk the app being rejected or pulled. On web there's
 * no such rule, so Premium is sold there, and the native app links out
 * to the website to subscribe (see WEBSITE_URL in config/socialLinks).
 * Adding native billing later means adding `react-native-iap` and
 * configuring subscription products in App Store Connect / Play Console
 * — a separate, deliberate piece of work, not something to fake here.
 */
export const isWebCheckoutSupported = Platform.OS === 'web';

export interface PremiumCheckoutResult {
  months: number;
  premiumSince: string;
  premiumExpiresAt: string;
}

/** Thrown when the shopper closes the Razorpay window without paying —
 * not a real error, just "they changed their mind", so callers should
 * check for this and stay quiet rather than showing an error toast. */
export const CHECKOUT_DISMISSED = 'CHECKOUT_DISMISSED';

let razorpayScriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof document === 'undefined') {
    return Promise.reject(new Error('Razorpay Checkout only runs in a browser.'));
  }
  if ((window as any).Razorpay) return Promise.resolve();
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      razorpayScriptPromise = null;
      reject(new Error('Could not load the payment window — check your connection and try again.'));
    };
    document.body.appendChild(script);
  });
  return razorpayScriptPromise;
}

/** Opens Razorpay Checkout for `months` of Premium and resolves once the
 * payment is placed AND verified server-side. Rejects with a normal
 * Error for real failures, or an Error whose message is
 * CHECKOUT_DISMISSED if the shopper just closed the window. */
export async function startPremiumCheckout(months: 1 | 3 | 12 = 1): Promise<PremiumCheckoutResult> {
  if (!isWebCheckoutSupported) {
    throw new Error('In-app checkout isn\u2019t available on the app yet \u2014 please subscribe on our website.');
  }
  if (!isSupabaseConfigured) {
    throw new Error('Premium checkout isn\u2019t set up yet \u2014 see RAZORPAY_SETUP.md.');
  }

  const { data: order, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
    body: { months },
  });
  if (orderError || !order || order.error) {
    throw new Error(order?.error || 'Could not start checkout right now \u2014 please try again shortly.');
  }

  await loadRazorpayScript();

  return new Promise<PremiumCheckoutResult>((resolve, reject) => {
    let settled = false;

    const rzp = new (window as any).Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: 'Fashionable Flair',
      description: `Premium \u2014 ${months} month${months > 1 ? 's' : ''}`,
      theme: { color: '#286CB0' },
      handler: async (response: any) => {
        try {
          const { data: verification, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
            body: {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              months,
            },
          });
          if (verifyError || !verification?.verified) {
            settled = true;
            reject(new Error(verification?.error || 'We couldn\u2019t verify that payment \u2014 if money was deducted, contact us and we\u2019ll sort it out.'));
            return;
          }
          settled = true;
          resolve({
            months: verification.months,
            premiumSince: verification.premiumSince,
            premiumExpiresAt: verification.premiumExpiresAt,
          });
        } catch (err) {
          settled = true;
          reject(err instanceof Error ? err : new Error('Something went wrong verifying your payment.'));
        }
      },
      modal: {
        ondismiss: () => {
          if (!settled) reject(new Error(CHECKOUT_DISMISSED));
        },
      },
    });

    rzp.on('payment.failed', () => {
      settled = true;
      reject(new Error('Payment failed \u2014 you have not been charged.'));
    });

    rzp.open();
  });
}
