import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useIsWideScreen } from '@/hooks/useResponsive';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { isSupabaseConfigured } from '@/services/supabaseClient';
import { sendChatMessage, ChatMessage } from '@/services/chatService';

const SUGGESTIONS = ['How do I place an order?', 'What\u2019s your return policy?', 'How can I contact you?'];

const WELCOME_MESSAGE: ChatMessage = {
  role: 'model',
  text:
    "Hi! I'm the Fashionable Flair assistant \u2014 ask me about our products, ordering, shipping, or anything else about the store.",
};

interface Props {
  /** True on the admin screens — this widget is for shoppers, not store
   *  management, and shouldn't float over the dashboard. Passed down from
   *  App.tsx via a navigation ref rather than useNavigationState() here,
   *  since this component is a sibling of the navigator tree, not a
   *  descendant of an actual screen — that hook would (and did) crash. */
  hidden?: boolean;
}

export default function ChatWidget({ hidden }: Props) {
  const { colors } = useTheme();
  const isWide = useIsWideScreen();
  // Shared with BottomTabNavigator via useTabBarHeight so the FAB always
  // clears the actual tab bar — computing this separately here (as before)
  // was exactly what let them drift out of sync when the tab bar's own
  // height changed.
  const tabBarHeight = useTabBarHeight();
  const styles = makeStyles(colors, tabBarHeight);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (open) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, open]);

  if (hidden) return null;

  const handleSend = async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || sending) return;

    const userMessage: ChatMessage = { role: 'user', text: messageText };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const reply = await sendChatMessage(messageText, nextMessages);
      setMessages((prev) => [...prev, { role: 'model', text: reply }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: 'model', text: err.message ?? 'Something went wrong.' }]);
    } finally {
      setSending(false);
    }
  };

  const ChatPanel = (
    <View style={[styles.panelBase, isWide && styles.panelWide]}>
      <View style={styles.panelHeader}>
        <View style={styles.panelHeaderLeft}>
          <View style={styles.avatarDot}>
            <Ionicons name="sparkles" size={14} color={colors.textInverse} />
          </View>
          <View>
            <Text style={styles.panelTitle}>Flair Assistant</Text>
            <Text style={styles.panelSubtitle}>Ask about products, orders & policies</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setOpen(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {!isSupabaseConfigured && (
        <View style={styles.warningBox}>
          <Ionicons name="warning-outline" size={14} color={colors.warning} />
          <Text style={styles.warningText}>Chat isn't configured yet — see CHATBOT_SETUP.md.</Text>
        </View>
      )}

      <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={{ paddingVertical: spacing.sm }}>
        {messages.map((msg, i) => (
          <View key={i} style={[styles.bubbleRow, msg.role === 'user' && styles.bubbleRowUser]}>
            <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleModel]}>
              <Text style={[styles.bubbleText, msg.role === 'user' && styles.bubbleTextUser]}>{msg.text}</Text>
            </View>
          </View>
        ))}
        {sending && (
          <View style={styles.bubbleRow}>
            <View style={[styles.bubble, styles.bubbleModel]}>
              <ActivityIndicator size="small" color={colors.textSecondary} />
            </View>
          </View>
        )}
        {messages.length === 1 && (
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => handleSend(s)}>
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a question..."
          placeholderTextColor={colors.textMuted}
          onSubmitEditing={() => handleSend()}
          editable={!sending}
        />
        <TouchableOpacity style={styles.sendButton} onPress={() => handleSend()} disabled={sending || !input.trim()}>
          <Ionicons name="arrow-up" size={18} color={colors.textInverse} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.fab, isWide ? styles.fabWide : styles.fabNarrow]}
        activeOpacity={0.85}
        onPress={() => setOpen(true)}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color={colors.textInverse} />
      </TouchableOpacity>

      {open &&
        (isWide ? (
          ChatPanel
        ) : (
          <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalBackdrop}
            >
              <SafeAreaView edges={['bottom']} style={styles.modalSheet}>
                {ChatPanel}
              </SafeAreaView>
            </KeyboardAvoidingView>
          </Modal>
        ))}
    </>
  );
}

function makeStyles(colors: ColorTheme, tabBarHeight: number) {
  return StyleSheet.create({
    fab: {
      position: 'absolute',
      width: 56,
      height: 56,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      ...(Platform.OS === 'web'
        ? ({ boxShadow: `0 4px 16px ${colors.shadow}`, cursor: 'pointer' } as any)
        : { shadowColor: colors.shadow, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 }),
    },
    fabWide: { bottom: 28, right: 28 },
    // Clears the actual tab bar height (matches BottomTabNavigator's own
    // math) plus a 16px gap, instead of a guessed fixed number that only
    // happened to work on some devices.
    fabNarrow: { bottom: tabBarHeight + 16, right: 20 },
    // Shared visual style, deliberately with NO position/size — the modal
    // sheet (narrow) and the anchored box (wide) size it completely
    // differently, and this used to hardcode the wide dimensions onto both,
    // which is what broke the mobile layout (a fixed 360×480 box floating
    // inside the modal instead of filling it).
    panelBase: {
      flex: 1,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    panelWide: {
      position: 'absolute',
      bottom: 96,
      right: 28,
      width: 360,
      height: 480,
      flex: 0,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      zIndex: 51,
      ...(Platform.OS === 'web' ? ({ boxShadow: `0 8px 32px ${colors.shadow}` } as any) : {}),
    },
    modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    modalSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      height: '80%',
      overflow: 'hidden',
    },
    panelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    panelHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    avatarDot: {
      width: 30,
      height: 30,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    panelTitle: { ...typography.bodySmall, fontFamily: fonts.bodySemiBold, color: colors.textPrimary },
    panelSubtitle: { ...typography.caption, color: colors.textMuted },
    warningBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.goldLight,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    warningText: { ...typography.caption, color: colors.textPrimary, flex: 1 },
    messages: { flex: 1, paddingHorizontal: spacing.md },
    bubbleRow: { flexDirection: 'row', marginBottom: spacing.sm },
    bubbleRowUser: { justifyContent: 'flex-end' },
    bubble: { maxWidth: '82%', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    bubbleModel: { backgroundColor: colors.surfaceAlt, borderTopLeftRadius: 2 },
    bubbleUser: { backgroundColor: colors.primary, borderTopRightRadius: 2 },
    bubbleText: { ...typography.bodySmall, color: colors.textPrimary, lineHeight: 19 },
    bubbleTextUser: { color: colors.textInverse },
    suggestions: { gap: spacing.xs, marginTop: spacing.xs },
    suggestionChip: {
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
    },
    suggestionText: { ...typography.caption, color: colors.textSecondary },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    input: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      ...typography.bodySmall,
      color: colors.textPrimary,
    },
    sendButton: {
      width: 36,
      height: 36,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
