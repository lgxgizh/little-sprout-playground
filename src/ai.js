const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

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
  return {
    ageRange: "3",
    canReadText: false,
    currentCourse: activityCourse,
    childContext: {
      age: child?.age || 3,
      gender: child?.gender === "unspecified" ? null : child?.gender || null,
      englishLevel: child?.englishLevel || "not-started",
      baselineScore:
        child?.baseline?.status === "complete" ? child.baseline.score : null,
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

export async function requestNextQuestion({
  model,
  profile,
  activityCourse,
  child,
  candidates,
}) {
  if (!apiBaseUrl || model !== "gpt-4o-mini") return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${apiBaseUrl}/learning/next-question`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        learningContext: buildLearningContext(profile, activityCourse, child),
        candidates: candidates.map(({ id, difficulty, prompt }) => ({
          id,
          difficulty,
          prompt,
        })),
      }),
    });
    if (!response.ok) return null;
    const result = await response.json();
    const chosen = candidates.find(
      (candidate) => candidate.id === result?.questionId,
    );
    return chosen ? { questionId: chosen.id, source: "ai" } : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
