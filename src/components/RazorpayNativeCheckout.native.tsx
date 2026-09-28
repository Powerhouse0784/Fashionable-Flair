import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import type { RazorpayNativeCheckoutProps } from './RazorpayNativeCheckout';

/** Mobile-app payment window: the same Razorpay Checkout the website uses,
 * hosted inside a WebView (works in Expo Go and in a built app — no native
 * Razorpay SDK to install). The page reports back through
 * postMessage; nothing here grants Premium by itself — onSuccess just hands
 * the payment ids to the caller, which verifies them server-side. */
function buildHtml(order: NonNullable<RazorpayNativeCheckoutProps['order']>, background: string): string {
  const options = {
    key: order.keyId,
    amount: order.amount,
    currency: order.currency,
    order_id: order.orderId,
    name: 'Fashionable Flair',
    description: `Premium \u2014 ${order.months} month${order.months > 1 ? 's' : ''}`,
    theme: { color: '#286CB0' },
  };
  // Escape "<" so the JSON can never close the script tag early.
  const optionsJson = JSON.stringify(options).replace(/</g, '\\u003c');
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head><body style="margin:0;background:${background}">
<script>
  function post(payload) { window.ReactNativeWebView.postMessage(JSON.stringify(payload)); }
  window.onload = function () {
    if (!window.Razorpay) { post({ type: 'failure', message: 'Could not load the payment window \\u2014 check your connection and try again.' }); return; }
    var options = ${optionsJson};
    options.handler = function (r) { post({ type: 'success', payment: r }); };
    options.modal = { ondismiss: function () { post({ type: 'dismiss' }); } };
    var rzp = new Razorpay(options);
    rzp.on('payment.failed', function (r) {
      post({ type: 'failure', message: (r && r.error && r.error.description) || 'Payment failed \\u2014 you have not been charged.' });
    });
    rzp.open();
  };
</script></body></html>`;
}

export default function RazorpayNativeCheckout({ order, onSuccess, onDismiss, onFailure }: RazorpayNativeCheckoutProps) {
  const { colors } = useTheme();
  const html = useMemo(() => (order ? buildHtml(order, colors.background) : ''), [order, colors.background]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'success') onSuccess(data.payment);
      else if (data.type === 'dismiss') onDismiss();
      else if (data.type === 'failure') onFailure(data.message || 'Payment failed.');
    } catch {
      onFailure('Something went wrong with the payment window.');
    }
  };

  return (
    <Modal visible={!!order} animationType="slide" onRequestClose={onDismiss}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Secure Payment</Text>
          <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        {order && (
          <WebView
            originWhitelist={['*']}
            source={{ html, baseUrl: 'https://checkout.razorpay.com' }}
            onMessage={handleMessage}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.primary} />
              </View>
            )}
            // UPI apps and other deep links come through as non-http
            // schemes — hand them to the OS instead of letting the
            // WebView choke on them.
            onShouldStartLoadWithRequest={(req) => {
              if (/^https?:|^about:|^data:/i.test(req.url)) return true;
              Linking.openURL(req.url).catch(() => {});
              return false;
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  title: { ...typography.h3 },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
