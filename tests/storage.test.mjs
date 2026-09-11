import test from "node:test";
import assert from "node:assert/strict";
import { parseLearningData } from "../src/storage.js";

function payloadWith(overrides = {}) {
  return {
    schemaVersion: 1,
    children: [
      {
        id: "child-one",
        nickname: "Sunny",
        age: 3,
        profile: {
          totalSessions: "not-a-number",
          totalAnswers: 4,
          correctAnswers: 99,
          stars: -8,
          streak: 2.9,
          lastActive: "2026-09-03",
          skills: {
            english: { attempts: 3, correct: 9, lastPracticed: null },
          },
          questionStats: {
            "english-apple": {
              attempts: 2,
              correct: 8,
              lastPracticed: "2026-09-03T10:00:00.000Z",
              lastCorrect: true,
            },
          },
          englishPlan: {
            stage: 99,
            stageStartedAt: "not-a-date",
            masteredConcepts: [" apple ", 42],
            reviewQueue: [
              { questionId: "english-apple", intervalDays: 99, dueAt: "bad" },
              { questionId: 42, intervalDays: 1, dueAt: null },
            ],
            lastRecommendationAt: "not-a-date",
          },
          events: [
            { type: "answer", courseId: "english", at: "not-a-date" },
            {
              type: "answer",
              courseId: "english",
              questionId: "english-apple",
              correct: true,
              at: "2026-09-03T10:00:00.000Z",
            },
          ],
          awards: [],
        },
      },
    ],
    ...overrides,
  };
}

test("import normalizes corrupted counters and drops invalid events", () => {
  const parsed = parseLearningData(payloadWith());
  const profile = parsed.children[0].profile;
  assert.equal(profile.totalSessions, 0);
  assert.equal(profile.correctAnswers, 4);
  assert.equal(profile.stars, 0);
  assert.equal(profile.streak, 2);
  assert.equal(profile.skills.english.correct, 3);
  assert.equal(profile.questionStats["english-apple"].correct, 2);
  assert.equal(profile.events.length, 1);
  assert.equal(profile.events[0].questionId, "english-apple");
  assert.equal(parsed.children[0].englishPlan.stage, 4);
  assert.deepEqual(parsed.children[0].englishPlan.masteredConcepts, ["apple"]);
  assert.deepEqual(parsed.children[0].englishPlan.reviewQueue, [
    { questionId: "english-apple", intervalDays: 1, dueAt: null },
  ]);
});

test("import still rejects missing learning profile data", () => {
  assert.throws(
    () =>
      parseLearningData(
        payloadWith({ children: [{ nickname: "Sunny", age: 3 }] }),
      ),
    /学习档案数据不完整/,
  );
});
