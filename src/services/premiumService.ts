import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Premium checkout via Razorpay — built for PREVIEW / TEST MODE: put a
 * Razorpay *test* key pair in the Supabase secrets (see RAZORPAY_SETUP.md)
 * and a completed test payment unlocks Premium on both the website (the
 * Razorpay Checkout popup) and the mobile app (the same Checkout, hosted
 * inside a WebView — see components/RazorpayNativeCheckout.native.tsx).
 * No real money moves in Test Mode.
 *
 * Every payment, on either platform, is verified server-side
 * (verify-razorpay-payment checks Razorpay's HMAC signature and writes
 * the account's Premium expiry) — the client never grants Premium
 * itself. Both edge functions require a signed-in account.
 *
 * If this ever goes to production with real money: Apple/Google require
 * their own in-app-purchase billing for unlocking digital features inside
 * a store-distributed native app, so the native path here would need to
 * be replaced (e.g. react-native-iap) before a store release.
 */
export const isWebPlatform = Platform.OS === 'web';

export interface PremiumOrder {
  orderId: string;
  amount: number; // paise
  currency: string;
  keyId: string;
  months: number;
}

export interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PremiumCheckoutResult {
  months: number;
  premiumSince: string;
  premiumExpiresAt: string;
}

/** Thrown when the shopper closes the payment window without paying —
 * not a real error, so callers should stay quiet rather than alert. */
export const CHECKOUT_DISMISSED = 'CHECKOUT_DISMISSED';

/** Razorpay test keys start with "rzp_test_" — lets the UI say plainly
 * that no real money is involved. */
export function isTestModeKey(keyId: string | undefined | null): boolean {
  return !!keyId && keyId.startsWith('rzp_test_');
}

/** Step 1 — ask the server to create a Razorpay order (needs login). */
export async function createPremiumOrder(months: 1 | 3 | 12 = 1): Promise<PremiumOrder> {
  if (!isSupabaseConfigured) {
    throw new Error('Premium checkout isn\u2019t set up yet \u2014 see RAZORPAY_SETUP.md.');
  }
  const { data: order, error } = await supabase.functions.invoke('create-razorpay-order', { body: { months } });
  if (error || !order || order.error) {
    throw new Error(order?.error || 'Could not start checkout right now \u2014 please try again shortly.');
  }
  return order as PremiumOrder;
}

/** Final step (both platforms) — server checks the signature and credits
 * this account's Premium; returns the new dates to show immediately. */
export async function verifyPremiumPayment(
  payment: RazorpayPaymentResponse,
  months: number
): Promise<PremiumCheckoutResult> {
  const { data: verification, error } = await supabase.functions.invoke('verify-razorpay-payment', {
    body: { ...payment, months },
  });
  if (error || !verification?.verified) {
    throw new Error(
      verification?.error ||
        'We couldn\u2019t verify that payment \u2014 if money was deducted, contact us and we\u2019ll sort it out.'
    );
  }
  return {
    months: verification.months,
    premiumSince: verification.premiumSince,
    premiumExpiresAt: verification.premiumExpiresAt,
  };
}

let razorpayScriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof document === 'undefined') return Promise.reject(new Error('Razorpay Checkout only runs in a browser.'));
  if ((window as any).Razorpay) return Promise.resolve();
  if (razorpayScriptPromise) return razorpayScriptPromise;
  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      razorpayScriptPromise = null;
      reject(new Error('Could not load the payment window \u2014 check your connection and try again.'));
    };
    document.body.appendChild(script);
  });
  return razorpayScriptPromise;
}

/** Web only — opens the Razorpay popup for an order from createPremiumOrder
 * and resolves once the payment is placed AND verified server-side. Rejects
 * with CHECKOUT_DISMISSED if the window is simply closed. */
export async function runWebCheckout(order: PremiumOrder): Promise<PremiumCheckoutResult> {
  await loadRazorpayScript();
  return new Promise<PremiumCheckoutResult>((resolve, reject) => {
    let settled = false;
    const rzp = new (window as any).Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: 'Fashionable Flair',
      description: `Premium \u2014 ${order.months} month${order.months > 1 ? 's' : ''}`,
      theme: { color: '#286CB0' },
      handler: async (response: RazorpayPaymentResponse) => {
        settled = true;
        try {
          resolve(await verifyPremiumPayment(response, order.months));
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Something went wrong verifying your payment.'));
        }
      },
      modal: {
        ondismiss: () => {
          if (!settled) reject(new Error(CHECKOUT_DISMISSED));
        },
      },
    });
    rzp.on('payment.failed', (r: any) => {
      settled = true;
      reject(new Error(r?.error?.description || 'Payment failed \u2014 you have not been charged.'));
    });
    rzp.open();
  });
}
