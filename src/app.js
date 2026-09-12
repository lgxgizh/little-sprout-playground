import "./styles.css";
import "./overrides.css";
import { requestNextQuestion, requestSpeech } from "./ai.js";
import {
  BASELINE_MAX_ITEMS,
  selectBaselineQuestions,
  shouldStopBaseline,
  summarizeBaseline,
  suggestedLevelFromBaseline,
} from "./assessment.js";
import {
  ANIMATION_FEATURE,
  createDemoAnimations,
  loadAnimationLibrary,
  mergeAnimationShelf,
  normalizeAnimationEntry,
  parentAnimationSummary,
  saveAnimationLibrary,
  summarizeAnimationAttempts,
} from "./animation-quiz.js";
import {
  LISTENING_FEATURE,
  createListeningSeedQuestions,
  enrichQuestionImages,
  pickSessionQuestion,
} from "./listening.js";
import {
  homeHubMarkup,
  listeningHubMarkup,
  animationHubMarkup,
  videoHubMarkup,
} from "./hub-ui.js";
import { parentModelsMarkup } from "./parent-ui.js";
import { listeningResultMarkup, playStageMarkup } from "./play-ui.js";
import {
  bankIdFromTheme,
  bankPreviewWords,
  clampListeningCount,
  recommendedListeningCount,
  catalogBankFiles,
  findListeningBank,
  LISTENING_COUNTS,
  listListeningBanks,
  listeningPoolForBank,
  loadListeningPrefs,
  pickListeningRound,
  saveListeningPrefs,
} from "./wordbank.js";
import {
  chooseQuestionCandidates,
  stageDefinition,
  stageFromBaseline,
  summarizeWeek,
  updateEnglishPlan,
} from "./learning-plan.js";
import {
  CUSTOM_STORAGE_KEY,
  defaultModels,
  emptyCustomConfig,
  isAdapterModel,
  modelName as catalogModelName,
  normalizeCustomConfig,
  resolveModels,
} from "./model-config.js";
import { escapeHtml } from "./quiz-ui.js";
import { speakWithVoice } from "./speech.js";
import {
  addLearningEvent,
  clearLearningData,
  createDefaultChild,
  createDefaultProfile,
  loadChildren,
  parseLearningData,
  saveAttempt,
  saveChild,
  saveProfile,
  saveReward,
  saveSession,
  replaceLearningData,
  serializeLearningData,
} from "./storage.js";

const courses = [
  {
    id: "english",
    label: LISTENING_FEATURE.title,
    subtitle: LISTENING_FEATURE.subtitle,
    emoji: LISTENING_FEATURE.emoji,
    tone: LISTENING_FEATURE.tone,
    duration: "5–8 min",
    tag: "Kid feature",
  },
  {
    id: "animation",
    label: ANIMATION_FEATURE.title,
    subtitle: ANIMATION_FEATURE.subtitle,
    emoji: ANIMATION_FEATURE.emoji,
    tone: ANIMATION_FEATURE.tone,
    duration: "~12 sec + Q",
    tag: "Kid feature",
  },
];

const assetBase = import.meta.env.BASE_URL;

let questionBank = {
  english: createListeningSeedQuestions(assetBase),
};

const offlineTasks = {
  english: {
    title: "English Listening Play",
    prompt: "Say apple, cat, or ball with a grown-up",
    emoji: "🎧",
  },
  animation: {
    title: "Story Replay",
    prompt: "Watch the fox GIF again and point to the apple",
    emoji: "🎞️",
  },
};

const savedModels = (() => {
  try {
    return JSON.parse(
      localStorage.getItem("little-sprout-models") ||
        localStorage.getItem("little-fun-models") ||
        "{}",
    );
  } catch {
    return {};
  }
})();
const models = resolveModels(savedModels);
const customModels = (() => {
  try {
    return normalizeCustomConfig(
      JSON.parse(localStorage.getItem(CUSTOM_STORAGE_KEY) || "{}"),
    );
  } catch {
    return emptyCustomConfig();
  }
})();

let profile = createDefaultProfile();
let children = [];
let activeChildId = null;
let wordbankCatalog = null;
let loadedWordbanks = {};
let startersWordbank = null;

const childLabels = {
  gender: {
    unspecified: "不特别设置",
    girl: "女孩",
    boy: "男孩",
  },
  englishLevel: {
    "not-started": "刚开始接触",
    songs: "听过英文儿歌",
    words: "认识一些英文单词",
    conversation: "能听懂简单表达",
  },
};

const state = {
  activeTab: "home",
  playing: null,
  step: 1,
  answered: false,
  correct: false,
  soundOn: true,
  modal: false,
  encouragement: "",
  parentGate: false,
  parentUnlocked: false,
  parentTab: "child",
  activeSession: null,
  offlineTaskDone: false,
  activityCourse: "english",
  questionIndex: 0,
  sessionQuestionIds: [],
  selectedChoice: null,
  activityComplete: false,
  baselineTest: false,
  baselineCorrect: 0,
  baselineAnswers: [],
  baselinePool: [],
  animationMode: false,
  activeAnimationId: null,
  animationPhase: "watch",
  animationLibrary: [],
  sessionBlobUrls: [],
  aiQuestionId: null,
  aiPlanning: false,
  aiPlanSource: "local",
  aiPlanMessage: "",
  aiPlanToken: 0,
  kidView: "home",
  listeningBankId: "starters",
  listeningTheme: "all",
  listeningCount: 8,
  listeningGoal: 8,
  listeningQueue: [],
  activeQuestionId: null,
  roundCorrect: 0,
  roundAnswered: 0,
};

function todayKey(date = new Date()) {
  return date
    .toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replaceAll("/", "-");
}

function activeChild() {
  return children.find((child) => child.id === activeChildId) || children[0];
}

function persistActiveChild() {
  const child = activeChild();
  if (child) {
    child.profile = profile;
    void saveChild(child);
  }
  void saveProfile(profile);
}

function resetActiveActivity() {
  state.aiPlanToken += 1;
  state.aiPlanning = false;
  state.aiQuestionId = null;
  state.activeSession = null;
  state.baselineTest = false;
  state.baselineCorrect = 0;
  state.baselineAnswers = [];
  state.baselinePool = [];
  state.animationMode = false;
  state.activeAnimationId = null;
  state.animationPhase = "watch";
  for (const url of state.sessionBlobUrls || []) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }
  state.sessionBlobUrls = [];
  state.offlineTaskDone = false;
  state.answered = false;
  state.correct = false;
  state.selectedChoice = null;
  state.activityComplete = false;
  state.sessionQuestionIds = [];
  state.activeQuestionId = null;
  state.roundCorrect = 0;
  state.roundAnswered = 0;
}

function switchChild(childId) {
  const next = children.find((child) => child.id === childId);
  if (!next || next.id === activeChildId) return;
  if (state.activeSession) completeSession("quit");
  const current = activeChild();
  if (current) {
    current.profile = profile;
    void saveChild(current);
  }
  activeChildId = next.id;
  profile = next.profile;
  resetActiveActivity();
  applyWordbankPool();
}

function touchLearningDay() {
  const today = todayKey();
  if (profile.lastActive === today) return;
  const previous = new Date();
  previous.setDate(previous.getDate() - 1);
  profile.streak =
    profile.lastActive === todayKey(previous) ? profile.streak + 1 : 1;
  profile.lastActive = today;
}

function activeAnimation() {
  return (
    state.animationLibrary.find(
      (video) => video.id === state.activeAnimationId,
    ) || null
  );
}

function sessionQuestionTotal() {
  if (state.animationMode) {
    return Math.max(1, activeAnimation()?.questions?.length || 1);
  }
  if (state.baselineTest) {
    if (state.activityComplete && state.baselineAnswers.length) {
      return state.baselineAnswers.length;
    }
    return Math.max(
      state.baselinePool.length || BASELINE_MAX_ITEMS,
      state.questionIndex + 1,
    );
  }
  return state.listeningGoal || 8;
}

function lockQuestion(question) {
  if (question?.id && !state.activeQuestionId)
    state.activeQuestionId = question.id;
  return question;
}

function currentQuestion() {
  let question = null;
  if (state.animationMode) {
    const item = activeAnimation();
    const questions = item?.questions || [];
    question = pickSessionQuestion(questions, {
      lockedId: state.activeQuestionId,
      sessionQuestionIds: state.sessionQuestionIds,
    }) || {
      id: "animation-empty",
      visual: "🎞️",
      prompt: "Watch the animation, then tap a picture",
      speech: "Watch the animation, then tap a picture.",
      answer: "apple",
      choices: [
        { label: "Apple", emoji: "🍎", value: "apple", color: "#ff6b5e" },
        { label: "Ball", emoji: "⚽", value: "ball", color: "#6db6e8" },
      ],
    };
    lockQuestion(question);
    return enrichQuestionImages(question, assetBase);
  }
  const questions = questionBank.english;
  const aiQuestion = questions.find((item) => item.id === state.aiQuestionId);
  if (aiQuestion) {
    lockQuestion(aiQuestion);
    return enrichQuestionImages(aiQuestion, assetBase);
  }
  if (!state.baselineTest && state.listeningQueue.length) {
    const nextId =
      state.activeQuestionId ||
      state.listeningQueue.find((id) => !state.sessionQuestionIds.includes(id));
    question = questions.find((item) => item.id === nextId) || questions[0];
    lockQuestion(question);
    return enrichQuestionImages(question, assetBase);
  }
  const child = activeChild();
  const candidates = state.baselineTest
    ? state.baselinePool.length
      ? state.baselinePool
      : selectBaselineQuestions(questions, child?.age || 3)
    : chooseQuestionCandidates({
        questions,
        plan: child?.englishPlan,
        questionStats: profile.questionStats,
        sessionQuestionIds: state.sessionQuestionIds,
        age: child?.age,
      });
  question =
    pickSessionQuestion(candidates, {
      lockedId: state.activeQuestionId,
      sessionQuestionIds: state.sessionQuestionIds,
    }) || questions[0];
  lockQuestion(question);
  return enrichQuestionImages(question, assetBase);
}

function makeId(prefix) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

function beginSession(courseId, baselineTest = false, options = {}) {
  const sameCourse = state.activeSession?.courseId === courseId;
  const sameVideo =
    !options.animationId || state.activeAnimationId === options.animationId;
  if (sameCourse && sameVideo && !options.force) return;
  if (state.activeSession) completeSession("quit");
  state.activityCourse = courseId;
  state.questionIndex = 0;
  state.sessionQuestionIds = [];
  state.activeQuestionId = null;
  if (courseId !== "english" || baselineTest) state.listeningQueue = [];
  state.answered = false;
  state.correct = false;
  state.selectedChoice = null;
  state.activityComplete = false;
  state.offlineTaskDone = false;
  state.roundCorrect = 0;
  state.roundAnswered = 0;
  state.baselineTest = baselineTest;
  state.baselineCorrect = 0;
  state.baselineAnswers = [];
  state.animationMode = Boolean(options.animationId);
  state.activeAnimationId = options.animationId || null;
  state.animationPhase = options.animationId ? "watch" : "watch";
  state.baselinePool = baselineTest
    ? selectBaselineQuestions(questionBank.english, activeChild()?.age || 3)
    : [];
  state.aiQuestionId = null;
  state.aiPlanning = false;
  state.aiPlanSource = "local";
  state.aiPlanMessage = "";
  state.aiPlanToken += 1;
  const startedAt = new Date().toISOString();
  state.activeSession = {
    id: makeId("session"),
    courseId,
    startedAt,
    animationId: options.animationId || null,
    videoId: options.animationId || null,
  };
  applyWordbankPool();
  const event = {
    type: "session_started",
    courseId,
    animationId: options.animationId || null,
    videoId: options.animationId || null,
    at: startedAt,
  };
  profile.events.push(event);
  profile.events = profile.events.slice(-60);
  persistActiveChild();
  addLearningEvent(event);
  saveSession({
    id: state.activeSession.id,
    courseId,
    animationId: options.animationId || null,
    videoId: options.animationId || null,
    startedAt,
    status: "started",
  });
}

function completeSession(status = "completed") {
  const session = state.activeSession;
  if (!session) return;
  const completedAt = new Date().toISOString();
  const durationMs = Math.max(
    0,
    Date.now() - new Date(session.startedAt).getTime(),
  );
  if (status === "completed") {
    touchLearningDay();
    profile.totalSessions += 1;
    if (profile.skills[session.courseId])
      profile.skills[session.courseId].lastPracticed = completedAt;
  }
  const event = {
    type: `session_${status}`,
    courseId: session.courseId,
    videoId: session.animationId || null,
    at: completedAt,
    durationMs,
  };
  profile.events.push(event);
  profile.events = profile.events.slice(-60);
  persistActiveChild();
  addLearningEvent(event);
  saveSession({ ...session, completedAt, durationMs, status });
  state.activeSession = null;
  if (status === "completed" || status === "quit") {
    state.animationMode = false;
    state.activeAnimationId = null;
    state.animationPhase = "watch";
  }
}

function recordAnswer(courseId, correct, question) {
  touchLearningDay();
  profile.totalAnswers += 1;
  if (correct) profile.correctAnswers += 1;
  if (!profile.skills[courseId] && courseId === "animation") {
    profile.skills.animation = { attempts: 0, correct: 0, lastPracticed: null };
  }
  const skill = profile.skills[courseId];
  if (skill) {
    skill.attempts += 1;
    if (correct) skill.correct += 1;
    skill.lastPracticed = new Date().toISOString();
  }
  if (correct) {
    profile.stars += 1;
    if (profile.stars % 5 === 0) {
      profile.awards.push({
        id: `stars-${profile.stars}`,
        label: `${profile.stars} 颗小星星`,
        at: new Date().toISOString(),
      });
    }
  }
  const event = {
    type: "answer",
    courseId,
    questionId: question.id,
    difficulty: question.difficulty || 1,
    animationId: state.activeAnimationId || null,
    videoId: state.activeAnimationId || null,
    correct,
    at: new Date().toISOString(),
  };
  const questionStat = profile.questionStats[question.id] || {
    attempts: 0,
    correct: 0,
    lastPracticed: null,
    lastCorrect: null,
  };
  questionStat.attempts += 1;
  if (correct) questionStat.correct += 1;
  questionStat.lastPracticed = event.at;
  questionStat.lastCorrect = correct;
  profile.questionStats[question.id] = questionStat;
  // Slim listening path uses word-bank queues; do not write review-queue chrome.
  if (
    courseId === "english" &&
    !state.baselineTest &&
    !state.listeningQueue.length
  ) {
    const child = activeChild();
    if (child)
      child.englishPlan = updateEnglishPlan(
        child.englishPlan,
        question.id,
        correct,
        event.at,
      );
  }
  if (!state.sessionQuestionIds.includes(question.id))
    state.sessionQuestionIds.push(question.id);
  profile.events.push(event);
  profile.events = profile.events.slice(-60);
  persistActiveChild();
  addLearningEvent(event);
  saveAttempt({
    id: makeId("attempt"),
    sessionId: state.activeSession?.id || null,
    courseId,
    animationId: state.activeAnimationId || null,
    videoId: state.activeAnimationId || null,
    correct,
    at: event.at,
    questionId: question.id,
    difficulty: question.difficulty || 1,
    selectedChoice: state.selectedChoice,
    hintUsed: false,
  });
}

function recommendation() {
  const preferenceOrder = ["english", "animation"];
  const child = activeChild();
  const dueReviews = (child?.englishPlan?.reviewQueue || []).filter(
    (item) => !item.dueAt || new Date(item.dueAt).getTime() <= Date.now(),
  );
  if (dueReviews.length) {
    const stage = stageDefinition(child.englishPlan.stage);
    return {
      course: courses.find((course) => course.id === "english") || courses[0],
      reason: `${dueReviews.length} review ${dueReviews.length === 1 ? "word" : "words"} are ready`,
      accuracy: profile.skills.english?.attempts
        ? Math.round(
            (profile.skills.english.correct / profile.skills.english.attempts) *
              100,
          )
        : 0,
      stage,
    };
  }
  const ranked = Object.entries(profile.skills)
    .filter(([id]) => preferenceOrder.includes(id))
    .sort(([a, left], [b, right]) => {
      const leftScore = left.attempts ? left.correct / left.attempts : -1;
      const rightScore = right.attempts ? right.correct / right.attempts : -1;
      if (leftScore !== rightScore) return leftScore - rightScore;
      const recentOrder = (left.lastPracticed || "").localeCompare(
        right.lastPracticed || "",
      );
      return (
        recentOrder || preferenceOrder.indexOf(a) - preferenceOrder.indexOf(b)
      );
    });
  const [courseId, skill] = ranked[0] || [
    "english",
    { attempts: 0, correct: 0 },
  ];
  const course = courses.find((item) => item.id === courseId) || courses[0];
  const accuracy = skill.attempts
    ? Math.round((skill.correct / skill.attempts) * 100)
    : 0;
  const reason = !skill.attempts
    ? "A fresh start is ready"
    : accuracy < 70
      ? "A few more tries will build confidence"
      : "Great work—let's keep it fresh";
  return { course, reason, accuracy };
}

function relativeTime(iso) {
  if (!iso) return "还没开始";
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} 小时前`;
  return new Date(iso).toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
  });
}

function skillProgress() {
  return `<div class="skill-progress">${courses
    .map((course) => {
      const skill = profile.skills[course.id];
      const accuracy = skill?.attempts
        ? Math.round((skill.correct / skill.attempts) * 100)
        : 0;
      return `<div class="skill-row"><span class="skill-name"><span>${course.emoji}</span><b>${course.label}</b></span><span class="skill-score">${skill?.attempts ? `${accuracy}%` : "未开始"}</span><div class="skill-bar"><i style="width:${accuracy}%"></i></div></div>`;
    })
    .join("")}</div>`;
}

function recentActivity() {
  const recent = profile.events.slice(-4).reverse();
  if (!recent.length)
    return `<div class="recent-empty">完成一次游戏后，这里会出现成长足迹 🌱</div>`;
  return `<div class="recent-activity"><b>最近足迹</b>${recent
    .map((event) => {
      const course =
        courses.find((item) => item.id === event.courseId) || courses[0];
      const copy =
        event.type === "answer"
          ? event.correct
            ? "Found it and earned a star"
            : "A brave try—let's try again"
          : event.type === "offline_task_completed"
            ? "Finished an off-screen play task"
            : event.type === "session_completed"
              ? "Finished a play session"
              : "Started a play session";
      return `<div class="activity-row"><span>${course.emoji}</span><span><b>${course.label}</b><small>${copy}</small></span><time>${relativeTime(event.at)}</time></div>`;
    })
    .join("")}</div>`;
}

function profileSummary() {
  const accuracy = profile.totalAnswers
    ? Math.round((profile.correctAnswers / profile.totalAnswers) * 100)
    : 0;
  const coveredQuestions = Object.values(profile.questionStats || {}).filter(
    (stat) => stat.attempts,
  ).length;
  const child = activeChild();
  const recommendationText = recommendation();
  return `<div class="profile-summary"><div class="summary-head"><span>🌱</span><div><b>${escapeHtml(child?.nickname || "Little learner")} · Learning profile</b><small>Saved on this device only</small></div></div><div class="summary-stats"><div><strong>${profile.streak}</strong><small>days in a row</small></div><div><strong>${profile.totalSessions}</strong><small>play sessions</small></div><div><strong>${accuracy}%</strong><small>answer accuracy</small></div><div><strong>${profile.stars}</strong><small>stars collected</small></div></div><div class="question-coverage"><span>🧩</span><span>Explored <b>${coveredQuestions}</b> little questions</span><small>Local rules and the AI adapter use this practice history</small></div>${skillProgress()}${recentActivity()}<div class="summary-recommendation"><span>✨</span><span>Next up: <b>${recommendationText.course.label}</b><small>${recommendationText.reason}</small></span></div><button class="clear-profile" id="clearProfile">Clear learning data on this device</button></div>`;
}

function weeklyGrowthCard() {
  const child = activeChild();
  const plan = child?.englishPlan;
  const stage = stageDefinition(plan?.stage);
  const week = summarizeWeek(profile.events, profile.questionStats);
  const weakLabels = week.weakConcepts.map((id) => id.replace(/^english-/, ""));
  const suggestion = weakLabels.length
    ? `Next week, meet ${weakLabels.join(", ")} again`
    : week.answers
      ? "Keep each play session short and happy"
      : "Pick a gentle English game to begin";
  return `<section class="weekly-growth"><div class="weekly-growth-head"><span class="weekly-growth-icon">🌤️</span><div><b>本周成长卡</b><small>最近 7 天 · ${escapeHtml(child?.nickname || "小朋友")}</small></div><span class="stage-pill">第 ${stage.id} 阶段</span></div><div class="weekly-stats"><div><strong>${week.studyDays}</strong><small>学习天数</small></div><div><strong>${week.completedSessions}</strong><small>完成次数</small></div><div><strong>${week.answers}</strong><small>答题数量</small></div><div><strong>${week.accuracy === null ? "—" : `${week.accuracy}%`}</strong><small>本周正确率</small></div></div><div class="weekly-growth-detail"><span>🔤</span><span>英语路径：<b>${stage.label}</b><small>已探索 ${week.englishConcepts} 个英语小概念</small></span></div><p class="weekly-growth-suggestion">✨ ${suggestion}</p></section>`;
}

function offlineTaskMarkup(courseId) {
  const task = offlineTasks[courseId] || offlineTasks.english;
  return `<div class="offline-task ${state.offlineTaskDone ? "done" : ""}"><span class="offline-task-emoji">${task.emoji}</span><span><b>${task.title}</b><small>${state.offlineTaskDone ? "All done—high five!" : task.prompt}</small></span><button id="offlineDone" ${state.offlineTaskDone ? "disabled" : ""}>${state.offlineTaskDone ? "✓" : "Done"}</button></div>`;
}

function baselineResultMarkup() {
  const child = activeChild();
  const summary =
    child?.baseline?.summary ||
    summarizeBaseline({
      score: state.baselineCorrect,
      total: Math.max(state.baselineAnswers.length, 1),
      answers: state.baselineAnswers,
      questions: state.baselinePool,
    });
  return `<div class="baseline-result"><span class="baseline-result-icon">🎈</span><span><b>${escapeHtml(summary.headline || "English check complete!")}</b><small>${escapeHtml(summary.detail || "")}</small></span></div>`;
}

function animationResultMarkup() {
  const correct = Number(state.roundCorrect) || 0;
  const total = Math.max(
    Number(state.roundAnswered) || 0,
    activeAnimation()?.questions?.length || 1,
  );
  const stats = summarizeAnimationAttempts(
    profile.events,
    state.activeAnimationId,
  );
  return listeningResultMarkup({
    correct,
    total,
    mode: "animation",
    detail: parentAnimationSummary(stats),
  });
}

function englishListeningResultMarkup() {
  const correct = Number(state.roundCorrect) || 0;
  const total = Math.max(
    Number(state.roundAnswered) || 0,
    Number(state.listeningGoal) || 0,
    1,
  );
  return listeningResultMarkup({ correct, total, mode: "listening" });
}
function modelName(type) {
  return catalogModelName(type, models);
}

function featuredAnimationDemo() {
  return (
    state.animationLibrary.find((item) => item.id === "demo-fox-apple") ||
    state.animationLibrary.find((item) => item.demo) ||
    createDemoAnimations(assetBase)[0]
  );
}

/** @deprecated Prefer featuredAnimationDemo */
const featuredVideoDemo = featuredAnimationDemo;

function listeningBanks() {
  if (wordbankCatalog) {
    return listListeningBanks(wordbankCatalog, loadedWordbanks);
  }
  if (startersWordbank) {
    return listListeningBanks(
      {
        schemaVersion: 1,
        defaultBankId: "starters",
        banks: [
          {
            id: "starters",
            label: "剑桥 Starters 全库",
            file: "wordbank.starters.json",
          },
        ],
      },
      {
        "wordbank.starters.json": startersWordbank,
        starters: startersWordbank,
      },
    );
  }
  return [
    {
      id: "starters",
      label: "剑桥 Starters 全库",
      count: questionBank.english.length,
      theme: "all",
      words: [],
    },
  ];
}

function selectedListeningBank() {
  const banks = listeningBanks();
  return (
    banks.find((bank) => bank.id === state.listeningBankId) || banks[0] || null
  );
}

function persistListeningPrefs() {
  const bank = selectedListeningBank();
  state.listeningTheme = bank?.theme || "all";
  saveListeningPrefs({
    bankId: state.listeningBankId,
    count: state.listeningCount,
    theme: state.listeningTheme,
  });
}

function listeningBankPreviews(bank, limit = 8) {
  const base = assetBase.endsWith("/") ? assetBase : `${assetBase}/`;
  return bankPreviewWords(bank, limit).map((word) => ({
    src: `${base}${String(word.image).replace(/^\//, "")}`,
    lemma: word.lemma,
  }));
}

function applyWordbankPool() {
  const bank =
    selectedListeningBank() ||
    findListeningBank(wordbankCatalog, state.listeningBankId);
  if (!bank && !startersWordbank) return;
  const pool = listeningPoolForBank(
    bank || {
      id: "starters",
      file: "wordbank.starters.json",
      theme: state.listeningTheme || "all",
    },
    {
      ...loadedWordbanks,
      "wordbank.starters.json":
        loadedWordbanks["wordbank.starters.json"] || startersWordbank,
      starters: startersWordbank,
    },
    {
      childId: activeChild()?.id || "default",
      assetBase,
      salt: state.activeSession?.id || "home",
      shuffle: false,
    },
  );
  if (!pool.length) return;
  questionBank.english = pool;
  const available = pool.length;
  state.listeningGoal = clampListeningCount(state.listeningCount, available);
  if (
    state.activeSession &&
    !state.baselineTest &&
    state.activityCourse === "english"
  ) {
    const round = pickListeningRound(pool, state.listeningGoal);
    state.listeningQueue = round.map((question) => question.id);
  }
}

async function loadWordbankFile(fileName) {
  const response = await fetch(`${assetBase}content/${fileName}`, {
    cache: "no-store",
  });
  if (!response.ok) return null;
  const payload = await response.json();
  if (payload?.schemaVersion !== 1) return null;
  const hasWords = Array.isArray(payload.words) && payload.words.length > 0;
  const hasPairs = Array.isArray(payload.pairs) && payload.pairs.length > 0;
  if (!hasWords && !hasPairs) return null;
  return payload;
}

async function loadWordbank() {
  try {
    const catalogResponse = await fetch(`${assetBase}content/wordbanks.json`, {
      cache: "no-store",
    });
    if (catalogResponse.ok) {
      const catalog = await catalogResponse.json();
      if (catalog?.schemaVersion === 1 && Array.isArray(catalog.banks)) {
        wordbankCatalog = catalog;
      }
    }
  } catch {
    wordbankCatalog = null;
  }

  const files = catalogBankFiles(wordbankCatalog);
  if (!files.includes("wordbank.starters.json")) {
    files.push("wordbank.starters.json");
  }

  const nextLoaded = { ...loadedWordbanks };
  for (const fileName of files) {
    try {
      const payload = await loadWordbankFile(fileName);
      if (!payload) continue;
      nextLoaded[fileName] = payload;
      if (fileName === "wordbank.starters.json") {
        startersWordbank = payload;
        nextLoaded.starters = payload;
      }
    } catch {
      // Keep going so one missing pack does not block the rest.
    }
  }
  loadedWordbanks = nextLoaded;
  if (wordbankCatalog?.banks) {
    for (const bank of wordbankCatalog.banks) {
      if (bank?.id && bank?.file && nextLoaded[bank.file]) {
        loadedWordbanks[bank.id] = nextLoaded[bank.file];
      }
    }
  }

  if (!wordbankCatalog && startersWordbank) {
    wordbankCatalog = {
      schemaVersion: 1,
      defaultBankId: "starters",
      banks: [
        {
          id: "starters",
          label: "剑桥 Starters 全库",
          file: "wordbank.starters.json",
        },
      ],
    };
  }

  const banks = listListeningBanks(wordbankCatalog, loadedWordbanks);
  if (!banks.some((bank) => bank.id === state.listeningBankId) && banks[0]) {
    state.listeningBankId = banks[0].id;
  }
  const selected = selectedListeningBank();
  state.listeningTheme = selected?.theme || "all";
  state.listeningCount = clampListeningCount(
    state.listeningCount,
    selected?.count || state.listeningCount,
  );
  applyWordbankPool();
}

function childProfileSettings() {
  const child = activeChild() || createDefaultChild();
  const baseline =
    child.baseline?.status === "complete"
      ? `已完成：${child.baseline.score} / ${child.baseline.total}${child.baseline.summary?.readyFor ? ` · ${child.baseline.summary.readyFor}` : ""}`
      : "还没有做过听力图片测评";
  const stage = stageDefinition(child.englishPlan?.stage);
  return `<div class="child-profile-settings"><div class="child-switch-row"><label><span>当前孩子</span><select id="childSelect">${children.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === child.id ? "selected" : ""}>${escapeHtml(item.nickname)}</option>`).join("")}</select></label><button class="small-action" id="addChild">＋ 添加孩子</button></div><div class="child-form-grid"><label><span>孩子昵称</span><input id="childNickname" maxlength="12" value="${escapeHtml(child.nickname)}" placeholder="例如：小米" /></label><label><span>年龄</span><select id="childAge">${[2, 3, 4, 5, 6].map((age) => `<option value="${age}" ${Number(child.age) === age ? "selected" : ""}>${age} 岁</option>`).join("")}</select></label><label><span>性别（可不填）</span><select id="childGender">${Object.entries(
    childLabels.gender,
  )
    .map(
      ([value, label]) =>
        `<option value="${escapeHtml(value)}" ${child.gender === value ? "selected" : ""}>${label}</option>`,
    )
    .join(
      "",
    )}</select></label><label><span>英语基础</span><select id="childEnglishLevel">${Object.entries(
    childLabels.englishLevel,
  )
    .map(
      ([value, label]) =>
        `<option value="${escapeHtml(value)}" ${child.englishLevel === value ? "selected" : ""}>${label}</option>`,
    )
    .join(
      "",
    )}</select></label></div><div class="baseline-row"><span>当前英语路径：<b>第 ${stage.id} 阶段 · ${stage.label}</b><small>${baseline} · 听力主路径为词库抽题</small></span></div><div class="video-register"><div class="config-divider"><span>本地动画理解（GIF/图片）</span></div><p class="video-register-note">添加本地 GIF 或图片（本机文件或 <code>public/assets/stories</code> 路径）。孩子流程：观看 → 听题 → 点大图。旧版 MP4 已降级，不再作为主演示。</p><label><span>标题</span><input id="animationTitle" maxlength="40" placeholder="例如：Fox finds an apple" /></label><label><span>资源路径或选择文件</span><input id="animationAssetPath" maxlength="160" placeholder="assets/stories/fox-apple.gif" /><input id="animationFile" type="file" accept="image/gif,image/png,image/webp,image/jpeg,video/mp4,video/webm" /></label><label><span>题目英文提示</span><input id="animationPrompt" maxlength="80" placeholder="What fruit did you see?" value="What fruit did you see?" /></label><label><span>正确答案</span><input id="animationAnswer" maxlength="40" placeholder="apple" value="apple" /></label><div class="video-choice-row"><label><span>选项 A</span><input id="animationChoiceA" maxlength="20" value="apple" /></label><label><span>选项 B</span><input id="animationChoiceB" maxlength="20" value="banana" /></label><label><span>选项 C</span><input id="animationChoiceC" maxlength="20" value="ball" /></label><label><span>选项 D</span><input id="animationChoiceD" maxlength="20" value="cup" /></label></div><button class="small-action" id="addAnimationClip">＋ 登记本地动画</button><div class="video-library-list">${(state.animationLibrary.filter((v) => !v.demo) || []).map((item) => `<div class="video-library-item"><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.src)}</small><button class="text-btn" data-remove-animation="${escapeHtml(item.id)}">移除</button></div>`).join("") || "<small>还没有自定义动画</small>"}</div></div><button class="save-child-btn" id="saveChildProfile">保存孩子信息</button></div>`;
}

function saveChildForm() {
  const child = activeChild();
  const nicknameInput = document.querySelector("#childNickname");
  if (!child || !nicknameInput) return;
  const nickname = nicknameInput.value.trim();
  child.nickname = nickname || "Sunny";
  child.age = Number(document.querySelector("#childAge")?.value) || 3;
  child.gender = document.querySelector("#childGender")?.value || "unspecified";
  child.englishLevel =
    document.querySelector("#childEnglishLevel")?.value || "not-started";
  persistActiveChild();
}

function saveModels() {
  try {
    localStorage.setItem("little-sprout-models", JSON.stringify(models));
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(customModels));
  } catch {
    /* 隐私模式下仍可继续使用当前会话设置 */
  }
}

let advanceTimer = 0;

function clearAdvanceTimer() {
  if (advanceTimer) {
    clearTimeout(advanceTimer);
    advanceTimer = 0;
  }
}

function scheduleAdvance() {
  clearAdvanceTimer();
  if (!state.answered || !state.correct || state.activityComplete) return;
  advanceTimer = setTimeout(() => {
    document.querySelector("#nextQuestion")?.click();
  }, 1100);
}

function speak(text, question = null) {
  void speakWithVoice({
    text,
    soundOn: state.soundOn,
    voiceId: models.voice,
    question: question || currentQuestion(),
    assetBase,
    requestSpeech,
    custom: customModels,
    onToast: showToast,
  });
}

async function planQuestionWithAI() {
  if (
    !isAdapterModel("vocab", models.vocab) ||
    !state.activeSession ||
    state.answered ||
    state.animationMode ||
    state.baselineTest ||
    state.listeningQueue.length
  ) {
    state.aiPlanning = false;
    state.aiQuestionId = null;
    state.aiPlanSource = "local";
    state.aiPlanMessage = "";
    return null;
  }

  const courseId = state.activityCourse;
  const sessionId = state.activeSession.id;
  const token = ++state.aiPlanToken;
  const allCandidates = state.baselineTest
    ? state.baselinePool.length
      ? state.baselinePool
      : selectBaselineQuestions(questionBank.english, activeChild()?.age || 3)
    : chooseQuestionCandidates({
        questions: questionBank.english,
        plan: activeChild()?.englishPlan,
        questionStats: profile.questionStats,
        sessionQuestionIds: state.sessionQuestionIds,
        age: activeChild()?.age,
      });
  const unseenCandidates = allCandidates.filter(
    (question) => !state.sessionQuestionIds.includes(question.id),
  );
  const candidates = unseenCandidates.length ? unseenCandidates : allCandidates;
  state.aiPlanning = true;
  state.aiPlanSource = "ai";
  state.aiPlanMessage = "Little Sprout is choosing a just-right question…";
  render();

  const result = await requestNextQuestion({
    model: models.vocab,
    profile,
    activityCourse: courseId,
    child: activeChild(),
    candidates,
    custom: customModels,
  });

  if (
    token !== state.aiPlanToken ||
    state.activeSession?.id !== sessionId ||
    state.activityCourse !== courseId
  ) {
    return result;
  }

  state.aiPlanning = false;
  if (result) {
    state.aiQuestionId = result.questionId;
    state.aiPlanSource = "ai";
    state.aiPlanMessage = "A smart helper picked a question for you";
  } else {
    state.aiQuestionId = null;
    state.aiPlanSource = "local";
    state.aiPlanMessage = "Playing with the local question bank";
  }
  render();
  return result;
}

function animationWatchMarkup() {
  const item = activeAnimation();
  if (!item) return "";
  const isImage =
    item.mediaType === "image" ||
    /\.(gif|png|webp|jpe?g)(\?|$)/i.test(item.src);
  const media = isImage
    ? `<img id="comprehensionAnimation" class="comprehension-animation" src="${escapeHtml(item.src)}" alt="${escapeHtml(item.title)}" />`
    : `<video id="comprehensionAnimation" class="comprehension-animation" src="${escapeHtml(item.src)}" poster="${escapeHtml(item.poster || "")}" controls playsinline></video>`;
  return `<div class="video-player-card animation-player-card">${media}<div class="video-player-copy"><b>${escapeHtml(item.title)}</b><small>Look and listen. Grown-ups can pause anytime.</small></div></div>`;
}

function kidChrome(inner) {
  const childName = escapeHtml(activeChild()?.nickname || "Sunny");
  return `
    <div class="app-shell is-hub">
      <header class="topbar">
        <div class="brand"><span class="brand-mark">✦</span><span>Little Sprout</span><small>${childName}</small></div>
        <div class="top-actions"><button class="icon-btn" id="soundToggle" aria-label="Sound on or off">${state.soundOn ? "🔊" : "🔇"}</button><button class="parent-btn" id="openParent">Parent <span>⌄</span></button></div>
      </header>
      <main class="hub-main">${inner}</main>
      ${state.modal ? modelSettingsModal() : ""}
      <div class="toast" id="toast">Ready to play</div>
    </div>`;
}

function playResultHtml() {
  if (!state.activityComplete) return "";
  if (state.baselineTest) return baselineResultMarkup();
  if (state.animationMode) return animationResultMarkup();
  if (state.activityCourse === "english") return englishListeningResultMarkup();
  // Kid path only uses listening / animation result markups.
  return animationResultMarkup();
}

function render() {
  const question = currentQuestion();
  if (state.activeSession) {
    document.querySelector("#app").innerHTML = `
    <div class="app-shell is-playing">
      ${playStageMarkup({
        question,
        state,
        total: sessionQuestionTotal(),
        watchMediaHtml:
          state.animationMode && state.animationPhase === "watch"
            ? animationWatchMarkup()
            : "",
        resultHtml: playResultHtml(),
      })}
      ${state.modal ? modelSettingsModal() : ""}
      <div class="toast" id="toast">Ready to play</div>
    </div>`;
    bindEvents();
    scheduleAdvance();
    return;
  }
  if (state.kidView === "listening") {
    const banks = listeningBanks();
    const selected = selectedListeningBank() || banks[0];
    document.querySelector("#app").innerHTML = kidChrome(
      listeningHubMarkup({
        banks,
        selectedBankId: selected?.id || state.listeningBankId,
        counts: LISTENING_COUNTS,
        selectedCount: recommendedListeningCount(
          selected?.count || 0,
          state.listeningCount,
        ),
        available: selected?.count || 0,
        activeBankLabel: selected?.label || "",
        previews: listeningBankPreviews(selected),
      }),
    );
    bindEvents();
    return;
  }
  if (state.kidView === "animation" || state.kidView === "video") {
    const demo = featuredAnimationDemo();
    const others = state.animationLibrary.filter(
      (item) => item.id !== demo?.id && !item.demo,
    );
    const stats = demo
      ? summarizeAnimationAttempts(profile.events, demo.id)
      : { answers: 0 };
    document.querySelector("#app").innerHTML = kidChrome(
      animationHubMarkup({
        demo,
        others,
        parentSummary: stats.answers
          ? parentAnimationSummary(stats)
          : "Look first, then tap a picture",
      }),
    );
    bindEvents();
    return;
  }
  document.querySelector("#app").innerHTML = kidChrome(
    homeHubMarkup({
      childName: activeChild()?.nickname || "Sunny",
      assetBase,
    }),
  );
  bindEvents();
}

function modelSettingsModal() {
  if (state.parentGate && !state.parentUnlocked) {
    return `<div class="modal-backdrop" id="modalBackdrop"><div class="modal parent-gate"><div class="modal-icon">🔒</div><h3>家长入口</h3><p>为了不让小朋友误触，请家长长按下面按钮 1 秒钟。</p><button class="hold-btn" id="parentHold"><span>长按进入设置</span><i></i></button><button class="reset-btn" id="parentCancel">先不设置</button></div></div>`;
  }
  const tab = state.parentTab || "child";
  const panel =
    tab === "growth"
      ? `<div class="parent-panel-grid">${profileSummary()}<details class="growth-fold"><summary>本周成长卡</summary>${weeklyGrowthCard()}</details></div>`
      : tab === "models"
        ? parentModelsMarkup({ models, customModels })
        : childProfileSettings();
  return `<div class="modal-backdrop" id="modalBackdrop">
    <div class="modal model-modal parent-sheet">
      <button class="modal-close" id="closeModal" aria-label="关闭">×</button>
      <div class="parent-sheet-head">
        <h3>家长设置</h3>
        <div class="parent-tabs" role="tablist">
          <button type="button" class="parent-tab ${tab === "child" ? "active" : ""}" data-parent-tab="child">孩子</button>
          <button type="button" class="parent-tab ${tab === "growth" ? "active" : ""}" data-parent-tab="growth">成长</button>
          <button type="button" class="parent-tab ${tab === "models" ? "active" : ""}" data-parent-tab="models">设置</button>
        </div>
      </div>
      <div class="parent-sheet-body">${panel}</div>
      <div class="parent-sheet-foot modal-actions">
        ${tab === "models" ? '<button class="reset-btn" id="resetModels">恢复默认</button>' : "<span></span>"}
        <button class="primary-btn" id="closeModal2">完成 <span class="arrow">→</span></button>
      </div>
    </div>
  </div>`;
}

function bindEvents() {
  document.querySelector("#soundToggle")?.addEventListener("click", () => {
    state.soundOn = !state.soundOn;
    render();
  });
  document.querySelector("#backHome")?.addEventListener("click", () => {
    state.kidView = "home";
    render();
  });
  document
    .querySelector("#listeningBankSelect")
    ?.addEventListener("change", (event) => {
      state.listeningBankId = event.target.value || "starters";
      const bank = selectedListeningBank();
      state.listeningTheme = bank?.theme || "all";
      state.listeningCount = clampListeningCount(
        state.listeningCount,
        bank?.count || 0,
      );
      persistListeningPrefs();
      render();
    });
  document.querySelectorAll("[data-listening-bank]").forEach((btn) =>
    btn.addEventListener("click", () => {
      state.listeningBankId = btn.dataset.listeningBank || "starters";
      const bank = selectedListeningBank();
      state.listeningTheme = bank?.theme || "all";
      state.listeningCount = clampListeningCount(
        state.listeningCount,
        bank?.count || 0,
      );
      persistListeningPrefs();
      render();
    }),
  );
  document.querySelectorAll("[data-listening-theme]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const theme = btn.dataset.listeningTheme || "all";
      state.listeningTheme = theme;
      state.listeningBankId = bankIdFromTheme(wordbankCatalog, theme);
      const bank = selectedListeningBank();
      state.listeningCount = clampListeningCount(
        state.listeningCount,
        bank?.count || 0,
      );
      persistListeningPrefs();
      render();
    }),
  );
  document.querySelectorAll("[data-listening-count]").forEach((btn) =>
    btn.addEventListener("click", () => {
      state.listeningCount = Number(btn.dataset.listeningCount) || 8;
      persistListeningPrefs();
      render();
    }),
  );
  document.querySelector("#startListening")?.addEventListener("click", () => {
    state.kidView = "listening";
    applyWordbankPool();
    beginSession("english", false, { force: true });
    render();
    speak(currentQuestion().speech);
  });
  document.querySelector("#startVideoDemo")?.addEventListener("click", () => {
    const animationId =
      document.querySelector("#startVideoDemo")?.dataset.animation ||
      featuredVideoDemo()?.id;
    if (!animationId) return;
    beginSession("animation", false, { animationId, force: true });
    state.animationPhase = "watch";
    state.kidView = "animation";
    render();
    showToast("先看，再点图");
    const player = document.querySelector("#comprehensionAnimation");
    try {
      player?.play?.();
    } catch {
      /* autoplay may be blocked */
    }
  });
  document.querySelectorAll("[data-feature]").forEach((btn) =>
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const feature = btn.dataset.feature;
      if (feature === "video" || feature === "animation") {
        state.kidView = "animation";
        render();
        return;
      }
      state.kidView = "listening";
      render();
    }),
  );
  document.querySelector("#voicePrompt")?.addEventListener("click", () => {
    const question = currentQuestion();
    speak(question?.speech || question?.prompt || "", question);
  });
  document.querySelectorAll("[data-choice]").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (state.aiPlanning || state.answered) return;
      const question = currentQuestion();
      const firstSubmit = !state.sessionQuestionIds.includes(question.id);
      state.answered = true;
      state.selectedChoice = btn.dataset.choice;
      state.correct = btn.dataset.choice === question.answer;
      // Round score counts only the first submit per question.
      if (firstSubmit && !state.baselineTest) {
        state.roundAnswered += 1;
        if (state.correct) state.roundCorrect += 1;
      }
      const courseId = state.animationMode ? "animation" : state.activityCourse;
      recordAnswer(courseId, state.correct, question);
      if (state.baselineTest) {
        if (state.correct) state.baselineCorrect += 1;
        state.baselineAnswers.push({
          questionId: question.id,
          correct: state.correct,
        });
        const recentCorrect = state.baselineAnswers.map((item) => item.correct);
        if (
          shouldStopBaseline({
            answered: state.baselineAnswers.length,
            correct: state.baselineCorrect,
            recentCorrect,
          })
        ) {
          state.activityComplete = true;
        }
      } else if (state.correct) {
        // Wrong answers stay on the same questionIndex for「再选一次」.
        if (state.animationMode) {
          const total = activeAnimation()?.questions?.length || 1;
          if (state.questionIndex >= total - 1) state.activityComplete = true;
        } else if (state.questionIndex >= sessionQuestionTotal() - 1) {
          state.activityComplete = true;
        }
      }
      if (state.baselineTest && state.activityComplete) {
        const child = activeChild();
        const score = state.baselineCorrect;
        const total = state.baselineAnswers.length;
        const summary = summarizeBaseline({
          score,
          total,
          answers: state.baselineAnswers,
          questions: state.baselinePool,
        });
        const suggestedLevel = suggestedLevelFromBaseline(score, total);
        if (child) {
          child.baseline = {
            status: "complete",
            score,
            total,
            completedAt: new Date().toISOString(),
            suggestedLevel,
            summary,
          };
          child.englishPlan = {
            ...child.englishPlan,
            stage: stageFromBaseline(score, total),
            stageStartedAt: new Date().toISOString(),
            masteredConcepts: [],
            reviewQueue: [],
          };
          if (child.englishLevel === "not-started")
            child.englishLevel = suggestedLevel;
          persistActiveChild();
        }
      }
      state.encouragement = state.correct
        ? "对了 · You found it!"
        : "再试一次 · Try this one again";
      if (state.correct) speak("You found it!", question);
      else speak("That's okay. Try this one again.", question);
      render();
    }),
  );
  document.querySelectorAll("[data-animation]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const animationId = btn.dataset.animation;
      beginSession("animation", false, { animationId, force: true });
      state.animationPhase = "watch";
      state.kidView = "animation";
      render();
      showToast("先看，再点图");
      const player = document.querySelector("#comprehensionAnimation");
      try {
        player?.play?.();
      } catch {
        /* autoplay may be blocked; controls remain */
      }
    }),
  );
  document.querySelector("#animationReady")?.addEventListener("click", () => {
    state.animationPhase = "quiz";
    state.questionIndex = 0;
    state.answered = false;
    state.correct = false;
    state.selectedChoice = null;
    state.activeQuestionId = null;
    state.activityComplete = false;
    state.encouragement = "";
    render();
    speak(currentQuestion().speech);
  });
  document.querySelector("#addAnimationClip")?.addEventListener("click", () => {
    const title =
      document.querySelector("#animationTitle")?.value.trim() || "My animation";
    const prompt =
      document.querySelector("#animationPrompt")?.value.trim() ||
      "What fruit did you see?";
    const answer =
      document.querySelector("#animationAnswer")?.value.trim().toLowerCase() ||
      "apple";
    const choiceValues = ["A", "B", "C", "D"]
      .map((key) =>
        document
          .querySelector(`#animationChoice${key}`)
          ?.value.trim()
          .toLowerCase(),
      )
      .filter(Boolean);
    const uniqueChoices = [...new Set(choiceValues)];
    if (uniqueChoices.length < 2 || !uniqueChoices.includes(answer)) {
      showToast("请至少提供两个选项，并让正确答案出现在选项中");
      return;
    }
    const file = document.querySelector("#animationFile")?.files?.[0];
    let src = document.querySelector("#animationAssetPath")?.value.trim() || "";
    let sourceType = "asset";
    if (file) {
      src = URL.createObjectURL(file);
      state.sessionBlobUrls.push(src);
      sourceType = "blob";
    } else if (src) {
      if (
        !src.startsWith("http") &&
        !src.startsWith("/") &&
        !src.startsWith("assets/") &&
        !src.startsWith("blob:")
      ) {
        src = `assets/stories/${src.replace(/^\/?assets\/stories\//, "")}`;
      }
      if (src.startsWith("assets/")) src = `${assetBase}${src}`;
      sourceType = "asset";
    } else {
      showToast("请选择本地 GIF/图片或填写 assets/stories 路径");
      return;
    }
    const entry = normalizeAnimationEntry(
      {
        id: makeId("animation"),
        title,
        description: "Watch, then tap a picture.",
        durationLabel: "short",
        sourceType,
        src,
        poster: `${assetBase}assets/fox-hero.png`,
        questions: [
          {
            id: makeId("anim-q"),
            visual: "🎞️",
            prompt,
            speech: prompt,
            answer,
            choices: uniqueChoices.map((value) => ({
              label: value,
              value,
              imageKey: value,
            })),
          },
        ],
      },
      { allowBlob: true, assetBase },
    );
    if (!entry) {
      showToast("动画题目格式不正确");
      return;
    }
    const custom = [
      ...state.animationLibrary.filter(
        (item) => !item.demo && item.sourceType !== "blob",
      ),
      ...(entry.sourceType === "blob" ? [] : [entry]),
    ];
    saveAnimationLibrary(custom, assetBase);
    state.animationLibrary = mergeAnimationShelf(
      createDemoAnimations(assetBase),
      [...custom, ...(entry.sourceType === "blob" ? [entry] : [])],
    );
    render();
    showToast("本地短片已加入动画提问");
  });
  document.querySelectorAll("[data-remove-animation]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = btn.dataset.removeAnimation;
      const custom = loadAnimationLibrary(assetBase).filter(
        (item) => item.id !== id,
      );
      saveAnimationLibrary(custom, assetBase);
      state.animationLibrary = mergeAnimationShelf(
        createDemoAnimations(assetBase),
        custom,
      );
      render();
      showToast("已移除自定义动画");
    }),
  );
  document.querySelectorAll("[data-model]").forEach((select) =>
    select.addEventListener("change", () => {
      models[select.dataset.model] = select.value;
      saveModels();
      render();
    }),
  );
  document.querySelectorAll("[data-custom-field]").forEach((input) =>
    input.addEventListener("change", () => {
      const type = input.dataset.customType;
      const field = input.dataset.customField;
      if (!customModels[type])
        customModels[type] = { model: "", baseUrl: "", voiceId: "" };
      customModels[type][field] = input.value.trim();
      saveModels();
    }),
  );
  document
    .querySelector("#childSelect")
    ?.addEventListener("change", (event) => {
      saveChildForm();
      switchChild(event.target.value);
      render();
    });
  document.querySelector("#saveChildProfile")?.addEventListener("click", () => {
    saveChildForm();
    render();
    showToast("孩子信息已保存");
  });
  document.querySelector("#addChild")?.addEventListener("click", () => {
    saveChildForm();
    const child = createDefaultChild({ nickname: "新朋友" });
    children.push(child);
    activeChildId = child.id;
    profile = child.profile;
    resetActiveActivity();
    void saveChild(child);
    render();
    showToast("已经添加一个新孩子");
  });
  document.querySelector("#startBaseline")?.addEventListener("click", () => {
    saveChildForm();
    state.modal = false;
    state.parentGate = false;
    beginSession("english", true);
    state.kidView = "home";
    render();
    speak(currentQuestion().speech);
  });
  document.querySelector("#exportData")?.addEventListener("click", () => {
    const content = serializeLearningData(children, {
      ...models,
      custom: customModels,
    });
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `little-sprout-learning-${todayKey()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("学习档案已导出");
  });
  document.querySelector("#importData")?.addEventListener("click", () => {
    document.querySelector("#importFile")?.click();
  });
  document
    .querySelector("#importFile")
    ?.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      try {
        const parsed = parseLearningData(await file.text());
        if (!window.confirm("导入会替换这台设备上的全部孩子档案，确定继续吗？"))
          return;
        const imported = await replaceLearningData(parsed);
        children = imported.children;
        activeChildId = children[0].id;
        profile = children[0].profile;
        Object.assign(models, resolveModels(imported.modelSettings));
        Object.assign(
          customModels,
          normalizeCustomConfig(imported.modelSettings?.custom),
        );
        saveModels();
        resetActiveActivity();
        state.modal = true;
        state.parentUnlocked = true;
        render();
        showToast("学习档案已导入");
      } catch (error) {
        showToast(error.message || "学习档案导入失败");
      }
    });
  document.querySelector("#resetModels")?.addEventListener("click", () => {
    Object.assign(models, defaultModels());
    Object.assign(customModels, emptyCustomConfig());
    saveModels();
    render();
  });
  document.querySelector("#restartListening")?.addEventListener("click", () => {
    clearAdvanceTimer();
    completeSession(state.activityComplete ? "completed" : "quit");
    state.kidView = "listening";
    applyWordbankPool();
    beginSession("english", false, { force: true });
    render();
    speak(currentQuestion()?.speech || "");
  });
  document.querySelector("#restartAnimation")?.addEventListener("click", () => {
    clearAdvanceTimer();
    const animationId = state.activeAnimationId;
    completeSession(state.activityComplete ? "completed" : "quit");
    if (!animationId) {
      state.kidView = "animation";
      render();
      return;
    }
    beginSession("animation", false, { animationId, force: true });
    state.animationPhase = "watch";
    state.kidView = "animation";
    render();
  });
  document
    .querySelector("#backHomeFromResult")
    ?.addEventListener("click", () => {
      clearAdvanceTimer();
      completeSession(state.activityComplete ? "completed" : "quit");
      state.kidView = "home";
      state.animationMode = false;
      state.activeAnimationId = null;
      state.animationPhase = "watch";
      state.answered = false;
      state.activeQuestionId = null;
      state.encouragement = "";
      render();
    });
  document.querySelector("#finishSession")?.addEventListener("click", () => {
    clearAdvanceTimer();
    state.aiPlanToken += 1;
    state.aiPlanning = false;
    state.aiQuestionId = null;
    state.baselineTest = false;
    state.baselineCorrect = 0;
    state.baselineAnswers = [];
    state.baselinePool = [];
    const returnToVideo = state.animationMode;
    completeSession(state.activityComplete ? "completed" : "quit");
    state.kidView = returnToVideo ? "video" : "listening";
    state.animationMode = false;
    state.activeAnimationId = null;
    state.animationPhase = "watch";
    state.offlineTaskDone = false;
    state.answered = false;
    state.activeQuestionId = null;
    state.encouragement = "";
    speak("All done.");
    render();
  });
  document.querySelector("#offlineDone")?.addEventListener("click", () => {
    if (state.offlineTaskDone) return;
    state.offlineTaskDone = true;
    touchLearningDay();
    profile.stars += 1;
    profile.awards.push({
      id: makeId("offline"),
      label: "完成亲子小游戏",
      at: new Date().toISOString(),
    });
    const event = {
      type: "offline_task_completed",
      courseId: state.activityCourse,
      at: new Date().toISOString(),
    };
    profile.events.push(event);
    profile.events = profile.events.slice(-60);
    persistActiveChild();
    addLearningEvent(event);
    saveReward({
      id: makeId("reward"),
      type: "offline_task",
      courseId: state.activityCourse,
      at: event.at,
    });
    speak("Great job playing with your grown-up!");
    render();
  });
  document.querySelector("#retryQuestion")?.addEventListener("click", () => {
    clearAdvanceTimer();
    // Same question again — do not advance questionIndex or clear activeQuestionId.
    state.answered = false;
    state.correct = false;
    state.selectedChoice = null;
    state.encouragement = "";
    render();
    if (state.activeSession) speak(currentQuestion().speech);
  });
  document.querySelector("#nextQuestion")?.addEventListener("click", () => {
    clearAdvanceTimer();
    if (!state.correct) {
      // Safety: Next only advances after a correct answer.
      state.answered = false;
      state.correct = false;
      state.selectedChoice = null;
      state.encouragement = "";
      render();
      if (state.activeSession) speak(currentQuestion().speech);
      return;
    }
    state.questionIndex = Math.min(
      sessionQuestionTotal() - 1,
      state.questionIndex + 1,
    );
    state.answered = false;
    state.correct = false;
    state.selectedChoice = null;
    state.encouragement = "";
    state.aiQuestionId = null;
    state.activeQuestionId = null;
    render();
    if (state.baselineTest || state.animationMode) {
      if (state.activeSession) speak(currentQuestion().speech);
      return;
    }
    void planQuestionWithAI().then(() => {
      if (state.activeSession) speak(currentQuestion().speech);
    });
  });
  document.querySelector("#clearProfile")?.addEventListener("click", () => {
    if (!window.confirm("确定要清除这台设备上的学习记录吗？")) return;
    clearLearningData().then(() => {
      children = [createDefaultChild({ id: "child-default" })];
      activeChildId = children[0].id;
      profile = children[0].profile;
      void saveChild(children[0]);
      state.aiPlanToken += 1;
      state.aiPlanning = false;
      state.aiQuestionId = null;
      state.aiPlanMessage = "";
      state.baselineTest = false;
      state.baselineCorrect = 0;
      state.baselineAnswers = [];
      state.baselinePool = [];
      state.animationMode = false;
      state.activeAnimationId = null;
      state.sessionQuestionIds = [];
      state.answered = false;
      state.encouragement = "";
      render();
    });
  });
  document.querySelectorAll("[data-parent-tab]").forEach((btn) =>
    btn.addEventListener("click", () => {
      saveChildForm();
      state.parentTab = btn.dataset.parentTab;
      render();
    }),
  );
  ["openParent", "openParent2", "openParent3", "openSetup"].forEach((id) =>
    document.querySelector("#" + id)?.addEventListener("click", () => {
      state.parentGate = !state.parentUnlocked;
      state.modal = true;
      state.parentTab =
        id === "openSetup" ? "child" : state.parentTab || "child";
      render();
    }),
  );
  document.querySelector("#parentCancel")?.addEventListener("click", () => {
    state.modal = false;
    state.parentGate = false;
    render();
  });
  let holdTimer;
  const holdButton = document.querySelector("#parentHold");
  holdButton?.addEventListener("pointerdown", () => {
    holdButton.classList.add("holding");
    holdTimer = setTimeout(() => {
      state.parentUnlocked = true;
      state.parentGate = false;
      render();
    }, 1000);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach((eventName) =>
    holdButton?.addEventListener(eventName, () => {
      clearTimeout(holdTimer);
      holdButton.classList.remove("holding");
    }),
  );
  document.querySelector("#closeModal")?.addEventListener("click", () => {
    saveChildForm();
    state.modal = false;
    render();
  });
  document.querySelector("#closeModal2")?.addEventListener("click", () => {
    saveChildForm();
    state.modal = false;
    render();
  });
  document.querySelector("#modalBackdrop")?.addEventListener("click", (e) => {
    if (e.target.id === "modalBackdrop") {
      saveChildForm();
      state.modal = false;
      render();
    }
  });
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
}

async function init() {
  document.querySelector("#app").innerHTML =
    '<div class="loading-screen"><span>🦊</span><b>Little Sprout is getting ready…</b></div>';
  const listeningPrefs = loadListeningPrefs();
  if (listeningPrefs.bankId) state.listeningBankId = listeningPrefs.bankId;
  if (listeningPrefs.count)
    state.listeningCount = Number(listeningPrefs.count) || 8;
  if (listeningPrefs.theme) state.listeningTheme = listeningPrefs.theme;
  if (!listeningPrefs.bankId && listeningPrefs.theme) {
    // Prefs saved before bank ids existed: map theme → concrete bank later.
    state.listeningBankId = bankIdFromTheme(
      { defaultBankId: "starters", banks: [] },
      listeningPrefs.theme,
    );
  }
  children = await loadChildren();
  await loadWordbank();
  if (!listeningPrefs.bankId && listeningPrefs.theme && wordbankCatalog) {
    state.listeningBankId = bankIdFromTheme(
      wordbankCatalog,
      listeningPrefs.theme,
    );
    persistListeningPrefs();
  }
  state.animationLibrary = mergeAnimationShelf(
    createDemoAnimations(assetBase),
    loadAnimationLibrary(assetBase),
  );
  if (!children.length) children = [createDefaultChild()];
  activeChildId = children[0].id;
  profile = children[0].profile;
  render();
}

init();
