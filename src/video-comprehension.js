/** Local-first animation / short-video comprehension helpers. */

const VIDEO_LIBRARY_KEY = "little-sprout-video-library";

export function createDemoVideos(assetBase = "/") {
  const base = assetBase.endsWith("/") ? assetBase : `${assetBase}/`;
  return [
    {
      id: "demo-shapes-hello",
      title: "Shapes say hello",
      description: "Watch calm shape colors, then tap what you saw.",
      durationLabel: "8 sec",
      sourceType: "asset",
      src: `${base}assets/media/shapes-hello.mp4`,
      poster: `${base}assets/fox-hero.png`,
      demo: true,
      questions: [
        {
          id: "video-shapes-circle",
          visual: "🟢",
          prompt: "Which shape did you see first?",
          speech: "Which shape did you see first?",
          answer: "circle",
          choices: [
            { label: "Circle", emoji: "🟢", value: "circle", color: "#9ed9c4" },
            { label: "Star", emoji: "⭐", value: "star", color: "#f7c94b" },
            { label: "Heart", emoji: "❤️", value: "heart", color: "#ff6b5e" },
          ],
        },
        {
          id: "video-shapes-square",
          visual: "🟦",
          prompt: "Which one is a square?",
          speech: "Which one is a square?",
          answer: "square",
          choices: [
            { label: "Circle", emoji: "⚪", value: "circle", color: "#6db6e8" },
            { label: "Square", emoji: "🟦", value: "square", color: "#6db6e8" },
            {
              label: "Triangle",
              emoji: "🔺",
              value: "triangle",
              color: "#ff8b76",
            },
          ],
        },
        {
          id: "video-shapes-star",
          visual: "⭐",
          prompt: "Find the yellow star",
          speech: "Can you find the yellow star?",
          answer: "star",
          choices: [
            { label: "Star", emoji: "⭐", value: "star", color: "#f7c94b" },
            { label: "Ball", emoji: "⚽", value: "ball", color: "#6db6e8" },
            { label: "Cup", emoji: "🥤", value: "cup", color: "#9ed9c4" },
          ],
        },
      ],
    },
  ];
}

function clean(value, max = 160) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, max);
}

export function normalizeVideoQuestion(question) {
  if (!question || typeof question !== "object") return null;
  const choices = Array.isArray(question.choices)
    ? question.choices
        .map((choice) => ({
          label: clean(choice?.label, 40),
          emoji: clean(choice?.emoji, 8),
          value: clean(choice?.value, 40),
          color: /^#[0-9a-f]{6}$/i.test(choice?.color)
            ? choice.color
            : "#9ed9c4",
        }))
        .filter((choice) => choice.label && choice.value && choice.emoji)
        .slice(0, 4)
    : [];
  const normalized = {
    id: clean(question.id, 80),
    visual: clean(question.visual, 8) || "🎬",
    prompt: clean(question.prompt),
    speech: clean(question.speech || question.prompt),
    answer: clean(question.answer, 40),
    choices,
  };
  if (
    !normalized.id ||
    !normalized.prompt ||
    !normalized.answer ||
    choices.length < 2 ||
    !choices.some((choice) => choice.value === normalized.answer)
  ) {
    return null;
  }
  return normalized;
}

export function normalizeVideoEntry(entry, { allowBlob = false } = {}) {
  if (!entry || typeof entry !== "object") return null;
  const sourceType = clean(entry.sourceType, 20) || "asset";
  const src = clean(entry.src, 400);
  if (!src) return null;
  if (sourceType === "blob" && !allowBlob && !src.startsWith("blob:")) {
    return null;
  }
  if (
    sourceType === "asset" &&
    !src.includes("/assets/media/") &&
    !src.startsWith("assets/media/")
  ) {
    // Still allow absolute app paths that already include the media folder.
    if (!/media\//.test(src)) return null;
  }
  const questions = Array.isArray(entry.questions)
    ? entry.questions.map(normalizeVideoQuestion).filter(Boolean).slice(0, 8)
    : [];
  if (!questions.length) return null;
  return {
    id: clean(entry.id, 80) || `video-${Date.now()}`,
    title: clean(entry.title, 60) || "My video",
    description: clean(entry.description, 160) || "Watch, then tap a picture.",
    durationLabel: clean(entry.durationLabel, 20) || "short",
    sourceType,
    src,
    poster: clean(entry.poster, 400) || "",
    demo: Boolean(entry.demo),
    questions,
  };
}

export function loadVideoLibrary() {
  try {
    const saved = JSON.parse(localStorage.getItem(VIDEO_LIBRARY_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    return saved
      .map((entry) => normalizeVideoEntry(entry, { allowBlob: false }))
      .filter(Boolean)
      .slice(0, 12);
  } catch {
    return [];
  }
}

export function saveVideoLibrary(entries = []) {
  const normalized = entries
    .map((entry) => normalizeVideoEntry(entry, { allowBlob: false }))
    .filter(Boolean)
    .filter((entry) => entry.sourceType !== "blob")
    .slice(0, 12);
  try {
    localStorage.setItem(VIDEO_LIBRARY_KEY, JSON.stringify(normalized));
  } catch {
    /* private mode still keeps the in-memory shelf for this session */
  }
  return normalized;
}

export function mergeVideoShelf(demoVideos, customVideos = []) {
  const seen = new Set();
  const merged = [];
  for (const entry of [...demoVideos, ...customVideos]) {
    if (!entry?.id || seen.has(entry.id)) continue;
    seen.add(entry.id);
    merged.push(entry);
  }
  return merged;
}

export function summarizeVideoAttempts(events = [], videoId = null) {
  const answers = events.filter((event) => {
    if (event.type !== "answer" || event.courseId !== "video") return false;
    if (videoId && event.videoId !== videoId) return false;
    return true;
  });
  const completed = events.filter((event) => {
    if (event.type !== "session_completed" || event.courseId !== "video")
      return false;
    if (videoId && event.videoId !== videoId) return false;
    return true;
  });
  return {
    answers: answers.length,
    correct: answers.filter((event) => event.correct).length,
    completedSessions: completed.length,
  };
}

export function parentVideoSummary(stats) {
  if (!stats.answers) {
    return "No video tries yet—pick a calm clip when you are ready.";
  }
  const ratio = stats.answers ? stats.correct / stats.answers : 0;
  if (ratio >= 0.7) {
    return `Watched and answered ${stats.correct} of ${stats.answers} picture questions. Lovely looking!`;
  }
  if (ratio >= 0.4) {
    return `Tried ${stats.answers} picture questions after watching. Replay the clip and try again together.`;
  }
  return `Started watching and tapping pictures (${stats.answers} tries). Keep sessions short and cheerful.`;
}
