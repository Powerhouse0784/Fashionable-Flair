import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

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
 * SpeechRecognition on web, via expo-speech-recognition's cross-platform
 * module. Requires a dev/production build (EAS) on native platforms since
 * it ships native code — it will report `isSupported: false` if the module
 * isn't linked (e.g. running inside plain Expo Go) so the mic button can
 * hide itself instead of crashing.
 */
export function useVoiceSearch({ onResult, onFinalResult, lang = 'en-IN' }: UseVoiceSearchOptions) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      // Not every environment (e.g. Expo Go, or a device with no speech
      // service installed) can actually recognize speech — check once up
      // front so the UI can quietly hide the mic rather than fail on tap.
      const available = ExpoSpeechRecognitionModule.isRecognitionAvailable?.();
      if (available === false) setIsSupported(false);
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

  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    setError(null);
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results?.[0]?.transcript ?? '';
    if (!transcript) return;
    onResult(transcript);
    if (event.isFinal) onFinalResult(transcript);
  });

  useSpeechRecognitionEvent('error', (event) => {
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
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        flashError('Microphone permission is needed for voice search.');
        return;
      }
      ExpoSpeechRecognitionModule.start({
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
      ExpoSpeechRecognitionModule.stop();
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
