import test from "node:test";
import assert from "node:assert/strict";
import {
  createDemoAnimations,
  mergeAnimationShelf,
  normalizeAnimationEntry,
  parentAnimationSummary,
  summarizeAnimationAttempts,
} from "../src/animation-quiz.js";
import {
  choiceImageSrc,
  createListeningSeedQuestions,
  withChoiceImages,
} from "../src/listening.js";
import { choiceGridMarkup, choiceLetter } from "../src/quiz-ui.js";

test("demo shelf uses fox-apple GIF with picture choices", () => {
  const demos = createDemoAnimations("/");
  assert.equal(demos.length, 1);
  assert.match(demos[0].src, /fox-apple\.gif$/);
  assert.equal(demos[0].mediaType, "image");
  assert.ok(demos[0].questions.length >= 2);
  assert.ok(
    demos[0].questions.every((question) =>
      question.choices.some((choice) => choice.value === question.answer),
    ),
  );
  assert.ok(
    demos[0].questions.every((question) =>
      question.choices.every((choice) =>
        choice.imageSrc.includes("/assets/choices/"),
      ),
    ),
  );
});

test("normalizeAnimationEntry accepts stories GIF paths and imageSrc choices", () => {
  assert.equal(
    normalizeAnimationEntry({
      id: "bad",
      title: "Bad",
      src: "assets/stories/clip.gif",
      questions: [],
    }),
    null,
  );
  const ok = normalizeAnimationEntry(
    {
      id: "ok",
      title: "OK",
      sourceType: "asset",
      src: "/assets/stories/fox-apple.gif",
      questions: [
        {
          id: "q1",
          prompt: "Find the apple",
          speech: "Find the apple",
          answer: "apple",
          choices: [
            {
              label: "Apple",
              value: "apple",
              imageKey: "apple",
              color: "#ff6b5e",
            },
            {
              label: "Star",
              value: "star",
              imageKey: "star",
              color: "#f7c94b",
            },
          ],
        },
      ],
    },
    { assetBase: "/" },
  );
  assert.equal(ok.title, "OK");
  assert.equal(ok.mediaType, "image");
  assert.equal(ok.questions.length, 1);
  assert.match(ok.questions[0].choices[0].imageSrc, /apple\.png$/);
});

test("merge and parent summary stay gentle for animation attempts", () => {
  const merged = mergeAnimationShelf(createDemoAnimations("/"), [
    normalizeAnimationEntry(
      {
        id: "custom-1",
        title: "Custom",
        sourceType: "asset",
        src: "assets/stories/custom.gif",
        questions: [
          {
            id: "q1",
            prompt: "Find the star",
            answer: "star",
            choices: [
              {
                label: "Star",
                value: "star",
                imageKey: "star",
                color: "#f7c94b",
              },
              {
                label: "Cup",
                value: "cup",
                imageKey: "cup",
                color: "#9ed9c4",
              },
            ],
          },
        ],
      },
      { assetBase: "/" },
    ),
  ]);
  assert.equal(merged.length, 2);
  const stats = summarizeAnimationAttempts(
    [
      {
        type: "answer",
        courseId: "animation",
        animationId: "demo-fox-apple",
        correct: true,
      },
      {
        type: "answer",
        courseId: "animation",
        animationId: "demo-fox-apple",
        correct: false,
      },
      {
        type: "session_completed",
        courseId: "animation",
        animationId: "demo-fox-apple",
      },
    ],
    "demo-fox-apple",
  );
  assert.equal(stats.answers, 2);
  assert.equal(stats.correct, 1);
  assert.equal(stats.completedSessions, 1);
  assert.match(parentAnimationSummary(stats), /Replay|picture|watching|tries/i);
});

test("listening seed questions map to shipped choice PNGs", () => {
  const seeds = createListeningSeedQuestions("/");
  assert.ok(seeds.length >= 6);
  assert.ok(seeds.every((q) => q.choices.length === 4));
  assert.equal(choiceImageSrc("apple", "/"), "/assets/choices/apple.png");
  const enriched = withChoiceImages(
    [{ label: "Dog", value: "dog", emoji: "🐶", color: "#d9a66f" }],
    "/",
  );
  assert.match(enriched[0].imageSrc, /dog\.png$/);
});

test("shared quiz UI builds A-D picture cards", () => {
  assert.equal(choiceLetter(0), "A");
  assert.equal(choiceLetter(3), "D");
  const html = choiceGridMarkup(
    [
      {
        label: "Apple",
        value: "apple",
        color: "#ff6b5e",
        imageSrc: "/assets/choices/apple.png",
      },
      {
        label: "Ball",
        value: "ball",
        color: "#6db6e8",
        imageSrc: "/assets/choices/ball.png",
      },
    ],
    { answer: "apple", prompt: "Find the apple" },
  );
  assert.match(html, /choice-grid-pictures/);
  assert.match(html, /choice-letter/);
  assert.match(html, /apple\.png/);
  assert.match(html, /data-choice="apple"/);
});
