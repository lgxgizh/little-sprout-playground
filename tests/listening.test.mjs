import test from "node:test";
import assert from "node:assert/strict";
import {
  applyFirstSubmitRoundScore,
  createListeningSeedQuestions,
  pickSessionQuestion,
} from "../src/listening.js";
import { WRONG_CHOICE_FLASH_MS } from "../src/play-ui.js";
import { choiceGridMarkup } from "../src/quiz-ui.js";

test("answering does not swap in the next listening question", () => {
  const pool = createListeningSeedQuestions("/");
  const first = pool[0];
  const second = pool[1];
  const afterAnswer = pickSessionQuestion(pool, {
    lockedId: first.id,
    sessionQuestionIds: [first.id],
  });
  assert.equal(afterAnswer.id, first.id);
  const afterNext = pickSessionQuestion(pool, {
    lockedId: null,
    sessionQuestionIds: [first.id],
  });
  assert.equal(afterNext.id, second.id);
});

test("listening cards hide written answers until after a tap", () => {
  const apple = createListeningSeedQuestions("/")[0];
  const waiting = choiceGridMarkup(apple.choices, {
    answer: apple.answer,
    answered: false,
    showLabels: false,
  });
  assert.match(waiting, /choice-letter/);
  assert.match(waiting, /loading="eager"/);
  assert.doesNotMatch(waiting, /loading="lazy"/);
  assert.match(waiting, /onerror=/);
  assert.doesNotMatch(waiting, />Apple</);
  assert.doesNotMatch(waiting, /class="correct"/);
  const done = choiceGridMarkup(apple.choices, {
    answer: apple.answer,
    selectedChoice: "apple",
    answered: true,
    showLabels: false,
  });
  assert.match(done, /class="choice choice-picture correct/);
});

test("first-submit round score counts only once per question", () => {
  let round = { roundAnswered: 0, roundCorrect: 0, sessionQuestionIds: [] };
  const firstWrong = applyFirstSubmitRoundScore(round, {
    questionId: "q-apple",
    correct: false,
  });
  assert.equal(firstWrong.firstSubmit, true);
  assert.equal(firstWrong.roundAnswered, 1);
  assert.equal(firstWrong.roundCorrect, 0);
  // Simulate recordAnswer marking the question as seen.
  round = {
    roundAnswered: firstWrong.roundAnswered,
    roundCorrect: firstWrong.roundCorrect,
    sessionQuestionIds: ["q-apple"],
  };
  const retryThenCorrect = applyFirstSubmitRoundScore(round, {
    questionId: "q-apple",
    correct: true,
  });
  assert.equal(retryThenCorrect.firstSubmit, false);
  assert.equal(retryThenCorrect.roundAnswered, 1);
  assert.equal(retryThenCorrect.roundCorrect, 0);

  const nextQuestion = applyFirstSubmitRoundScore(
    { ...round, sessionQuestionIds: ["q-apple"] },
    { questionId: "q-banana", correct: true },
  );
  assert.equal(nextQuestion.firstSubmit, true);
  assert.equal(nextQuestion.roundAnswered, 2);
  assert.equal(nextQuestion.roundCorrect, 1);
});

test("wrong flash duration is short so TTS does not block re-taps", () => {
  assert.ok(WRONG_CHOICE_FLASH_MS >= 300);
  assert.ok(WRONG_CHOICE_FLASH_MS <= 600);
});

test("unlocked after wrong keeps soft dock without disabling choices", () => {
  const apple = createListeningSeedQuestions("/")[0];
  const unlocked = choiceGridMarkup(apple.choices, {
    answer: apple.answer,
    selectedChoice: null,
    answered: false,
    showLabels: false,
  });
  assert.doesNotMatch(unlocked, /\sdisabled/);
  assert.doesNotMatch(unlocked, /class="choice choice-picture  wrong"/);
});
