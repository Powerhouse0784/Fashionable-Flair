import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const ICONS: Record<ToastType, string> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const toastColors: Record<ToastType, string> = {
    success: colors.success,
    error: colors.danger,
    info: colors.primary,
  };
  const [toast, setToast] = useState<Toast | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const useNative = Platform.OS !== 'web';

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast({ id: Date.now(), message, type });
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: useNative }).start();
    timeoutRef.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: useNative }).start(() => setToast(null));
    }, 2800);
  }, [opacity, useNative]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <SafeAreaView style={[styles.wrap, { pointerEvents: 'none' }]} edges={['top']}>
          <Animated.View style={[styles.toast, { opacity, borderColor: toastColors[toast.type] }]}>
            <Ionicons name={ICONS[toast.type] as any} size={18} color={toastColors[toast.type]} />
            <Text style={styles.text}>{toast.message}</Text>
          </Animated.View>
        </SafeAreaView>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    wrap: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 100,
    },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      marginTop: spacing.sm,
      maxWidth: 420,
      ...(Platform.OS === 'web'
        ? ({ boxShadow: `0 4px 16px ${colors.shadow}` } as any)
        : {
            shadowColor: colors.shadow,
            shadowOpacity: 0.4,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          }),
    },
    text: { ...typography.bodySmall, color: colors.textPrimary, fontFamily: fonts.bodySemiBold, flexShrink: 1 },
  });
}
