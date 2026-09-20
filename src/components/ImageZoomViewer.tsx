import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  PanResponder,
  GestureResponderEvent,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  visible: boolean;
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const DOUBLE_TAP_WINDOW_MS = 280;

function distanceBetween(touches: GestureResponderEvent['nativeEvent']['touches']): number {
  const [a, b] = touches;
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
}

/**
 * A single zoomable photo: pinch with two fingers, drag to pan once
 * zoomed in, or double-tap to hop between 1x and a comfortable close-up.
 * Built on the core PanResponder API (no gesture-handler/reanimated
 * dependency) — deliberately self-contained per image so paging between
 * photos (the parent FlatList) and zoom gestures never fight each other.
 *
 * The tricky part, and worth explaining since it's easy to get subtly
 * wrong: at rest (1x), a single finger touching down must be left
 * completely alone so the parent FlatList's own native swipe-to-page
 * gesture can claim it — grabbing it here even briefly (the previous
 * version's onStartShouldSetPanResponder returning true unconditionally)
 * silently breaks paging, since only one gesture responder can own a
 * touch stream at a time. But a *second* finger joining mid-gesture (the
 * start of a pinch) needs to be claimed immediately and reliably even if
 * it lands a beat after the first — which is what the *Capture variants
 * below are for: they run before the normal claim negotiation and fire
 * again on every new touch, so the moment a touch count hits 2 they grab
 * it, regardless of how the gesture started. Once truly zoomed in (>1x),
 * single-finger touches ARE claimed immediately (for panning) — safe to
 * do since the parent disables its own scroll entirely at that point (see
 * `scrollEnabled={!zoomedIn}` below), so there's no competing gesture to
 * step on.
 */
function ZoomableImage({
  uri,
  width,
  height,
  onZoomChange,
}: {
  uri: string;
  width: number;
  height: number;
  onZoomChange: (zoomed: boolean) => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // Plain numbers mirroring the Animated.Values above — PanResponder math
  // needs to read "current" values synchronously every touch move, which
  // Animated.Value doesn't expose directly.
  const current = useRef({ scale: 1, x: 0, y: 0 });
  const gestureStart = useRef({ scale: 1, x: 0, y: 0, distance: 0, midX: 0, midY: 0 });
  const lastTap = useRef(0);

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const boundsFor = (s: number) => {
    // How far the image can pan before its edge would show background —
    // half the "extra" size the current zoom level adds beyond the frame.
    const extraW = Math.max(0, (width * s - width) / 2);
    const extraH = Math.max(0, (height * s - height) / 2);
    return { extraW, extraH };
  };

  const animateTo = (s: number, x: number, y: number) => {
    current.current = { scale: s, x, y };
    Animated.parallel([
      Animated.spring(scale, { toValue: s, useNativeDriver: Platform.OS !== 'web', speed: 20, bounciness: 4 }),
      Animated.spring(translateX, { toValue: x, useNativeDriver: Platform.OS !== 'web', speed: 20, bounciness: 4 }),
      Animated.spring(translateY, { toValue: y, useNativeDriver: Platform.OS !== 'web', speed: 20, bounciness: 4 }),
    ]).start();
    onZoomChange(s > 1.05);
  };

  const handleDoubleTap = (tapX: number, tapY: number) => {
    if (current.current.scale > 1) {
      animateTo(1, 0, 0);
      return;
    }
    // Zoom in centered roughly on where the person tapped, rather than
    // always snapping to the image's dead center.
    const { extraW, extraH } = boundsFor(DOUBLE_TAP_SCALE);
    const focusX = clamp((width / 2 - tapX) * (DOUBLE_TAP_SCALE - 1), -extraW, extraW);
    const focusY = clamp((height / 2 - tapY) * (DOUBLE_TAP_SCALE - 1), -extraH, extraH);
    animateTo(DOUBLE_TAP_SCALE, focusX, focusY);
  };

  // Tap detection (for double-tap-to-zoom-IN) lives here, on a plain
  // TouchableWithoutFeedback wrapping the image, completely separate from
  // the PanResponder below — since at 1x the PanResponder deliberately
  // never claims single-finger touches (see the big comment above), it
  // would never see a simple tap to detect a double-tap from in the first
  // place. Touchable's own lighter-weight tap handling coexists with the
  // parent FlatList's swipe far better than a manual responder claim would.
  const handlePress = (e: GestureResponderEvent) => {
    const now = Date.now();
    const { locationX, locationY } = e.nativeEvent;
    if (now - lastTap.current < DOUBLE_TAP_WINDOW_MS) {
      handleDoubleTap(locationX, locationY);
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: (e) => e.nativeEvent.touches.length === 2,
      onStartShouldSetPanResponder: (e) => e.nativeEvent.touches.length === 2 || current.current.scale > 1.01,
      onMoveShouldSetPanResponderCapture: (e) => e.nativeEvent.touches.length === 2,
      onMoveShouldSetPanResponder: (e) => e.nativeEvent.touches.length === 2 || current.current.scale > 1.01,

      onPanResponderGrant: (e) => {
        const touches = e.nativeEvent.touches;
        gestureStart.current = {
          scale: current.current.scale,
          x: current.current.x,
          y: current.current.y,
          distance: touches.length === 2 ? distanceBetween(touches) : 0,
          midX: touches.length === 2 ? (touches[0].pageX + touches[1].pageX) / 2 : 0,
          midY: touches.length === 2 ? (touches[0].pageY + touches[1].pageY) / 2 : 0,
        };

        const now = Date.now();
        if (touches.length === 1 && now - lastTap.current < DOUBLE_TAP_WINDOW_MS) {
          handleDoubleTap(touches[0].locationX, touches[0].locationY);
          lastTap.current = 0;
        } else if (touches.length === 1) {
          lastTap.current = now;
        }
      },

      onPanResponderMove: (e, gesture) => {
        const touches = e.nativeEvent.touches;

        if (touches.length === 2) {
          // Pinch: scale by how much the finger-to-finger distance has
          // changed since the gesture started.
          const newDistance = distanceBetween(touches);
          const rawScale = gestureStart.current.scale * (newDistance / (gestureStart.current.distance || newDistance));
          const nextScale = clamp(rawScale, 1, MAX_SCALE);
          const { extraW, extraH } = boundsFor(nextScale);
          const nextX = clamp(gestureStart.current.x, -extraW, extraW);
          const nextY = clamp(gestureStart.current.y, -extraH, extraH);
          scale.setValue(nextScale);
          translateX.setValue(nextX);
          translateY.setValue(nextY);
          current.current = { scale: nextScale, x: nextX, y: nextY };
          return;
        }

        if (current.current.scale > 1.01) {
          // Pan: only once zoomed in — at 1x, a single-finger drag is left
          // for the parent FlatList to treat as swipe-between-photos.
          const { extraW, extraH } = boundsFor(gestureStart.current.scale);
          const nextX = clamp(gestureStart.current.x + gesture.dx, -extraW, extraW);
          const nextY = clamp(gestureStart.current.y + gesture.dy, -extraH, extraH);
          translateX.setValue(nextX);
          translateY.setValue(nextY);
          current.current = { ...current.current, x: nextX, y: nextY };
        }
      },

      onPanResponderRelease: () => {
        // Pinched below 1x (or let go mid-pinch-out past the edge) —
        // settle back to a clean baseline instead of leaving it stuck
        // at an odd in-between scale.
        if (current.current.scale < 1.05) {
          animateTo(1, 0, 0);
        } else {
          onZoomChange(current.current.scale > 1.05);
        }
      },
    })
  ).current;

  return (
    <View style={{ width, height, overflow: 'hidden' }} {...panResponder.panHandlers}>
      <TouchableWithoutFeedback onPress={handlePress}>
        <Animated.View
          style={{
            width,
            height,
            transform: [{ translateX }, { translateY }, { scale }],
          }}
        >
          <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
}

/**
 * Full-screen photo viewer opened from the product gallery's zoom button.
 * Swipe between photos at normal zoom; once zoomed into one, paging locks
 * so a pan gesture doesn't accidentally flip to the next photo.
 */
export default function ImageZoomViewer({ visible, images, initialIndex, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const [zoomedIn, setZoomedIn] = useState(false);
  const listRef = useRef<FlatList<string>>(null);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          <FlatList
            ref={listRef}
            data={images}
            horizontal
            pagingEnabled
            scrollEnabled={!zoomedIn}
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialIndex}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            keyExtractor={(uri, i) => `${uri}-${i}`}
            renderItem={({ item }) => (
              <ZoomableImage uri={item} width={width} height={height} onZoomChange={setZoomedIn} />
            )}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)' },
  safe: { flex: 1 },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 16 : 8,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
