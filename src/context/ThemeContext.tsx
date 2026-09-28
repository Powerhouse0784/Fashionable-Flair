import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, ColorTheme } from '@/theme/colors';
import { AccentThemeId, applyAccentTheme, isAccentThemeId, isPremiumAccentTheme } from '@/theme/accentThemes';
import {
  AppearanceId,
  isAppearanceId,
  isPremiumAppearance,
  getPremiumAppearance,
  freeFallbackFor,
} from '@/theme/appearances';

const STORAGE_KEY = '@fashionable_flair/theme_preference';
const ACCENT_STORAGE_KEY = '@fashionable_flair/accent_theme';

interface ThemeContextValue {
  colors: ColorTheme;
  isDark: boolean;
  /** The appearance actually being shown. 'light' | 'dark' | 'system' are
   * free; 'ivory' | 'blush' | 'twilight' | 'espresso' are Premium-only. If a Premium
   * choice is saved but Premium isn't active (expired, or logged out), this
   * reports the free look it falls back to — the saved choice itself is
   * kept, so it comes straight back when Premium does. */
  preference: AppearanceId;
  setPreference: (pref: AppearanceId) => void;
  /** 'classic' is free; every other accent is a Premium-only gemstone skin.
   * Same fallback rule as `preference`. */
  accentTheme: AccentThemeId;
  setAccentTheme: (accent: AccentThemeId) => void;
  /** True while a Premium appearance (Ivory / Blush / Twilight / Espresso) is on.
   * Screens with artwork painted for the classic blue palette use this to
   * skip that backdrop rather than clash with a different palette. */
  isCustomAppearance: boolean;
  /** Told by PremiumThemeGate whether Premium is active. Until something
   * says otherwise it's assumed true, so a member never sees a flash of
   * the free look while their status is still loading. */
  setPremiumAccess: (allowed: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [storedPreference, setStoredPreference] = useState<AppearanceId>('light');
  const [storedAccent, setStoredAccent] = useState<AccentThemeId>('classic');
  const [premiumAccess, setPremiumAccessState] = useState(true);
  const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (isAppearanceId(stored)) setStoredPreference(stored);
    });
    AsyncStorage.getItem(ACCENT_STORAGE_KEY).then((stored) => {
      if (isAccentThemeId(stored)) setStoredAccent(stored);
    });
    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystemScheme(colorScheme));
    return () => sub.remove();
  }, []);

  const setPreference = useCallback((pref: AppearanceId) => {
    setStoredPreference(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref).catch((err) => console.warn('Failed to persist theme', err));
  }, []);

  const setAccentTheme = useCallback((accent: AccentThemeId) => {
    setStoredAccent(accent);
    AsyncStorage.setItem(ACCENT_STORAGE_KEY, accent).catch((err) => console.warn('Failed to persist accent theme', err));
  }, []);

  const setPremiumAccess = useCallback((allowed: boolean) => setPremiumAccessState(allowed), []);

  // What's actually applied: a Premium choice only counts while Premium is
  // active. Nothing is written back to storage here on purpose — a network
  // hiccup while loading Premium status must never wipe someone's saved look.
  const preference: AppearanceId =
    !premiumAccess && isPremiumAppearance(storedPreference) ? freeFallbackFor(storedPreference) : storedPreference;
  const accentTheme: AccentThemeId = !premiumAccess && isPremiumAccentTheme(storedAccent) ? 'classic' : storedAccent;

  const value = useMemo<ThemeContextValue>(() => {
    let isDark: boolean;
    let base: ColorTheme;
    if (isPremiumAppearance(preference)) {
      const appearance = getPremiumAppearance(preference);
      isDark = appearance.isDark;
      base = appearance.palette;
    } else {
      isDark = preference === 'dark' || (preference === 'system' && systemScheme === 'dark');
      base = isDark ? darkColors : lightColors;
    }
    return {
      colors: applyAccentTheme(base, accentTheme, isDark),
      isDark,
      preference,
      setPreference,
      accentTheme,
      setAccentTheme,
      isCustomAppearance: isPremiumAppearance(preference),
      setPremiumAccess,
    };
  }, [preference, accentTheme, systemScheme, setPreference, setAccentTheme, setPremiumAccess]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
