import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// No-ops silently on web (Haptics API is native-only) — every call site
// can use these without platform checks of its own.
export const hapticSelection = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
};

export const hapticSuccess = () => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
};

export const hapticImpact = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
};
