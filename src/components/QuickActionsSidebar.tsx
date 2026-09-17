import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Linking, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useIsWideScreen } from '@/hooks/useResponsive';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import ChatWidget from '@/components/ChatWidget';
import { WHATSAPP_NUMBER, WHATSAPP_DEFAULT_MESSAGE, INSTAGRAM_URL, SUPPORT_PHONE } from '@/config/socialLinks';

interface Props {
  hidden?: boolean;
}

const BUTTON_SIZE_WIDE = 52;
const MAIN_SIZE_NARROW = 54;
const SUB_SIZE_NARROW = 44;
const GAP = 10;

interface Action {
  key: string;
  icon: any;
  color: string;
  onPress: () => void;
  accessibilityLabel: string;
}

/**
 * Fixed bottom-right quick-contact control, with two different shapes:
 *
 *  - Wide/desktop web: room isn't a problem, so all 4 actions (chat,
 *    WhatsApp, Instagram, call) stay visible at once as a simple vertical
 *    rail, same as before.
 *  - Narrow/mobile: a single collapsed FAB by default (so it never sits
 *    over product cards or the tab bar), which expands into a small
 *    speed-dial stack of the other 3 actions on tap and collapses again
 *    after a pick — the standard mobile pattern for "several floating
 *    actions" instead of permanently covering the screen.
 */
export default function QuickActionsSidebar({ hidden }: Props) {
  const { colors } = useTheme();
  const isWide = useIsWideScreen();
  const tabBarHeight = useTabBarHeight();
  const [chatOpen, setChatOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: expanded ? 1 : 0,
      useNativeDriver: true,
      speed: 18,
      bounciness: 6,
    }).start();
  }, [expanded]);

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
        setExpanded(false);
        handleCall();
      },
      accessibilityLabel: 'Call us',
    },
    {
      key: 'instagram',
      icon: 'logo-instagram',
      color: '#C1398E',
      onPress: () => {
        setExpanded(false);
        handleInstagram();
      },
      accessibilityLabel: 'Visit our Instagram',
    },
    {
      key: 'whatsapp',
      icon: 'logo-whatsapp',
      color: '#25D366',
      onPress: () => {
        setExpanded(false);
        handleWhatsApp();
      },
      accessibilityLabel: 'Message us on WhatsApp',
    },
  ];

  // ---- Wide / desktop web: simple always-visible vertical rail ----
  if (isWide) {
    const railHeight = BUTTON_SIZE_WIDE * 4 + GAP * 3;
    const wideBottomOffset = 28 + railHeight + 16;

    return (
      <>
        <View style={[styles.rail, { bottom: 28, right: 28, pointerEvents: 'box-none' }]}>
          <RailButton
            icon={chatOpen ? 'close' : 'chatbubble-ellipses'}
            color={colors.primary}
            size={BUTTON_SIZE_WIDE}
            shadow={buttonShadow}
            onPress={() => setChatOpen((v) => !v)}
            accessibilityLabel="Chat with us"
          />
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
        </View>
        <ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} wideBottomOffset={wideBottomOffset} />
      </>
    );
  }

  // ---- Narrow / mobile: collapsed FAB that expands into a speed-dial ----
  const mainRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '135deg'] });

  return (
    <>
      <View style={[styles.rail, { bottom: tabBarHeight + 16, right: 16, pointerEvents: 'box-none' }]}>
        {secondaryActions.map((a, i) => {
          // Stack each secondary button just above the previous one, sliding
          // up + fading in together as `anim` goes 0 -> 1, so collapsed
          // state has zero footprint beyond the single main FAB.
          const distance = (SUB_SIZE_NARROW + GAP) * (i + 1);
          const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] });
          return (
            <Animated.View
              key={a.key}
              style={[
                styles.subButtonWrap,
                {
                  opacity: anim,
                  transform: [{ translateY }, { scale: anim }],
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
          onPress={() => setExpanded((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Close quick actions' : 'Quick contact options'}
        >
          <Animated.View style={{ transform: [{ rotate: mainRotate }] }}>
            <Ionicons name="add" size={26} color="#FFFFFF" />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Dedicated chat trigger: a small pill just left of the main FAB so
          chat stays one tap away without being buried inside the
          expand/collapse flow. */}
      <TouchableOpacity
        style={[
          styles.chatPill,
          { bottom: tabBarHeight + 16, right: 16 + MAIN_SIZE_NARROW + GAP },
          { backgroundColor: colors.surface, borderColor: colors.border },
          buttonShadow,
        ]}
        activeOpacity={0.85}
        onPress={() => {
          setExpanded(false);
          setChatOpen((v) => !v);
        }}
        accessibilityRole="button"
        accessibilityLabel="Chat with us"
      >
        <Ionicons name={chatOpen ? 'close' : 'chatbubble-ellipses'} size={22} color={colors.primary} />
      </TouchableOpacity>

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
  subButtonWrap: {
    position: 'absolute',
    bottom: 0,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatPill: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
});
