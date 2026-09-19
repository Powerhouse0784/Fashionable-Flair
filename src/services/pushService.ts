import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const TABLE = 'push_tokens';

// Expo Go (the generic sandbox app used for `expo start` + scanning a QR)
// dropped support for remote push notifications as of SDK 53 — the native
// module throws a hard, uncatchable-by-try/catch error the moment
// anything in expo-notifications runs, including just importing it and
// calling setNotificationHandler at module load time. That's exactly what
// crashed the whole app: this file used to call setNotificationHandler
// unconditionally at the top, before any Platform/environment check ever
// got a chance to run. Real push only ever works in a proper EAS
// development or production build anyway, so the fix is to detect Expo Go
// up front and skip touching expo-notifications at all in that case —
// including the import itself, via a lazy require() instead of a
// top-level import, since even loading the module is what triggers Expo
// Go's warning/throw here.
//
// Uses the deprecated `appOwnership` rather than the "recommended"
// `executionEnvironment` deliberately: executionEnvironment's StoreClient
// value covers both Expo Go *and* a proper expo-dev-client development
// build, and the latter DOES support push — so checking executionEnvironment
// would wrongly skip registration on dev-client builds too. appOwnership
// is still functional (just deprecated, not removed) and is the only one
// of the two that actually distinguishes the two cases.
const IS_EXPO_GO = Constants.appOwnership === 'expo';

if (!IS_EXPO_GO && Platform.OS !== 'web') {
  // Lazy require, not a top-level import — see IS_EXPO_GO comment above.
  const Notifications = require('expo-notifications');
  // Show a banner + play a sound for notifications that arrive while the
  // app is open in the foreground — the default is to silently do
  // nothing, which makes it look like notifications aren't working at all.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Requests notification permission and registers this device for push,
 * saving the Expo push token to Supabase so the admin broadcast function
 * can reach it later.
 *
 * No-ops quietly (no crash, no console spam beyond one clear message) on:
 *  - web — browser push works completely differently (Push API + VAPID
 *    keys, no Expo push token involved) and isn't set up here
 *  - Expo Go — see IS_EXPO_GO above; test push using a real EAS
 *    development or production build instead
 *  - simulators/emulators — can't receive real push regardless of build type
 *
 * Safe to call on every app launch otherwise: registering an
 * already-registered device just re-saves the same token (upserted, so no
 * duplicates pile up), which also naturally keeps the "last seen"
 * timestamp fresh.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (IS_EXPO_GO) {
    console.log('Push notifications need a real EAS build — skipped in Expo Go.');
    return null;
  }

  try {
    // Both required here rather than at module scope, for the same reason
    // the notification handler setup above is inside its own guard.
    const Notifications = require('expo-notifications');
    const Device = require('expo-device');

    if (!Device.isDevice) return null; // simulators/emulators can't receive real push

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    const token = data;

    if (isSupabaseConfigured && token) {
      await supabase.from(TABLE).upsert(
        [{ token, platform: Platform.OS, updatedAt: new Date().toISOString() }],
        { onConflict: 'token' }
      );
    }

    return token;
  } catch (e) {
    console.warn('Push notification registration failed', e);
    return null;
  }
}
