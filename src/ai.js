import { stageDefinition } from "./learning-plan.js";
import {
  adapterFields,
  hasRemoteAdapter,
  imagePromptFor,
  isAdapterModel,
  modelOption,
} from "./model-config.js";

const apiBaseUrl = (
  typeof import.meta !== "undefined"
    ? import.meta.env?.VITE_API_BASE_URL || ""
    : ""
).replace(/\/$/, "");

function compactSkill(skill) {
  return {
    attempts: skill?.attempts || 0,
    accuracy: skill?.attempts
      ? Math.round((skill.correct / skill.attempts) * 100)
      : null,
    lastPracticed: skill?.lastPracticed || null,
  };
}

/**
 * Build a privacy-minimised context for a planning adapter.
 * It intentionally excludes names, audio, photos, free-text, and raw answers.
 */
export function buildLearningContext(profile, activityCourse, child = null) {
  const plan = child?.englishPlan || { stage: 1, reviewQueue: [] };
  const stage = stageDefinition(plan.stage);
  const weakConcepts = Object.entries(profile.questionStats || {})
    .filter(
      ([questionId, stat]) =>
        questionId.startsWith("english-") &&
        stat.attempts &&
        stat.correct / stat.attempts < 0.8,
    )
    .sort(
      ([, left], [, right]) =>
        left.correct / left.attempts - right.correct / right.attempts,
    )
    .slice(0, 3)
    .map(([questionId]) => questionId);
  const reviewQuestionIds = (plan.reviewQueue || [])
    .filter(
      (item) => !item.dueAt || new Date(item.dueAt).getTime() <= Date.now(),
    )
    .slice(0, 8)
    .map((item) => item.questionId);
  return {
    ageRange: String(child?.age || 3),
    canReadText: false,
    currentCourse: activityCourse,
    childContext: {
      age: child?.age || 3,
      gender: child?.gender === "unspecified" ? null : child?.gender || null,
      englishLevel: child?.englishLevel || "not-started",
      baselineScore:
        child?.baseline?.status === "complete" ? child.baseline.score : null,
    },
    learningPlan: {
      stage: stage.id,
      goal: stage.goal,
      reviewQuestionIds,
      weakConcepts,
    },
    totals: {
      sessions: profile.totalSessions,
      answers: profile.totalAnswers,
      accuracy: profile.totalAnswers
        ? Math.round((profile.correctAnswers / profile.totalAnswers) * 100)
        : null,
      streakDays: profile.streak,
      stars: profile.stars,
    },
    skills: Object.fromEntries(
      Object.entries(profile.skills).map(([skill, value]) => [
        skill,
        compactSkill(value),
      ]),
    ),
    questionStats: Object.fromEntries(
      Object.entries(profile.questionStats || {}).map(([questionId, value]) => [
        questionId,
        {
          attempts: value.attempts || 0,
          accuracy: value.attempts
            ? Math.round((value.correct / value.attempts) * 100)
            : null,
          lastPracticed: value.lastPracticed || null,
          lastCorrect:
            typeof value.lastCorrect === "boolean" ? value.lastCorrect : null,
        },
      ]),
    ),
    recentActivity: profile.events.slice(-8).map((event) => ({
      type: event.type,
      courseId: event.courseId,
      questionId: event.questionId,
      difficulty: event.difficulty,
      correct: typeof event.correct === "boolean" ? event.correct : undefined,
      at: event.at,
    })),
    constraints: {
      sessionMinutes: 5,
      maxQuestions: 3,
      usePicturesFirst: true,
      useEncouragingLanguage: true,
      noRankings: true,
    },
  };
}

export async function adapterPost(path, body, timeoutMs = 8000) {
  if (!hasRemoteAdapter() || !apiBaseUrl) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify(body),
    });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) return response.json();
    const buffer = await response.arrayBuffer();
    if (!buffer.byteLength) return null;
    return { binary: buffer, contentType };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function adapterPayload(type, modelId, extra = {}, custom = {}) {
  return {
    ...adapterFields(type, modelId, custom),
    ...extra,
  };
}

export async function requestNextQuestion({
  model,
  profile,
  activityCourse,
  child,
  candidates,
  custom = {},
}) {
  if (!isAdapterModel("vocab", model)) return null;
  const result = await adapterPost("/learning/next-question", {
    ...adapterPayload("vocab", model, {}, custom),
    learningContext: buildLearningContext(profile, activityCourse, child),
    candidates: candidates.map(
      ({ id, difficulty, stage, ageMin, ageMax, concept, prompt }) => ({
        id,
        difficulty,
        stage,
        ageMin,
        ageMax,
        concept,
        prompt,
      }),
    ),
  });
  const chosen = candidates.find(
    (candidate) => candidate.id === result?.questionId,
  );
  return chosen ? { questionId: chosen.id, source: "ai" } : null;
}

export async function requestSpeech({ model, text, custom = {} }) {
  const option = modelOption("voice", model);
  if (option?.mode !== "adapter" || !text) return null;
  const result = await adapterPost("/learning/speak", {
    ...adapterPayload(
      "voice",
      model,
      {
        language: "en",
      },
      custom,
    ),
    text: String(text).slice(0, 240),
  });
  if (!result) return null;
  if (result.audioUrl && /^https?:\/\//i.test(result.audioUrl))
    return { audioUrl: result.audioUrl };
  if (result.audioBase64) {
    return {
      audioUrl: `data:${result.mimeType || "audio/mpeg"};base64,${result.audioBase64}`,
    };
  }
  if (result.binary) {
    const blob = new Blob([result.binary], {
      type: result.contentType || "audio/mpeg",
    });
    return { audioUrl: URL.createObjectURL(blob) };
  }
  return null;
}

export async function requestImage({ model, question, custom = {} }) {
  if (!isAdapterModel("image", model) || !question) return null;
  const prompt = imagePromptFor(question);
  if (!prompt) return null;
  const result = await adapterPost(
    "/learning/image",
    {
      ...adapterPayload("image", model, { questionId: question.id }, custom),
      prompt,
    },
    20000,
  );
  const imageUrl = result?.imageUrl;
  if (
    typeof imageUrl === "string" &&
    /^(https?:\/\/|data:image\/)/i.test(imageUrl)
  )
    return { imageUrl };
  return null;
}

export async function requestVideoAnalysis({ model, media, custom = {} }) {
  if (!isAdapterModel("video", model) || !media?.url) return null;
  const result = await adapterPost(
    "/learning/video-analyze",
    {
      ...adapterPayload("video", model, {}, custom),
      media: {
        id: String(media.id || "").slice(0, 80),
        type: media.type === "video" ? "video" : "image",
        url: String(media.url).slice(0, 500),
      },
      constraints: {
        preschool: true,
        language: "en",
        maxSentences: 3,
        noNames: true,
      },
    },
    20000,
  );
  const summary = String(result?.summary || "")
    .trim()
    .slice(0, 400);
  if (!summary) return null;
  return {
    title: String(result.title || media.title || "Picture story").slice(0, 80),
    summary,
    prompt: String(result.prompt || "")
      .trim()
      .slice(0, 160),
  };
}
