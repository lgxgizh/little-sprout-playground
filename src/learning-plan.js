export const ENGLISH_STAGES = {
  1: {
    id: 1,
    label: "听声音与图片",
    labelEn: "Hear & Match",
    goal: "听懂简单英文词汇，并和图片匹配",
    goalEn: "Hear a simple word and match it to a picture",
    maxDifficulty: 1,
    masteryTarget: 3,
  },
  2: {
    id: 2,
    label: "图片词汇",
    labelEn: "Picture Words",
    goal: "认识常见英文词汇和颜色",
    goalEn: "Meet everyday words and colors",
    maxDifficulty: 1,
    masteryTarget: 4,
  },
  3: {
    id: 3,
    label: "简单表达",
    labelEn: "Little Sentences",
    goal: "理解短句中的熟悉词汇",
    goalEn: "Understand familiar words in short sentences",
    maxDifficulty: 2,
    masteryTarget: 5,
  },
  4: {
    id: 4,
    label: "亲子互动",
    labelEn: "Play Together",
    goal: "在生活场景中听懂并尝试表达",
    goalEn: "Listen and try words in everyday play",
    maxDifficulty: 2,
    masteryTarget: 6,
  },
};

const REVIEW_INTERVALS = [1, 3, 7];

export function createEnglishPlan() {
  return {
    stage: 1,
    stageStartedAt: null,
    masteredConcepts: [],
    reviewQueue: [],
    lastRecommendationAt: null,
  };
}

export function normalizeEnglishPlan(saved) {
  const defaults = createEnglishPlan();
  const stage = Math.min(4, Math.max(1, Number(saved?.stage) || 1));
  return {
    ...defaults,
    ...(saved || {}),
    stage,
    masteredConcepts: Array.isArray(saved?.masteredConcepts)
      ? saved.masteredConcepts.slice(0, 100)
      : [],
    reviewQueue: Array.isArray(saved?.reviewQueue)
      ? saved.reviewQueue.slice(0, 100)
      : [],
  };
}

export function stageDefinition(stage) {
  return ENGLISH_STAGES[Math.min(4, Math.max(1, Number(stage) || 1))];
}

export function stageFromBaseline(score) {
  if (score >= 3) return 2;
  return 1;
}

function dueAt(days, timestamp) {
  const date = new Date(timestamp || Date.now());
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function reviewRank(item, now) {
  const due = item?.dueAt ? new Date(item.dueAt).getTime() : Infinity;
  // 只把到期复习提到最前；尚未到期的题目不应抢占新概念。
  return due <= now ? 0 : 2;
}

export function chooseQuestionCandidates({
  questions,
  plan,
  questionStats = {},
  sessionQuestionIds = [],
  age = null,
  now = Date.now(),
}) {
  const currentPlan = normalizeEnglishPlan(plan);
  const definition = stageDefinition(currentPlan.stage);
  const eligible = questions.filter((question) => {
    const questionStage = Number(question.stage) || question.difficulty || 1;
    const minAge = Number(question.ageMin) || 0;
    const maxAge = Number(question.ageMax) || Infinity;
    return (
      question.difficulty <= definition.maxDifficulty &&
      questionStage <= currentPlan.stage &&
      (age === null || (age >= minAge && age <= maxAge))
    );
  });
  const unseen = eligible.filter(
    (question) => !sessionQuestionIds.includes(question.id),
  );
  const pool = unseen.length ? unseen : eligible;
  const reviewMap = new Map(
    currentPlan.reviewQueue.map((item) => [item.questionId, item]),
  );
  return [...pool].sort((left, right) => {
    const leftReview = reviewMap.get(left.id);
    const rightReview = reviewMap.get(right.id);
    const leftDue = leftReview && reviewRank(leftReview, now);
    const rightDue = rightReview && reviewRank(rightReview, now);
    if (leftDue !== rightDue) return (leftDue ?? 2) - (rightDue ?? 2);
    const leftStat = questionStats[left.id];
    const rightStat = questionStats[right.id];
    const leftAccuracy = leftStat?.attempts
      ? leftStat.correct / leftStat.attempts
      : -1;
    const rightAccuracy = rightStat?.attempts
      ? rightStat.correct / rightStat.attempts
      : -1;
    if (leftAccuracy !== rightAccuracy) return leftAccuracy - rightAccuracy;
    return (leftStat?.lastPracticed || "").localeCompare(
      rightStat?.lastPracticed || "",
    );
  });
}

export function updateEnglishPlan(plan, questionId, correct, at) {
  const next = normalizeEnglishPlan(plan);
  const existing = next.reviewQueue.find(
    (item) => item.questionId === questionId,
  );
  const currentInterval = existing?.intervalDays || 0;
  const intervalIndex = REVIEW_INTERVALS.indexOf(currentInterval);
  const nextInterval = existing
    ? REVIEW_INTERVALS[
        Math.min(REVIEW_INTERVALS.length - 1, intervalIndex + 1)
      ] || REVIEW_INTERVALS[0]
    : REVIEW_INTERVALS[0];
  next.reviewQueue = next.reviewQueue.filter(
    (item) => item.questionId !== questionId,
  );

  if (correct) {
    if (nextInterval >= 7) {
      next.masteredConcepts = [
        ...new Set([...next.masteredConcepts, questionId]),
      ].slice(-100);
    } else {
      next.reviewQueue.push({
        questionId,
        intervalDays: nextInterval,
        dueAt: dueAt(nextInterval, at),
      });
    }
  } else {
    next.masteredConcepts = next.masteredConcepts.filter(
      (id) => id !== questionId,
    );
    next.reviewQueue.push({
      questionId,
      intervalDays: 1,
      dueAt: dueAt(1, at),
    });
  }

  const definition = stageDefinition(next.stage);
  if (
    next.stage < 4 &&
    next.masteredConcepts.length >= definition.masteryTarget
  ) {
    next.stage += 1;
    next.stageStartedAt = at || new Date().toISOString();
    next.masteredConcepts = [];
  }
  next.lastRecommendationAt = at || new Date().toISOString();
  return next;
}

export function summarizeWeek(
  events = [],
  questionStats = {},
  now = new Date(),
) {
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const recent = events.filter((event) => {
    const at = new Date(event.at).getTime();
    return at >= start.getTime() && at <= end.getTime();
  });
  const answers = recent.filter((event) => event.type === "answer");
  const completedSessions = recent.filter(
    (event) => event.type === "session_completed",
  );
  const dayKeys = new Set(
    recent.map((event) => new Date(event.at).toLocaleDateString("zh-CN")),
  );
  const englishAnswers = answers.filter(
    (event) => event.courseId === "english" && event.questionId,
  );
  const weakConcepts = Object.entries(questionStats)
    .filter(([questionId, stat]) => {
      if (!questionId.startsWith("english-")) return false;
      return stat.attempts && stat.correct / stat.attempts < 0.8;
    })
    .sort(
      ([, left], [, right]) =>
        left.correct / left.attempts - right.correct / right.attempts,
    )
    .slice(0, 3)
    .map(([questionId]) => questionId);
  return {
    studyDays: dayKeys.size,
    completedSessions: completedSessions.length,
    answers: answers.length,
    correctAnswers: answers.filter((event) => event.correct).length,
    accuracy: answers.length
      ? Math.round(
          (answers.filter((event) => event.correct).length / answers.length) *
            100,
        )
      : null,
    englishConcepts: new Set(englishAnswers.map((event) => event.questionId))
      .size,
    weakConcepts,
  };
}
