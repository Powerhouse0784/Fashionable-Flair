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
// This is the actual bug this hook shipped with, found after two wrong
// guesses, so the reasoning is worth keeping in full:
//
// Closing the INNER modal via its own "Done"/X/selection (not a real
// back-press) used to run a cleanup that called `history.back()`, purely
// to undo that modal's own earlier pushState and keep history tidy for
// later. The problem: `history.back()` always fires a real `popstate`
// event, with no way to mark it as "this one's just me tidying up" — and
// the OUTER modal (Edit Profile) was still mounted with its own listener
// still attached, so it received that same event and closed itself too,
// discarding whatever hadn't been saved yet (the picked avatar) before
// "Save Changes" was ever pressed.
//
// The first fix attempt added a shared flag to mark "the next popstate
// doesn't count" right before calling history.back(). That still didn't
// hold up, because nothing about *looking* reliable in testing actually
// ruled out a genuine race: `history.back()` doesn't fire its popstate
// synchronously, and there's no hard guarantee about exactly when it
// lands relative to whatever the user does next — so the flag could, at
// least in principle, already be consumed or overwritten by the time the
// real event arrived. A counter (tracking *how many* are pending, not
// just whether one is) closed that gap but was still built on the same
// shaky foundation: suppressing an event we ourselves are about to cause,
// and hoping nothing else reads it first.
//
// The actual fix removes the race instead of out-guessing its timing:
// don't call `history.back()` while any other modal is still open to
// possibly misread the echo. `history.replaceState()` updates our own
// entry in place and — critically — never fires `popstate` at all, so an
// inner modal closing this way has nothing for a sibling to overhear in
// the first place. The one time it's actually safe to call
// `history.back()` is when the stack is empty right after we remove
// ourselves — nobody else is listening by then, so there's no one left to
// confuse, and real history stays accurate for wherever the user goes
// next.
let modalStack: number[] = [];
let nextModalId = 1;

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
          // our extra history entry is still sitting there unused.
          pushedHistoryRef.current = false;
          if (modalStack.length === 0) {
            // Nothing else is open/listening right now, so it's safe to
            // actually remove the entry — no one left to overhear it.
            window.history.back();
          } else {
            // Another modal is still open underneath this one. Neutralize
            // our entry in place instead of popping it — replaceState
            // never fires popstate, so its still-mounted listener has
            // nothing to mishear as its own close signal.
            window.history.replaceState({ __modalBackClose: false }, '');
          }
        }
      };
    }

    return undefined;
  }, [visible]);
}
