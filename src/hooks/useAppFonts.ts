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
// ⚠️ These two power just the Testimonials page's headline and script
// flourish, to match a reference design. They are NOT yet installed —
// run this once before building:
//
//   npx expo install @expo-google-fonts/playfair-display @expo-google-fonts/alex-brush
//
// Until that command has been run, this import will fail to resolve and
// the app will not build. If you compare both on fonts.google.com and
// prefer a different script font (Great Vibes, Sacramento and Parisienne
// are close alternatives), swap the package/import/weight names below —
// nothing else in this file needs to change.
import { PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { AlexBrush_400Regular } from '@expo-google-fonts/alex-brush';

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
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    AlexBrush_400Regular,
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
  // Used only on the Testimonials screen for now (see the note above) —
  // not part of the site-wide type scale.
  displaySerif: 'PlayfairDisplay_600SemiBold',
  displaySerifBold: 'PlayfairDisplay_700Bold',
  script: 'AlexBrush_400Regular',
};
