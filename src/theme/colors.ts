// Fashionable Flair — Dual Luxury Theme
//
// LIGHT MODE
// Ocean Blue + White
//
// DARK MODE
// Deep Blue + Gold
//
// Both themes use the same keys so existing components
// can switch themes without component changes.

export const lightColors = {
  // Brand
  primary: '#286CB0',
  primaryDark: '#1E4F86',
  primaryLight: '#DCEEFF',

  // Jewellery accent
  gold: '#C9A24B',
  goldLight: '#F3E7C5',

  // Backgrounds
  background: '#F8FAFF',
  surface: '#FFFFFF',
  surfaceAlt: '#EAF3FC',

  // Text
  textPrimary: '#192A3D',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Status
  success: '#2E7D63',
  successLight: '#DDF3EB',
  warning: '#C58A2C',
  danger: '#C94A4A',

  // UI
  border: '#D9E7F5',
  divider: '#E7EEF6',
  overlay: 'rgba(25, 42, 61, 0.45)',
  shadow: 'rgba(40, 108, 176, 0.14)',

  // Rating
  star: '#D9A441',
};

export const darkColors = {
  // Brand — Deep Blue
  primary: '#2878C8',
  primaryDark: '#1760A8',
  primaryLight: '#12385D',

  // Jewellery accent — Gold
  gold: '#D9A943',
  goldLight: '#4A3B1D',

  // Backgrounds — Deep Blue
  background: '#07111F',
  surface: '#0D1C2E',
  surfaceAlt: '#102943',

  // Text
  textPrimary: '#F4F8FC',
  textSecondary: '#B8C7D8',
  textMuted: '#718398',
  textInverse: '#FFFFFF',

  // Status
  success: '#4BA889',
  successLight: '#17372F',
  warning: '#D8A64A',
  danger: '#D96666',

  // UI
  border: '#1B4A73',
  divider: '#16344F',
  overlay: 'rgba(0, 0, 0, 0.65)',
  shadow: 'rgba(0, 35, 70, 0.55)',

  // Rating
  star: '#E4B54F',
};

// Default palette
export const colors = lightColors;

export type ColorTheme = typeof lightColors;