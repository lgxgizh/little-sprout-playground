/** Full-viewport listening / animation play stage. */

import { choiceGridMarkup, escapeHtml } from "./quiz-ui.js";

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
    ? "看视频提问"
    : state.baselineTest
      ? "听力图片测评"
      : "英语听力测试";
  const board = watching
    ? `<div class="play-watch">${watchMediaHtml}<div class="play-watch-actions"><button class="primary-btn" id="animationReady" type="button">开始答题</button></div></div>`
    : `<h1 class="play-prompt vis-hidden">${escapeHtml(prompt)}</h1>
       <button type="button" class="play-listen" id="voicePrompt" ${state.aiPlanning ? "disabled" : ""}>听一听</button>
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
           ? `<div class="play-dock"><div class="feedback ${state.correct ? "good" : "try"}">${escapeHtml(state.encouragement || (state.correct ? "对了" : "再试一次"))}</div>${state.activityComplete ? resultHtml : `<button class="next-question" id="nextQuestion" type="button">${state.correct ? "下一题" : "再试一题"}</button>`}</div>`
           : `<p class="play-hint">点一张图</p>`
       }`;

  return `<section class="play-stage" id="quizPanel" aria-label="${escapeHtml(title)}">
    <header class="play-bar">
      <button type="button" class="text-btn" id="finishSession">${state.activityComplete ? "完成" : "离开"}</button>
      <div class="play-progress" aria-hidden="true">${playProgressDots(state.questionIndex, total)}</div>
      <span class="play-count">${state.questionIndex + 1} / ${total}</span>
      <button type="button" class="text-btn" id="soundToggle" aria-label="声音开关">${state.soundOn ? "声音开" : "声音关"}</button>
    </header>
    <div class="play-board ${watching ? "is-watching" : ""}">${board}</div>
  </section>`;
}
