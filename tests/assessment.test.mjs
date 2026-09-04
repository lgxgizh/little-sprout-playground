import test from "node:test";
import assert from "node:assert/strict";
import {
  BASELINE_MAX_ITEMS,
  BASELINE_MIN_ITEMS,
  selectBaselineQuestions,
  shouldStopBaseline,
  summarizeBaseline,
  suggestedLevelFromBaseline,
} from "../src/assessment.js";
import { stageFromBaseline } from "../src/learning-plan.js";

const bank = [
  {
    id: "english-apple",
    baseline: true,
    stage: 1,
    ageMin: 2,
    ageMax: 4,
    concept: "apple",
    difficulty: 1,
  },
  {
    id: "english-cat",
    baseline: true,
    stage: 1,
    ageMin: 2,
    ageMax: 4,
    concept: "cat",
    difficulty: 1,
  },
  {
    id: "english-red",
    baseline: true,
    stage: 1,
    ageMin: 2,
    ageMax: 4,
    concept: "red",
    difficulty: 1,
  },
  {
    id: "english-dog",
    baseline: true,
    stage: 1,
    ageMin: 2,
    ageMax: 5,
    concept: "dog",
    difficulty: 1,
  },
  {
    id: "english-yellow",
    baseline: true,
    stage: 2,
    ageMin: 2,
    ageMax: 5,
    concept: "yellow",
    difficulty: 1,
  },
  {
    id: "english-ball-noun",
    baseline: true,
    stage: 1,
    ageMin: 2,
    ageMax: 4,
    concept: "ball",
    difficulty: 1,
  },
  {
    id: "english-cup",
    baseline: true,
    stage: 1,
    ageMin: 2,
    ageMax: 4,
    concept: "cup",
    difficulty: 1,
  },
  {
    id: "english-bird",
    baseline: true,
    stage: 2,
    ageMin: 2,
    ageMax: 5,
    concept: "bird",
    difficulty: 1,
  },
  {
    id: "english-open",
    baseline: false,
    stage: 3,
    ageMin: 3,
    ageMax: 6,
    concept: "door",
    difficulty: 2,
  },
  {
    id: "english-too-old",
    baseline: true,
    stage: 1,
    ageMin: 5,
    ageMax: 6,
    concept: "advanced",
    difficulty: 1,
  },
];

test("baseline selection prefers marked age-safe items up to the max", () => {
  const selected = selectBaselineQuestions(bank, 3);
  assert.ok(selected.length >= BASELINE_MIN_ITEMS);
  assert.ok(selected.length <= BASELINE_MAX_ITEMS);
  assert.equal(
    selected.some((question) => question.id === "english-too-old"),
    false,
  );
  assert.ok(selected.every((question) => question.baseline));
});

test("adaptive stop waits for a minimum then can finish early", () => {
  assert.equal(shouldStopBaseline({ answered: 4, correct: 4 }), false);
  assert.equal(
    shouldStopBaseline({
      answered: 6,
      correct: 1,
      recentCorrect: [false, false, false],
    }),
    true,
  );
  assert.equal(
    shouldStopBaseline({
      answered: 8,
      correct: 7,
      recentCorrect: [true, true, true],
    }),
    true,
  );
  assert.equal(
    shouldStopBaseline({
      answered: BASELINE_MAX_ITEMS,
      correct: 5,
      recentCorrect: [true, false, true],
    }),
    true,
  );
});

test("parent summary celebrates concepts without rankings", () => {
  const summary = summarizeBaseline({
    score: 5,
    total: 8,
    answers: [
      { questionId: "english-apple", correct: true },
      { questionId: "english-cat", correct: false },
      { questionId: "english-red", correct: true },
    ],
    questions: bank,
  });
  assert.match(summary.headline, /listening|pictures|warm-up|start/i);
  assert.match(summary.detail, /Heard well: apple/);
  assert.match(summary.detail, /Ready for:/);
  assert.equal(summary.detail.includes("rank"), false);
  assert.equal(suggestedLevelFromBaseline(5, 8), "songs");
  assert.equal(stageFromBaseline(8, 10), 2);
  assert.equal(stageFromBaseline(3, 10), 1);
  assert.equal(stageFromBaseline(3), 2);
});
