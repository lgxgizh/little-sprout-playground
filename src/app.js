import "./styles.css";
import "./overrides.css";
import {
  addLearningEvent,
  clearLearningData,
  createDefaultProfile,
  loadProfile,
  saveProfile,
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

const quizChoices = [
  { label: "红色", emoji: "🍎", value: "red", color: "#ff6b5e" },
  { label: "黄色", emoji: "🍌", value: "yellow", color: "#f7c94b" },
  { label: "蓝色", emoji: "🫐", value: "blue", color: "#6db6e8" },
];

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
    return JSON.parse(localStorage.getItem("little-fun-models") || "{}");
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

function recordSession(courseId) {
  touchLearningDay();
  profile.totalSessions += 1;
  if (profile.skills[courseId])
    profile.skills[courseId].lastPracticed = new Date().toISOString();
  const event = {
    type: "session",
    courseId,
    at: new Date().toISOString(),
  };
  profile.events.push(event);
  profile.events = profile.events.slice(-60);
  saveProfile(profile);
  addLearningEvent(event);
}

function recordAnswer(courseId, correct) {
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
    correct,
    at: new Date().toISOString(),
  };
  profile.events.push(event);
  profile.events = profile.events.slice(-60);
  saveProfile(profile);
  addLearningEvent(event);
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

function profileSummary() {
  const accuracy = profile.totalAnswers
    ? Math.round((profile.correctAnswers / profile.totalAnswers) * 100)
    : 0;
  const recommendationText = recommendation();
  return `<div class="profile-summary"><div class="summary-head"><span>🌱</span><div><b>成长小档案</b><small>只保存在这台设备</small></div></div><div class="summary-stats"><div><strong>${profile.streak}</strong><small>连续学习天</small></div><div><strong>${profile.totalSessions}</strong><small>学习次数</small></div><div><strong>${accuracy}%</strong><small>答题正确率</small></div><div><strong>${profile.stars}</strong><small>收集星星</small></div></div><div class="summary-recommendation"><span>✨</span><span>下一步推荐：<b>${recommendationText.course.label}</b><small>${recommendationText.reason}</small></span></div><button class="clear-profile" id="clearProfile">清除本机学习记录</button></div>`;
}

function modelName(type) {
  return (
    modelCatalog[type].find((item) => item.id === models[type])?.name ||
    models[type]
  );
}

function saveModels() {
  try {
    localStorage.setItem("little-fun-models", JSON.stringify(models));
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

function render() {
  const next = recommendation();
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
            <h1>和小栗子<br/><em>一起发现颜色</em></h1>
            <p>不用识字，看一看、听一听，<br/>小眼睛也能学会新本领。</p>
            <button class="primary-btn" id="startLesson"><span>开始今天的学习</span><span class="arrow">→</span></button>
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
          <div class="panel-intro"><span class="section-kicker">MINI QUEST · 01</span><h2>颜色小侦探</h2><p>小栗子想找一颗蓝色的水果，<br/>你能帮帮它吗？</p><button class="voice-btn" id="voicePrompt"><span>🔊</span> 听一听题目</button><div class="model-chip"><span>题目模型</span><b>${modelName("vocab")}</b></div></div>
          <div class="quiz-card">
            <div class="quiz-top"><span>第 ${state.step} 题 / 3</span><div class="progress-dots">${[1, 2, 3].map((i) => `<i class="${i <= state.step ? "filled" : ""}"></i>`).join("")}</div></div>
            <div class="question-visual"><span class="question-emoji">🦊</span><span class="question-bubble">帮我找到<br/><b>蓝色水果</b>吧！</span></div>
            <div class="choice-grid">${quizChoices.map((choice) => `<button class="choice ${state.answered && choice.value === "blue" ? "correct" : ""}" data-choice="${choice.value}" style="--choice-color:${choice.color}"><span class="choice-emoji">${choice.emoji}</span><span>${choice.label}</span>${state.answered && choice.value === "blue" ? '<b class="check">✓</b>' : ""}</button>`).join("")}</div>
            ${state.answered ? `<div class="feedback ${state.correct ? "good" : "try"}">${state.encouragement || (state.correct ? "太棒了！蓝莓是蓝色的 ✨" : "再听一遍，小栗子说的是蓝色哦～")}</div>` : '<div class="hint">点击图片来回答 · 答对会有小星星</div>'}
          </div>
        </section>

        <section class="parent-note"><div class="note-icon">💛</div><div><b>给家长的小提示</b><p>3 岁宝宝每次专注 5–8 分钟就很棒啦，跟着兴趣慢慢来。</p></div><button class="round-arrow" id="openParent2">→</button></section>
      </main>

      <nav class="mobile-nav"><button class="mobile-nav-item active">⌂<span>今天</span></button><button class="mobile-nav-item">▶<span>动画</span></button><button class="mobile-nav-item">♡<span>任务</span></button><button class="mobile-nav-item" id="openParent3">☼<span>家长</span></button></nav>
      ${state.modal ? modelSettingsModal() : ""}
      <div class="toast" id="toast">已切换内容</div>
    </div>`;
  bindEvents();
}

function courseCard(course, recommended = false) {
  return `<article class="course-card ${course.tone} ${recommended ? "is-recommended" : ""}" data-course="${course.id}"><div class="course-art"><span>${course.emoji}</span><b>${recommended ? "为你推荐" : course.tag}</b><button class="play-fab" data-play="${course.id}">▶</button></div><div class="course-meta"><div><h3>${course.label}</h3><p>${course.subtitle}</p></div><span class="duration">◷ ${course.duration}</span></div></article>`;
}

function modelSettingsModal() {
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
    }),
  );
  document.querySelector("#soundToggle")?.addEventListener("click", () => {
    state.soundOn = !state.soundOn;
    render();
  });
  document.querySelector("#startLesson")?.addEventListener("click", () => {
    recordSession("colors");
    document
      .querySelector("#quizPanel")
      .scrollIntoView({ behavior: "smooth", block: "center" });
    speak("我们来找蓝色的水果");
  });
  document.querySelector("#voicePrompt")?.addEventListener("click", () => {
    if (models.voice === "local-audio")
      showToast("请在 public/assets/audio 中放入题目音频");
    else speak("小栗子想找一颗蓝色的水果，你能帮帮它吗？");
  });
  document.querySelectorAll("[data-choice]").forEach((btn) =>
    btn.addEventListener("click", () => {
      state.answered = true;
      state.correct = btn.dataset.choice === "blue";
      recordAnswer("colors", state.correct);
      const goodWords = [
        "太棒了！蓝莓是蓝色的 ✨",
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
      if (state.correct) speak("太棒了，蓝莓是蓝色的");
      else speak("再试一次，蓝色");
      render();
    }),
  );
  document.querySelectorAll("[data-play]").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      state.playing = btn.dataset.play;
      recordSession(state.playing);
      showToast(
        state.playing === "animals" ? "动物来唱歌准备中" : "播放预览中",
      );
      speak("现在开始播放");
    }),
  );
  document
    .querySelector("#viewAll")
    ?.addEventListener("click", () => showToast("更多内容正在准备中"));
  document.querySelector("[data-recommend]")?.addEventListener("click", () => {
    const courseId =
      document.querySelector("[data-recommend]").dataset.recommend;
    recordSession(courseId);
    showToast("小栗子已经为你打开啦");
    document
      .querySelector(`[data-course="${courseId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
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
  document.querySelector("#clearProfile")?.addEventListener("click", () => {
    if (!window.confirm("确定要清除这台设备上的学习记录吗？")) return;
    clearLearningData().then(() => {
      profile = createDefaultProfile();
      state.answered = false;
      state.encouragement = "";
      render();
    });
  });
  ["openParent", "openParent2", "openParent3"].forEach((id) =>
    document.querySelector("#" + id)?.addEventListener("click", () => {
      state.modal = true;
      render();
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
