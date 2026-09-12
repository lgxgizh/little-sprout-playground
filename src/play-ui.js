/** Full-viewport listening / animation play stage. */

import { choiceGridMarkup, escapeHtml } from "./quiz-ui.js";

export function listeningEncouragement(pct) {
  if (pct >= 80) {
    return {
      zh: "太棒了！耳朵真灵。",
      en: "Amazing listening!",
      icon: "🌟",
    };
  }
  if (pct >= 50) {
    return {
      zh: "很不错，再练一会儿会更稳。",
      en: "Nice work—keep going!",
      icon: "🎈",
    };
  }
  return {
    zh: "热热身就很好，我们再来一轮吧。",
    en: "Warm-up complete—try again!",
    icon: "🌱",
  };
}

export function listeningResultMarkup({
  correct = 0,
  total = 1,
  mode = "listening",
  detail = "",
} = {}) {
  const safeTotal = Math.max(Number(total) || 0, 1);
  const safeCorrect = Math.max(0, Number(correct) || 0);
  const pct = Math.round((safeCorrect / safeTotal) * 100);
  const band = listeningEncouragement(pct);
  const title =
    mode === "animation" ? "看完啦！Nice watching!" : "本轮听完啦！";
  const restartId =
    mode === "animation" ? "restartAnimation" : "restartListening";
  const restartLabel = mode === "animation" ? "再看一次" : "再来一次";
  const extra = detail
    ? ` · ${escapeHtml(detail)}`
    : ` · ${escapeHtml(band.en)}`;
  return `<div class="listening-result" id="${mode === "animation" ? "animationResult" : "listeningResult"}">
    <span class="listening-result-icon">${mode === "animation" ? "🎬" : band.icon}</span>
    <div class="listening-result-copy">
      <b>${title}</b>
      <p class="listening-result-score">${safeCorrect} / ${safeTotal} · ${pct}%</p>
      <small>${escapeHtml(band.zh)}${extra}</small>
    </div>
    <div class="listening-result-actions">
      <button type="button" class="primary-btn" id="${restartId}"><span>${restartLabel}</span><span class="arrow">→</span></button>
      <button type="button" class="reset-btn" id="backHomeFromResult">回主页</button>
    </div>
  </div>`;
}

export function playProgressDots(index = 0, total = 3) {
  const count = Math.min(Math.max(total, 1), 12);
  return Array.from(
    { length: count },
    (_, step) => `<i class="${step <= index ? "filled" : ""}"></i>`,
  ).join("");
}

export function playStageMarkup({
  question,
  state,
  total = 3,
  watchMediaHtml = "",
  resultHtml = "",
}) {
  const watching = Boolean(
    state.animationMode && state.animationPhase === "watch",
  );
  const prompt = question?.prompt || "Listen, then tap a picture";
  const title = state.animationMode
    ? "动画提问"
    : state.baselineTest
      ? "听力图片测评"
      : "英语听力测试";
  const board = watching
    ? `<div class="play-watch">${watchMediaHtml}<div class="play-watch-actions"><p>When the animation ends, tap Ready.</p><button class="primary-btn" id="animationReady" type="button"><span>Ready to answer</span><span class="arrow">→</span></button></div></div>`
    : `<h1 class="play-prompt vis-hidden">${escapeHtml(prompt)}</h1>
       <button type="button" class="play-listen" id="voicePrompt" ${state.aiPlanning ? "disabled" : ""}><span>🔊</span> Listen</button>
       ${choiceGridMarkup(question?.choices || [], {
         answer: question?.answer || "",
         selectedChoice: state.selectedChoice,
         answered: state.answered,
         disabled: state.aiPlanning,
         prompt,
         showLabels: false,
       })}
       ${
         state.answered
           ? `<div class="play-dock"><div class="feedback ${state.correct ? "good" : "try"}">${escapeHtml(state.encouragement || (state.correct ? "You found it! ✨" : "That's okay—let's look again"))}</div>${state.activityComplete ? resultHtml : `<button class="next-question" id="nextQuestion" type="button">${state.correct ? "Next one" : "Try another"} <span>→</span></button>`}</div>`
           : `<p class="play-hint">Tap a picture</p>`
       }`;

  return `<section class="play-stage" id="quizPanel" aria-label="${escapeHtml(title)}">
    <header class="play-bar">
      <button type="button" class="play-leave" id="finishSession">${state.activityComplete ? "Finish" : "Leave"}</button>
      <div class="play-progress" aria-hidden="true">${playProgressDots(state.questionIndex, total)}</div>
      <span class="play-count">${state.questionIndex + 1} / ${total}</span>
      <button type="button" class="icon-btn" id="soundToggle" aria-label="Sound on or off">${state.soundOn ? "🔊" : "🔇"}</button>
    </header>
    <div class="play-board ${watching ? "is-watching" : ""}">${board}</div>
  </section>`;
}
