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
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radius, ColorTheme } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { fonts } from '@/hooks/useAppFonts';
import { useIsWideScreen } from '@/hooks/useResponsive';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { isSupabaseConfigured } from '@/services/supabaseClient';
import { sendChatMessage, ChatMessage, checkChatbotHealth } from '@/services/chatService';

const SUGGESTIONS = ['How do I place an order?', 'What\u2019s your return policy?', 'How can I contact you?'];

const WELCOME_MESSAGE: ChatMessage = {
  role: 'model',
  text:
    "Hi! I'm the Fashionable Flair assistant \u2014 ask me about our products, ordering, shipping, or anything else about the store.",
};

interface Props {
  hidden?: boolean;
  /**
   * Controlled mode: pass `open` + `onClose` when this widget is being
   * driven by an external trigger (e.g. QuickActionsSidebar's chat button)
   * so there's a single source of truth for whether the panel is visible.
   * Omit both to fall back to the old self-contained behavior (own FAB,
   * own open/close state) — kept for anything that still mounts
   * ChatWidget on its own.
   */
  open?: boolean;
  onClose?: () => void;
  /** How far above its default bottom-right corner the floating panel
   * should sit on wide screens, so it can clear a taller trigger (like the
   * sidebar rail) instead of overlapping it. Ignored on narrow screens,
   * where the panel is always a full bottom sheet. */
  wideBottomOffset?: number;
}

export default function ChatWidget({ hidden, open: openProp, onClose, wideBottomOffset }: Props) {
  const { colors } = useTheme();
  const isWide = useIsWideScreen();
  const tabBarHeight = useTabBarHeight();
  const { height: windowHeight } = useWindowDimensions();

  // The panel used to have a fixed 480px height regardless of the actual
  // browser window size. Combined with a trigger that can sit fairly high
  // up (the quick-actions rail), that fixed height was taller than some
  // laptop viewports could fit below wideBottomOffset — pushing the panel's
  // top edge above y=0, i.e. "off the top of the screen". Capping it to
  // whatever room is actually available (with a sane floor/ceiling) means
  // it always fits, however short the window is.
  const wideTopMargin = 16;
  const minPanelHeight = 320;
  const maxPanelHeight = 480;
  // If even the minimum panel height wouldn't fit below the requested
  // bottom offset (a very short/laptop-with-devtools-open window), pull
  // the offset down instead of letting the panel clip above y=0 — a little
  // overlap with the rail's lowest icon beats the panel vanishing off the
  // top of the screen.
  const requestedBottom = wideBottomOffset ?? 96;
  const wideBottom = Math.max(16, Math.min(requestedBottom, windowHeight - minPanelHeight - wideTopMargin));
  const panelHeightWide = Math.max(minPanelHeight, Math.min(maxPanelHeight, windowHeight - wideBottom - wideTopMargin));

  const styles = makeStyles(colors, tabBarHeight, wideBottom, panelHeightWide);

  const isControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? (openProp as boolean) : internalOpen;
  const closePanel = () => {
    if (onClose) onClose();
    if (!isControlled) setInternalOpen(false);
  };
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [chatStatus, setChatStatus] = useState<{ isAvailable: boolean; message: string } | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  
  // Animated pulse for loading dots
  const [dot1] = useState(new Animated.Value(0));
  const [dot2] = useState(new Animated.Value(0));
  const [dot3] = useState(new Animated.Value(0));

  // Animated loading dots
  useEffect(() => {
    if (sending) {
      const useNativeDriverForDots = Platform.OS !== 'web';
      const animations = [dot1, dot2, dot3].map((dot, index) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(index * 200),
            Animated.spring(dot, {
              toValue: 1,
              useNativeDriver: useNativeDriverForDots,
              speed: 12,
              bounciness: 8,
            }),
            Animated.delay(400),
            Animated.spring(dot, {
              toValue: 0,
              useNativeDriver: useNativeDriverForDots,
              speed: 12,
              bounciness: 8,
            }),
          ])
        );
      });
      
      animations.forEach(anim => anim.start());
      
      return () => {
        animations.forEach(anim => anim.stop());
      };
    }
  }, [sending]);

  // Check chatbot health on mount
  useEffect(() => {
    const checkHealth = async () => {
      const status = await checkChatbotHealth();
      setChatStatus(status);
    };
    checkHealth();
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, open]);

  if (hidden) return null;

  // FIX: Add optimistic response for faster feel
const handleSend = async (text?: string) => {
  const messageText = (text ?? input).trim();
  if (!messageText || sending) return;

  const userMessage: ChatMessage = { role: 'user', text: messageText };
  const nextMessages = [...messages, userMessage];
  setMessages(nextMessages);
  setInput('');
  setSending(true);

  // FIX: Show "typing" immediately
  setTimeout(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, 50);

  try {
    const reply = await sendChatMessage(messageText, nextMessages);
    setMessages((prev) => {
      const lastMessage = prev[prev.length - 1];
      if (lastMessage?.role === 'model' && lastMessage.text.startsWith('❌')) {
        return [...prev.slice(0, -1), { role: 'model', text: reply }];
      }
      return [...prev, { role: 'model', text: reply }];
    });
  } catch (err: any) {
    let errorMsg = err.message ?? 'Something went wrong.';
    if (errorMsg.includes('timeout')) {
      errorMsg = '⏳ Taking too long — please try again.';
    } else if (errorMsg.includes('Network')) {
      errorMsg = '📡 Network error — check connection.';
    } else if (errorMsg.includes('configured')) {
      errorMsg = '⚙️ Chatbot not configured yet.';
    }
    setMessages((prev) => [...prev, { role: 'model', text: `❌ ${errorMsg}` }]);
  } finally {
    setSending(false);
  }
};

  // Retry last message
  const handleRetry = () => {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (lastUserMessage) {
      // Remove the last error message
      setMessages(prev => prev.slice(0, -1));
      handleSend(lastUserMessage.text);
    }
  };

  // Loading dots animation component
  const LoadingDots = () => (
    <View style={styles.loadingDots}>
      <Animated.View style={[
        styles.loadingDot,
        {
          transform: [{
            scale: dot1.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1.2],
            }),
          }],
          opacity: dot1.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
          }),
        },
      ]} />
      <Animated.View style={[
        styles.loadingDot,
        {
          transform: [{
            scale: dot2.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1.2],
            }),
          }],
          opacity: dot2.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
          }),
        },
      ]} />
      <Animated.View style={[
        styles.loadingDot,
        {
          transform: [{
            scale: dot3.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1.2],
            }),
          }],
          opacity: dot3.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
          }),
        },
      ]} />
    </View>
  );

  const ChatPanel = (
    <View style={[styles.panelBase, isWide && styles.panelWide]}>
      <View style={styles.panelHeader}>
        <View style={styles.panelHeaderLeft}>
          <View style={styles.avatarDot}>
            <Ionicons name="sparkles" size={14} color={colors.textInverse} />
          </View>
          <View>
            <View style={styles.headerTitleRow}>
              <Text style={styles.panelTitle}>Flair Assistant</Text>
              {chatStatus && (
                <View style={[
                  styles.statusDot,
                  { backgroundColor: chatStatus.isAvailable ? colors.success : colors.danger }
                ]} />
              )}
            </View>
            <Text style={styles.panelSubtitle}>
              {chatStatus?.isAvailable ? 'Online' : chatStatus?.message || 'Ask about products, orders & policies'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={closePanel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
        {messages.map((msg, i) => {
          const isError = msg.role === 'model' && msg.text.startsWith('❌');
          return (
            <View key={i} style={[styles.bubbleRow, msg.role === 'user' && styles.bubbleRowUser]}>
              <View style={[
                styles.bubble,
                msg.role === 'user' ? styles.bubbleUser : styles.bubbleModel,
                isError && styles.bubbleError,
              ]}>
                <Text style={[
                  styles.bubbleText,
                  msg.role === 'user' && styles.bubbleTextUser,
                  isError && styles.bubbleTextError,
                ]}>{msg.text}</Text>
                {isError && (
                  <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
                    <Ionicons name="refresh-outline" size={14} color={colors.primary} />
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
        {sending && (
          <View style={styles.bubbleRow}>
            <View style={[styles.bubble, styles.bubbleModel, styles.loadingBubble]}>
              <LoadingDots />
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
          multiline
          numberOfLines={1}
        />
        <TouchableOpacity 
          style={[styles.sendButton, (!input.trim() || sending) && styles.sendButtonDisabled]} 
          onPress={() => handleSend()} 
          disabled={sending || !input.trim()}
        >
          <Ionicons name="arrow-up" size={18} color={colors.textInverse} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      {/* Own FAB only in uncontrolled mode — when a parent (like
          QuickActionsSidebar) supplies `open`, that parent owns the
          trigger button instead, so we don't end up with two chat
          buttons on screen. */}
      {!isControlled && (
        <TouchableOpacity
          style={[styles.fab, isWide ? styles.fabWide : styles.fabNarrow]}
          activeOpacity={0.85}
          onPress={() => setInternalOpen(true)}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color={colors.textInverse} />
        </TouchableOpacity>
      )}

      {open &&
        (isWide ? (
          ChatPanel
        ) : (
          <Modal visible={open} transparent animationType="slide" onRequestClose={closePanel}>
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

function makeStyles(colors: ColorTheme, tabBarHeight: number, wideBottomOffset: number, panelHeightWide: number) {
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
    fabNarrow: { bottom: tabBarHeight + 16, right: 20 },
    panelBase: {
      flex: 1,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    panelWide: {
      position: 'absolute',
      bottom: wideBottomOffset,
      right: 28,
      width: 360,
      height: panelHeightWide,
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
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
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
    bubble: { 
      maxWidth: '85%', 
      borderRadius: radius.md, 
      paddingHorizontal: spacing.md, 
      paddingVertical: spacing.sm,
    },
    bubbleModel: { backgroundColor: colors.surfaceAlt, borderTopLeftRadius: 2 },
    bubbleUser: { backgroundColor: colors.primary, borderTopRightRadius: 2 },
    bubbleError: { backgroundColor: colors.danger + '15', borderWidth: 1, borderColor: colors.danger },
    bubbleText: { ...typography.bodySmall, color: colors.textPrimary, lineHeight: 20 },
    bubbleTextUser: { color: colors.textInverse },
    bubbleTextError: { color: colors.danger },
    loadingBubble: {
      minHeight: 40,
      justifyContent: 'center',
    },
    loadingDots: {
      flexDirection: 'row',
      paddingHorizontal: spacing.xs,
      gap: 5,
      alignItems: 'center',
      minHeight: 30,
    },
    loadingDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
      padding: 4,
    },
    retryText: {
      ...typography.caption,
      color: colors.primary,
      fontFamily: fonts.bodySemiBold,
    },
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
      paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
      ...typography.bodySmall,
      color: colors.textPrimary,
      maxHeight: 100,
    },
    sendButton: {
      width: 36,
      height: 36,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
  });
}