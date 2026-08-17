// Fashionable Flair — brand palette
// Warm, jewellery-store feel: rose-gold accent on a soft cream base.

export const colors = {
  // Brand
  primary: '#B76E79',       // rose gold
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
  warning: '#C97A2B',
  danger: '#C1443B',

  // UI
  border: '#EFE0D6',
  divider: '#F1E7DF',
  overlay: 'rgba(43, 35, 32, 0.55)',
  shadow: 'rgba(183, 110, 121, 0.18)',

  // Rating
  star: '#E0A63C',

  // Dark mode (optional toggle target)
  dark: {
    background: '#1C1512',
    surface: '#251C18',
    textPrimary: '#F4E9E2',
    textSecondary: '#C9B8AF',
    border: '#3A2C26',
  },
};

export type ColorTheme = typeof colors;
