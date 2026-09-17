import { LogBox } from 'react-native';

/**
 * "Cannot record touch end without a touch start" is a long-standing,
 * well-documented internal quirk in React Native Web's touch-responder
 * bookkeeping (not a bug in this app) — it fires on certain overlapping or
 * nested touchable layouts in dev mode and is harmless: it doesn't affect
 * taps, gestures, or anything the person actually sees. There's no app-code
 * fix for it since it originates inside RNWeb itself, so this narrowly
 * silences just that one message (and nothing else) rather than letting it
 * clutter the terminal on every rapid scroll/tap.
 *
 * Deliberately narrow: only this one exact, known-benign string is
 * filtered. Every other warning or error still prints normally.
 */
const IGNORED_WARNING_PATTERNS = ['Cannot record touch end without a touch start'];

function matchesIgnored(message: unknown): boolean {
  return typeof message === 'string' && IGNORED_WARNING_PATTERNS.some((pattern) => message.includes(pattern));
}

const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (matchesIgnored(args[0])) return;
  originalWarn(...(args as []));
};

// Also covers the native on-device LogBox overlay (Android/iOS), where
// warnings don't go through the terminal at all.
LogBox.ignoreLogs(IGNORED_WARNING_PATTERNS);
