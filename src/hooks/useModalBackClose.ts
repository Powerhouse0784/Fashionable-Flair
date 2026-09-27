import { useEffect, useRef } from 'react';
import { BackHandler, Platform } from 'react-native';

/**
 * Makes a Modal/bottom-sheet play along with "back" the way people expect:
 * pressing it should close the topmost sheet first, not skip straight
 * through to whatever screen sits underneath (e.g. closing the avatar
 * picker should never also leave the Edit Profile screen).
 *
 * - Android: the hardware back button normally bubbles straight past a
 *   transparent RN Modal to the navigator underneath. This claims it while
 *   the modal is open and closes the modal instead.
 * - Web: a plain Modal has no entry of its own in browser history, so the
 *   browser's back button/edge-swipe navigates the page directly. This
 *   pushes one history entry while the modal is open, so that back closes
 *   the modal and only a second press actually leaves the page — and pops
 *   that entry again if the modal is closed some other way (an X button, a
 *   selection), so it never takes two presses later to make up for it.
 * - iOS: no hardware back button and this isn't part of the navigation
 *   stack, so there's nothing to intercept — the effect is a no-op.
 *
 * Usage: call it unconditionally near the top of the modal component,
 * passing its own `visible` and `onClose` — nothing else changes.
 */
export function useModalBackClose(visible: boolean, onClose: () => void) {
  const pushedHistoryRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!visible) return;

    if (Platform.OS === 'android') {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        onCloseRef.current();
        return true; // we handled it — don't also pop the navigator underneath
      });
      return () => sub.remove();
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.history.pushState({ __modalBackClose: true }, '');
      pushedHistoryRef.current = true;

      const handlePopState = () => {
        pushedHistoryRef.current = false;
        onCloseRef.current();
      };
      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
        if (pushedHistoryRef.current) {
          // Closed some other way (X, backdrop tap, made a selection) while
          // our extra history entry is still sitting there unused — remove
          // it so a later real back-press doesn't appear to do nothing.
          pushedHistoryRef.current = false;
          window.history.back();
        }
      };
    }

    return undefined;
  }, [visible]);
}
