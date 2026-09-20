import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { sendBroadcastNotification } from '@/services/notifyService';
import { useToast } from '@/context/ToastContext';
import { hapticSuccess } from '@/utils/haptics';
import { goBackOrTo } from '@/utils/navigation';
import { confirmAsync, alertInfo } from '@/utils/confirm';
import Container from '@/components/Container';

const TITLE_LIMIT = 120;
const BODY_LIMIT = 500;

/**
 * Sends a push notification to every device that has the native app
 * installed and has granted notification permission — new arrivals,
 * sales, restocks, whatever's worth a nudge. Composable from web too
 * (an admin can be on their browser while targeting phone users) — only
 * the notifications themselves are native-only, not this screen.
 */
export default function AdminNotifyScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      alertInfo('Missing info', 'Enter both a title and a message.');
      return;
    }
    const confirmed = await confirmAsync(
      'Send to everyone?',
      'This goes out immediately to every device with the app installed. This can\u2019t be undone.',
      'Send'
    );
    if (confirmed) doSend();
  };

  const doSend = async () => {
    setSending(true);
    try {
      const result = await sendBroadcastNotification(title.trim(), body.trim());
      hapticSuccess();
      showToast(`Sent to ${result.sentTo} of ${result.totalDevices} devices`, 'success');
      setTitle('');
      setBody('');
    } catch (e: any) {
      alertInfo('Couldn\u2019t send', e?.message || 'Something went wrong.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => goBackOrTo(navigation, 'AdminDashboard')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notify Everyone</Text>
          <View style={{ width: 24 }} />
        </View>

        <Container style={{ flex: 1 }}>
          <Text style={styles.hint}>
            Sends a push notification to every phone with the Fashionable Flair app installed — new arrivals, a
            sale, a restock, whatever's worth a nudge. Native app only (no web visitors are reached).
          </Text>

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={(v) => setTitle(v.slice(0, TITLE_LIMIT))}
            placeholder="New Arrivals Are Here! ✨"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.counter}>{title.length}/{TITLE_LIMIT}</Text>

          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={body}
            onChangeText={(v) => setBody(v.slice(0, BODY_LIMIT))}
            placeholder="Check out this week's new pieces — fresh earrings, pendants and more."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
          />
          <Text style={styles.counter}>{body.length}/{BODY_LIMIT}</Text>

          <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={sending} activeOpacity={0.85}>
            {sending ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <>
                <Ionicons name="paper-plane-outline" size={18} color={colors.textInverse} />
                <Text style={styles.sendButtonText}>Send to All Devices</Text>
              </>
            )}
          </TouchableOpacity>
        </Container>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: { ...typography.h3, color: colors.textPrimary },
    hint: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.lg, lineHeight: 19 },
    label: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase', marginTop: spacing.lg, marginBottom: spacing.xs },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      color: colors.textPrimary,
      backgroundColor: colors.surface,
      ...typography.body,
    },
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    counter: { ...typography.caption, color: colors.textMuted, textAlign: 'right', marginTop: spacing.xs },
    sendButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      marginTop: spacing.xl,
    },
    sendButtonText: { ...typography.button, color: colors.textInverse },
  });
}
