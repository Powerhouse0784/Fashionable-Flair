import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Linking, Platform, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useIsWideScreen } from '@/hooks/useResponsive';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { useScrollVisibility } from '@/context/ScrollVisibilityContext';
import ChatWidget from '@/components/ChatWidget';
import { WHATSAPP_NUMBER, WHATSAPP_DEFAULT_MESSAGE, INSTAGRAM_URL, SUPPORT_PHONE } from '@/config/socialLinks';

interface Props {
  hidden?: boolean;
  /** Extra clearance above the usual bottom offset, for screens with their
   * own taller sticky footer (e.g. Product Detail's "Buy Now" bar) that
   * the sidebar's default tab-bar-based spacing doesn't know about. */
  extraBottomOffset?: number;
}

const BUTTON_SIZE_WIDE = 52;
const MAIN_SIZE_NARROW = 58;
const HANDLE_SIZE = 26;
const SUB_SIZE_NARROW = 44;
const GAP = 12;
const STAGGER_MS = 45;
const PULSE_INTERVAL_MS = 9000;
const PULSE_DURATION_MS = 1100;

interface Action {
  key: string;
  icon: any;
  color: string;
  onPress: () => void;
  accessibilityLabel: string;
}

/**
 * Fixed bottom-right quick-contact control.
 *
 *  - Wide/desktop web: room isn't a problem, so all 4 actions (chat,
 *    WhatsApp, Instagram, call) stay visible at once as a simple vertical
 *    rail.
 *  - Narrow/mobile: chat is the main, always-tappable button — one tap
 *    opens the chat panel directly, with no menu step in the way. A small
 *    round "more options" handle sits attached to its corner, badge-style;
 *    tapping *that* reveals WhatsApp, Instagram and Call as a compact
 *    staggered stack above it.
 *
 * Extra polish on top of the base widget:
 *  - A gentle scale/fade entrance when it first mounts.
 *  - Hides itself while the person is actively scrolling down to read
 *    (and reappears the instant they scroll back up, or land near the top
 *    of the page) — the same pattern shopping apps use so a floating
 *    button never sits over content mid-scroll. Driven by
 *    ScrollVisibilityContext, which every main browsing screen reports
 *    its scroll position to.
 *  - A soft, occasional pulse ring around the chat button — not constant,
 *    just often enough to catch the eye — that stops for good the first
 *    time someone actually interacts with the widget.
 */
export default function QuickActionsSidebar({ hidden, extraBottomOffset = 0 }: Props) {
  const { colors } = useTheme();
  const isWide = useIsWideScreen();
  const tabBarHeight = useTabBarHeight();
  const scrollVisibility = useScrollVisibility();
  const [chatOpen, setChatOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleAnim = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const mountAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Gentle entrance the first time this mounts, so the widget arrives
  // instead of just popping into existence.
  useEffect(() => {
    Animated.spring(mountAnim, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 8 }).start();
  }, []);

  // A single soft pulse ring, repeating on a long interval, until the
  // person interacts with the widget for the first time.
  useEffect(() => {
    if (hasInteracted) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const runPulse = () => {
      if (cancelled) return;
      pulseAnim.setValue(0);
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: PULSE_DURATION_MS,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        if (!cancelled) timer = setTimeout(runPulse, PULSE_INTERVAL_MS);
      });
    };
    timer = setTimeout(runPulse, PULSE_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [hasInteracted]);

  const markInteracted = () => setHasInteracted(true);

  const setExpandedAnimated = (next: boolean) => {
    setExpanded(next);
    Animated.timing(handleAnim, {
      toValue: next ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const springs = itemAnims.map((v) =>
      Animated.spring(v, { toValue: next ? 1 : 0, useNativeDriver: true, speed: 20, bounciness: 9 })
    );
    Animated.stagger(STAGGER_MS, next ? springs : springs.slice().reverse()).start();
  };

  const handleWhatsApp = () =>
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_DEFAULT_MESSAGE)}`);
  const handleInstagram = () => Linking.openURL(INSTAGRAM_URL);
  const handleCall = () => Linking.openURL(`tel:${SUPPORT_PHONE}`);

  if (hidden) return null;

  const buttonShadow =
    Platform.OS === 'web'
      ? ({ boxShadow: `0 4px 14px ${colors.shadow}` } as any)
      : {
          shadowColor: colors.shadow,
          shadowOpacity: 0.4,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 6,
        };

  const secondaryActions: Action[] = [
    {
      key: 'call',
      icon: 'call',
      color: colors.gold,
      onPress: () => {
        markInteracted();
        setExpandedAnimated(false);
        handleCall();
      },
      accessibilityLabel: 'Call us',
    },
    {
      key: 'instagram',
      icon: 'logo-instagram',
      color: '#C1398E',
      onPress: () => {
        markInteracted();
        setExpandedAnimated(false);
        handleInstagram();
      },
      accessibilityLabel: 'Visit our Instagram',
    },
    {
      key: 'whatsapp',
      icon: 'logo-whatsapp',
      color: '#25D366',
      onPress: () => {
        markInteracted();
        setExpandedAnimated(false);
        handleWhatsApp();
      },
      accessibilityLabel: 'Message us on WhatsApp',
    },
  ];

  const openChat = () => {
    markInteracted();
    setChatOpen((v) => !v);
  };

  const pulseRingStyle = (size: number, align: 'left' | 'right') => ({
    position: 'absolute' as const,
    top: 0,
    ...(align === 'right' ? { right: 0 } : { left: 0 }),
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 2,
    borderColor: colors.primary,
    opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
    transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] }) }],
  });

  // ---- Wide / desktop web: simple always-visible vertical rail ----
  if (isWide) {
    const railHeight = BUTTON_SIZE_WIDE * 4 + GAP * 3;
    const wideBottomOffset = 28 + railHeight + 16 + extraBottomOffset;
    const scrollTranslate = scrollVisibility.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

    return (
      <>
        <Animated.View
          style={[
            styles.rail,
            { bottom: 28 + extraBottomOffset, right: 28, pointerEvents: 'box-none' },
            {
              opacity: Animated.multiply(mountAnim, scrollVisibility),
              transform: [
                { translateY: mountAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
                { translateY: scrollTranslate },
              ],
            },
          ]}
        >
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            {!hasInteracted && <Animated.View pointerEvents="none" style={pulseRingStyle(BUTTON_SIZE_WIDE, 'left')} />}
            <RailButton
              icon={chatOpen ? 'close' : 'chatbubbles'}
              color={colors.primary}
              size={BUTTON_SIZE_WIDE}
              shadow={buttonShadow}
              onPress={openChat}
              accessibilityLabel="Chat with us"
            />
          </View>
          {secondaryActions
            .slice()
            .reverse()
            .map((a) => (
              <RailButton
                key={a.key}
                icon={a.icon}
                color={a.color}
                size={BUTTON_SIZE_WIDE}
                shadow={buttonShadow}
                onPress={a.onPress}
                accessibilityLabel={a.accessibilityLabel}
              />
            ))}
        </Animated.View>
        <ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} wideBottomOffset={wideBottomOffset} />
      </>
    );
  }

  // ---- Narrow / mobile: chat button up front + a small "more" handle ----
  const handleRotate = handleAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const bottom = tabBarHeight + 16 + extraBottomOffset;
  const scrollTranslateNarrow = scrollVisibility.interpolate({ inputRange: [0, 1], outputRange: [90, 0] });

  return (
    <>
      <Animated.View
        style={[
          styles.wrap,
          { bottom, right: 16, pointerEvents: 'box-none' },
          {
            opacity: Animated.multiply(mountAnim, scrollVisibility),
            transform: [
              { scale: mountAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
              { translateY: scrollTranslateNarrow },
            ],
          },
        ]}
      >
        {secondaryActions.map((a, i) => {
          const distance = (SUB_SIZE_NARROW + GAP) * (i + 1) + MAIN_SIZE_NARROW - SUB_SIZE_NARROW;
          const v = itemAnims[i];
          const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] });
          return (
            <Animated.View
              key={a.key}
              style={[
                styles.subButtonWrap,
                {
                  opacity: v,
                  transform: [{ translateY }, { scale: v }],
                  pointerEvents: expanded ? 'auto' : 'none',
                },
              ]}
            >
              <RailButton
                icon={a.icon}
                color={a.color}
                size={SUB_SIZE_NARROW}
                shadow={buttonShadow}
                onPress={a.onPress}
                accessibilityLabel={a.accessibilityLabel}
              />
            </Animated.View>
          );
        })}

        {!hasInteracted && <Animated.View pointerEvents="none" style={pulseRingStyle(MAIN_SIZE_NARROW, 'right')} />}

        {/* Main chat button — always front and center, one tap opens chat
            directly, completely independent of the expand/collapse state. */}
        <TouchableOpacity
          style={[
            styles.button,
            {
              width: MAIN_SIZE_NARROW,
              height: MAIN_SIZE_NARROW,
              borderRadius: MAIN_SIZE_NARROW / 2,
              backgroundColor: colors.primary,
            },
            buttonShadow,
          ]}
          activeOpacity={0.85}
          onPress={openChat}
          accessibilityRole="button"
          accessibilityLabel="Chat with us"
        >
          <Ionicons name={chatOpen ? 'close' : 'chatbubble-ellipses'} size={26} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Small "more options" handle, badge-style, attached to the main
            button's corner. Tapping it — and only it — reveals WhatsApp /
            Instagram / Call. */}
        <TouchableOpacity
          style={[
            styles.handle,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
            buttonShadow,
          ]}
          activeOpacity={0.8}
          onPress={() => {
            markInteracted();
            setExpandedAnimated(!expanded);
          }}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Hide more contact options' : 'Show more contact options'}
        >
          <Animated.View style={{ transform: [{ rotate: handleRotate }] }}>
            <Ionicons name="chevron-up" size={15} color={colors.primary} />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      <ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}

function RailButton({
  icon,
  color,
  size,
  shadow,
  onPress,
  accessibilityLabel,
}: {
  icon: any;
  color: string;
  size: number;
  shadow: object;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        shadow,
        Platform.OS === 'web' && ({ cursor: 'pointer' } as any),
      ]}
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name={icon} size={Math.round(size * 0.46)} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  rail: {
    position: 'absolute',
    flexDirection: 'column',
    alignItems: 'center',
    gap: GAP,
    zIndex: 50,
  },
  wrap: {
    position: 'absolute',
    width: MAIN_SIZE_NARROW + 10,
    height: MAIN_SIZE_NARROW,
    alignItems: 'flex-end',
    zIndex: 50,
  },
  subButtonWrap: {
    position: 'absolute',
    bottom: 0,
    right: (MAIN_SIZE_NARROW - SUB_SIZE_NARROW) / 2,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    position: 'absolute',
    top: -8,
    right: -6,
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
