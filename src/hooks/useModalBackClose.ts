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
// Shared across every mounted instance of this hook (module-level, not per
// call) — `window.history`/`popstate` is one global browser API, so when
// two of these modals are stacked (e.g. the avatar picker opened from
// inside Edit Profile), coordinating which one a given event is "for"
// has to happen at that same global level.
//
// `modalStack` tracks which of the currently-open modals is on top, so a
// real back-press only ever closes the topmost one — not every modal that
// happens to be mounted. Without this, pressing back once with two modals
// open fired a `popstate` that EVERY listener received, closing both at
// once instead of just the top sheet.
//
// `suppressNextPopstate` fixes the bug this hook actually shipped with:
// closing the INNER modal via its own "Done"/X/selection (not a real
// back-press) runs this cleanup, which calls `history.back()` to undo that
// modal's own earlier pushState and keep history tidy. That call still
// fires a real `popstate` event — and the OUTER modal (Edit Profile) was
// still mounted with its own listener still attached, so it received that
// echo and closed itself too, discarding whatever hadn't been saved yet
// (the picked avatar, in this case) before "Save Changes" was ever
// pressed. This flag tells every listener "this one doesn't count."
let modalStack: number[] = [];
let nextModalId = 1;
let suppressNextPopstate = false;

export function useModalBackClose(visible: boolean, onClose: () => void) {
  const idRef = useRef<number | null>(null);
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
      const id = nextModalId++;
      idRef.current = id;
      modalStack.push(id);
      window.history.pushState({ __modalBackClose: true, id }, '');
      pushedHistoryRef.current = true;

      const handlePopState = () => {
        if (suppressNextPopstate) {
          // Another modal's own cleanup caused this pop, not a real
          // back-press — it already closed itself; nobody else should.
          suppressNextPopstate = false;
          return;
        }
        if (modalStack[modalStack.length - 1] !== id) {
          // Not the topmost modal — a real back-press closes the one on
          // top first, same as pressing back in a normal navigation stack.
          return;
        }
        modalStack = modalStack.filter((x) => x !== id);
        pushedHistoryRef.current = false;
        onCloseRef.current();
      };
      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
        modalStack = modalStack.filter((x) => x !== id);
        if (pushedHistoryRef.current) {
          // Closed some other way (X, backdrop tap, made a selection) while
          // our extra history entry is still sitting there unused — remove
          // it so a later real back-press doesn't appear to do nothing.
          pushedHistoryRef.current = false;
          suppressNextPopstate = true;
          window.history.back();
        }
      };
    }

    return undefined;
  }, [visible]);
}
