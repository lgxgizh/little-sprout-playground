let currentAudio = null;

export function speak(text, soundOn) {
  if (!soundOn || !("speechSynthesis" in window)) return;
  stopSpeech();
  const utterance = new SpeechSynthesisUtterance(text);
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
