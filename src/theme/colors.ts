// Fashionable Flair — Dual Luxury Theme
//
// LIGHT MODE
// Clean Ocean Blue + White
//
// DARK MODE
// Premium Black + Gold
//
// Both themes use the same keys so existing components
// can switch themes without requiring component changes.

export const lightColors = {
  // Brand
  primary: '#286CB0',
  primaryDark: '#1E4F86',
  primaryLight: '#DCEEFF',

  // Gold jewellery accent
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
  // Brand
  // In dark mode BLUE is no longer the main brand colour.
  // Gold becomes the primary visual accent.
  primary: '#D4A943',
  primaryDark: '#B88A2E',
  primaryLight: '#3A301C',

  // Gold
  gold: '#D9B65F',
  goldLight: '#4A3D22',

  // Backgrounds
  background: '#0B0B0A',
  surface: '#151514',
  surfaceAlt: '#201F1C',

  // Text
  textPrimary: '#F5EBD5',
  textSecondary: '#B9B1A3',
  textMuted: '#77736A',
  textInverse: '#0B0B0A',

  // Status
  success: '#4FA47C',
  successLight: '#20372D',
  warning: '#D6A247',
  danger: '#D96A5F',

  // UI
  border: '#302D27',
  divider: '#26241F',
  overlay: 'rgba(0, 0, 0, 0.70)',
  shadow: 'rgba(0, 0, 0, 0.55)',

  // Rating
  star: '#E0B04F',
};

// Default palette
export const colors = lightColors;

export type ColorTheme = typeof lightColors;