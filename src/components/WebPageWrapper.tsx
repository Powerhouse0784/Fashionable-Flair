import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { useIsWideScreen } from '@/hooks/useResponsive';
import TopNav from '@/components/TopNav';

/**
 * Every screen reachable from the footer (or from a product/category link)
 * used to lose the site header the moment you navigated to it on web —
 * only the Home tab had TopNav, because it lived inside AppShell while
 * everything else is a separate top-level stack screen. This wrapper is
 * the fix: drop it at the top of any customer-facing screen and the header
 * (and therefore easy navigation back to Shop/Wishlist/etc.) stays put no
 * matter where you clicked from. No-op on native/narrow — those keep their
 * own back-button headers as before.
 */
export default function WebPageWrapper({ children }: { children: ReactNode }) {
  const isWide = useIsWideScreen();
  if (!isWide) return <>{children}</>;
  return (
    <View style={{ flex: 1 }}>
      <TopNav />
      {children}
    </View>
  );
}
