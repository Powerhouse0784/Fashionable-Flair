import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { APK_DOWNLOAD_URL } from '@/config/socialLinks';

interface Props {
  style?: object;
}

const RESET_DELAY_MS = 2500;

/**
 * "Download App" button — web only (the native app obviously doesn't need
 * a way to download itself). Triggers a real file download rather than
 * navigating to the APK's URL, and disables itself briefly right after
 * tapping so it can't be mashed into firing several downloads at once,
 * re-enabling once the browser has had time to actually start the
 * download.
 */
export default function DownloadAppButton({ style }: Props) {
  const { colors } = useTheme();
  const [downloading, setDownloading] = useState(false);
  const styles = makeStyles(colors);

  if (Platform.OS !== 'web') return null;

  const handlePress = () => {
    if (downloading) return;
    setDownloading(true);

    // A plain navigation to the APK URL would just open/replace the page in
    // some browsers instead of downloading; an anchor with the `download`
    // attribute reliably triggers a save-file prompt instead.
    const link = document.createElement('a');
    link.href = APK_DOWNLOAD_URL;
    link.download = 'FashionableFlair.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setDownloading(false), RESET_DELAY_MS);
  };

  return (
    <TouchableOpacity
      style={[styles.button, downloading && styles.buttonDisabled, style]}
      activeOpacity={0.85}
      onPress={handlePress}
      disabled={downloading}
      accessibilityRole="button"
      accessibilityLabel="Download the Fashionable Flair Android app"
    >
      <Ionicons name={downloading ? 'download' : 'logo-android'} size={18} color={colors.textInverse} />
      <Text style={styles.text}>{downloading ? 'Starting download…' : 'Download App'}</Text>
    </TouchableOpacity>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.textPrimary,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
    },
    buttonDisabled: { opacity: 0.6 },
    text: { ...typography.button, color: colors.textInverse, fontFamily: fonts.bodySemiBold },
  });
}
