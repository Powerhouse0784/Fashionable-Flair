import {
  useFonts as useFrauncesFonts,
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';

/**
 * Fraunces (serif) for headings/prices gives the brand an actual jewellery-
 * boutique feel instead of looking like every other system-font app.
 * Plus Jakarta Sans (clean grotesque) handles body text for readability.
 * Both are free Google Fonts, no licensing cost.
 */
export function useAppFonts() {
  return useFrauncesFonts({
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
}

export const fonts = {
  heading: 'Fraunces_600SemiBold',
  headingBold: 'Fraunces_700Bold',
  headingMedium: 'Fraunces_500Medium',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
};
