import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@/theme';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time crashes anywhere below it and shows a recoverable
 * screen instead of a blank white page. Before this existed, any uncaught
 * error (a bad prop, a null reference, a third-party library quirk)
 * silently produced "nothing works" with zero way to tell what broke —
 * this surfaces the actual error message so it's diagnosable, and gives
 * the person a working "Reload" action instead of a dead end.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, info.componentStack);
  }

  handleReload = () => {
    if (Platform.OS === 'web') {
      (globalThis as any).location?.reload();
    } else {
      this.setState({ error: null });
    }
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.wrap}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.iconWrap}>
            <Ionicons name="alert-circle" size={32} color={colors.textInverse} />
          </View>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            The app hit an unexpected error. Reloading usually fixes it — if it keeps happening, the
            details below will help track down why.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReload} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Reload</Text>
          </TouchableOpacity>
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{this.state.error.message}</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 420,
  },
  button: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  buttonText: { ...typography.button, color: colors.textInverse },
  errorBox: {
    marginTop: spacing.xl,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    maxWidth: 480,
    width: '100%',
  },
  errorText: { ...typography.bodySmall, color: colors.textSecondary, fontFamily: Platform.select({ web: 'monospace', default: undefined }) },
});
