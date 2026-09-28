import { ColorTheme } from './colors';

export type AccentThemeId = 'classic' | 'ruby' | 'emerald' | 'amethyst';

type AccentOverride = Pick<ColorTheme, 'primary' | 'primaryDark' | 'primaryLight'>;

/**
 * Premium "gemstone" skins — three extra accent colours a Premium member
 * can switch to, on top of the free Classic Blue. Only the brand accent
 * (primary/primaryDark/primaryLight) changes; background, surface, text,
 * borders and the gold jewellery accent all stay exactly as they are in
 * light/dark mode, so contrast and readability everywhere else in the
 * app is untouched — this only reskins buttons, links and active states.
 */
const ACCENT_OVERRIDES: Record<Exclude<AccentThemeId, 'classic'>, { light: AccentOverride; dark: AccentOverride }> = {
  ruby: {
    light: { primary: '#B23A4E', primaryDark: '#8A2C3D', primaryLight: '#F8DEE2' },
    dark: { primary: '#D9576B', primaryDark: '#B23A4E', primaryLight: '#3D1B22' },
  },
  emerald: {
    light: { primary: '#1F7A5C', primaryDark: '#155C45', primaryLight: '#DAF0E6' },
    dark: { primary: '#3FA37F', primaryDark: '#1F7A5C', primaryLight: '#123A2E' },
  },
  amethyst: {
    light: { primary: '#7B4FA0', primaryDark: '#5E3A7D', primaryLight: '#ECE0F5' },
    dark: { primary: '#A87BC9', primaryDark: '#7B4FA0', primaryLight: '#33223F' },
  },
};

export interface AccentThemeMeta {
  id: AccentThemeId;
  label: string;
  premium: boolean;
  /** A representative swatch colour for the picker UI (light-mode primary). */
  swatch: string;
}

export const ACCENT_THEMES: AccentThemeMeta[] = [
  { id: 'classic', label: 'Classic', premium: false, swatch: '#286CB0' },
  { id: 'ruby', label: 'Ruby', premium: true, swatch: ACCENT_OVERRIDES.ruby.light.primary },
  { id: 'emerald', label: 'Emerald', premium: true, swatch: ACCENT_OVERRIDES.emerald.light.primary },
  { id: 'amethyst', label: 'Amethyst', premium: true, swatch: ACCENT_OVERRIDES.amethyst.light.primary },
];

/** Applies an accent skin on top of the resolved light/dark base palette.
 * Returns the base unchanged for 'classic' (today's look, byte-for-byte). */
export function applyAccentTheme(base: ColorTheme, accent: AccentThemeId, isDark: boolean): ColorTheme {
  if (accent === 'classic') return base;
  const override = ACCENT_OVERRIDES[accent][isDark ? 'dark' : 'light'];
  return { ...base, ...override };
}

export function isPremiumAccentTheme(id: AccentThemeId): boolean {
  return id !== 'classic';
}
