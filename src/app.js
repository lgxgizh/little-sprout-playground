import "./styles.css";
import "./overrides.css";
import { requestNextQuestion } from "./ai.js";
import {
  chooseQuestionCandidates,
  stageDefinition,
  stageFromBaseline,
  summarizeWeek,
  updateEnglishPlan,
} from "./learning-plan.js";
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
    id: "colors",
    label: "Color Hunt",
    subtitle: "Find colors with pictures",
    emoji: "🌈",
    tone: "peach",
    duration: "5 min",
    tag: "Today's pick",
  },
  {
    id: "animals",
    label: "Animal Sounds",
    subtitle: "Listen and find the animal",
    emoji: "🐼",
    tone: "mint",
    duration: "5 min",
    tag: "Fun sounds",
  },
  {
    id: "shapes",
    label: "Shape Search",
    subtitle: "Find circles and squares",
    emoji: "🔵",
    tone: "lavender",
    duration: "5 min",
    tag: "Hands-on play",
  },
  {
    id: "english",
    label: "English Ears",
    subtitle: "Learn words with pictures and sounds",
    emoji: "🔤",
    tone: "sky",
    duration: "5 min",
    tag: "English starter",
  },
];

const questionBank = {
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
  english: [
    {
      id: "english-apple",
      baseline: true,
      difficulty: 1,
      visual: "🍎",
      prompt: "Which one is an apple?",
      speech: "Which one is an apple?",
      answer: "apple",
      choices: [
        { label: "Apple", emoji: "🍎", value: "apple", color: "#ff6b5e" },
        {
          label: "Banana",
          emoji: "🍌",
          value: "banana",
          color: "#f7c94b",
        },
        { label: "Cat", emoji: "🐱", value: "cat", color: "#f3b56d" },
      ],
    },
    {
      id: "english-cat",
      baseline: true,
      difficulty: 1,
      visual: "🐱",
      prompt: "Which one is a cat?",
      speech: "Which one is a cat?",
      answer: "cat",
      choices: [
        { label: "Dog", emoji: "🐶", value: "dog", color: "#d9a66f" },
        { label: "Cat", emoji: "🐱", value: "cat", color: "#f3b56d" },
        { label: "Duck", emoji: "🦆", value: "duck", color: "#f7c94b" },
      ],
    },
    {
      id: "english-red",
      baseline: true,
      difficulty: 1,
      visual: "🔴",
      prompt: "Find the red one",
      speech: "Find the red one.",
      answer: "red",
      choices: [
        { label: "Blue", emoji: "🔵", value: "blue", color: "#6db6e8" },
        {
          label: "Yellow",
          emoji: "🟡",
          value: "yellow",
          color: "#f7c94b",
        },
        { label: "Red", emoji: "🔴", value: "red", color: "#ff6b5e" },
      ],
    },
    {
      id: "english-dog",
      difficulty: 1,
      visual: "🐶",
      prompt: "Which one is a dog?",
      speech: "Which one is a dog?",
      answer: "dog",
      choices: [
        { label: "Dog", emoji: "🐶", value: "dog", color: "#d9a66f" },
        { label: "Fish", emoji: "🐟", value: "fish", color: "#6db6e8" },
        { label: "Bird", emoji: "🐦", value: "bird", color: "#9ed9c4" },
      ],
    },
    {
      id: "english-yellow",
      difficulty: 1,
      visual: "⭐",
      prompt: "Find the yellow one",
      speech: "Can you find the yellow one?",
      answer: "yellow",
      choices: [
        { label: "Green", emoji: "🟢", value: "green", color: "#9ed9c4" },
        { label: "Yellow", emoji: "⭐", value: "yellow", color: "#f7c94b" },
        { label: "Blue", emoji: "🔵", value: "blue", color: "#6db6e8" },
      ],
    },
    {
      id: "english-ball",
      difficulty: 2,
      visual: "⚽",
      prompt: "Touch the big red ball",
      speech: "Touch the big red ball.",
      answer: "red-ball",
      choices: [
        {
          label: "Big red ball",
          emoji: "🔴",
          value: "red-ball",
          color: "#ff6b5e",
        },
        { label: "Blue hat", emoji: "🧢", value: "blue-hat", color: "#6db6e8" },
        {
          label: "Yellow star",
          emoji: "⭐",
          value: "yellow-star",
          color: "#f7c94b",
        },
      ],
    },
    {
      id: "english-big",
      difficulty: 2,
      visual: "🐘",
      prompt: "Which animal is big?",
      speech: "Which animal is big?",
      answer: "elephant",
      choices: [
        { label: "Mouse", emoji: "🐭", value: "mouse", color: "#c9b9d9" },
        { label: "Elephant", emoji: "🐘", value: "elephant", color: "#9da9b6" },
        { label: "Ant", emoji: "🐜", value: "ant", color: "#d9a66f" },
      ],
    },
    {
      id: "english-wash",
      difficulty: 2,
      visual: "🧼",
      prompt: "What do we use to wash our hands?",
      speech: "What do we use to wash our hands?",
      answer: "soap",
      choices: [
        { label: "Soap", emoji: "🧼", value: "soap", color: "#9ed9c4" },
        { label: "Shoe", emoji: "👟", value: "shoe", color: "#d9a66f" },
        { label: "Ball", emoji: "⚽", value: "ball", color: "#6db6e8" },
      ],
    },
  ],
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
    title: "English Play Time",
    prompt: "Say apple, cat, or red with a grown-up",
    emoji: "🎈",
  },
};

const modelCatalog = {
  image: [
    { id: "gpt-image-1", name: "GPT Image 1", note: "Quality illustrations" },
    { id: "flux-schnell", name: "FLUX Schnell", note: "Fast drafts" },
    {
      id: "local-image",
      name: "Local image library",
      note: "Use files in public/assets",
    },
  ],
  voice: [
    { id: "browser-speech", name: "Browser speech", note: "No key · default" },
    {
      id: "gpt-4o-mini-tts",
      name: "OpenAI TTS",
      note: "Natural English · needs API",
    },
    {
      id: "local-audio",
      name: "Local audio",
      note: "Play an English audio file",
    },
  ],
  vocab: [
    {
      id: "adaptive-picture",
      name: "Adaptive picture quiz",
      note: "Adjusts to recent answers",
    },
    {
      id: "gpt-4o-mini",
      name: "GPT-4o mini",
      note: "Personalized picks · needs API",
    },
    {
      id: "local-question-bank",
      name: "Local question bank",
      note: "Use your approved questions",
    },
  ],
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
const models = {
  image: savedModels.image || "gpt-image-1",
  voice: savedModels.voice || "browser-speech",
  vocab: savedModels.vocab || "adaptive-picture",
};

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
  activeSession: null,
  offlineTaskDone: false,
  activityCourse: "english",
  questionIndex: 0,
  sessionQuestionIds: [],
  selectedChoice: null,
  activityComplete: false,
  baselineTest: false,
  baselineCorrect: 0,
  aiQuestionId: null,
  aiPlanning: false,
  aiPlanSource: "local",
  aiPlanMessage: "",
  aiPlanToken: 0,
};
const assetBase = import.meta.env.BASE_URL;

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
  state.offlineTaskDone = false;
  state.answered = false;
  state.correct = false;
  state.selectedChoice = null;
  state.activityComplete = false;
  state.sessionQuestionIds = [];
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

function currentQuestion() {
  const questions = questionBank[state.activityCourse] || questionBank.colors;
  const aiQuestion = questions.find(
    (question) => question.id === state.aiQuestionId,
  );
  if (aiQuestion) return aiQuestion;
  if (state.activityCourse === "english") {
    const child = activeChild();
    const candidates = state.baselineTest
      ? questions.filter((question) => question.baseline).slice(0, 3)
      : chooseQuestionCandidates({
          questions,
          plan: child?.englishPlan,
          questionStats: profile.questionStats,
          sessionQuestionIds: state.sessionQuestionIds,
        });
    const unseen = candidates.filter(
      (question) => !state.sessionQuestionIds.includes(question.id),
    );
    const pool = unseen.length ? unseen : candidates;
    return pool[state.questionIndex % pool.length] || questions[0];
  }
  const skill = profile.skills[state.activityCourse] || {
    attempts: 0,
    correct: 0,
  };
  const accuracy = skill.attempts ? skill.correct / skill.attempts : 0;
  const targetDifficulty = skill.attempts >= 3 && accuracy >= 0.7 ? 2 : 1;
  const available = questions.filter(
    (question) => question.difficulty <= targetDifficulty,
  );
  const unseen = available.filter(
    (question) => !state.sessionQuestionIds.includes(question.id),
  );
  const pool = unseen.length ? unseen : available;
  return pool[state.questionIndex % pool.length] || questions[0];
}

function makeId(prefix) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

function beginSession(courseId, baselineTest = false) {
  if (state.activeSession?.courseId === courseId) return;
  if (state.activeSession) completeSession("quit");
  state.activityCourse = courseId;
  state.questionIndex = 0;
  state.sessionQuestionIds = [];
  state.answered = false;
  state.correct = false;
  state.selectedChoice = null;
  state.activityComplete = false;
  state.offlineTaskDone = false;
  state.baselineTest = baselineTest;
  state.baselineCorrect = 0;
  state.aiQuestionId = null;
  state.aiPlanning = false;
  state.aiPlanSource = "local";
  state.aiPlanMessage = "";
  state.aiPlanToken += 1;
  const startedAt = new Date().toISOString();
  state.activeSession = { id: makeId("session"), courseId, startedAt };
  const event = {
    type: "session_started",
    courseId,
    at: startedAt,
  };
  profile.events.push(event);
  profile.events = profile.events.slice(-60);
  persistActiveChild();
  addLearningEvent(event);
  saveSession({
    id: state.activeSession.id,
    courseId,
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
    at: completedAt,
    durationMs,
  };
  profile.events.push(event);
  profile.events = profile.events.slice(-60);
  persistActiveChild();
  addLearningEvent(event);
  saveSession({ ...session, completedAt, durationMs, status });
  state.activeSession = null;
}

function recordAnswer(courseId, correct, question) {
  touchLearningDay();
  profile.totalAnswers += 1;
  if (correct) profile.correctAnswers += 1;
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
    difficulty: question.difficulty,
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
    correct,
    at: event.at,
    questionId: question.id,
    difficulty: question.difficulty,
    selectedChoice: state.selectedChoice,
    hintUsed: false,
  });
}

function recommendation() {
  const preferenceOrder = ["english", "colors", "animals", "shapes"];
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
  const score = state.baselineCorrect;
  const suggestedLevel =
    score >= 3
      ? "picture words"
      : score === 2
        ? "songs and picture words"
        : "sounds and pictures";
  return `<div class="baseline-result"><span class="baseline-result-icon">🎈</span><span><b>English check complete!</b><small>${score} / 3 correct · Ready for: ${suggestedLevel}</small></span></div>`;
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

function modelName(type) {
  return (
    modelCatalog[type].find((item) => item.id === models[type])?.name ||
    models[type]
  );
}

function escapeHtml(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
}

function childProfileSettings() {
  const child = activeChild() || createDefaultChild();
  const baseline =
    child.baseline?.status === "complete"
      ? `已完成：${child.baseline.score} / ${child.baseline.total}`
      : "还没有做过基础测评";
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
    )}</select></label></div><div class="baseline-row"><span>当前英语路径：<b>第 ${stage.id} 阶段 · ${stage.label}</b><small>${baseline}</small></span><button class="small-action" id="startBaseline">开始 3 题测评</button></div><button class="save-child-btn" id="saveChildProfile">保存孩子信息</button></div>`;
}

function saveChildForm() {
  const child = activeChild();
  if (!child) return;
  const nickname = document.querySelector("#childNickname")?.value.trim();
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
  } catch {
    /* 隐私模式下仍可继续使用当前会话设置 */
  }
}

function speak(text) {
  if (!state.soundOn || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.82;
  utterance.pitch = 1.15;
  window.speechSynthesis.speak(utterance);
}

async function planQuestionWithAI() {
  if (
    models.vocab !== "gpt-4o-mini" ||
    !state.activeSession ||
    state.answered
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
        ? questionBank.english
            .filter((question) => question.baseline)
            .slice(0, 3)
        : chooseQuestionCandidates({
            questions: questionBank.english,
            plan: activeChild()?.englishPlan,
            questionStats: profile.questionStats,
            sessionQuestionIds: state.sessionQuestionIds,
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

function render() {
  const next = recommendation();
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
            <h1>${childName} + Little Sprout<br/><em>${activeCourse.label}</em></h1>
            <p>Look, listen, and play together.<br/>${activeCourse.subtitle}.</p>
            <button class="primary-btn" id="startLesson"><span>${state.activeSession ? "Keep playing" : "Start today's play"}</span><span class="arrow">→</span></button>
            <div class="streak"><span class="streak-icon">🔥</span><span><b>${profile.streak} days in a row</b><small>${profile.streak ? "A little play every day helps" : "Finish today to light your first star"}</small></span></div>
            <div class="star-badge">⭐ ${profile.stars} stars collected</div>
          </div>
          <div class="hero-art"><img src="${assetBase}assets/fox-hero.png" alt="A little fox reads a picture book by a tent"/><div class="floating-pill pill-one">Have fun today!</div><div class="floating-pill pill-two">⭐ +1</div></div>
        </section>

        <section class="section-block" id="lessonArea">
          <div class="section-heading"><div><span class="section-kicker">PLAY · LEARN · GROW</span><h2>What shall we play?</h2><span class="active-model">Pictures: ${modelName("image")}</span></div><button class="text-btn" id="viewAll">See all <span>→</span></button></div>
          <div class="course-grid">${courses.map((course) => courseCard(course, course.id === next.course.id)).join("")}</div>
          <div class="recommendation-strip"><span class="recommendation-mascot">🦊</span><div><span class="section-kicker">READY FOR YOU</span><b>${next.course.label}</b><small>${next.reason}</small></div><button class="mini-cta" data-recommend="${next.course.id}">Play <span>→</span></button></div>
        </section>

        <section class="learning-panel" id="quizPanel">
          <div class="panel-intro"><span class="section-kicker">MINI QUEST · ${String(state.questionIndex + 1).padStart(2, "0")}</span><h2>${activeCourse.label}</h2><p>${question.prompt}<br/>Let's try it together!</p><button class="voice-btn" id="voicePrompt"><span>🔊</span> Listen</button><div class="model-chip"><span>Question model</span><b>${modelName("vocab")}</b></div>${state.aiPlanning ? '<div class="ai-plan-note is-loading">🪄 Choosing a question for you…</div>' : state.aiPlanMessage ? `<div class="ai-plan-note ${state.aiPlanSource === "ai" ? "is-ai" : "is-local"}">${state.aiPlanSource === "ai" ? "✨" : "🌱"} ${state.aiPlanMessage}</div>` : ""}</div>
          <div class="quiz-card">
            <div class="quiz-top"><span>Question ${state.questionIndex + 1} / 3</span><span class="session-live">${state.activeSession ? "● Playing now" : ""}</span><div class="progress-dots">${[0, 1, 2].map((i) => `<i class="${i <= state.questionIndex ? "filled" : ""}"></i>`).join("")}</div></div>
            <div class="question-visual"><span class="question-emoji">${question.visual}</span><span class="question-bubble">${question.prompt}<br/><b>Look and choose</b></span></div>
            <div class="choice-grid">${question.choices.map((choice) => `<button class="choice ${state.answered && choice.value === question.answer ? "correct" : ""} ${state.answered && state.selectedChoice === choice.value && choice.value !== question.answer ? "wrong" : ""}" data-choice="${choice.value}" aria-label="${question.prompt}: ${choice.label}" style="--choice-color:${choice.color}" ${state.answered || state.aiPlanning ? "disabled" : ""}><span class="choice-emoji">${choice.emoji}</span><span>${choice.label}</span>${state.answered && choice.value === question.answer ? '<b class="check">✓</b>' : ""}</button>`).join("")}</div>
            ${state.answered ? `<div class="feedback ${state.correct ? "good" : "try"}">${state.encouragement || (state.correct ? "You found it! ✨" : "That's okay—let's look again")}</div>${state.activityComplete ? (state.baselineTest ? baselineResultMarkup() : offlineTaskMarkup(state.activityCourse)) : `<button class="next-question" id="nextQuestion">${state.correct ? "Next one" : "Try another"} <span>→</span></button>`}` : '<div class="hint">Tap a picture to answer · Find a star!</div>'}
            ${state.activeSession ? `<button class="finish-btn" id="finishSession">${state.activityComplete ? "Finish today" : "Take a break"}</button>` : ""}
          </div>
        </section>

        ${familyTaskPanel()}

        <section class="parent-note"><div class="note-icon">💛</div><div><b>Grown-up note</b><p>Five to eight minutes is plenty. Follow your child's curiosity.</p></div><button class="round-arrow" id="openParent2" aria-label="Open parent settings">→</button></section>
      </main>

      <nav class="mobile-nav"><button class="mobile-nav-item ${state.activeTab === "home" ? "active" : ""}" data-tab="home">⌂<span>Today</span></button><button class="mobile-nav-item ${state.activeTab === "library" ? "active" : ""}" data-tab="library">▶<span>Play</span></button><button class="mobile-nav-item ${state.activeTab === "tasks" ? "active" : ""}" data-tab="tasks">♡<span>Together</span></button><button class="mobile-nav-item" id="openParent3">☼<span>Parent</span></button></nav>
      ${state.modal ? modelSettingsModal() : ""}
      <div class="toast" id="toast">Ready to play</div>
    </div>`;
  bindEvents();
}

function courseCard(course, recommended = false) {
  return `<article class="course-card ${course.tone} ${recommended ? "is-recommended" : ""}" data-course="${course.id}"><div class="course-art"><span>${course.emoji}</span><b>${recommended ? "For you" : course.tag}</b><button class="play-fab" data-play="${course.id}" aria-label="Start ${course.label}">▶</button></div><div class="course-meta"><div><h3>${course.label}</h3><p>${course.subtitle}</p></div><span class="duration">◷ ${course.duration}</span></div></article>`;
}

function modelSettingsModal() {
  if (state.parentGate && !state.parentUnlocked) {
    return `<div class="modal-backdrop" id="modalBackdrop"><div class="modal parent-gate"><div class="modal-icon">🔒</div><h3>家长入口</h3><p>为了不让小朋友误触，请家长长按下面按钮 1 秒钟。</p><button class="hold-btn" id="parentHold"><span>长按进入设置</span><i></i></button><button class="reset-btn" id="parentCancel">先不设置</button></div></div>`;
  }
  const select = (type, label, icon) =>
    `<label class="model-setting"><span class="model-setting-label"><span class="model-setting-icon">${icon}</span><span><b>${label}</b><small>${type === "image" ? "生成学习插画与封面" : type === "voice" ? "朗读题目和鼓励语" : "选择题目难度与题库策略"}</small></span></span><select data-model="${type}">${modelCatalog[type].map((item) => `<option value="${item.id}" ${models[type] === item.id ? "selected" : ""}>${item.name} · ${item.note}</option>`).join("")}</select></label>`;
  return `<div class="modal-backdrop" id="modalBackdrop"><div class="modal model-modal"><button class="modal-close" id="closeModal">×</button><div class="modal-icon">⚙️</div><h3>家长设置</h3>${profileSummary()}${weeklyGrowthCard()}<div class="config-divider"><span>孩子档案</span></div>${childProfileSettings()}<div class="config-divider"><span>模型与能力</span></div><p>家长可以为每项能力选择模型。设置会保存在本机，下次打开仍然生效。</p><div class="model-settings">${select("image", "图片生成", "🖼️")}${select("voice", "语音提问", "🔊")}${select("vocab", "词汇量测试", "🧩")}</div><div class="config-tip">当前语音：<b>${modelName("voice")}</b> · 当前题目：<b>${modelName("vocab")}</b></div><div class="data-tools"><button class="small-action" id="exportData">导出学习档案</button><button class="small-action" id="importData">导入学习档案</button><input id="importFile" type="file" accept="application/json,.json" hidden /></div><div class="modal-actions"><button class="reset-btn" id="resetModels">恢复默认</button><button class="primary-btn" id="closeModal2">保存配置 <span class="arrow">→</span></button></div></div></div>`;
}

function bindEvents() {
  document.querySelectorAll("[data-tab]").forEach((btn) =>
    btn.addEventListener("click", () => {
      state.activeTab = btn.dataset.tab;
      showToast(btn.textContent);
      render();
      const targetId =
        state.activeTab === "library"
          ? "#lessonArea"
          : state.activeTab === "tasks"
            ? "#familyTasks"
            : "#quizPanel";
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
  document.querySelector("#startLesson")?.addEventListener("click", () => {
    beginSession("english");
    render();
    document
      .querySelector("#quizPanel")
      .scrollIntoView({ behavior: "smooth", block: "center" });
    void planQuestionWithAI().then(() => {
      if (state.activeSession) speak(currentQuestion().speech);
    });
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
      recordAnswer(state.activityCourse, state.correct, question);
      if (state.baselineTest && state.correct) state.baselineCorrect += 1;
      if (state.questionIndex >= 2) state.activityComplete = true;
      if (state.baselineTest && state.activityComplete) {
        const child = activeChild();
        const score = state.baselineCorrect;
        const suggestedLevel =
          score >= 3 ? "words" : score === 2 ? "songs" : "not-started";
        if (child) {
          child.baseline = {
            status: "complete",
            score,
            total: 3,
            completedAt: new Date().toISOString(),
            suggestedLevel,
          };
          child.englishPlan = {
            ...child.englishPlan,
            stage: stageFromBaseline(score),
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
      const tip = document.querySelector(".config-tip");
      if (tip)
        tip.innerHTML = `当前语音：<b>${modelName("voice")}</b> · 当前题目：<b>${modelName("vocab")}</b>`;
      const chip = document.querySelector(".model-chip b");
      if (chip) chip.textContent = modelName("vocab");
      const imageBadge = document.querySelector(".active-model");
      if (imageBadge) imageBadge.textContent = `图片：${modelName("image")}`;
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
    const content = serializeLearningData(children, models);
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
        for (const type of ["image", "voice", "vocab"]) {
          const modelId = imported.modelSettings[type];
          if (modelId && modelCatalog[type].some((item) => item.id === modelId))
            models[type] = modelId;
        }
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
    models.image = "gpt-image-1";
    models.voice = "browser-speech";
    models.vocab = "adaptive-picture";
    saveModels();
    render();
  });
  document.querySelector("#finishSession")?.addEventListener("click", () => {
    state.aiPlanToken += 1;
    state.aiPlanning = false;
    state.aiQuestionId = null;
    state.baselineTest = false;
    state.baselineCorrect = 0;
    completeSession(state.activityComplete ? "completed" : "quit");
    state.offlineTaskDone = false;
    state.answered = false;
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
    state.questionIndex = Math.min(2, state.questionIndex + 1);
    state.answered = false;
    state.correct = false;
    state.selectedChoice = null;
    state.encouragement = "";
    state.aiQuestionId = null;
    render();
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
      state.sessionQuestionIds = [];
      state.answered = false;
      state.encouragement = "";
      render();
    });
  });
  ["openParent", "openParent2", "openParent3"].forEach((id) =>
    document.querySelector("#" + id)?.addEventListener("click", () => {
      state.parentGate = !state.parentUnlocked;
      state.modal = true;
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
    state.modal = false;
    render();
  });
  document.querySelector("#closeModal2")?.addEventListener("click", () => {
    state.modal = false;
    render();
  });
  document.querySelector("#modalBackdrop")?.addEventListener("click", (e) => {
    if (e.target.id === "modalBackdrop") {
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
  children = await loadChildren();
  if (!children.length) children = [createDefaultChild()];
  activeChildId = children[0].id;
  profile = children[0].profile;
  render();
}

init();
