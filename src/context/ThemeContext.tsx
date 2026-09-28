import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, ColorTheme } from '@/theme/colors';
import { AccentThemeId, applyAccentTheme } from '@/theme/accentThemes';

const STORAGE_KEY = '@fashionable_flair/theme_preference';
const ACCENT_STORAGE_KEY = '@fashionable_flair/accent_theme';
type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  colors: ColorTheme;
  isDark: boolean;
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  /** 'classic' is free; 'ruby' | 'emerald' | 'amethyst' are Premium-only
   * skins — gating who is *allowed* to set this happens where it's set
   * (the Preferences UI), not here, since this context has no idea what
   * plan the shopper is on. */
  accentTheme: AccentThemeId;
  setAccentTheme: (accent: AccentThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('light');
  const [accentTheme, setAccentThemeState] = useState<AccentThemeId>('classic');
  const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setPreferenceState(stored);
      }
    });
    AsyncStorage.getItem(ACCENT_STORAGE_KEY).then((stored) => {
      if (stored === 'classic' || stored === 'ruby' || stored === 'emerald' || stored === 'amethyst') {
        setAccentThemeState(stored);
      }
    });
    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystemScheme(colorScheme));
    return () => sub.remove();
  }, []);

  const setPreference = (pref: ThemePreference) => {
    setPreferenceState(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref).catch((err) => console.warn('Failed to persist theme', err));
  };

  const setAccentTheme = (accent: AccentThemeId) => {
    setAccentThemeState(accent);
    AsyncStorage.setItem(ACCENT_STORAGE_KEY, accent).catch((err) => console.warn('Failed to persist accent theme', err));
  };

  const isDark = preference === 'dark' || (preference === 'system' && systemScheme === 'dark');
  const colors = applyAccentTheme(isDark ? darkColors : lightColors, accentTheme, isDark);

  const value = useMemo(
    () => ({ colors, isDark, preference, setPreference, accentTheme, setAccentTheme }),
    [colors, isDark, preference, accentTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
