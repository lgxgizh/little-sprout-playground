import test from "node:test";
import assert from "node:assert/strict";
import {
  createListeningSeedQuestions,
  pickSessionQuestion,
} from "../src/listening.js";
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
