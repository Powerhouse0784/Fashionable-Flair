import '@/utils/suppressKnownWarnings';
import 'react-native-url-polyfill/auto';
import React, { useCallback, useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import { inject as injectVercelAnalytics } from '@vercel/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, LinkingOptions, useNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { WishlistProvider } from '@/context/WishlistContext';
import { ProductsProvider } from '@/context/ProductsContext';
import { ProfileProvider } from '@/context/ProfileContext';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { RecentlyViewedProvider } from '@/context/RecentlyViewedContext';
import { ScrollVisibilityProvider } from '@/context/ScrollVisibilityContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import QuickActionsSidebar from '@/components/QuickActionsSidebar';
import OnboardingScreen from '@/screens/OnboardingScreen';
import RootNavigator from '@/navigation/RootNavigator';
import { RootStackParamList } from '@/types/navigation';
import { useAppFonts } from '@/hooks/useAppFonts';
import { useWebThemeBackground } from '@/hooks/useWebThemeBackground';
import { registerForPushNotifications } from '@/services/pushService';

const ONBOARDING_KEY = '@fashionable_flair/onboarding_complete';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Vercel Analytics — page-view tracking on the web build only (native
// obviously isn't served from Vercel). React Navigation's `linking` config
// below keeps the browser's URL bar in sync via the History API, so
// Analytics' built-in SPA route-change detection picks up screen changes
// automatically with no extra wiring per screen. Requires Analytics to be
// turned on once in the Vercel project's dashboard (Project → Analytics →
// Enable) — this call alone doesn't do that.
if (Platform.OS === 'web') {
  injectVercelAnalytics();
}

// Enables real URLs on web: yoursite.com/admin opens the admin dashboard
// directly (redirecting to sign-in if needed), /product/:id deep-links a
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
      MeeshoRedirect: 'meesho',
      AdminLogin: 'admin/login',
      AdminDashboard: 'admin',
      AdminProductForm: 'admin/product/:productId?',
      About: 'about',
      Contact: 'contact',
      FAQ: 'faq',
      PrivacyPolicy: 'privacy',
      Terms: 'terms',
    },
  },
};

// Small inner component so the status bar icon color (light-on-dark vs
// dark-on-light) can react to the theme — it needs to live below
// ThemeProvider in the tree to call useTheme().
function AppNavigation() {
  const { isDark, colors } = useTheme();
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const [isAdminScreen, setIsAdminScreen] = useState(false);
  const [isMeeshoRedirect, setIsMeeshoRedirect] = useState(false);
  const [isProductDetail, setIsProductDetail] = useState(false);

  useWebThemeBackground(colors.background);

  // Register for push once the app's up — silently no-ops on web and on
  // simulators, and re-registering an already-known device just refreshes
  // its saved token rather than creating a duplicate.
  useEffect(() => {
    registerForPushNotifications();
  }, []);

  // QuickActionsSidebar (chat + WhatsApp + Instagram + call) sits as a
  // sibling of RootNavigator, not inside any of its screens — so it can't
  // use useNavigationState() itself (that hook requires being a descendant
  // of an actual Navigator, not just inside NavigationContainer, and
  // calling it anyway crashed the whole app). Tracking the current route
  // via the container ref instead and passing it down as a plain prop
  // avoids that entirely.
  const updateCurrentRoute = useCallback(() => {
    const routeName = navigationRef.getCurrentRoute()?.name;
    setIsAdminScreen(typeof routeName === 'string' && routeName.startsWith('Admin'));
    // FIX: Hide the sidebar on MeeshoRedirect screen
    setIsMeeshoRedirect(routeName === 'MeeshoRedirect');
    // ProductDetail has its own sticky "Buy Now" bar on mobile, taller than
    // (and positioned independently of) the app's normal tab bar — the
    // sidebar's usual bottom offset assumes the tab bar's height, so on
    // this one screen it needs to sit higher or it visually collides with
    // that bar / the content just above it while scrolling.
    setIsProductDetail(routeName === 'ProductDetail');
  }, [navigationRef]);

  // FIX: Hide the sidebar if on admin screen OR meesho redirect screen
  const shouldHideSidebar = isAdminScreen || isMeeshoRedirect;

  return (
    <NavigationContainer ref={navigationRef} linking={linking} onReady={updateCurrentRoute} onStateChange={updateCurrentRoute}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ flex: 1 }}>
        <RootNavigator />
        <QuickActionsSidebar hidden={shouldHideSidebar} extraBottomOffset={isProductDetail ? 64 : 0} />
      </View>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useAppFonts();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((value) => setShowOnboarding(value !== 'true'))
      .catch(() => setShowOnboarding(false)) // fail safe: never block the whole app on a storage error
      .finally(() => setOnboardingChecked(true));
  }, []);

  const handleOnboardingDone = useCallback(() => {
    setShowOnboarding(false);
    AsyncStorage.setItem(ONBOARDING_KEY, 'true').catch((err) => console.warn('Failed to persist onboarding flag', err));
  }, []);

  const ready = (fontsLoaded || fontError) && onboardingChecked;

  const onLayoutRootView = useCallback(async () => {
    if (ready) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  // Keep the native splash screen up (not a blank/white flash) until both
  // the custom fonts are ready AND we know whether to show onboarding —
  // otherwise the splash would hide, flash the main app for a frame, then
  // switch to onboarding once the AsyncStorage check resolves.
  if (!ready) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider onLayout={onLayoutRootView}>
        <ThemeProvider>
          {showOnboarding ? (
            <OnboardingScreen onDone={handleOnboardingDone} />
          ) : (
            <ToastProvider>
              <AuthProvider>
                <ProductsProvider>
                  <ProfileProvider>
                    <WishlistProvider>
                      <RecentlyViewedProvider>
                        <ScrollVisibilityProvider>
                          <AppNavigation />
                        </ScrollVisibilityProvider>
                      </RecentlyViewedProvider>
                    </WishlistProvider>
                  </ProfileProvider>
                </ProductsProvider>
              </AuthProvider>
            </ToastProvider>
          )}
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}