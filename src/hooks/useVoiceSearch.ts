import { useCallback, useEffect, useRef, useState } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';

interface UseVoiceSearchOptions {
  /** Called on every partial/interim transcript so the input can live-update. */
  onResult: (transcript: string) => void;
  /** Called once with the final transcript when the user stops speaking. */
  onFinalResult: (transcript: string) => void;
  /** BCP-47 locale for recognition. */
  lang?: string;
}

type SpeechEvent = { results?: { transcript: string }[]; isFinal?: boolean; error?: string };
type SpeechSubscription = { remove: () => void };
interface SpeechRecognitionModule {
  isRecognitionAvailable?: () => boolean;
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  start: (options: { lang: string; interimResults: boolean; continuous: boolean; maxAlternatives: number }) => void;
  stop: () => void;
  addListener: (eventName: string, listener: (event: SpeechEvent) => void) => SpeechSubscription;
}

/**
 * `expo-speech-recognition` ships native code, so the module only exists
 * inside a dev/production build made with the config plugin (EAS build,
 * `expo run:android`/`expo run:ios`). Expo Go's binary never contains it —
 * and critically, that package resolves its native handle with
 * `requireNativeModule(...)` at module-evaluation time, which throws
 * synchronously the moment the module is loaded, not when a function on it
 * is called. A top-level `import` of the package therefore crashes the
 * whole app in Expo Go before any of our own try/catch can run (that's the
 * "[runtime not ready]: Cannot find native module" red screen).
 *
 * The fix is to never statically import it. Instead, resolve it lazily via
 * `require(...)` inside a try/catch, and only attempt that at all outside
 * Expo Go — so Expo Go never touches the package and just reports the
 * feature as unsupported (the mic button hides itself, see SearchScreen),
 * while a real dev/preview/production build resolves and uses it normally.
 */
let cachedModule: SpeechRecognitionModule | null | undefined;
function getSpeechModule(): SpeechRecognitionModule | null {
  if (cachedModule !== undefined) return cachedModule;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    // Running inside the plain Expo Go app — never linked, don't even try.
    cachedModule = null;
    return cachedModule;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('expo-speech-recognition');
    cachedModule = (mod?.ExpoSpeechRecognitionModule as SpeechRecognitionModule) ?? null;
  } catch {
    // Not linked in this particular build either (e.g. a stale dev client
    // built before the plugin was added) — same graceful fallback.
    cachedModule = null;
  }
  return cachedModule;
}

/**
 * Unified voice-search controller — same API drives the native
 * SpeechRecognizer on Android, SFSpeechRecognizer on iOS, and the browser's
 * SpeechRecognition on web. Reports `isSupported: false` whenever the
 * native module isn't available (Expo Go, or a build made without the
 * plugin) so the mic button can quietly hide instead of crashing.
 */
export function useVoiceSearch({ onResult, onFinalResult, lang = 'en-IN' }: UseVoiceSearchOptions) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashError = useCallback((message: string) => {
    setError(message);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 3500);
  }, []);

  useEffect(() => {
    const mod = getSpeechModule();
    if (!mod) {
      setIsSupported(false);
      return;
    }
    try {
      const available = mod.isRecognitionAvailable?.();
      setIsSupported(available !== false);
    } catch {
      setIsSupported(false);
    }
    return () => {
      if (errorTimer.current) clearTimeout(errorTimer.current);
    };
  }, []);

  // Subscribe to native events ourselves (rather than the package's own
  // `useSpeechRecognitionEvent` hook) so the native module is only ever
  // touched through `getSpeechModule()` — one guarded resolution path,
  // instead of a second entry point that would need its own Expo Go guard.
  useEffect(() => {
    const mod = getSpeechModule();
    if (!mod) return;

    const subs: SpeechSubscription[] = [
      mod.addListener('start', () => {
        setIsListening(true);
        setError(null);
      }),
      mod.addListener('end', () => setIsListening(false)),
      mod.addListener('result', (event) => {
        const transcript = event.results?.[0]?.transcript ?? '';
        if (!transcript) return;
        onResult(transcript);
        if (event.isFinal) onFinalResult(transcript);
      }),
      mod.addListener('error', (event) => {
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'permission-denied' || event.error === 'service-not-allowed') {
          flashError('Microphone permission is needed for voice search.');
        } else if (event.error === 'no-speech') {
          // User didn't say anything — not worth alarming them over.
        } else if (event.error === 'network') {
          flashError('No connection — voice search needs the internet.');
        } else {
          flashError("Didn't catch that. Try again.");
        }
      }),
    ];

    return () => subs.forEach((sub) => sub?.remove());
  }, [onResult, onFinalResult, flashError]);

  const start = useCallback(async () => {
    const mod = getSpeechModule();
    if (!mod) {
      flashError('Voice search needs the installed app build, not this preview.');
      return;
    }
    try {
      const permission = await mod.requestPermissionsAsync();
      if (!permission.granted) {
        flashError('Microphone permission is needed for voice search.');
        return;
      }
      mod.start({
        lang,
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
      });
    } catch {
      setIsSupported(false);
      flashError('Voice search isn’t available on this build.');
    }
  }, [flashError, lang]);

  const stop = useCallback(() => {
    const mod = getSpeechModule();
    if (!mod) return;
    try {
      mod.stop();
    } catch {
      setIsListening(false);
    }
  }, []);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  return { isListening, isSupported, error, start, stop, toggle };
}
