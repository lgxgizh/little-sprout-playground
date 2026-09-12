let currentAudio = null;
let remoteVoiceToastShown = false;

export function speak(text, soundOn) {
  if (!soundOn || !text || !("speechSynthesis" in window)) return;
  stopSpeech();
  const utterance = new SpeechSynthesisUtterance(String(text));
  utterance.lang = "en-US";
  const englishVoice = window.speechSynthesis
    .getVoices()
    .find((voice) => /^en(-|_)/i.test(voice.lang));
  if (englishVoice) utterance.voice = englishVoice;
  utterance.rate = 0.82;
  utterance.pitch = 1.15;
  window.speechSynthesis.speak(utterance);
}

export function playAudioUrl(url, soundOn) {
  if (!soundOn || !url) return Promise.resolve(false);
  stopSpeech();
  return new Promise((resolve) => {
    const audio = new Audio(url);
    currentAudio = audio;
    audio.addEventListener("ended", () => {
      if (currentAudio === audio) currentAudio = null;
      resolve(true);
    });
    audio.addEventListener("error", () => {
      if (currentAudio === audio) currentAudio = null;
      resolve(false);
    });
    audio.play().catch(() => {
      if (currentAudio === audio) currentAudio = null;
      resolve(false);
    });
  });
}

export function stopSpeech() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
}

function audioCandidateUrls(question, assetBase = "/") {
  const base = assetBase.endsWith("/") ? assetBase : `${assetBase}/`;
  const ids = [
    question?.id,
    question?.answer,
    question?.concept,
    question?.audioId,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  const urls = [];
  for (const id of ids) {
    const slug = id.replace(/^english-/, "").replace(/[^a-z0-9-_]/gi, "");
    if (!slug) continue;
    urls.push(`${base}assets/audio/${slug}.mp3`);
    if (id !== slug) urls.push(`${base}assets/audio/${id}.mp3`);
  }
  return [...new Set(urls)];
}

/**
 * Honor models.voice: browser TTS, local-audio file then TTS, adapter then TTS.
 * Never leave Listen as a dead button.
 */
export async function speakWithVoice({
  text,
  soundOn = true,
  voiceId = "browser-speech",
  question = null,
  assetBase = "/",
  requestSpeech = null,
  custom = {},
  onToast = null,
} = {}) {
  if (!soundOn || !text) return { mode: "silent" };
  const voice = voiceId || "browser-speech";

  if (voice === "local-audio") {
    for (const url of audioCandidateUrls(question, assetBase)) {
      const played = await playAudioUrl(url, true);
      if (played) return { mode: "local-audio", url };
    }
    speak(text, true);
    return { mode: "tts-fallback" };
  }

  if (voice !== "browser-speech" && typeof requestSpeech === "function") {
    try {
      const result = await requestSpeech({
        model: voice,
        text,
        custom,
      });
      if (result?.audioUrl) {
        const played = await playAudioUrl(result.audioUrl, true);
        if (played) return { mode: "adapter", url: result.audioUrl };
      }
    } catch {
      /* fall through to browser TTS */
    }
    if (!remoteVoiceToastShown) {
      remoteVoiceToastShown = true;
      onToast?.("远程语音暂不可用，已改用浏览器朗读");
    }
    speak(text, true);
    return { mode: "tts-fallback" };
  }

  speak(text, true);
  return { mode: "browser-speech" };
}

/** Kept for compatibility; kid path does not use speech recognition. */
export function startSpeechPractice({ question, onState }) {
  const Recognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    onState({
      speechPractice: "unsupported",
      speechFeedback: "跟读在 Chrome 或 Edge 里更好用",
    });
    return;
  }
  const targetWords = question.answer
    .replaceAll("-", " ")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const recognition = new Recognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  onState({ speechPractice: "listening", speechFeedback: "正在听…" });
  recognition.onresult = (event) => {
    const transcript = String(event.results?.[0]?.[0]?.transcript || "")
      .toLowerCase()
      .replace(/[^a-z\s-]/g, " ");
    const matched = targetWords.every((word) => transcript.includes(word));
    onState({
      speechPractice: matched ? "success" : "try",
      speechFeedback: matched ? "说得真好！✨" : "很棒的尝试，再听一次吧",
    });
  };
  recognition.onerror = () => {
    onState({
      speechPractice: "idle",
      speechFeedback: "再点一次「跟我说」",
    });
  };
  recognition.onend = () => {
    onState((current) =>
      current.speechPractice === "listening"
        ? { speechPractice: "idle", speechFeedback: "" }
        : null,
    );
  };
  try {
    recognition.start();
  } catch {
    onState({
      speechPractice: "idle",
      speechFeedback: "再点一次「跟我说」",
    });
  }
}
