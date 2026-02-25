import { useCallback, useEffect, useRef, useState } from "react";

// TODO: Google TTS provider
// When tts-provider is set to "google", use the Cloud TTS API instead.
// Monthly free tier: 4M chars standard / 1M WaveNet chars.
// Requires an API key passed via config. Implementation deferred.

const isBrowser = typeof window !== "undefined";
const isSupported = isBrowser && "speechSynthesis" in window;

interface UseTTSOptions {
  enabled: boolean;
  voiceName?: string;  // BCP-47 lang tag (e.g. "en-US") or voice name substring
  rate?: number;       // 0.1–10, default 1.0
  pitch?: number;      // 0–2, default 1.0
  volume?: number;     // 0–1, default 1.0
  /** Called when speech ends naturally (not when cancelled or on error). */
  onEnd?: () => void;
}

interface UseTTSReturn {
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  isSpeaking: boolean;
  /** Sync ref — true while speaking. Use this inside callbacks to avoid stale state. */
  isSpeakingRef: React.MutableRefObject<boolean>;
}

/**
 * Resolve a voice from a comma-separated list of queries.
 * Each query is tried in order: first by voice name substring, then by BCP-47 prefix.
 * e.g. "Kyunghoon, InJoon, ko-KR" → tries macOS male, Windows male, then any Korean voice.
 */
function resolveVoice(
  query: string | undefined,
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  if (!query || voices.length === 0) return null;
  const candidates = query.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  for (const q of candidates) {
    const byName = voices.find((v) => v.name.toLowerCase().includes(q));
    if (byName) return byName;
    const byLang = voices.find((v) => v.lang.toLowerCase().startsWith(q));
    if (byLang) return byLang;
  }
  return null;
}

export function useTTS({
  enabled,
  voiceName,
  rate = 1.0,
  pitch = 1.0,
  volume = 1.0,
  onEnd,
}: UseTTSOptions): UseTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Store mutable values in refs so callbacks can be stable (empty deps)
  const optionsRef = useRef({ enabled, voiceName, rate, pitch, volume });
  optionsRef.current = { enabled, voiceName, rate, pitch, volume };

  // onEnd is stored in a ref so the stable speak() closure always calls the latest version
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  // isSpeakingRef allows callers to check speaking state synchronously inside callbacks
  const isSpeakingRef = useRef(false);

  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load voices — Chrome populates synchronously, Firefox fires onvoiceschanged
  useEffect(() => {
    if (!isSupported) return;
    const load = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  // Cancel on unmount
  useEffect(() => {
    return () => {
      if (isSupported) window.speechSynthesis.cancel();
    };
  }, []);

  // Stable callbacks — read options from refs, never stale
  const speak = useCallback((text: string) => {
    const { enabled, voiceName, rate, pitch, volume } = optionsRef.current;
    if (!isSupported || !enabled || !text.trim()) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Math.max(0.1, Math.min(10, rate));
    utterance.pitch = Math.max(0, Math.min(2, pitch));
    utterance.volume = Math.max(0, Math.min(1, volume));

    const voice = resolveVoice(voiceName, voicesRef.current);
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setIsSpeaking(true);
    };
    utterance.onend = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      // Natural end — notify caller (cancel/error do NOT trigger this)
      onEndRef.current?.();
    };
    utterance.onerror = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      // Do not call onEnd on error
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []); // stable — reads latest values via optionsRef

  const pause = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
    setIsSpeaking(false);
  }, []);

  const resume = useCallback(() => {
    if (!isSupported) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsSpeaking(true);
    }
  }, []);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    isSpeakingRef.current = false;
    setIsSpeaking(false);
  }, []);

  return { speak, pause, resume, cancel, isSpeaking, isSpeakingRef };
}
