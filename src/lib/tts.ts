type Voice = "uk" | "us";

interface SpeakOptions {
  rate?: number;
  voice?: Voice;
  pitch?: number;
  onEnd?: () => void;
  onError?: () => void;
  /** 强制只用浏览器 Web Speech, 跳过云端 TTS */
  preferLocal?: boolean;
}

const VOICE_LANG: Record<Voice, string> = {
  uk: "en-GB",
  us: "en-US"
};

let cachedVoices: SpeechSynthesisVoice[] | null = null;
let currentAudio: HTMLAudioElement | null = null;

// 同样 text+voice+rate 的请求短期内复用, 减少花费
const ttsCache = new Map<string, string>(); // key -> objectURL
const CACHE_LIMIT = 24;

function cacheKey(text: string, voice: Voice, rate: number, pitch: number): string {
  return `${voice}|${rate}|${pitch}|${text}`;
}

function rememberCache(key: string, url: string) {
  ttsCache.set(key, url);
  if (ttsCache.size > CACHE_LIMIT) {
    const oldest = ttsCache.keys().next().value;
    if (oldest) {
      const oldUrl = ttsCache.get(oldest);
      ttsCache.delete(oldest);
      if (oldUrl) URL.revokeObjectURL(oldUrl);
    }
  }
}

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

export interface TTSPlayResult {
  source: "minimax" | "browser";
  voiceId?: string;
}

async function fetchCloudTTS(
  text: string,
  voice: Voice,
  rate: number,
  pitch: number
): Promise<string> {
  const key = cacheKey(text, voice, rate, pitch);
  const hit = ttsCache.get(key);
  if (hit) return hit;
  const resp = await fetch("/api/ai/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice, rate, pitch })
  });
  if (!resp.ok) {
    let detail = "";
    try {
      const j = (await resp.json()) as { error?: string; reason?: string };
      detail = `${j.error ?? "unknown"}: ${j.reason ?? ""}`.trim();
    } catch {
      detail = await resp.text().catch(() => "");
    }
    throw new Error(`TTS HTTP ${resp.status} ${detail.slice(0, 200)}`);
  }
  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  rememberCache(key, url);
  return url;
}

function stopAllPlayback() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.removeAttribute("src");
      currentAudio.load();
    } catch {
      /* ignore */
    }
    currentAudio = null;
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function isTTSAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

async function speakViaBrowser(
  text: string,
  opts: SpeakOptions
): Promise<TTSPlayResult> {
  if (typeof window === "undefined" || !window.speechSynthesis || !text) {
    opts.onEnd?.();
    return { source: "browser" };
  }
  const voices = cachedVoices || (await loadVoices());
  return new Promise<TTSPlayResult>((resolve) => {
    const utter = new SpeechSynthesisUtterance(text);
    const voiceKey = opts.voice || "us";
    const matched = pickVoice(voices, voiceKey);
    if (matched) utter.voice = matched;
    utter.lang = VOICE_LANG[voiceKey];
    utter.rate = opts.rate ?? 1;
    utter.pitch = opts.pitch ?? 1;
    utter.onend = () => {
      opts.onEnd?.();
      resolve({ source: "browser" });
    };
    utter.onerror = () => {
      opts.onError?.();
      resolve({ source: "browser" });
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  });
}

export async function speak(
  text: string,
  opts: SpeakOptions = {}
): Promise<TTSPlayResult> {
  if (!text) return { source: "browser" };
  // 任何新一次 speak 都先停掉前一次
  stopAllPlayback();
  if (opts.preferLocal) {
    return speakViaBrowser(text, opts);
  }
  const voice = opts.voice ?? "us";
  const rate = opts.rate ?? 1;
  const pitch = opts.pitch ?? 0;
  try {
    const url = await fetchCloudTTS(text, voice, rate, pitch);
    return await new Promise<TTSPlayResult>((resolve) => {
      const audio = new Audio(url);
      audio.preload = "auto";
      audio.playbackRate = Math.max(0.5, Math.min(2, rate));
      audio.onended = () => {
        opts.onEnd?.();
        resolve({ source: "minimax" });
      };
      audio.onerror = () => {
        opts.onError?.();
        // 云端音频播放失败 -> 回退浏览器
        speakViaBrowser(text, opts).then(resolve);
      };
      currentAudio = audio;
      audio.play().catch(() => {
        opts.onError?.();
        speakViaBrowser(text, opts).then(resolve);
      });
    });
  } catch {
    return speakViaBrowser(text, opts);
  }
}

export function stopSpeak(): void {
  stopAllPlayback();
}

export const stopSpeaking = stopSpeak;
