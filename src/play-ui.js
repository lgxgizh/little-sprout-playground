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
    ? "Animation Q&A"
    : state.baselineTest
      ? "Listening check"
      : "Listening test";
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
