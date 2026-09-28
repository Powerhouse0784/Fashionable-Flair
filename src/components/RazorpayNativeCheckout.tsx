import type { PremiumOrder, RazorpayPaymentResponse } from '@/services/premiumService';

export interface RazorpayNativeCheckoutProps {
  order: PremiumOrder | null;
  onSuccess: (payment: RazorpayPaymentResponse) => void;
  onDismiss: () => void;
  onFailure: (message: string) => void;
}

/** Web build: the Razorpay popup (services/premiumService.runWebCheckout)
 * is used instead, so this renders nothing. The real implementation is in
 * RazorpayNativeCheckout.native.tsx — Metro picks it on iOS/Android. */
export default function RazorpayNativeCheckout(_props: RazorpayNativeCheckoutProps) {
  return null;
}
