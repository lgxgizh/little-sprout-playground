/** Local-first animated-image (GIF/PNG) comprehension helpers. */

import { choiceImageSrc } from "./listening.js";

const ANIMATION_LIBRARY_KEY = "little-sprout-animation-library";
const LEGACY_VIDEO_LIBRARY_KEY = "little-sprout-video-library";

function clean(value, max = 160) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, max);
}

function isSafeAssetPath(src) {
  return (
    /\/assets\/(stories|media|choices)\//.test(src) ||
    /^(assets\/)?(stories|media|choices)\//.test(src) ||
    /\.(gif|png|webp|jpg|jpeg|mp4|webm)(\?|$)/i.test(src)
  );
}

export function normalizeAnimationQuestion(question, assetBase = "/") {
  if (!question || typeof question !== "object") return null;
  const choices = Array.isArray(question.choices)
    ? question.choices
        .map((choice) => {
          const value = clean(choice?.value, 40);
          const imageKey = clean(choice?.imageKey || value, 40);
          const mapped = choiceImageSrc(imageKey, assetBase);
          const imageSrc = clean(choice?.imageSrc || mapped, 400);
          return {
            label: clean(choice?.label, 40),
            emoji: clean(choice?.emoji, 8) || (imageSrc ? "🖼️" : ""),
            value,
            color: /^#[0-9a-f]{6}$/i.test(choice?.color)
              ? choice.color
              : "#9ed9c4",
            imageSrc,
            imageKey,
          };
        })
        .filter(
          (choice) =>
            choice.label && choice.value && (choice.emoji || choice.imageSrc),
        )
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

export function createDemoAnimations(assetBase = "/") {
  const base = assetBase.endsWith("/") ? assetBase : `${assetBase}/`;
  const img = (key) => choiceImageSrc(key, assetBase);
  const card = (value, label, color, emoji) => ({
    label,
    value,
    color,
    emoji,
    imageSrc: img(value),
    imageKey: value,
  });

  return [
    {
      id: "demo-fox-apple",
      title: "Fox finds an apple",
      description: "Watch the little fox story, then tap what you saw.",
      durationLabel: "~12 sec",
      sourceType: "asset",
      mediaType: "image",
      src: `${base}assets/stories/fox-apple.gif`,
      poster: `${base}assets/stories/fox-apple/01.png`,
      demo: true,
      questions: [
        {
          id: "anim-fox-apple-fruit",
          visual: "🍎",
          prompt: "What fruit did you see?",
          speech: "What fruit did you see?",
          answer: "apple",
          choices: [
            card("apple", "Apple", "#ff6b5e", "🍎"),
            card("banana", "Banana", "#f7c94b", "🍌"),
            card("ball", "Ball", "#6db6e8", "⚽"),
            card("cup", "Cup", "#9ed9c4", "🥤"),
          ],
        },
        {
          id: "anim-fox-apple-find",
          visual: "🦊",
          prompt: "Find the apple from the story",
          speech: "Find the apple from the story.",
          answer: "apple",
          choices: [
            card("star", "Star", "#f7c94b", "⭐"),
            card("apple", "Apple", "#ff6b5e", "🍎"),
            card("fish", "Fish", "#6db6e8", "🐟"),
            card("dog", "Dog", "#d9a66f", "🐶"),
          ],
        },
        {
          id: "anim-fox-apple-not-fish",
          visual: "✨",
          prompt: "Which one was in the story?",
          speech: "Which one was in the story?",
          answer: "apple",
          choices: [
            card("fish", "Fish", "#6db6e8", "🐟"),
            card("cup", "Cup", "#9ed9c4", "🥤"),
            card("apple", "Apple", "#ff6b5e", "🍎"),
            card("ball", "Ball", "#6db6e8", "⚽"),
          ],
        },
      ],
    },
  ];
}

/** @deprecated Prefer createDemoAnimations — kept for migration/tests. */
export function createDemoVideos(assetBase = "/") {
  return createDemoAnimations(assetBase);
}

export function normalizeAnimationEntry(
  entry,
  { allowBlob = false, assetBase = "/" } = {},
) {
  if (!entry || typeof entry !== "object") return null;
  const sourceType = clean(entry.sourceType, 20) || "asset";
  const src = clean(entry.src, 400);
  if (!src) return null;
  if (sourceType === "blob" && !allowBlob && !src.startsWith("blob:")) {
    return null;
  }
  if (sourceType === "asset" && !isSafeAssetPath(src) && !src.startsWith("/")) {
    return null;
  }
  const questions = Array.isArray(entry.questions)
    ? entry.questions
        .map((question) => normalizeAnimationQuestion(question, assetBase))
        .filter(Boolean)
        .slice(0, 8)
    : [];
  if (!questions.length) return null;
  const mediaType =
    clean(entry.mediaType, 20) ||
    (/\.(gif|png|webp|jpe?g)(\?|$)/i.test(src) ? "image" : "video");
  return {
    id: clean(entry.id, 80) || `animation-${Date.now()}`,
    title: clean(entry.title, 60) || "My animation",
    description: clean(entry.description, 160) || "Watch, then tap a picture.",
    durationLabel: clean(entry.durationLabel, 20) || "short",
    sourceType,
    mediaType,
    src,
    poster: clean(entry.poster, 400) || "",
    demo: Boolean(entry.demo),
    questions,
  };
}

/** @deprecated Prefer normalizeAnimationEntry */
export function normalizeVideoEntry(entry, options = {}) {
  return normalizeAnimationEntry(entry, options);
}

/** @deprecated Prefer normalizeAnimationQuestion */
export function normalizeVideoQuestion(question) {
  return normalizeAnimationQuestion(question);
}

export function loadAnimationLibrary(assetBase = "/") {
  try {
    const raw =
      localStorage.getItem(ANIMATION_LIBRARY_KEY) ||
      localStorage.getItem(LEGACY_VIDEO_LIBRARY_KEY) ||
      "[]";
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved)) return [];
    return saved
      .map((entry) =>
        normalizeAnimationEntry(entry, { allowBlob: false, assetBase }),
      )
      .filter(Boolean)
      .slice(0, 12);
  } catch {
    return [];
  }
}

/** @deprecated Prefer loadAnimationLibrary */
export function loadVideoLibrary() {
  return loadAnimationLibrary("/");
}

export function saveAnimationLibrary(entries = [], assetBase = "/") {
  const normalized = entries
    .map((entry) =>
      normalizeAnimationEntry(entry, { allowBlob: false, assetBase }),
    )
    .filter(Boolean)
    .filter((entry) => entry.sourceType !== "blob")
    .slice(0, 12);
  try {
    localStorage.setItem(ANIMATION_LIBRARY_KEY, JSON.stringify(normalized));
  } catch {
    /* private mode still keeps the in-memory shelf for this session */
  }
  return normalized;
}

/** @deprecated Prefer saveAnimationLibrary */
export function saveVideoLibrary(entries = []) {
  return saveAnimationLibrary(entries);
}

export function mergeAnimationShelf(demoAnimations, customAnimations = []) {
  const seen = new Set();
  const merged = [];
  for (const entry of [...demoAnimations, ...customAnimations]) {
    if (!entry?.id || seen.has(entry.id)) continue;
    seen.add(entry.id);
    merged.push(entry);
  }
  return merged;
}

/** @deprecated Prefer mergeAnimationShelf */
export function mergeVideoShelf(demoVideos, customVideos = []) {
  return mergeAnimationShelf(demoVideos, customVideos);
}

export function summarizeAnimationAttempts(events = [], animationId = null) {
  const answers = events.filter((event) => {
    if (event.type !== "answer") return false;
    if (event.courseId !== "animation" && event.courseId !== "video")
      return false;
    const id = event.animationId || event.videoId;
    if (animationId && id !== animationId) return false;
    return true;
  });
  const completed = events.filter((event) => {
    if (event.type !== "session_completed") return false;
    if (event.courseId !== "animation" && event.courseId !== "video")
      return false;
    const id = event.animationId || event.videoId;
    if (animationId && id !== animationId) return false;
    return true;
  });
  return {
    answers: answers.length,
    correct: answers.filter((event) => event.correct).length,
    completedSessions: completed.length,
  };
}

/** @deprecated Prefer summarizeAnimationAttempts */
export function summarizeVideoAttempts(events = [], videoId = null) {
  return summarizeAnimationAttempts(events, videoId);
}

export function parentAnimationSummary(stats) {
  if (!stats.answers) {
    return "No animation tries yet—pick a calm GIF when you are ready.";
  }
  const ratio = stats.answers ? stats.correct / stats.answers : 0;
  if (ratio >= 0.7) {
    return `Watched and answered ${stats.correct} of ${stats.answers} picture questions. Lovely looking!`;
  }
  if (ratio >= 0.4) {
    return `Tried ${stats.answers} picture questions after watching. Replay the animation and try again together.`;
  }
  return `Started watching and tapping pictures (${stats.answers} tries). Keep sessions short and cheerful.`;
}

/** @deprecated Prefer parentAnimationSummary */
export function parentVideoSummary(stats) {
  return parentAnimationSummary(stats);
}

export const ANIMATION_FEATURE = {
  id: "animation",
  courseId: "animation",
  title: "Animation Q&A",
  titleZh: "动画提问",
  subtitle: "Watch a GIF story, then tap picture answers",
  subtitleZh: "看 GIF 小故事，再点选图片答题",
  emoji: "🎞️",
  tone: "peach",
};
