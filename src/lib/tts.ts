type Voice = "uk" | "us";

interface SpeakOptions {
  rate?: number;
  voice?: Voice;
  pitch?: number;
}

const VOICE_LANG: Record<Voice, string> = {
  uk: "en-GB",
  us: "en-US"
};

let cachedVoices: SpeechSynthesisVoice[] | null = null;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve([]);
      return;
    }
    const existing = window.speechSynthesis.getVoices();
    if (existing && existing.length) {
      cachedVoices = existing;
      resolve(existing);
      return;
    }
    const handle = () => {
      cachedVoices = window.speechSynthesis.getVoices();
      window.speechSynthesis.removeEventListener("voiceschanged", handle);
      resolve(cachedVoices);
    };
    window.speechSynthesis.addEventListener("voiceschanged", handle);
    setTimeout(() => {
      cachedVoices = window.speechSynthesis.getVoices();
      resolve(cachedVoices);
    }, 800);
  });
}

function pickVoice(voices: SpeechSynthesisVoice[], voice: Voice): SpeechSynthesisVoice | null {
  const lang = VOICE_LANG[voice];
  return (
    voices.find((v) => v.lang === lang) ||
    voices.find((v) => v.lang.startsWith(voice === "uk" ? "en-GB" : "en-US")) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    null
  );
}

export function isTTSAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export async function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
  if (!isTTSAvailable() || !text) return;
  const voices = cachedVoices || (await loadVoices());
  const utter = new SpeechSynthesisUtterance(text);
  const voiceKey = opts.voice || "uk";
  const matched = pickVoice(voices, voiceKey);
  if (matched) utter.voice = matched;
  utter.lang = VOICE_LANG[voiceKey];
  utter.rate = opts.rate ?? 1;
  utter.pitch = opts.pitch ?? 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

export function stopSpeak(): void {
  if (isTTSAvailable()) window.speechSynthesis.cancel();
}
