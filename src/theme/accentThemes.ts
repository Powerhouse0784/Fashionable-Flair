import { ColorTheme } from './colors';

export type AccentThemeId =
  | 'classic'
  | 'ruby'
  | 'emerald'
  | 'amethyst'
  | 'rosequartz'
  | 'topaz'
  | 'aquamarine'
  | 'peridot';

type AccentOverride = Pick<ColorTheme, 'primary' | 'primaryDark' | 'primaryLight'>;

/**
 * Premium "gemstone" skins — seven extra accent colours a Premium member
 * can switch to, on top of the free Classic Blue. Only the brand accent
 * (primary/primaryDark/primaryLight) changes; background, surface, text,
 * borders and the gold jewellery accent all stay exactly as they are in
 * whichever appearance is active (light, dark, or a Premium appearance),
 * so contrast and readability everywhere else in the app is untouched —
 * this only reskins buttons, links and active states.
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
  rosequartz: {
    light: { primary: '#B8477A', primaryDark: '#93375F', primaryLight: '#FBE1EC' },
    dark: { primary: '#CC5A94', primaryDark: '#B8477A', primaryLight: '#40202F' },
  },
  topaz: {
    light: { primary: '#B5651D', primaryDark: '#8F4E14', primaryLight: '#FBE9D3' },
    dark: { primary: '#C7761F', primaryDark: '#B5651D', primaryLight: '#3E2A12' },
  },
  aquamarine: {
    light: { primary: '#137C88', primaryDark: '#0E606A', primaryLight: '#D6F0F3' },
    dark: { primary: '#2A939F', primaryDark: '#137C88', primaryLight: '#10363B' },
  },
  peridot: {
    light: { primary: '#5F7F1A', primaryDark: '#496213', primaryLight: '#E6F0CF' },
    dark: { primary: '#6F9226', primaryDark: '#5F7F1A', primaryLight: '#243212' },
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
  { id: 'rosequartz', label: 'Rose Quartz', premium: true, swatch: ACCENT_OVERRIDES.rosequartz.light.primary },
  { id: 'topaz', label: 'Topaz', premium: true, swatch: ACCENT_OVERRIDES.topaz.light.primary },
  { id: 'aquamarine', label: 'Aquamarine', premium: true, swatch: ACCENT_OVERRIDES.aquamarine.light.primary },
  { id: 'peridot', label: 'Peridot', premium: true, swatch: ACCENT_OVERRIDES.peridot.light.primary },
];

const ACCENT_IDS = new Set<string>(ACCENT_THEMES.map((t) => t.id));

export function isAccentThemeId(value: unknown): value is AccentThemeId {
  return typeof value === 'string' && ACCENT_IDS.has(value);
}

/** Applies an accent skin on top of the resolved base palette.
 * Returns the base unchanged for 'classic' (today's look, byte-for-byte). */
export function applyAccentTheme(base: ColorTheme, accent: AccentThemeId, isDark: boolean): ColorTheme {
  if (accent === 'classic') return base;
  const override = ACCENT_OVERRIDES[accent][isDark ? 'dark' : 'light'];
  return { ...base, ...override };
}

export function isPremiumAccentTheme(id: AccentThemeId): boolean {
  return id !== 'classic';
}
