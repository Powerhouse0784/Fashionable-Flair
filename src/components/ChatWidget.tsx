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
}

export default function ChatWidget({ hidden }: Props) {
  const { colors } = useTheme();
  const isWide = useIsWideScreen();
  const tabBarHeight = useTabBarHeight();
  const styles = makeStyles(colors, tabBarHeight);

  const [open, setOpen] = useState(false);
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
      const animations = [dot1, dot2, dot3].map((dot, index) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(index * 200),
            Animated.spring(dot, {
              toValue: 1,
              useNativeDriver: true,
              speed: 12,
              bounciness: 8,
            }),
            Animated.delay(400),
            Animated.spring(dot, {
              toValue: 0,
              useNativeDriver: true,
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
    fabNarrow: { bottom: tabBarHeight + 16, right: 20 },
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