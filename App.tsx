import 'react-native-url-polyfill/auto';
import React, { useCallback } from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { WishlistProvider } from '@/context/WishlistContext';
import { ProductsProvider } from '@/context/ProductsContext';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { RecentlyViewedProvider } from '@/context/RecentlyViewedContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import RootNavigator from '@/navigation/RootNavigator';
import { RootStackParamList } from '@/types/navigation';
import { useAppFonts } from '@/hooks/useAppFonts';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Enables real URLs on web: yoursite.com/admin opens the admin dashboard
// directly (redirecting to sign-in if needed), /product/<id> deep-links a
// specific product, etc.
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [],
  config: {
    screens: {
      Tabs: {
        screens: {
          Home: '',
          Search: 'search',
          Wishlist: 'wishlist',
          Profile: 'profile',
        },
      },
      ProductDetail: 'product/:productId',
      CategoryProducts: 'category/:category',
      AdminLogin: 'admin/login',
      AdminDashboard: 'admin',
      AdminProductForm: 'admin/product/:productId?',
    },
  },
};

export default function App() {
  const [fontsLoaded, fontError] = useAppFonts();

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Keep the native splash screen up (not a blank/white flash) until the
  // custom fonts are ready, so headings/prices never render in the system
  // font for a split second before swapping to Fraunces.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider onLayout={onLayoutRootView}>
        <ToastProvider>
          <AuthProvider>
            <ProductsProvider>
              <WishlistProvider>
                <RecentlyViewedProvider>
                  <NavigationContainer linking={linking}>
                    <StatusBar style="dark" />
                    <RootNavigator />
                  </NavigationContainer>
                </RecentlyViewedProvider>
              </WishlistProvider>
            </ProductsProvider>
          </AuthProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
