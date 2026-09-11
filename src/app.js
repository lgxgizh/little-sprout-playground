import "./styles.css";
import "./overrides.css";
import { requestNextQuestion } from "./ai.js";
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
  withChoiceImages,
} from "./listening.js";
import {
  chooseQuestionCandidates,
  stageDefinition,
  stageFromBaseline,
  summarizeWeek,
  updateEnglishPlan,
} from "./learning-plan.js";
import {
  CUSTOM_STORAGE_KEY,
  catalogOptions,
  defaultModels,
  emptyCustomConfig,
  isAdapterModel,
  modelName as catalogModelName,
  normalizeCustomConfig,
  resolveModels,
} from "./model-config.js";
import { choiceGridMarkup, escapeHtml, listenButtonMarkup } from "./quiz-ui.js";
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

const secondaryCourses = [
  {
    id: "colors",
    label: "Color Hunt",
    subtitle: "Find colors with pictures",
    emoji: "🌈",
    tone: "peach",
    duration: "5 min",
    tag: "Extra",
  },
  {
    id: "animals",
    label: "Animal Sounds",
    subtitle: "Listen and find the animal",
    emoji: "🐼",
    tone: "mint",
    duration: "5 min",
    tag: "Extra",
  },
  {
    id: "shapes",
    label: "Shape Search",
    subtitle: "Find circles and squares",
    emoji: "🔵",
    tone: "lavender",
    duration: "5 min",
    tag: "Extra",
  },
];

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
  ...secondaryCourses,
];

const assetBase = import.meta.env.BASE_URL;

let questionBank = {
  colors: [
    {
      id: "color-blue-fruit",
      difficulty: 1,
      visual: "🦊",
      prompt: "Find the blue fruit",
      speech: "Can you find the blue fruit?",
      answer: "blue",
      choices: [
        { label: "Red", emoji: "🍎", value: "red", color: "#ff6b5e" },
        { label: "Yellow", emoji: "🍌", value: "yellow", color: "#f7c94b" },
        { label: "Blue", emoji: "🫐", value: "blue", color: "#6db6e8" },
      ],
    },
    {
      id: "color-red-flower",
      difficulty: 1,
      visual: "🌼",
      prompt: "Which flower is red?",
      speech: "Can you find the red flower?",
      answer: "red",
      choices: [
        { label: "Red", emoji: "🌹", value: "red", color: "#ff6b5e" },
        { label: "Yellow", emoji: "🌻", value: "yellow", color: "#f7c94b" },
        { label: "Blue", emoji: "🪻", value: "blue", color: "#6db6e8" },
      ],
    },
    {
      id: "color-yellow-sun",
      difficulty: 2,
      visual: "☀️",
      prompt: "Give the yellow one to the bear",
      speech: "Find the yellow one and give it to the bear.",
      answer: "yellow",
      choices: [
        { label: "Blue", emoji: "🧢", value: "blue", color: "#6db6e8" },
        { label: "Yellow", emoji: "⭐", value: "yellow", color: "#f7c94b" },
        { label: "Red", emoji: "🧣", value: "red", color: "#ff6b5e" },
      ],
    },
  ],
  animals: [
    {
      id: "animal-cat",
      difficulty: 1,
      visual: "🐼",
      prompt: "Who says meow?",
      speech: "Find the animal that says meow.",
      answer: "cat",
      choices: [
        { label: "Cat", emoji: "🐱", value: "cat", color: "#f3b56d" },
        { label: "Duck", emoji: "🦆", value: "duck", color: "#f7c94b" },
        { label: "Cow", emoji: "🐮", value: "cow", color: "#9ed9c4" },
      ],
    },
    {
      id: "animal-duck",
      difficulty: 2,
      visual: "🎵",
      prompt: "Find the animal that says quack",
      speech: "Can you find the animal that says quack?",
      answer: "duck",
      choices: [
        { label: "Dog", emoji: "🐶", value: "dog", color: "#d9a66f" },
        { label: "Duck", emoji: "🦆", value: "duck", color: "#f7c94b" },
        { label: "Sheep", emoji: "🐑", value: "sheep", color: "#e8e8dc" },
      ],
    },
  ],
  shapes: [
    {
      id: "shape-circle",
      difficulty: 1,
      visual: "🔵",
      prompt: "Find a round shape",
      speech: "Can you find the round shape?",
      answer: "circle",
      choices: [
        { label: "Circle", emoji: "⚪", value: "circle", color: "#6db6e8" },
        { label: "Square", emoji: "🟨", value: "square", color: "#f7c94b" },
        { label: "Triangle", emoji: "🔺", value: "triangle", color: "#ff8b76" },
      ],
    },
    {
      id: "shape-square",
      difficulty: 2,
      visual: "🧩",
      prompt: "Which shape looks like a block?",
      speech: "Which shape looks like a block?",
      answer: "square",
      choices: [
        { label: "Triangle", emoji: "🔺", value: "triangle", color: "#ff8b76" },
        { label: "Circle", emoji: "⚪", value: "circle", color: "#6db6e8" },
        { label: "Square", emoji: "🟨", value: "square", color: "#f7c94b" },
      ],
    },
  ],
  english: createListeningSeedQuestions(assetBase),
};

const offlineTasks = {
  colors: {
    title: "Color Hunt at Home",
    prompt: "Find three blue things with a grown-up",
    emoji: "🔎",
  },
  animals: {
    title: "Animal Sound Play",
    prompt: "Make the sound of your favorite animal",
    emoji: "🐾",
  },
  shapes: {
    title: "Shape Treasure Hunt",
    prompt: "Find something round at home",
    emoji: "🧺",
  },
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
  showExtras: false,
  demoChoice: null,
  demoAnswered: false,
  demoCorrect: false,
  activeQuestionId: null,
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

function todayProgress() {
  const today = todayKey();
  const answers = profile.events.filter((event) => {
    const at = new Date(event.at);
    return (
      event.type === "answer" &&
      Number.isFinite(at.getTime()) &&
      todayKey(at) === today
    );
  }).length;
  return {
    answers: Math.min(3, answers),
    target: 3,
  };
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
  return 3;
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
  const questions = questionBank[state.activityCourse] || questionBank.colors;
  const aiQuestion = questions.find((item) => item.id === state.aiQuestionId);
  if (aiQuestion) {
    lockQuestion(aiQuestion);
    return enrichQuestionImages(aiQuestion, assetBase);
  }
  if (state.activityCourse === "english") {
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
  const skill = profile.skills[state.activityCourse] || {
    attempts: 0,
    correct: 0,
  };
  const accuracy = skill.attempts ? skill.correct / skill.attempts : 0;
  const targetDifficulty = skill.attempts >= 3 && accuracy >= 0.7 ? 2 : 1;
  const available = questions.filter(
    (item) => item.difficulty <= targetDifficulty,
  );
  question =
    pickSessionQuestion(available, {
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
  state.answered = false;
  state.correct = false;
  state.selectedChoice = null;
  state.activityComplete = false;
  state.offlineTaskDone = false;
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
  if (courseId === "english" && !state.baselineTest) {
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
  const preferenceOrder = [
    "english",
    "animation",
    "colors",
    "animals",
    "shapes",
  ];
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
  const ranked = Object.entries(profile.skills).sort(
    ([a, left], [b, right]) => {
      const leftScore = left.attempts ? left.correct / left.attempts : -1;
      const rightScore = right.attempts ? right.correct / right.attempts : -1;
      if (leftScore !== rightScore) return leftScore - rightScore;
      const recentOrder = (left.lastPracticed || "").localeCompare(
        right.lastPracticed || "",
      );
      return (
        recentOrder || preferenceOrder.indexOf(a) - preferenceOrder.indexOf(b)
      );
    },
  );
  const [courseId, skill] = ranked[0];
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

function englishPlanCard() {
  const child = activeChild();
  const plan = child?.englishPlan;
  const stage = stageDefinition(plan?.stage);
  const dueReviews = (plan?.reviewQueue || []).filter(
    (item) => !item.dueAt || new Date(item.dueAt).getTime() <= Date.now(),
  ).length;
  const detail = dueReviews
    ? `${dueReviews} review ${dueReviews === 1 ? "word" : "words"} ready`
    : "A fresh little step is ready";
  return `<div class="english-plan-card"><div class="english-plan-icon">🔤</div><div><span>ENGLISH PATH · STAGE ${stage.id}</span><b>${stage.labelEn}</b><small>${detail}</small></div><i aria-hidden="true">→</i></div>`;
}

function learnerSetupCard() {
  const child = activeChild();
  if (!child || child.baseline?.status === "complete") return "";
  const hasPlayed = profile.totalAnswers > 0;
  return `<div class="learner-setup-card"><span class="learner-setup-icon">🧸</span><div><span>GROWN-UP START</span><b>${hasPlayed ? "Make this path yours" : "Meet your little learner"}</b><small>Set a nickname, age, and English starting point in one minute.</small></div><button class="small-action" id="openSetup">Set up <span>→</span></button></div>`;
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
  const task = offlineTasks[courseId] || offlineTasks.colors;
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
  const stats = summarizeAnimationAttempts(
    profile.events,
    state.activeAnimationId,
  );
  return `<div class="baseline-result"><span class="baseline-result-icon">🎬</span><span><b>Nice watching!</b><small>${escapeHtml(parentAnimationSummary(stats))}</small></span></div>`;
}
function familyTaskPanel() {
  const recommendedId = recommendation().course.id;
  return `<section class="family-tasks" id="familyTasks"><div class="section-heading"><div><span class="section-kicker">TOGETHER · PLAY TIME</span><h2>Play beyond the screen</h2></div><span class="active-model">Pick just one today</span></div><div class="family-task-grid">${courses
    .map((course) => {
      const task = offlineTasks[course.id];
      return `<article class="family-task-card ${course.tone} ${course.id === recommendedId ? "is-recommended" : ""}"><span class="family-task-icon">${task.emoji}</span><div><b>${task.title}</b><p>${task.prompt}</p></div>${course.id === recommendedId ? '<span class="family-task-tag">Today\'s pick</span>' : ""}</article>`;
    })
    .join(
      "",
    )}</div><p class="family-task-note">You do not need to finish every task. Looking, listening, and playing with a grown-up is wonderful learning.</p></section>`;
}

function animationShelf() {
  const items = state.animationLibrary.length
    ? state.animationLibrary
    : createDemoAnimations(assetBase);
  const cards = items
    .map((item) => {
      const stats = summarizeAnimationAttempts(profile.events, item.id);
      const thumb = item.poster
        ? `<img src="${escapeHtml(item.poster)}" alt=""/>`
        : `<span class="media-empty-icon">🎞️</span>`;
      return `<article class="media-card ${item.demo ? "media-card-featured" : ""}"><div class="media-thumb">${thumb}<span class="media-duration">${escapeHtml(item.durationLabel)}</span></div><div class="media-card-copy"><span class="media-type">${item.demo ? "Demo GIF" : "Your local animation"}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p><button class="media-play" data-animation="${escapeHtml(item.id)}">▶ Watch & answer</button><small class="media-status">${stats.answers ? parentAnimationSummary(stats) : "Picture answers after watching"}</small></div></article>`;
    })
    .join("");
  return `<section class="media-shelf" id="mediaShelf"><div class="section-heading"><div><span class="section-kicker">ANIMATION Q&A · 动画提问</span><h2>Story shelf</h2><span class="active-model">GIF · listen · tap</span></div><span class="shelf-note">Local only</span></div><div class="media-grid">${cards}</div><p class="family-task-note">Demo uses <code>fox-apple.gif</code>. Parents can register another local GIF/image in Parent settings. The old shapes MP4 is no longer the primary demo.</p></section>`;
}

function modelName(type) {
  return catalogModelName(type, models);
}

function homeTryQuestion() {
  return createListeningSeedQuestions(assetBase)[0];
}

function homeTryMarkup() {
  const question = homeTryQuestion();
  if (!question) return "";
  return `<div class="demo-quiz" aria-label="Try one question">
    <div class="eyebrow">Try one now · 打开就能玩</div>
    <h2>${escapeHtml(question.prompt)}</h2>
    <p>Listen, then tap a picture. No sign-in.</p>
    <button class="voice-btn" id="demoListen" type="button"><span>🔊</span> Listen</button>
    ${choiceGridMarkup(question.choices, {
      answer: question.answer,
      selectedChoice: state.demoChoice,
      answered: state.demoAnswered,
      prompt: question.prompt,
      dataAttr: "demo-choice",
      showLabels: false,
    })}
    ${
      state.demoAnswered
        ? `<div class="feedback ${state.demoCorrect ? "good" : "try"}">${state.demoCorrect ? "You found it! That's Little Sprout." : "That's okay — look for the apple."}</div>
           <button class="primary-btn" id="startAfterDemo" type="button"><span>${state.demoCorrect ? "Play the listening test" : "Start listening test"}</span><span class="arrow">→</span></button>
           ${state.demoCorrect ? "" : `<button class="text-btn" id="retryDemo" type="button">Try again</button>`}`
        : `<p class="hint">Tap a picture to try</p>`
    }
  </div>`;
}

function normalizeContentQuestion(question) {
  if (!question || typeof question !== "object") return null;
  const containsCjk = (value) => /[\u3400-\u9fff]/u.test(String(value || ""));
  const clean = (value, max = 160) =>
    String(value || "")
      .replace(/[<>]/g, "")
      .trim()
      .slice(0, max);
  const choices = Array.isArray(question.choices)
    ? withChoiceImages(
        question.choices
          .map((choice) => ({
            label: clean(choice?.label, 40),
            emoji: clean(choice?.emoji, 8),
            value: clean(choice?.value, 40),
            color: /^#[0-9a-f]{6}$/i.test(choice?.color)
              ? choice.color
              : "#9ed9c4",
            imageKey: clean(choice?.imageKey || choice?.value, 40),
            imageSrc: clean(choice?.imageSrc, 400),
          }))
          .filter(
            (choice) =>
              choice.label &&
              choice.value &&
              (choice.emoji || choice.imageSrc || choice.imageKey),
          )
          .slice(0, 4),
        assetBase,
      )
    : [];
  const ageMin = Math.min(6, Math.max(2, Number(question.ageMin) || 2));
  const ageMax = Math.min(6, Math.max(2, Number(question.ageMax) || 6));
  if (ageMin > ageMax) return null;
  const normalized = {
    id: clean(question.id, 80),
    difficulty: Math.min(3, Math.max(1, Number(question.difficulty) || 1)),
    stage: Math.min(
      4,
      Math.max(1, Number(question.stage) || Number(question.difficulty) || 1),
    ),
    ageMin,
    ageMax,
    concept: clean(question.concept, 60),
    baseline: Boolean(question.baseline),
    visual: clean(question.visual, 8) || "🎧",
    prompt: clean(question.prompt),
    speech: clean(question.speech),
    answer: clean(question.answer, 40),
    choices,
  };
  const visibleText = [
    normalized.visual,
    normalized.prompt,
    normalized.speech,
    ...choices.flatMap((choice) => [choice.label, choice.value]),
  ];
  if (
    !normalized.id ||
    !normalized.prompt ||
    !normalized.speech ||
    !normalized.answer ||
    choices.length < 2 ||
    !choices.some((choice) => choice.value === normalized.answer) ||
    new Set(choices.map((choice) => choice.value)).size !== choices.length ||
    visibleText.some(containsCjk)
  )
    return null;
  return normalized;
}

async function loadQuestionPack() {
  try {
    const response = await fetch(`${assetBase}content/questions.en.json`, {
      cache: "no-store",
    });
    if (!response.ok) return;
    const payload = await response.json();
    if (payload?.schemaVersion !== 1 || !Array.isArray(payload.questions))
      return;
    const additions = payload.questions
      .map(normalizeContentQuestion)
      .filter(Boolean);
    const existing = new Set(
      questionBank.english.map((question) => question.id),
    );
    questionBank.english = [
      ...questionBank.english,
      ...additions.filter((question) => !existing.has(question.id)),
    ];
  } catch {
    // The built-in question bank keeps the app fully usable offline.
  }
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
    )}</select></label></div><div class="baseline-row"><span>当前英语路径：<b>第 ${stage.id} 阶段 · ${stage.label}</b><small>${baseline}</small></span><button class="small-action" id="startBaseline">开始听力图片测评</button></div><div class="video-register"><div class="config-divider"><span>本地动画理解（GIF/图片）</span></div><p class="video-register-note">添加本地 GIF 或图片（本机文件或 <code>public/assets/stories</code> 路径）。孩子流程：观看 → 听题 → 点大图。旧版 MP4 已降级，不再作为主演示。</p><label><span>标题</span><input id="animationTitle" maxlength="40" placeholder="例如：Fox finds an apple" /></label><label><span>资源路径或选择文件</span><input id="animationAssetPath" maxlength="160" placeholder="assets/stories/fox-apple.gif" /><input id="animationFile" type="file" accept="image/gif,image/png,image/webp,image/jpeg,video/mp4,video/webm" /></label><label><span>题目英文提示</span><input id="animationPrompt" maxlength="80" placeholder="What fruit did you see?" value="What fruit did you see?" /></label><label><span>正确答案</span><input id="animationAnswer" maxlength="40" placeholder="apple" value="apple" /></label><div class="video-choice-row"><label><span>选项 A</span><input id="animationChoiceA" maxlength="20" value="apple" /></label><label><span>选项 B</span><input id="animationChoiceB" maxlength="20" value="banana" /></label><label><span>选项 C</span><input id="animationChoiceC" maxlength="20" value="ball" /></label><label><span>选项 D</span><input id="animationChoiceD" maxlength="20" value="cup" /></label></div><button class="small-action" id="addAnimationClip">＋ 登记本地动画</button><div class="video-library-list">${(state.animationLibrary.filter((v) => !v.demo) || []).map((item) => `<div class="video-library-item"><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.src)}</small><button class="text-btn" data-remove-animation="${escapeHtml(item.id)}">移除</button></div>`).join("") || "<small>还没有自定义动画</small>"}</div></div><div class="config-divider"><span>次要玩法（可选）</span></div><p class="video-register-note">颜色 / 动物 / 形状已从孩子主页收起，需要时再打开。</p><label class="extras-toggle"><input type="checkbox" id="showExtrasToggle" ${state.showExtras ? "checked" : ""} /> 在主页显示次要玩法卡片</label><button class="save-child-btn" id="saveChildProfile">保存孩子信息</button></div>`;
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

function speak(text) {
  if (!state.soundOn || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
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

async function planQuestionWithAI() {
  if (
    !isAdapterModel("vocab", models.vocab) ||
    !state.activeSession ||
    state.answered ||
    state.animationMode ||
    state.baselineTest
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
  const allCandidates =
    courseId === "english"
      ? state.baselineTest
        ? state.baselinePool.length
          ? state.baselinePool
          : selectBaselineQuestions(
              questionBank.english,
              activeChild()?.age || 3,
            )
        : chooseQuestionCandidates({
            questions: questionBank.english,
            plan: activeChild()?.englishPlan,
            questionStats: profile.questionStats,
            sessionQuestionIds: state.sessionQuestionIds,
            age: activeChild()?.age,
          })
      : questionBank[courseId] || questionBank.colors;
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

function featureHubMarkup(next) {
  return `<section class="feature-hub" id="featureHub"><div class="section-heading"><div><span class="section-kicker">TWO KID FEATURES · 两大玩法</span><h2>What shall we play?</h2></div></div><div class="feature-hub-grid"><article class="feature-card feature-listening ${next.course.id === "english" ? "is-recommended" : ""}" data-feature="listening"><div class="feature-card-art"><span>🎧</span><b>听力测试</b></div><div class="feature-card-copy"><h3>Listening test</h3><p>Browser speech asks an English question. Tap a big picture card A / B / C / D.</p><button class="primary-btn feature-start" data-feature="listening"><span>Start listening</span><span class="arrow">→</span></button></div></article><article class="feature-card feature-animation ${next.course.id === "animation" ? "is-recommended" : ""}" data-feature="animation"><div class="feature-card-art"><span>🎞️</span><b>动画提问</b></div><div class="feature-card-copy"><h3>Animation Q&A</h3><p>Watch the fox GIF or the shapes clip, then answer with the same picture cards.</p><button class="primary-btn feature-start" data-feature="animation"><span>Watch & answer</span><span class="arrow">→</span></button></div></article></div>${state.showExtras ? `<div class="extras-grid">${secondaryCourses.map((course) => courseCard(course, false)).join("")}</div>` : `<p class="hub-aux-note">Parent helpers, storage, and voice prompts stay in settings. Extra color / animal / shape play is tucked away unless a grown-up turns it on.</p>`}</section>`;
}

function render() {
  const next = recommendation();
  const dailyProgress = todayProgress();
  const activeCourse =
    courses.find((course) => course.id === state.activityCourse) || courses[0];
  const question = currentQuestion();
  const childName = escapeHtml(activeChild()?.nickname || "Sunny");
  document.querySelector("#app").innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand"><span class="brand-mark">✦</span><span>Little Sprout</span><small>Play · Learn · Grow</small></div>
        <nav class="desktop-nav" aria-label="Main navigation">
          <button class="nav-item ${state.activeTab === "home" ? "active" : ""}" data-tab="home">Today</button>
          <button class="nav-item ${state.activeTab === "library" ? "active" : ""}" data-tab="library">Play shelf</button>
          <button class="nav-item ${state.activeTab === "tasks" ? "active" : ""}" data-tab="tasks">Together</button>
        </nav>
        <div class="top-actions"><button class="icon-btn" id="soundToggle" aria-label="Sound on or off">${state.soundOn ? "🔊" : "🔇"}</button><button class="parent-btn" id="openParent">Parent <span>⌄</span></button></div>
      </header>

      <main>
        <section class="hero">
          <div class="hero-copy">
            <div class="eyebrow"><span class="spark">✦</span> 5-MINUTE PLAY TIME</div>
            <h1>${childName} + Little Sprout<br/><em>Listening & Animation</em></h1>
            <p>Tap a picture to try right now — no sign-in.<br/>Then play Listening test or Animation Q&amp;A.</p>
            <button class="primary-btn" id="startLesson"><span>${state.activeSession ? "Keep playing" : "Start listening test"}</span><span class="arrow">→</span></button>
            <div class="streak"><span class="streak-icon">🔥</span><span><b>${profile.streak} days in a row</b><small>${profile.streak ? "A little play every day helps" : "Finish today to light your first star"}</small></span></div>
            <div class="star-badge">⭐ ${profile.stars} stars collected</div>
            <div class="daily-goal"><div class="daily-goal-top"><span>Today's picture answers</span><b>${dailyProgress.answers}/${dailyProgress.target}</b></div><div class="daily-goal-track"><i style="width:${Math.round((dailyProgress.answers / dailyProgress.target) * 100)}%"></i></div><small>${dailyProgress.answers >= dailyProgress.target ? "Today is complete—come back tomorrow!" : `${dailyProgress.target - dailyProgress.answers} more to go`}</small></div>
            ${englishPlanCard()}
            ${learnerSetupCard()}
          </div>
          <div class="hero-art">${homeTryMarkup()}</div>
        </section>

        ${featureHubMarkup(next)}

        <section class="learning-panel" id="quizPanel">
          ${state.animationMode && state.animationPhase === "watch" ? animationWatchMarkup() : ""}
          <div class="panel-intro"><span class="section-kicker">${state.animationMode ? "ANIMATION Q&A" : state.baselineTest ? "LISTENING CHECK" : "MINI QUEST"} · ${String(state.questionIndex + 1).padStart(2, "0")}</span><h2>${state.animationMode ? escapeHtml(activeAnimation()?.title || "Animation play") : activeCourse.label}</h2><p>${state.animationMode && state.animationPhase === "watch" ? "Watch first, then answer with pictures." : `${question.prompt}<br/>Let's try it together!`}</p><div class="speech-actions">${listenButtonMarkup({ disabled: state.animationMode && state.animationPhase === "watch" })}</div><div class="model-chip"><span>Question model</span><b>${state.animationMode ? "Local animation cards" : modelName("vocab")}</b></div>${state.aiPlanning ? '<div class="ai-plan-note is-loading">🪄 Choosing a question for you…</div>' : state.aiPlanMessage ? `<div class="ai-plan-note ${state.aiPlanSource === "ai" ? "is-ai" : "is-local"}">${state.aiPlanSource === "ai" ? "✨" : "🌱"} ${state.aiPlanMessage}</div>` : ""}</div>
          <div class="quiz-card ${state.animationMode && state.animationPhase === "watch" ? "is-watching" : ""}">
            <div class="quiz-top"><span>${state.animationMode && state.animationPhase === "watch" ? "Watch time" : `Question ${state.questionIndex + 1} / ${sessionQuestionTotal()}`}</span><span class="session-live">${state.activeSession ? "● Playing now" : ""}</span><div class="progress-dots">${Array.from({ length: Math.min(sessionQuestionTotal(), 12) }, (_, i) => `<i class="${i <= state.questionIndex ? "filled" : ""}"></i>`).join("")}</div></div>
            ${
              state.animationMode && state.animationPhase === "watch"
                ? `<div class="video-watch-hint"><p>When the animation ends, tap <b>Ready to answer</b>.</p><button class="primary-btn" id="animationReady"><span>Ready to answer</span><span class="arrow">→</span></button></div>`
                : `<div class="question-visual"><span class="question-emoji" aria-hidden="true">${state.animationMode ? "🎞️" : "🎧"}</span><span class="question-bubble">${escapeHtml(question.prompt)}<br/><b>Listen, then tap a picture</b></span></div>
            ${choiceGridMarkup(question.choices, {
              answer: question.answer,
              selectedChoice: state.selectedChoice,
              answered: state.answered,
              disabled: state.aiPlanning,
              prompt: question.prompt,
              showLabels: false,
            })}
            ${state.answered ? `<div class="feedback ${state.correct ? "good" : "try"}">${state.encouragement || (state.correct ? "You found it! ✨" : "That's okay—let's look again")}</div>${state.activityComplete ? (state.baselineTest ? baselineResultMarkup() : state.animationMode ? animationResultMarkup() : offlineTaskMarkup(state.activityCourse)) : `<button class="next-question" id="nextQuestion">${state.correct ? "Next one" : "Try another"} <span>→</span></button>`}` : '<div class="hint">Tap a picture to answer · Find a star!</div>'}`
            }
            ${state.activeSession ? `<button class="finish-btn" id="finishSession">${state.activityComplete ? "Finish today" : "Take a break"}</button>` : ""}
          </div>
        </section>

        ${animationShelf()}

        ${familyTaskPanel()}

        <section class="parent-note"><div class="note-icon">💛</div><div><b>Grown-up note</b><p>Five to eight minutes is plenty. Voice is for prompts only.</p></div><button class="round-arrow" id="openParent2" aria-label="Open parent settings">→</button></section>
      </main>

      <nav class="mobile-nav"><button class="mobile-nav-item ${state.activeTab === "home" ? "active" : ""}" data-tab="home">⌂<span>Today</span></button><button class="mobile-nav-item ${state.activeTab === "library" ? "active" : ""}" data-tab="library">▶<span>Play</span></button><button class="mobile-nav-item ${state.activeTab === "tasks" ? "active" : ""}" data-tab="tasks">♡<span>Together</span></button><button class="mobile-nav-item" id="openParent3">☼<span>Parent</span></button></nav>
      ${state.modal ? modelSettingsModal() : ""}
      <div class="toast" id="toast">Ready to play</div>
    </div>`;
  bindEvents();
  scheduleAdvance();
}

function courseCard(course, recommended = false) {
  return `<article class="course-card ${course.tone} ${recommended ? "is-recommended" : ""}" data-course="${course.id}"><div class="course-art"><span>${course.emoji}</span><b>${recommended ? "For you" : course.tag}</b><button class="play-fab" data-play="${course.id}" aria-label="Start ${course.label}">▶</button></div><div class="course-meta"><div><h3>${course.label}</h3><p>${course.subtitle}</p></div><span class="duration">◷ ${course.duration}</span></div></article>`;
}

function modelSettingsModal() {
  if (state.parentGate && !state.parentUnlocked) {
    return `<div class="modal-backdrop" id="modalBackdrop"><div class="modal parent-gate"><div class="modal-icon">🔒</div><h3>家长入口</h3><p>为了不让小朋友误触，请家长长按下面按钮 1 秒钟。</p><button class="hold-btn" id="parentHold"><span>长按进入设置</span><i></i></button><button class="reset-btn" id="parentCancel">先不设置</button></div></div>`;
  }
  const tab = state.parentTab || "child";
  const customFields = (type) => {
    const option = catalogOptions(type).find(
      (item) => item.id === models[type],
    );
    if (option?.provider !== "custom") return "";
    const cfg = customModels[type] || {};
    const modelValue = cfg.model || option.remoteModel || "";
    return `<div class="custom-model-fields">
      <label><span>模型 ID</span><input data-custom-type="${type}" data-custom-field="model" value="${escapeHtml(modelValue)}" placeholder="例如 gpt-4o-mini 或 flux-schnell" /></label>
      <label><span>OpenAI 兼容接口</span><input data-custom-type="${type}" data-custom-field="baseUrl" value="${escapeHtml(cfg.baseUrl || "")}" placeholder="https://openrouter.ai/api/v1 ，可留空用 .env CUSTOM_API_BASE" /></label>
      ${
        type === "voice"
          ? `<label><span>音色 ID</span><input data-custom-type="${type}" data-custom-field="voiceId" value="${escapeHtml(cfg.voiceId || "")}" placeholder="alloy / nova / eve" /></label>`
          : ""
      }
    </div>`;
  };
  const select = (type, label, icon, hint) =>
    `<label class="model-setting"><span class="model-setting-label"><span class="model-setting-icon">${icon}</span><span><b>${label}</b><small>${hint}</small></span></span><select data-model="${type}">${catalogOptions(
      type,
    )
      .map(
        (item) =>
          `<option value="${item.id}" ${models[type] === item.id ? "selected" : ""} title="${item.name} · ${item.note}">${item.name} · ${item.note}</option>`,
      )
      .join("")}</select>${customFields(type)}</label>`;
  const panel =
    tab === "growth"
      ? `<div class="parent-panel-grid">${profileSummary()}${weeklyGrowthCard()}</div>`
      : tab === "models"
        ? `<p class="parent-lead">默认用本机。xAI / OpenAI / Gemini 用对应密钥；FLUX、Qwen、DeepSeek 等走 OpenAI 兼容网关。也可以选「自定义」填任意模型 ID，不被绑定在一家。</p><div class="model-settings">${select("image", "图片", "🖼️", "学习插画与封面")}${select("voice", "语音", "🔊", "朗读题目和鼓励语")}${select("vocab", "选题", "🧩", "题目难度与题库")}${select("video", "视频理解", "🎬", "读本地短片，不是生成视频")}</div><div class="config-tip">当前语音：<b>${modelName("voice")}</b> · 当前题目：<b>${modelName("vocab")}</b> · 当前图片：<b>${modelName("image")}</b></div><div class="data-tools"><button class="small-action" id="exportData">导出学习档案</button><button class="small-action" id="importData">导入学习档案</button><input id="importFile" type="file" accept="application/json,.json" hidden /></div>`
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
  document.querySelectorAll("[data-tab]").forEach((btn) =>
    btn.addEventListener("click", () => {
      state.activeTab = btn.dataset.tab;
      showToast(btn.textContent);
      render();
      const targetId =
        state.activeTab === "library"
          ? "#mediaShelf"
          : state.activeTab === "tasks"
            ? "#familyTasks"
            : "#featureHub";
      requestAnimationFrame(() =>
        document
          .querySelector(targetId)
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    }),
  );
  document.querySelector("#soundToggle")?.addEventListener("click", () => {
    state.soundOn = !state.soundOn;
    render();
  });
  document.querySelector("#demoListen")?.addEventListener("click", () => {
    speak(homeTryQuestion()?.speech || "Which one is an apple?");
  });
  document.querySelector("#retryDemo")?.addEventListener("click", () => {
    state.demoChoice = null;
    state.demoAnswered = false;
    state.demoCorrect = false;
    render();
  });
  document.querySelectorAll("[data-demo-choice]").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (state.demoAnswered) return;
      const question = homeTryQuestion();
      state.demoChoice = btn.dataset.demoChoice;
      state.demoAnswered = true;
      state.demoCorrect = btn.dataset.demoChoice === question?.answer;
      speak(
        state.demoCorrect ? "You found it!" : "That's okay. Let's look again.",
      );
      render();
    }),
  );
  document.querySelector("#startAfterDemo")?.addEventListener("click", () => {
    document.querySelector("#startLesson")?.click();
  });
  document.querySelector("#startLesson")?.addEventListener("click", () => {
    const child = activeChild();
    beginSession("english", child?.baseline?.status !== "complete", {
      force: true,
    });
    render();
    document
      .querySelector("#quizPanel")
      .scrollIntoView({ behavior: "smooth", block: "center" });
    speak(currentQuestion().speech);
  });
  document.querySelectorAll("[data-feature]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const feature = btn.dataset.feature;
      if (feature === "animation") {
        const animationId =
          state.animationLibrary.find((item) => item.demo)?.id ||
          createDemoAnimations(assetBase)[0]?.id;
        beginSession("animation", false, { animationId, force: true });
        state.animationPhase = "watch";
        state.activeTab = "library";
        render();
        document
          .querySelector("#quizPanel")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
        showToast("Watch the animation, then answer");
        return;
      }
      const child = activeChild();
      beginSession("english", child?.baseline?.status !== "complete", {
        force: true,
      });
      render();
      document
        .querySelector("#quizPanel")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      speak(currentQuestion().speech);
    }),
  );
  document
    .querySelector("#showExtrasToggle")
    ?.addEventListener("change", (event) => {
      state.showExtras = Boolean(event.target.checked);
      try {
        localStorage.setItem(
          "little-sprout-show-extras",
          state.showExtras ? "1" : "0",
        );
      } catch {
        /* ignore */
      }
    });
  document.querySelector("#voicePrompt")?.addEventListener("click", () => {
    if (models.voice === "local-audio")
      showToast("Add the English audio file to public/assets/audio");
    else speak(currentQuestion().speech);
  });
  document.querySelectorAll("[data-choice]").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (state.aiPlanning || state.answered) return;
      const question = currentQuestion();
      state.answered = true;
      state.selectedChoice = btn.dataset.choice;
      state.correct = btn.dataset.choice === question.answer;
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
      } else if (state.animationMode) {
        const total = activeAnimation()?.questions?.length || 1;
        if (state.questionIndex >= total - 1) state.activityComplete = true;
      } else if (state.questionIndex >= 2) {
        state.activityComplete = true;
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
      const goodWords = [
        "You found it! ✨",
        "Great looking! Here is a star 🌟",
        "Amazing teamwork! 🎈",
      ];
      const gentleWords = [
        "That's okay. Let's look again.",
        "Almost! Try one more time.",
        "Take your time and listen again.",
      ];
      state.encouragement = state.correct
        ? goodWords[profile.stars % goodWords.length]
        : gentleWords[profile.totalAnswers % gentleWords.length];
      if (state.correct) speak("You found it!");
      else speak("That's okay. Let's try another one.");
      render();
    }),
  );
  document.querySelectorAll("[data-play]").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      state.playing = btn.dataset.play;
      beginSession(state.playing);
      render();
      showToast(
        state.playing === "animals"
          ? "Animal sounds are ready"
          : "Play preview ready",
      );
      void planQuestionWithAI().then(() => {
        if (state.activeSession)
          speak(`Let's play. ${currentQuestion().speech}`);
      });
    }),
  );
  document.querySelectorAll("[data-animation]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const animationId = btn.dataset.animation;
      beginSession("animation", false, { animationId, force: true });
      state.animationPhase = "watch";
      state.activeTab = "library";
      render();
      document
        .querySelector("#quizPanel")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      showToast("Watch the animation, then answer");
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
    showToast("本地动画已加入 Story shelf");
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
  document
    .querySelector("#viewAll")
    ?.addEventListener("click", () =>
      showToast("More play ideas are coming soon"),
    );
  document.querySelector("[data-recommend]")?.addEventListener("click", () => {
    const courseId =
      document.querySelector("[data-recommend]").dataset.recommend;
    beginSession(courseId);
    render();
    showToast("Your play idea is ready");
    document
      .querySelector("#quizPanel")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    void planQuestionWithAI().then(() => {
      if (state.activeSession) speak(currentQuestion().speech);
    });
  });
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
    render();
    document
      .querySelector("#quizPanel")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
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
  document.querySelector("#finishSession")?.addEventListener("click", () => {
    clearAdvanceTimer();
    state.aiPlanToken += 1;
    state.aiPlanning = false;
    state.aiQuestionId = null;
    state.baselineTest = false;
    state.baselineCorrect = 0;
    state.baselineAnswers = [];
    state.baselinePool = [];
    completeSession(state.activityComplete ? "completed" : "quit");
    state.animationMode = false;
    state.activeAnimationId = null;
    state.animationPhase = "watch";
    state.offlineTaskDone = false;
    state.answered = false;
    state.activeQuestionId = null;
    state.encouragement = "";
    speak("Play time is complete!");
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
  document.querySelector("#nextQuestion")?.addEventListener("click", () => {
    clearAdvanceTimer();
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
  try {
    state.showExtras =
      localStorage.getItem("little-sprout-show-extras") === "1";
  } catch {
    state.showExtras = false;
  }
  children = await loadChildren();
  await loadQuestionPack();
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
