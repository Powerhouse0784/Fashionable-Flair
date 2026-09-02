// Fashionable Flair — brand palette
// Warm, jewellery-store feel: rose-gold accent on a soft cream base (light)
// or a warm charcoal base (dark). Both palettes share the exact same key
// names so every component can swap between them without any other code
// changes — see ThemeContext.tsx / useTheme().

export const lightColors = {
  // Brand
  primary: '#B76E79',
  primaryDark: '#8F4A54',
  primaryLight: '#E8C4C9',
  gold: '#C9A24B',
  goldLight: '#F1E2B8',

  // Backgrounds
  background: '#FFF8F3',
  surface: '#FFFFFF',
  surfaceAlt: '#FBEFE8',

  // Text
  textPrimary: '#2B2320',
  textSecondary: '#7A6E68',
  textMuted: '#A89C95',
  textInverse: '#FFFFFF',

  // Status
  success: '#3C8C5C',
  successLight: '#DCF0E2',
  warning: '#C97A2B',
  danger: '#C1443B',

  // UI
  border: '#EFE0D6',
  divider: '#F1E7DF',
  overlay: 'rgba(43, 35, 32, 0.55)',
  shadow: 'rgba(183, 110, 121, 0.18)',

  // Rating
  star: '#E0A63C',
};

export const darkColors = {
  // Brand — lightened slightly so it still reads clearly against dark
  // surfaces instead of looking muddy.
  primary: '#CB8D97',
  primaryDark: '#E8C4C9',
  primaryLight: '#4A2C32',
  gold: '#D9B76B',
  goldLight: '#4A3F26',

  // Backgrounds
  background: '#1C1512',
  surface: '#251C18',
  surfaceAlt: '#2E2320',

  // Text
  textPrimary: '#F4E9E2',
  textSecondary: '#C9B8AF',
  textMuted: '#8A7B72',
  textInverse: '#FFFFFF',

  // Status
  success: '#4FAD73',
  successLight: '#25422F',
  warning: '#D68F42',
  danger: '#D9695F',

  // UI
  border: '#3A2C26',
  divider: '#332822',
  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: 'rgba(0, 0, 0, 0.4)',

  // Rating
  star: '#E0A63C',
};

// Default export kept for any code that hasn't been migrated to the
// useTheme() hook yet — always resolves to the light palette so nothing
// breaks, it just won't respond to the dark mode toggle until converted.
export const colors = lightColors;

export type ColorTheme = typeof lightColors;
