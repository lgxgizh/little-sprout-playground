import "./styles.css";
import "./overrides.css";
import { requestNextQuestion } from "./ai.js";
import {
  addLearningEvent,
  clearLearningData,
  createDefaultProfile,
  loadProfile,
  saveAttempt,
  saveProfile,
  saveReward,
  saveSession,
} from "./storage.js";

const courses = [
  {
    id: "colors",
    label: "颜色小侦探",
    subtitle: "认识 4 种颜色",
    emoji: "🌈",
    tone: "peach",
    duration: "5 分钟",
    tag: "今日推荐",
  },
  {
    id: "animals",
    label: "动物来唱歌",
    subtitle: "听声音猜动物",
    emoji: "🐼",
    tone: "mint",
    duration: "8 分钟",
    tag: "趣味动画",
  },
  {
    id: "shapes",
    label: "形状碰碰车",
    subtitle: "找一找圆形和方形",
    emoji: "🔵",
    tone: "lavender",
    duration: "6 分钟",
    tag: "动手玩",
  },
];

const questionBank = {
  colors: [
    {
      id: "color-blue-fruit",
      difficulty: 1,
      visual: "🦊",
      prompt: "帮我找到蓝色水果",
      speech: "小栗子想找一颗蓝色的水果，你能帮帮它吗？",
      answer: "blue",
      choices: [
        { label: "红色", emoji: "🍎", value: "red", color: "#ff6b5e" },
        { label: "黄色", emoji: "🍌", value: "yellow", color: "#f7c94b" },
        { label: "蓝色", emoji: "🫐", value: "blue", color: "#6db6e8" },
      ],
    },
    {
      id: "color-red-flower",
      difficulty: 1,
      visual: "🌼",
      prompt: "哪一朵花是红色的？",
      speech: "请找出红色的花朵。",
      answer: "red",
      choices: [
        { label: "红色", emoji: "🌹", value: "red", color: "#ff6b5e" },
        { label: "黄色", emoji: "🌻", value: "yellow", color: "#f7c94b" },
        { label: "蓝色", emoji: "🪻", value: "blue", color: "#6db6e8" },
      ],
    },
    {
      id: "color-yellow-sun",
      difficulty: 2,
      visual: "☀️",
      prompt: "把黄色的东西送给小熊",
      speech: "请找出黄色的东西，送给小熊。",
      answer: "yellow",
      choices: [
        { label: "蓝色", emoji: "🧢", value: "blue", color: "#6db6e8" },
        { label: "黄色", emoji: "⭐", value: "yellow", color: "#f7c94b" },
        { label: "红色", emoji: "🧣", value: "red", color: "#ff6b5e" },
      ],
    },
  ],
  animals: [
    {
      id: "animal-cat",
      difficulty: 1,
      visual: "🐼",
      prompt: "谁会喵喵叫？",
      speech: "请找一找，谁会喵喵叫？",
      answer: "cat",
      choices: [
        { label: "小猫", emoji: "🐱", value: "cat", color: "#f3b56d" },
        { label: "小鸭", emoji: "🦆", value: "duck", color: "#f7c94b" },
        { label: "小牛", emoji: "🐮", value: "cow", color: "#9ed9c4" },
      ],
    },
    {
      id: "animal-duck",
      difficulty: 2,
      visual: "🎵",
      prompt: "找到会嘎嘎叫的小伙伴",
      speech: "请找出会嘎嘎叫的小伙伴。",
      answer: "duck",
      choices: [
        { label: "小狗", emoji: "🐶", value: "dog", color: "#d9a66f" },
        { label: "小鸭", emoji: "🦆", value: "duck", color: "#f7c94b" },
        { label: "小羊", emoji: "🐑", value: "sheep", color: "#e8e8dc" },
      ],
    },
  ],
  shapes: [
    {
      id: "shape-circle",
      difficulty: 1,
      visual: "🔵",
      prompt: "找一个圆圆的形状",
      speech: "请找一个圆圆的形状。",
      answer: "circle",
      choices: [
        { label: "圆形", emoji: "⚪", value: "circle", color: "#6db6e8" },
        { label: "方形", emoji: "🟨", value: "square", color: "#f7c94b" },
        { label: "三角形", emoji: "🔺", value: "triangle", color: "#ff8b76" },
      ],
    },
    {
      id: "shape-square",
      difficulty: 2,
      visual: "🧩",
      prompt: "哪一个像积木的方方脸？",
      speech: "哪一个形状像积木的方方脸？",
      answer: "square",
      choices: [
        { label: "三角形", emoji: "🔺", value: "triangle", color: "#ff8b76" },
        { label: "圆形", emoji: "⚪", value: "circle", color: "#6db6e8" },
        { label: "方形", emoji: "🟨", value: "square", color: "#f7c94b" },
      ],
    },
  ],
};

const offlineTasks = {
  colors: {
    title: "生活里的颜色",
    prompt: "和家长一起找 3 个蓝色的东西",
    emoji: "🔎",
  },
  animals: {
    title: "听听小动物",
    prompt: "学一学你最喜欢的小动物叫声",
    emoji: "🐾",
  },
  shapes: { title: "形状寻宝", prompt: "在家里找一个圆圆的东西", emoji: "🧺" },
};

const modelCatalog = {
  image: [
    { id: "gpt-image-1", name: "GPT Image 1", note: "通用插画 · 质量优先" },
    { id: "flux-schnell", name: "FLUX Schnell", note: "快速生成 · 适合草稿" },
    {
      id: "local-image",
      name: "本地图片库",
      note: "使用 public/assets 中的素材",
    },
  ],
  voice: [
    { id: "browser-speech", name: "浏览器语音", note: "无需密钥 · 当前默认" },
    {
      id: "gpt-4o-mini-tts",
      name: "OpenAI TTS",
      note: "自然中文 · 需配置 API",
    },
    { id: "local-audio", name: "本地音频", note: "播放题目音频文件" },
  ],
  vocab: [
    {
      id: "adaptive-picture",
      name: "图片自适应测试",
      note: "按答题表现动态调整",
    },
    {
      id: "gpt-4o-mini",
      name: "GPT-4o mini",
      note: "生成个性化题目 · 需配置 API",
    },
    {
      id: "local-question-bank",
      name: "本地题库",
      note: "使用你提供的固定题目",
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
  activityCourse: "colors",
  questionIndex: 0,
  sessionQuestionIds: [],
  selectedChoice: null,
  activityComplete: false,
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

function beginSession(courseId) {
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
  saveProfile(profile);
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
  saveProfile(profile);
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
  if (!state.sessionQuestionIds.includes(question.id))
    state.sessionQuestionIds.push(question.id);
  profile.events.push(event);
  profile.events = profile.events.slice(-60);
  saveProfile(profile);
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
  const ranked = Object.entries(profile.skills).sort(
    ([a, left], [b, right]) => {
      const leftScore = left.attempts ? left.correct / left.attempts : -1;
      const rightScore = right.attempts ? right.correct / right.attempts : -1;
      if (leftScore !== rightScore) return leftScore - rightScore;
      return (left.lastPracticed || "").localeCompare(
        right.lastPracticed || "",
      );
    },
  );
  const [courseId, skill] = ranked[0];
  const course = courses.find((item) => item.id === courseId) || courses[0];
  const accuracy = skill.attempts
    ? Math.round((skill.correct / skill.attempts) * 100)
    : 0;
  const reason = !skill.attempts
    ? "还没有玩过，我们从这里开始吧"
    : accuracy < 70
      ? "再玩几次，熟悉之后会更有信心"
      : "已经很棒啦，换个角度再巩固一下";
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
            ? "答对了一题，收集到一颗星"
            : "再试一次，继续加油"
          : event.type === "offline_task_completed"
            ? "完成了屏幕外亲子小游戏"
            : event.type === "session_completed"
              ? "完成了一次学习"
              : "开始了一次学习";
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
  const recommendationText = recommendation();
  return `<div class="profile-summary"><div class="summary-head"><span>🌱</span><div><b>成长小档案</b><small>只保存在这台设备</small></div></div><div class="summary-stats"><div><strong>${profile.streak}</strong><small>连续学习天</small></div><div><strong>${profile.totalSessions}</strong><small>学习次数</small></div><div><strong>${accuracy}%</strong><small>答题正确率</small></div><div><strong>${profile.stars}</strong><small>收集星星</small></div></div><div class="question-coverage"><span>🧩</span><span>已经探索 <b>${coveredQuestions}</b> 个小题目</span><small>AI 和本地题库都会参考这些练习痕迹</small></div>${skillProgress()}${recentActivity()}<div class="summary-recommendation"><span>✨</span><span>下一步推荐：<b>${recommendationText.course.label}</b><small>${recommendationText.reason}</small></span></div><button class="clear-profile" id="clearProfile">清除本机学习记录</button></div>`;
}

function offlineTaskMarkup(courseId) {
  const task = offlineTasks[courseId] || offlineTasks.colors;
  return `<div class="offline-task ${state.offlineTaskDone ? "done" : ""}"><span class="offline-task-emoji">${task.emoji}</span><span><b>${task.title}</b><small>${state.offlineTaskDone ? "完成啦，和家长击个掌！" : task.prompt}</small></span><button id="offlineDone" ${state.offlineTaskDone ? "disabled" : ""}>${state.offlineTaskDone ? "✓" : "完成"}</button></div>`;
}

function familyTaskPanel() {
  const recommendedId = recommendation().course.id;
  return `<section class="family-tasks" id="familyTasks"><div class="section-heading"><div><span class="section-kicker">TOGETHER · 亲子时光</span><h2>屏幕外也能玩</h2></div><span class="active-model">每天选一个就好</span></div><div class="family-task-grid">${courses
    .map((course) => {
      const task = offlineTasks[course.id];
      return `<article class="family-task-card ${course.tone} ${course.id === recommendedId ? "is-recommended" : ""}"><span class="family-task-icon">${task.emoji}</span><div><b>${task.title}</b><p>${task.prompt}</p></div>${course.id === recommendedId ? '<span class="family-task-tag">今日推荐</span>' : ""}</article>`;
    })
    .join(
      "",
    )}</div><p class="family-task-note">小朋友不需要完成全部任务，和家长一起开心观察、说一说，就是很棒的学习。</p></section>`;
}

function modelName(type) {
  return (
    modelCatalog[type].find((item) => item.id === models[type])?.name ||
    models[type]
  );
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
  utterance.lang = "zh-CN";
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
  const allCandidates = questionBank[courseId] || questionBank.colors;
  const unseenCandidates = allCandidates.filter(
    (question) => !state.sessionQuestionIds.includes(question.id),
  );
  const candidates = unseenCandidates.length ? unseenCandidates : allCandidates;
  state.aiPlanning = true;
  state.aiPlanSource = "ai";
  state.aiPlanMessage = "小栗子正在根据最近的学习情况想题目…";
  render();

  const result = await requestNextQuestion({
    model: models.vocab,
    profile,
    activityCourse: courseId,
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
    state.aiPlanMessage = "AI 已结合最近的学习表现选好题啦";
  } else {
    state.aiQuestionId = null;
    state.aiPlanSource = "local";
    state.aiPlanMessage = "AI 暂时不可用，先用本地自适应题库继续玩";
  }
  render();
  return result;
}

function render() {
  const next = recommendation();
  const activeCourse =
    courses.find((course) => course.id === state.activityCourse) || courses[0];
  const question = currentQuestion();
  document.querySelector("#app").innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand"><span class="brand-mark">✦</span><span>小栗子乐园</span><small>亲子学习网页</small></div>
        <nav class="desktop-nav" aria-label="主导航">
          <button class="nav-item ${state.activeTab === "home" ? "active" : ""}" data-tab="home">今天学习</button>
          <button class="nav-item ${state.activeTab === "library" ? "active" : ""}" data-tab="library">动画时间</button>
          <button class="nav-item ${state.activeTab === "tasks" ? "active" : ""}" data-tab="tasks">亲子任务</button>
        </nav>
        <div class="top-actions"><button class="icon-btn" id="soundToggle" aria-label="语音开关">${state.soundOn ? "🔊" : "🔇"}</button><button class="parent-btn" id="openParent">家长设置 <span>⌄</span></button></div>
      </header>

      <main>
        <section class="hero">
          <div class="hero-copy">
            <div class="eyebrow"><span class="spark">✦</span> 今天的 5 分钟亲子时光</div>
            <h1>和小栗子<br/><em>${activeCourse.label}</em></h1>
            <p>不用识字，看一看、听一听，<br/>${activeCourse.subtitle}，一起玩就会啦。</p>
            <button class="primary-btn" id="startLesson"><span>${state.activeSession ? "继续今天的学习" : "开始今天的学习"}</span><span class="arrow">→</span></button>
            <div class="streak"><span class="streak-icon">🔥</span><span><b>连续学习 ${profile.streak} 天</b><small>${profile.streak ? "每天玩一小会儿，成长会被记住" : "完成今天的学习，就能点亮第一颗星"}</small></span></div>
            <div class="star-badge">⭐ 已收集 ${profile.stars} 颗小星星</div>
          </div>
          <div class="hero-art"><img src="${assetBase}assets/fox-hero.png" alt="小狐狸坐在帐篷旁读图画书"/><div class="floating-pill pill-one">今天也要玩得开心</div><div class="floating-pill pill-two">⭐ +1</div></div>
        </section>

        <section class="section-block" id="lessonArea">
          <div class="section-heading"><div><span class="section-kicker">PLAY · LEARN · GROW</span><h2>今天玩什么？</h2><span class="active-model">图片：${modelName("image")}</span></div><button class="text-btn" id="viewAll">查看全部 <span>→</span></button></div>
          <div class="course-grid">${courses.map((course) => courseCard(course, course.id === next.course.id)).join("")}</div>
          <div class="recommendation-strip"><span class="recommendation-mascot">🦊</span><div><span class="section-kicker">为你准备</span><b>${next.course.label}</b><small>${next.reason}</small></div><button class="mini-cta" data-recommend="${next.course.id}">去玩 <span>→</span></button></div>
        </section>

        <section class="learning-panel" id="quizPanel">
          <div class="panel-intro"><span class="section-kicker">MINI QUEST · ${String(state.questionIndex + 1).padStart(2, "0")}</span><h2>${activeCourse.label}</h2><p>${question.prompt}<br/>和小栗子一起试试看吧！</p><button class="voice-btn" id="voicePrompt"><span>🔊</span> 听一听题目</button><div class="model-chip"><span>题目模型</span><b>${modelName("vocab")}</b></div>${state.aiPlanning ? '<div class="ai-plan-note is-loading">🪄 正在根据最近的学习表现准备题目…</div>' : state.aiPlanMessage ? `<div class="ai-plan-note ${state.aiPlanSource === "ai" ? "is-ai" : "is-local"}">${state.aiPlanSource === "ai" ? "✨" : "🌱"} ${state.aiPlanMessage}</div>` : ""}</div>
          <div class="quiz-card">
            <div class="quiz-top"><span>第 ${state.questionIndex + 1} 题 / 3</span><span class="session-live">${state.activeSession ? "● 本次学习中" : ""}</span><div class="progress-dots">${[0, 1, 2].map((i) => `<i class="${i <= state.questionIndex ? "filled" : ""}"></i>`).join("")}</div></div>
            <div class="question-visual"><span class="question-emoji">${question.visual}</span><span class="question-bubble">${question.prompt}<br/><b>看图片来选择</b></span></div>
            <div class="choice-grid">${question.choices.map((choice) => `<button class="choice ${state.answered && choice.value === question.answer ? "correct" : ""} ${state.answered && state.selectedChoice === choice.value && choice.value !== question.answer ? "wrong" : ""}" data-choice="${choice.value}" aria-label="${question.prompt}：${choice.label}" style="--choice-color:${choice.color}" ${state.answered || state.aiPlanning ? "disabled" : ""}><span class="choice-emoji">${choice.emoji}</span><span>${choice.label}</span>${state.answered && choice.value === question.answer ? '<b class="check">✓</b>' : ""}</button>`).join("")}</div>
            ${state.answered ? `<div class="feedback ${state.correct ? "good" : "try"}">${state.encouragement || (state.correct ? "太棒了！你发现啦 ✨" : "没关系，我们再看一眼吧～")}</div>${state.activityComplete ? offlineTaskMarkup(state.activityCourse) : `<button class="next-question" id="nextQuestion">${state.correct ? "继续下一题" : "再试下一题"} <span>→</span></button>`}` : '<div class="hint">点击图片来回答 · 答对会有小星星</div>'}
            ${state.activeSession ? `<button class="finish-btn" id="finishSession">${state.activityComplete ? "完成今天的学习" : "先结束，休息一下"}</button>` : ""}
          </div>
        </section>

        ${familyTaskPanel()}

        <section class="parent-note"><div class="note-icon">💛</div><div><b>给家长的小提示</b><p>3 岁宝宝每次专注 5–8 分钟就很棒啦，跟着兴趣慢慢来。</p></div><button class="round-arrow" id="openParent2">→</button></section>
      </main>

      <nav class="mobile-nav"><button class="mobile-nav-item ${state.activeTab === "home" ? "active" : ""}" data-tab="home">⌂<span>今天</span></button><button class="mobile-nav-item ${state.activeTab === "library" ? "active" : ""}" data-tab="library">▶<span>动画</span></button><button class="mobile-nav-item ${state.activeTab === "tasks" ? "active" : ""}" data-tab="tasks">♡<span>任务</span></button><button class="mobile-nav-item" id="openParent3">☼<span>家长</span></button></nav>
      ${state.modal ? modelSettingsModal() : ""}
      <div class="toast" id="toast">已切换内容</div>
    </div>`;
  bindEvents();
}

function courseCard(course, recommended = false) {
  return `<article class="course-card ${course.tone} ${recommended ? "is-recommended" : ""}" data-course="${course.id}"><div class="course-art"><span>${course.emoji}</span><b>${recommended ? "为你推荐" : course.tag}</b><button class="play-fab" data-play="${course.id}" aria-label="开始${course.label}">▶</button></div><div class="course-meta"><div><h3>${course.label}</h3><p>${course.subtitle}</p></div><span class="duration">◷ ${course.duration}</span></div></article>`;
}

function modelSettingsModal() {
  if (state.parentGate && !state.parentUnlocked) {
    return `<div class="modal-backdrop" id="modalBackdrop"><div class="modal parent-gate"><div class="modal-icon">🔒</div><h3>家长入口</h3><p>为了不让小朋友误触，请家长长按下面按钮 1 秒钟。</p><button class="hold-btn" id="parentHold"><span>长按进入设置</span><i></i></button><button class="reset-btn" id="parentCancel">先不设置</button></div></div>`;
  }
  const select = (type, label, icon) =>
    `<label class="model-setting"><span class="model-setting-label"><span class="model-setting-icon">${icon}</span><span><b>${label}</b><small>${type === "image" ? "生成学习插画与封面" : type === "voice" ? "朗读题目和鼓励语" : "选择题目难度与题库策略"}</small></span></span><select data-model="${type}">${modelCatalog[type].map((item) => `<option value="${item.id}" ${models[type] === item.id ? "selected" : ""}>${item.name} · ${item.note}</option>`).join("")}</select></label>`;
  return `<div class="modal-backdrop" id="modalBackdrop"><div class="modal model-modal"><button class="modal-close" id="closeModal">×</button><div class="modal-icon">⚙️</div><h3>家长设置</h3>${profileSummary()}<div class="config-divider"><span>模型与能力</span></div><p>家长可以为每项能力选择模型。设置会保存在本机，下次打开仍然生效。</p><div class="model-settings">${select("image", "图片生成", "🖼️")}${select("voice", "语音提问", "🔊")}${select("vocab", "词汇量测试", "🧩")}</div><div class="config-tip">当前语音：<b>${modelName("voice")}</b> · 当前题目：<b>${modelName("vocab")}</b></div><div class="modal-actions"><button class="reset-btn" id="resetModels">恢复默认</button><button class="primary-btn" id="closeModal2">保存配置 <span class="arrow">→</span></button></div></div></div>`;
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
    beginSession("colors");
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
      showToast("请在 public/assets/audio 中放入题目音频");
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
      if (state.questionIndex >= 2) state.activityComplete = true;
      const goodWords = [
        "太棒了！你发现啦 ✨",
        "小眼睛真会观察！收下这颗星星吧 🌟",
        "答对啦！你和小栗子配合得真好 🎈",
      ];
      const gentleWords = [
        "没关系，我们再看一眼蓝莓的颜色吧～",
        "差一点点！小栗子陪你再试一次",
        "慢慢来，听清楚再选也可以哦",
      ];
      state.encouragement = state.correct
        ? goodWords[profile.stars % goodWords.length]
        : gentleWords[profile.totalAnswers % gentleWords.length];
      if (state.correct) speak("太棒了，你找到了");
      else speak("没关系，我们换一道题试试");
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
        state.playing === "animals" ? "动物来唱歌准备中" : "播放预览中",
      );
      void planQuestionWithAI().then(() => {
        if (state.activeSession)
          speak(`现在开始播放。${currentQuestion().speech}`);
      });
    }),
  );
  document
    .querySelector("#viewAll")
    ?.addEventListener("click", () => showToast("更多内容正在准备中"));
  document.querySelector("[data-recommend]")?.addEventListener("click", () => {
    const courseId =
      document.querySelector("[data-recommend]").dataset.recommend;
    beginSession(courseId);
    render();
    showToast("小栗子已经为你打开啦");
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
    completeSession(state.activityComplete ? "completed" : "quit");
    state.offlineTaskDone = false;
    state.answered = false;
    state.encouragement = "";
    speak("今天的学习完成啦");
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
    saveProfile(profile);
    addLearningEvent(event);
    saveReward({
      id: makeId("reward"),
      type: "offline_task",
      courseId: state.activityCourse,
      at: event.at,
    });
    speak("太棒了，和家长一起完成啦");
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
      profile = createDefaultProfile();
      state.aiPlanToken += 1;
      state.aiPlanning = false;
      state.aiQuestionId = null;
      state.aiPlanMessage = "";
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
    '<div class="loading-screen"><span>🦊</span><b>小栗子正在打开成长档案…</b></div>';
  profile = await loadProfile();
  render();
}

init();
