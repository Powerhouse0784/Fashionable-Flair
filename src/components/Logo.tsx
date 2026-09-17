import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

// Full wordmark (icon + "Fashionable Flair" text). Swapped automatically
// based on the active theme:
//  - light: warm-shadowed gold-on-transparent version, designed to sit on
//    the app's cream/white backgrounds (TopNav, Footer, light-mode splash).
//  - dark: same mark with a soft gold glow added behind it, so it still
//    pops against the app's charcoal dark-mode surfaces instead of looking
//    flat or muddy.
const LOGO_FULL_LIGHT = require('@/assets/brand/logo-light.png');
const LOGO_FULL_DARK = require('@/assets/brand/logo-dark.png');

// Icon-only mark (just the "FF" glyph, no wordmark) — for tight spaces like
// a mobile header or a favicon-style badge where the full wordmark won't fit.
const LOGO_MARK_LIGHT = require('@/assets/brand/logo-mark-light.png');
const LOGO_MARK_DARK = require('@/assets/brand/logo-mark-dark.png');

interface Props {
  /** 'full' = icon + wordmark (default). 'mark' = icon only. */
  variant?: 'full' | 'mark';
  height?: number;
  style?: StyleProp<ImageStyle>;
}

export default function Logo({ variant = 'full', height = 36, style }: Props) {
  const { isDark } = useTheme();

  const source =
    variant === 'mark'
      ? isDark
        ? LOGO_MARK_DARK
        : LOGO_MARK_LIGHT
      : isDark
      ? LOGO_FULL_DARK
      : LOGO_FULL_LIGHT;

  // Each exported asset has a slightly different aspect ratio (the dark
  // variants have extra transparent padding around them for the glow
  // effect), so each one gets its own ratio rather than sharing a single
  // guess — otherwise the swap would visibly stretch the mark.
  const aspectRatio =
    variant === 'mark'
      ? isDark
        ? 310 / 389
        : 250 / 329
      : isDark
      ? 776 / 635
      : 680 / 539;

  return (
    <Image
      source={source}
      resizeMode="contain"
      style={[{ height, width: height * aspectRatio }, style]}
    />
  );
}
