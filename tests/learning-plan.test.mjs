import test from "node:test";
import assert from "node:assert/strict";
import {
  chooseQuestionCandidates,
  createEnglishPlan,
  stageFromBaseline,
  summarizeWeek,
  updateEnglishPlan,
} from "../src/learning-plan.js";

const questions = [
  { id: "english-apple", difficulty: 1 },
  { id: "english-cat", difficulty: 1 },
  { id: "english-sentence", difficulty: 2 },
];

test("baseline score maps to the safe starting stages", () => {
  assert.equal(stageFromBaseline(0), 1);
  assert.equal(stageFromBaseline(2), 1);
  assert.equal(stageFromBaseline(3), 2);
  assert.equal(stageFromBaseline(8, 10), 2);
  assert.equal(stageFromBaseline(3, 10), 1);
});

test("new English answers enter a one-day review queue", () => {
  const plan = updateEnglishPlan(
    createEnglishPlan(),
    "english-apple",
    true,
    "2026-09-03T00:00:00.000Z",
  );
  assert.deepEqual(plan.reviewQueue[0], {
    questionId: "english-apple",
    intervalDays: 1,
    dueAt: "2026-09-04T00:00:00.000Z",
  });
});

test("candidate ordering prioritizes due reviews and avoids session repeats", () => {
  const candidates = chooseQuestionCandidates({
    questions,
    plan: {
      ...createEnglishPlan(),
      reviewQueue: [
        {
          questionId: "english-apple",
          intervalDays: 1,
          dueAt: "2026-09-01T00:00:00.000Z",
        },
      ],
    },
    questionStats: {},
    sessionQuestionIds: ["english-cat"],
    now: Date.parse("2026-09-03T00:00:00.000Z"),
  });
  assert.equal(candidates[0].id, "english-apple");
  assert.equal(
    candidates.some((question) => question.id === "english-cat"),
    false,
  );
});

test("candidate selection respects stage and age metadata", () => {
  const candidates = chooseQuestionCandidates({
    questions: [
      { id: "english-apple", difficulty: 1, stage: 1, ageMin: 2, ageMax: 4 },
      { id: "english-sentence", difficulty: 2, stage: 3, ageMin: 3, ageMax: 6 },
      { id: "english-baby", difficulty: 1, stage: 1, ageMin: 2, ageMax: 2 },
    ],
    plan: { ...createEnglishPlan(), stage: 1 },
    age: 3,
  });
  assert.deepEqual(
    candidates.map((question) => question.id),
    ["english-apple"],
  );
});

test("candidate selection has a gentle age-safe fallback for sparse packs", () => {
  const candidates = chooseQuestionCandidates({
    questions: [
      { id: "english-advanced", difficulty: 2, stage: 4, ageMin: 3, ageMax: 6 },
      { id: "english-gentle", difficulty: 1, stage: 2, ageMin: 3, ageMax: 6 },
      {
        id: "english-too-young",
        difficulty: 1,
        stage: 1,
        ageMin: 2,
        ageMax: 2,
      },
    ],
    plan: { ...createEnglishPlan(), stage: 1 },
    age: 3,
  });
  assert.equal(candidates[0].id, "english-gentle");
  assert.equal(
    candidates.some((question) => question.id === "english-too-young"),
    false,
  );
});

test("weekly summary only counts the latest seven days", () => {
  const events = [
    {
      type: "answer",
      courseId: "english",
      questionId: "english-apple",
      correct: true,
      at: "2026-09-03T10:00:00.000Z",
    },
    {
      type: "session_completed",
      courseId: "english",
      at: "2026-09-03T10:01:00.000Z",
    },
    {
      type: "answer",
      courseId: "colors",
      correct: false,
      at: "2026-08-20T10:00:00.000Z",
    },
  ];
  const week = summarizeWeek(events, {}, new Date("2026-09-03T12:00:00.000Z"));
  assert.equal(week.answers, 1);
  assert.equal(week.completedSessions, 1);
  assert.equal(week.englishConcepts, 1);
  assert.equal(week.accuracy, 100);
});
