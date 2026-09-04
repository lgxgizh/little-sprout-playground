import test from "node:test";
import assert from "node:assert/strict";
import {
  createDemoVideos,
  mergeVideoShelf,
  normalizeVideoEntry,
  parentVideoSummary,
  summarizeVideoAttempts,
} from "../src/video-comprehension.js";

test("demo shelf includes an original placeholder with picture questions", () => {
  const demos = createDemoVideos("/");
  assert.equal(demos.length, 1);
  assert.match(demos[0].src, /shapes-hello\.mp4$/);
  assert.ok(demos[0].questions.length >= 2);
  assert.ok(
    demos[0].questions.every((question) =>
      question.choices.some((choice) => choice.value === question.answer),
    ),
  );
});

test("normalizeVideoEntry rejects empty question sets and keeps asset paths", () => {
  assert.equal(
    normalizeVideoEntry({
      id: "bad",
      title: "Bad",
      src: "assets/media/clip.mp4",
      questions: [],
    }),
    null,
  );
  const ok = normalizeVideoEntry({
    id: "ok",
    title: "OK",
    sourceType: "asset",
    src: "/assets/media/clip.mp4",
    questions: [
      {
        id: "q1",
        prompt: "Find the circle",
        speech: "Find the circle",
        answer: "circle",
        choices: [
          { label: "Circle", emoji: "🟢", value: "circle", color: "#9ed9c4" },
          { label: "Star", emoji: "⭐", value: "star", color: "#f7c94b" },
        ],
      },
    ],
  });
  assert.equal(ok.title, "OK");
  assert.equal(ok.questions.length, 1);
});

test("merge and parent summary stay gentle", () => {
  const merged = mergeVideoShelf(createDemoVideos("/"), [
    normalizeVideoEntry({
      id: "custom-1",
      title: "Custom",
      sourceType: "asset",
      src: "assets/media/custom.mp4",
      questions: [
        {
          id: "q1",
          prompt: "Find the star",
          answer: "star",
          choices: [
            { label: "Star", emoji: "⭐", value: "star", color: "#f7c94b" },
            { label: "Cup", emoji: "🥤", value: "cup", color: "#9ed9c4" },
          ],
        },
      ],
    }),
  ]);
  assert.equal(merged.length, 2);
  const stats = summarizeVideoAttempts(
    [
      {
        type: "answer",
        courseId: "video",
        videoId: "demo-shapes-hello",
        correct: true,
      },
      {
        type: "answer",
        courseId: "video",
        videoId: "demo-shapes-hello",
        correct: false,
      },
      {
        type: "session_completed",
        courseId: "video",
        videoId: "demo-shapes-hello",
      },
    ],
    "demo-shapes-hello",
  );
  assert.equal(stats.answers, 2);
  assert.equal(stats.correct, 1);
  assert.equal(stats.completedSessions, 1);
  assert.match(parentVideoSummary(stats), /Replay|picture|watching|tries/i);
});
