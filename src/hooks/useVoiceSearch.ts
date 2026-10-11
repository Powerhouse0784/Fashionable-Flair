import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

type SpeechLib = typeof import('expo-speech-recognition');

/**
 * expo-speech-recognition ships native code, and its module file throws the
 * moment it's evaluated if the running app binary doesn't contain that native
 * module (an old dev client / APK built before it was added, Expo Go, or a
 * prebuilt android/ios folder that hasn't been regenerated). A plain
 * top-level `import` therefore crashed the ENTIRE app at startup with
 * "Cannot find native module 'ExpoSpeechRecognition'", instead of just
 * leaving the mic out. This checks for the native module first
 * (requireOptionalNativeModule returns null rather than throwing) and only
 * then loads the library — so a build without it simply gets no mic button.
 *
 * Web has no native module (the library falls back to the browser's own
 * SpeechRecognition there), so it skips the native check and just loads.
 * This runs once, at module load, so the hook below always calls the same
 * hooks in the same order.
 */
function loadSpeechLib(): SpeechLib | null {
  try {
    if (Platform.OS !== 'web') {
      const { requireOptionalNativeModule } = require('expo-modules-core');
      if (!requireOptionalNativeModule('ExpoSpeechRecognition')) return null;
    }
    return require('expo-speech-recognition') as SpeechLib;
  } catch {
    return null;
  }
}

const speechLib = loadSpeechLib();
const SpeechModule = speechLib?.ExpoSpeechRecognitionModule ?? null;
const useSpeechEvent: (name: string, cb: (event: any) => void) => void =
  (speechLib?.useSpeechRecognitionEvent as any) ?? (() => {});

interface UseVoiceSearchOptions {
  /** Called on every partial/interim transcript so the input can live-update. */
  onResult: (transcript: string) => void;
  /** Called once with the final transcript when the user stops speaking. */
  onFinalResult: (transcript: string) => void;
  /** BCP-47 locale for recognition. */
  lang?: string;
}

/**
 * Unified voice-search controller — same API drives the native
 * SpeechRecognizer on Android, SFSpeechRecognizer on iOS, and the browser's
 * SpeechRecognition on web. On a build that doesn't include the native
 * module it reports `isSupported: false` so the mic button hides itself.
 */
export function useVoiceSearch({ onResult, onFinalResult, lang = 'en-IN' }: UseVoiceSearchOptions) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(SpeechModule !== null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      // Even with the module present, a device with no speech service
      // installed can't recognize speech — check once up front so the UI
      // can quietly hide the mic rather than fail on tap.
      const available = SpeechModule?.isRecognitionAvailable?.();
      if (!SpeechModule || available === false) setIsSupported(false);
    } catch {
      setIsSupported(false);
    }
    return () => {
      if (errorTimer.current) clearTimeout(errorTimer.current);
    };
  }, []);

  const flashError = useCallback((message: string) => {
    setError(message);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 3500);
  }, []);

  useSpeechEvent('start', () => {
    setIsListening(true);
    setError(null);
  });

  useSpeechEvent('end', () => {
    setIsListening(false);
  });

  useSpeechEvent('result', (event) => {
    const transcript = event.results?.[0]?.transcript ?? '';
    if (!transcript) return;
    onResult(transcript);
    if (event.isFinal) onFinalResult(transcript);
  });

  useSpeechEvent('error', (event) => {
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
  });

  const start = useCallback(async () => {
    if (!SpeechModule) return;
    try {
      const permission = await SpeechModule.requestPermissionsAsync();
      if (!permission.granted) {
        flashError('Microphone permission is needed for voice search.');
        return;
      }
      SpeechModule.start({
        lang,
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
      });
    } catch {
      setIsSupported(false);
      flashError('Voice search isn\u2019t available on this build.');
    }
  }, [flashError, lang]);

  const stop = useCallback(() => {
    try {
      SpeechModule?.stop();
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
