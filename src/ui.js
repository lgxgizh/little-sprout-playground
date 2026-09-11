import {
  childLabels,
  demoQuestion,
  mediaShelf,
  offlineTasks,
  resolveAssetUrl,
} from "./content.js";
import {
  hasRemoteAdapter,
  isAdapterModel,
  modelCatalog,
  MODEL_CAPABILITIES,
  modelName,
} from "./model-config.js";
import { stageDefinition, summarizeWeek } from "./learning-plan.js";

export function escapeHtml(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
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

function eventCopy(event) {
  if (event.type === "answer")
    return event.correct ? "找到啦，得了一颗星" : "勇敢试了一次";
  if (event.type === "offline_task_completed") return "完成了屏幕外小游戏";
  if (event.type === "session_completed") return "完成了一次小游戏";
  if (event.type === "session_quit") return "休息了一下";
  return "开始玩啦";
}

function topbar(ctx) {
  const { state } = ctx;
  const inPlay = state.view === "play";
  return `<header class="topbar">
    <div class="brand">
      <span class="brand-mark" aria-hidden="true">✦</span>
      <span>小栗子乐园</span>
      <small>听 · 看 · 玩</small>
    </div>
    ${
      inPlay
        ? ""
        : `<nav class="desktop-nav" aria-label="主导航">
      <button class="nav-item ${state.view === "home" ? "active" : ""}" data-tab="home">今天</button>
      <button class="nav-item ${state.view === "library" ? "active" : ""}" data-tab="library">故事</button>
      <button class="nav-item ${state.view === "tasks" ? "active" : ""}" data-tab="tasks">一起玩</button>
    </nav>`
    }
    <div class="top-actions">
      <button class="icon-btn" id="soundToggle" aria-label="${state.soundOn ? "关闭声音" : "打开声音"}">${state.soundOn ? "🔊" : "🔇"}</button>
      ${inPlay ? "" : `<button class="parent-btn" id="openParent">家长</button>`}
    </div>
  </header>`;
}

function mobileNav(ctx) {
  const { state } = ctx;
  if (state.view === "play") return "";
  return `<nav class="mobile-nav" aria-label="底部导航">
    <button class="mobile-nav-item ${state.view === "home" ? "active" : ""}" data-tab="home"><span aria-hidden="true">⌂</span>今天</button>
    <button class="mobile-nav-item ${state.view === "library" ? "active" : ""}" data-tab="library"><span aria-hidden="true">▶</span>故事</button>
    <button class="mobile-nav-item ${state.view === "tasks" ? "active" : ""}" data-tab="tasks"><span aria-hidden="true">♡</span>一起玩</button>
    <button class="mobile-nav-item" id="openParent3"><span aria-hidden="true">☼</span>家长</button>
  </nav>`;
}

function courseCard(course, recommended, assetBase) {
  const cover = course.cover
    ? `<img src="${escapeHtml(resolveAssetUrl(assetBase, course.cover))}" alt="${escapeHtml(course.label)}" />`
    : `<span>${course.emoji}</span>`;
  return `<article class="course-card ${course.tone} ${recommended ? "is-recommended" : ""}">
    <button class="course-hit" data-play="${course.id}" aria-label="开始${escapeHtml(course.label)}">
      <span class="course-art">${cover}${recommended ? "<b>为你准备</b>" : `<b>${course.tag}</b>`}</span>
      <span class="course-meta">
        <span>
          <strong>${course.label}</strong>
          <small>${course.labelEn}</small>
        </span>
        <em>${course.duration}</em>
      </span>
    </button>
  </article>`;
}

function demoQuiz(ctx) {
  const question = ctx.demoQuestion || demoQuestion;
  if (!question) return "";
  const { state, assetBase } = ctx;
  const visual = resolveAssetUrl(assetBase, question.image);
  return `<section class="demo-quiz" aria-label="试玩一题">
    <div class="demo-quiz-head">
      <span class="eyebrow">打开就能玩</span>
      <h2>${escapeHtml(question.prompt)}</h2>
      <p>先听一听，再点一张图。不用登录。</p>
    </div>
    <div class="demo-quiz-board">
      <img class="demo-hero" src="${escapeHtml(visual)}" alt="" />
      <div>
        <div class="speech-actions">
          <button class="voice-btn" id="demoListen"><span>🔊</span> 听一听</button>
        </div>
        <div class="choice-grid demo-choices">${question.choices
          .map((choice) => {
            const picked = state.demoChoice === choice.value;
            const correct =
              state.demoAnswered && choice.value === question.answer;
            const wrong =
              state.demoAnswered && picked && choice.value !== question.answer;
            return `<button class="choice ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}" data-demo-choice="${escapeHtml(choice.value)}" aria-label="${escapeHtml(question.prompt)}: ${escapeHtml(choice.label)}" style="--choice-color:${choice.color}" ${state.demoAnswered ? "disabled" : ""}><img class="choice-image" src="${escapeHtml(resolveAssetUrl(assetBase, choice.image))}" alt="" /><span>${escapeHtml(choice.label)}</span>${correct ? '<b class="check">✓</b>' : ""}</button>`;
          })
          .join("")}</div>
        ${
          state.demoAnswered
            ? `<div class="feedback ${state.demoCorrect ? "good" : "try"}">${state.demoCorrect ? "找到啦！这就是小栗子乐园。" : "没关系，再看一次苹果。"}</div>
               <button class="primary-btn" id="startLesson"><span>${state.demoCorrect ? "再玩 3 题" : "玩完整一局"}</span><span class="arrow">→</span></button>
               ${state.demoCorrect ? "" : `<button class="text-btn" id="retryDemo">再试一次</button>`}`
            : `<p class="hint">点一张图试试看</p>`
        }
      </div>
    </div>
  </section>`;
}

function homeView(ctx) {
  const { child, profile, next, dailyProgress, assetBase, courses, state } =
    ctx;
  const name = escapeHtml(child?.nickname || "小朋友");
  const played = (profile?.totalAnswers || 0) > 0;
  return `<section class="home-view">
    <div class="home-hero">
      <p class="home-hello">嗨，${name}</p>
      <h1>${played ? "今天一起玩英语" : "点一张图，开始玩"}</h1>
      <p class="home-lead">看图、听英语、点一选。打开就能试，不用登录，大约 5 分钟。</p>
      ${demoQuiz(ctx)}
      <div class="today-card today-card-compact">
        <div class="today-art">
          <img src="${assetBase}assets/fox-hero.png" alt="小狐狸在看图画书" />
        </div>
        <div class="today-copy">
          <span class="eyebrow">今天推荐</span>
          <h2>${next.course.emoji} ${escapeHtml(next.course.label)}</h2>
          <p>${escapeHtml(next.reason)}</p>
          <button class="primary-btn" id="startRecommended">
            <span>玩 ${escapeHtml(next.course.label)}</span>
            <span class="arrow">→</span>
          </button>
          <div class="daily-goal">
            <div class="daily-goal-top"><span>今天的小冒险</span><b>${dailyProgress.answers}/${dailyProgress.target}</b></div>
            <div class="daily-goal-track"><i style="width:${Math.round((dailyProgress.answers / dailyProgress.target) * 100)}%"></i></div>
            <small>${dailyProgress.answers >= dailyProgress.target ? "今天完成啦，明天再来玩" : `还差 ${dailyProgress.target - dailyProgress.answers} 题`}</small>
          </div>
        </div>
      </div>
      <div class="home-stats">
        <span>⭐ ${profile.stars} 颗小星星</span>
        <span>🔥 ${profile.streak} 天连续</span>
        <span>🔤 第 ${stageDefinition(child?.englishPlan?.stage).id} 阶段</span>
        <button class="text-btn" id="openSetup">家长设置</button>
      </div>
    </div>
    <section class="home-courses">
      <div class="section-heading">
        <h2>想玩哪一个？</h2>
      </div>
      <div class="course-grid">${courses.map((course) => courseCard(course, course.id === next.course.id, assetBase)).join("")}</div>
    </section>
  </section>`;
}

function playView(ctx) {
  const { state, question, courses } = ctx;
  const course =
    courses.find((item) => item.id === state.activityCourse) || courses[0];
  const step = state.questionIndex + 1;
  const good = state.correct ? "找到啦！✨" : "没关系，再看一次";
  return `<section class="play-view" aria-live="polite">
    <div class="play-toolbar">
      <button class="text-btn" id="leavePlay">${state.activityComplete ? "完成" : "休息一下"}</button>
      <div class="play-progress" aria-label="第 ${step} 题，共 3 题">
        ${[0, 1, 2].map((i) => `<i class="${i < step ? "filled" : ""}"></i>`).join("")}
      </div>
      <span class="play-course">${course.emoji} ${escapeHtml(course.label)}</span>
    </div>
    <div class="play-board">
      <p class="play-kicker">${state.baselineTest ? "3 题小测评" : `第 ${step} 题`}</p>
      <div class="question-visual">
        ${
          state.visualUrl
            ? `<img class="question-image" src="${escapeHtml(state.visualUrl)}" alt="" />`
            : `<span class="question-emoji">${escapeHtml(question.visual || "🌟")}</span>`
        }
        <h2 class="play-prompt">${escapeHtml(question.prompt)}</h2>
      </div>
      <div class="speech-actions">
        <button class="voice-btn" id="voicePrompt"><span>🔊</span> 听一听</button>
        ${
          course.id === "english"
            ? `<button class="say-btn ${state.speechPractice === "listening" ? "is-listening" : ""}" id="sayIt" ${state.aiPlanning ? "disabled" : ""}><span>🎙️</span> ${state.speechPractice === "listening" ? "正在听…" : "跟我说"}</button>`
            : ""
        }
      </div>
      ${state.speechFeedback ? `<p class="speech-feedback ${state.speechPractice === "success" ? "is-success" : ""}">${escapeHtml(state.speechFeedback)}</p>` : ""}
      ${state.aiPlanning ? '<p class="ai-plan-note is-loading">正在选一道刚刚好的题…</p>' : ""}
      <div class="choice-grid">${question.choices
        .map(
          (choice) =>
            `<button class="choice ${state.answered && choice.value === question.answer ? "correct" : ""} ${state.answered && state.selectedChoice === choice.value && choice.value !== question.answer ? "wrong" : ""}" data-choice="${escapeHtml(choice.value)}" aria-label="${escapeHtml(question.prompt)}: ${escapeHtml(choice.label)}" style="--choice-color:${choice.color}" ${state.answered || state.aiPlanning ? "disabled" : ""}>${choice.image ? `<img class="choice-image" src="${escapeHtml(resolveAssetUrl(ctx.assetBase, choice.image))}" alt="" />` : `<span class="choice-emoji">${escapeHtml(choice.emoji)}</span>`}<span>${escapeHtml(choice.label)}</span>${state.answered && choice.value === question.answer ? '<b class="check">✓</b>' : ""}</button>`,
        )
        .join("")}</div>
      ${
        state.answered
          ? `<div class="feedback ${state.correct ? "good" : "try"}">${escapeHtml(state.encouragement || good)}</div>${
              state.activityComplete
                ? state.baselineTest
                  ? baselineResult(state)
                  : offlineTaskMarkup(state)
                : `<button class="next-question" id="nextQuestion">${state.correct ? "下一题" : "再试一题"} <span>→</span></button>`
            }`
          : '<p class="hint">点一张图作答</p>'
      }
    </div>
  </section>`;
}

function baselineResult(state) {
  const score = state.baselineCorrect;
  const suggested =
    score >= 3 ? "图片词汇" : score === 2 ? "儿歌和图片词" : "声音和图片";
  return `<div class="baseline-result"><span class="baseline-result-icon">🎈</span><span><b>英语小测评完成</b><small>${score} / 3 答对 · 可以从「${suggested}」开始</small></span></div>`;
}

function offlineTaskMarkup(state) {
  const task = offlineTasks[state.activityCourse] || offlineTasks.colors;
  return `<div class="offline-task ${state.offlineTaskDone ? "done" : ""}">
    <span class="offline-task-emoji">${task.emoji}</span>
    <span><b>${task.title}</b><small>${state.offlineTaskDone ? "完成啦，击个掌！" : task.prompt}</small></span>
    <button id="offlineDone" ${state.offlineTaskDone ? "disabled" : ""}>${state.offlineTaskDone ? "✓" : "完成"}</button>
  </div>
  <button class="finish-btn" id="finishSession">今天就到这里</button>`;
}

function libraryView(ctx) {
  const { assetBase, state, models } = ctx;
  const canAnalyze = isAdapterModel("video", models.video);
  const active = mediaShelf.find((item) => item.id === state.story);
  return `<section class="media-shelf">
    <div class="section-heading">
      <div>
        <span class="section-kicker">1 分钟图画故事</span>
        <h2>故事架</h2>
      </div>
      <span class="shelf-note">这里不计分</span>
    </div>
    <div class="media-grid">
      ${mediaShelf
        .map((item) => {
          const src = resolveAssetUrl(assetBase, item.src);
          return `<article class="media-card ${item.id === "fox-hello" ? "media-card-featured" : ""}">
            <div class="media-thumb">${
              item.type === "video"
                ? `<video src="${escapeHtml(src)}" muted playsinline></video>`
                : `<img src="${escapeHtml(src)}" alt="${escapeHtml(item.title)}"/>`
            }<span class="media-duration">${escapeHtml(item.duration)}</span></div>
            <div class="media-card-copy">
              <span class="media-type">${item.type === "video" ? "短视频" : "图画故事"}</span>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.prompt)}</p>
              <button class="media-play" data-story="${escapeHtml(item.id)}">▶ 播放</button>
            </div>
          </article>`;
        })
        .join("")}
      <article class="media-card media-card-empty">
        <div class="media-empty-icon">🎬</div>
        <div>
          <span class="media-type">本地视频</span>
          <h3>放一段喜欢的片子</h3>
          <p>在 <code>public/content/media.json</code> 登记短片，文件放进 <code>public/assets/media</code>。</p>
        </div>
      </article>
    </div>
    ${
      active
        ? `<div class="story-stage">
            ${
              active.type === "video"
                ? `<video src="${escapeHtml(resolveAssetUrl(assetBase, active.src))}" controls playsinline></video>`
                : `<img src="${escapeHtml(resolveAssetUrl(assetBase, active.src))}" alt="${escapeHtml(active.title)}" />`
            }
            <div>
              <h3>${escapeHtml(active.title)}</h3>
              <p>${escapeHtml(active.prompt || active.speech)}</p>
              <div class="speech-actions">
                <button class="voice-btn" data-story="${escapeHtml(active.id)}">🔊 再听一次</button>
                ${
                  canAnalyze
                    ? `<button class="say-btn" id="analyzeStory" ${state.videoAnalyzing ? "disabled" : ""}>${state.videoAnalyzing ? "正在看…" : "请模型看一看"}</button>`
                    : ""
                }
                <button class="text-btn" id="closeStory">关掉故事</button>
              </div>
              ${
                state.videoInsight
                  ? `<div class="video-insight"><b>${escapeHtml(state.videoInsight.title)}</b><p>${escapeHtml(state.videoInsight.summary)}</p>${state.videoInsight.prompt ? `<small>${escapeHtml(state.videoInsight.prompt)}</small>` : ""}</div>`
                  : ""
              }
            </div>
          </div>`
        : ""
    }
  </section>`;
}

function tasksView(ctx) {
  const { courses, next } = ctx;
  return `<section class="family-tasks">
    <div class="section-heading">
      <div>
        <span class="section-kicker">离开屏幕也可以玩</span>
        <h2>亲子小任务</h2>
      </div>
    </div>
    <div class="family-task-grid">${courses
      .map((course) => {
        const task = offlineTasks[course.id];
        return `<article class="family-task-card ${course.tone} ${course.id === next.course.id ? "is-recommended" : ""}">
          <span class="family-task-icon">${task.emoji}</span>
          <div>
            <b>${task.title}</b>
            <p>${task.prompt}</p>
          </div>
          ${course.id === next.course.id ? '<span class="family-task-tag">今天推荐</span>' : ""}
        </article>`;
      })
      .join("")}</div>
    <p class="family-task-note">不用一次做完。看一看、听一听、和大人玩一玩，都是很好的学习。</p>
  </section>`;
}

function skillProgress(ctx) {
  return `<div class="skill-progress">${ctx.courses
    .map((course) => {
      const skill = ctx.profile.skills[course.id];
      const accuracy = skill?.attempts
        ? Math.round((skill.correct / skill.attempts) * 100)
        : 0;
      return `<div class="skill-row"><span class="skill-name"><span>${course.emoji}</span><b>${course.label}</b></span><span class="skill-score">${skill?.attempts ? `${accuracy}%` : "未开始"}</span><div class="skill-bar"><i style="width:${accuracy}%"></i></div></div>`;
    })
    .join("")}</div>`;
}

function recentActivity(ctx) {
  const recent = ctx.profile.events.slice(-4).reverse();
  if (!recent.length)
    return `<div class="recent-empty">完成一次游戏后，这里会出现成长足迹 🌱</div>`;
  return `<div class="recent-activity"><b>最近足迹</b>${recent
    .map((event) => {
      const course =
        ctx.courses.find((item) => item.id === event.courseId) ||
        ctx.courses[0];
      return `<div class="activity-row"><span>${course.emoji}</span><span><b>${course.label}</b><small>${eventCopy(event)}</small></span><time>${relativeTime(event.at)}</time></div>`;
    })
    .join("")}</div>`;
}

function growthPanel(ctx) {
  const { profile, child, next } = ctx;
  const accuracy = profile.totalAnswers
    ? Math.round((profile.correctAnswers / profile.totalAnswers) * 100)
    : 0;
  const covered = Object.values(profile.questionStats || {}).filter(
    (stat) => stat.attempts,
  ).length;
  const stage = stageDefinition(child?.englishPlan?.stage);
  const week = summarizeWeek(profile.events, profile.questionStats);
  const weakLabels = week.weakConcepts.map((id) => id.replace(/^english-/, ""));
  const suggestion = weakLabels.length
    ? `下周可以再见面：${weakLabels.join("、")}`
    : week.answers
      ? "每次玩短一点、开心一点就很好"
      : "选一个轻松的英语小游戏开始吧";
  return `<div class="profile-summary">
    <div class="summary-head"><span>🌱</span><div><b>${escapeHtml(child?.nickname || "小朋友")} · 成长档案</b><small>只保存在这台设备上</small></div></div>
    <div class="summary-stats">
      <div><strong>${profile.streak}</strong><small>连续天数</small></div>
      <div><strong>${profile.totalSessions}</strong><small>完成次数</small></div>
      <div><strong>${accuracy}%</strong><small>正确率</small></div>
      <div><strong>${profile.stars}</strong><small>小星星</small></div>
    </div>
    <div class="question-coverage"><span>🧩</span><span>已经探索 <b>${covered}</b> 道小题目</span></div>
    ${skillProgress(ctx)}
    ${recentActivity(ctx)}
    <div class="summary-recommendation"><span>✨</span><span>下一步：<b>${escapeHtml(next.course.label)}</b><small>${escapeHtml(next.reason)}</small></span></div>
  </div>
  <section class="weekly-growth">
    <div class="weekly-growth-head">
      <span class="weekly-growth-icon">🌤️</span>
      <div><b>本周成长卡</b><small>最近 7 天 · ${escapeHtml(child?.nickname || "小朋友")}</small></div>
      <span class="stage-pill">第 ${stage.id} 阶段</span>
    </div>
    <div class="weekly-stats">
      <div><strong>${week.studyDays}</strong><small>学习天数</small></div>
      <div><strong>${week.completedSessions}</strong><small>完成次数</small></div>
      <div><strong>${week.answers}</strong><small>答题数量</small></div>
      <div><strong>${week.accuracy === null ? "—" : `${week.accuracy}%`}</strong><small>本周正确率</small></div>
    </div>
    <div class="weekly-growth-detail"><span>🔤</span><span>英语路径：<b>${stage.label}</b><small>已探索 ${week.englishConcepts} 个英语小概念</small></span></div>
    <p class="weekly-growth-suggestion">✨ ${suggestion}</p>
  </section>`;
}

function childPanel(ctx) {
  const child = ctx.child;
  const baseline =
    child.baseline?.status === "complete"
      ? `已完成：${child.baseline.score} / ${child.baseline.total}`
      : "还没有做过基础测评";
  const stage = stageDefinition(child.englishPlan?.stage);
  return `<div class="child-profile-settings">
    <div class="child-switch-row">
      <label><span>当前孩子</span><select id="childSelect">${ctx.children
        .map(
          (item) =>
            `<option value="${escapeHtml(item.id)}" ${item.id === child.id ? "selected" : ""}>${escapeHtml(item.nickname)}</option>`,
        )
        .join("")}</select></label>
      <button class="small-action" id="addChild">＋ 添加孩子</button>
    </div>
    <div class="child-form-grid">
      <label><span>孩子昵称</span><input id="childNickname" maxlength="12" value="${escapeHtml(child.nickname)}" placeholder="例如：小米" /></label>
      <label><span>年龄</span><select id="childAge">${[2, 3, 4, 5, 6].map((age) => `<option value="${age}" ${Number(child.age) === age ? "selected" : ""}>${age} 岁</option>`).join("")}</select></label>
      <label><span>性别（可不填）</span><select id="childGender">${Object.entries(
        childLabels.gender,
      )
        .map(
          ([value, label]) =>
            `<option value="${escapeHtml(value)}" ${child.gender === value ? "selected" : ""}>${label}</option>`,
        )
        .join("")}</select></label>
      <label><span>英语基础</span><select id="childEnglishLevel">${Object.entries(
        childLabels.englishLevel,
      )
        .map(
          ([value, label]) =>
            `<option value="${escapeHtml(value)}" ${child.englishLevel === value ? "selected" : ""}>${label}</option>`,
        )
        .join("")}</select></label>
    </div>
    <div class="baseline-row">
      <span>当前英语路径：<b>第 ${stage.id} 阶段 · ${stage.label}</b><small>${baseline}</small></span>
      <button class="small-action" id="startBaseline">开始 3 题测评</button>
    </div>
    <button class="save-child-btn" id="saveChildProfile">保存孩子信息</button>
  </div>`;
}

function settingsPanel(ctx) {
  const { models } = ctx;
  const adapterReady = hasRemoteAdapter();
  const select = (type) => {
    const capability = modelCatalog[type];
    return `<label class="model-setting"><span class="model-setting-label"><span class="model-setting-icon">${capability.icon}</span><span><b>${capability.label}</b><small>${capability.hint}</small></span></span><select data-model="${type}">${capability.options
      .map(
        (item) =>
          `<option value="${item.id}" ${models[type] === item.id ? "selected" : ""}>${item.name} · ${item.note}</option>`,
      )
      .join("")}</select></label>`;
  };
  return `<div class="model-settings">
    ${MODEL_CAPABILITIES.map(select).join("")}
  </div>
  <div class="config-tip">当前：<b>${modelName("voice", models)}</b> · <b>${modelName("image", models)}</b> · <b>${modelName("vocab", models)}</b> · <b>${modelName("video", models)}</b><small>${adapterReady ? "已配置服务端适配器。密钥只应放在服务器上。" : "还没有配置 VITE_API_BASE_URL，远程模型会自动退回本机能力。"}</small></div>
  <div class="data-tools">
    <button class="small-action" id="exportData">导出学习档案</button>
    <button class="small-action" id="importData">导入学习档案</button>
    <input id="importFile" type="file" accept="application/json,.json" hidden />
  </div>
  <button class="clear-profile" id="clearProfile">清除这台设备上的学习记录</button>`;
}

function parentModal(ctx) {
  const { state } = ctx;
  if (state.parentGate && !state.parentUnlocked) {
    return `<div class="modal-backdrop" id="modalBackdrop"><div class="modal parent-gate"><div class="modal-icon">🔒</div><h3>家长入口</h3><p>为了不让小朋友误触，请家长长按下面按钮 1 秒钟。</p><button class="hold-btn" id="parentHold"><span>长按进入设置</span><i></i></button><button class="reset-btn" id="parentCancel">先不设置</button></div></div>`;
  }
  const tab = state.parentTab || "child";
  return `<div class="modal-backdrop" id="modalBackdrop">
    <div class="modal model-modal">
      <button class="modal-close" id="closeModal" aria-label="关闭">×</button>
      <h3>家长设置</h3>
      <div class="parent-tabs" role="tablist">
        <button class="parent-tab ${tab === "child" ? "active" : ""}" data-parent-tab="child">孩子</button>
        <button class="parent-tab ${tab === "growth" ? "active" : ""}" data-parent-tab="growth">成长</button>
        <button class="parent-tab ${tab === "settings" ? "active" : ""}" data-parent-tab="settings">设置</button>
      </div>
      <div class="parent-panel">
        ${tab === "child" ? childPanel(ctx) : tab === "growth" ? growthPanel(ctx) : settingsPanel(ctx)}
      </div>
      <div class="modal-actions">
        ${tab === "settings" ? '<button class="reset-btn" id="resetModels">恢复默认</button>' : "<span></span>"}
        <button class="primary-btn" id="closeModal2">完成 <span class="arrow">→</span></button>
      </div>
    </div>
  </div>`;
}

function mainView(ctx) {
  if (ctx.state.view === "play") return playView(ctx);
  if (ctx.state.view === "library") return libraryView(ctx);
  if (ctx.state.view === "tasks") return tasksView(ctx);
  return homeView(ctx);
}

export function renderApp(ctx) {
  return `<div class="app-shell ${ctx.state.view === "play" ? "is-playing" : ""}">
    ${topbar(ctx)}
    <main>${mainView(ctx)}</main>
    ${mobileNav(ctx)}
    ${ctx.state.modal ? parentModal(ctx) : ""}
    <div class="toast" id="toast">准备好玩啦</div>
  </div>`;
}
