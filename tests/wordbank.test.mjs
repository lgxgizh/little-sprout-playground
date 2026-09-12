import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  buildListeningQuestion,
  listeningPoolFromWordbank,
  pickDistractors,
  seedFrom,
} from "../src/wordbank.js";
import { playStageMarkup } from "../src/play-ui.js";
import { choiceImageSrc } from "../src/listening.js";

const wordbank = JSON.parse(
  await readFile("public/content/wordbank.starters.json", "utf8"),
);

test("starters wordbank only keeps imageable nouns", () => {
  assert.equal(wordbank.schemaVersion, 1);
  assert.equal(wordbank.imageFormat, "jpeg");
  assert.ok(wordbank.words.length >= 80);
  for (const word of wordbank.words) {
    assert.equal(word.pos, "noun");
    assert.equal(word.level, "starters");
    assert.equal(word.imageable, true);
    assert.match(word.image, /\.jpg$/);
    assert.doesNotMatch(word.lemma, /^(the|is|and|because|happy|morning)$/i);
  }
});

test("same-theme distractors beat distant objects", () => {
  const apple = wordbank.words.find((word) => word.slug === "apple");
  const random = () => 0.2;
  const picked = pickDistractors(apple, wordbank.words, random, 3);
  assert.equal(picked.length, 3);
  assert.ok(picked.every((word) => word.theme === "food"));
  assert.ok(!picked.some((word) => word.slug === "apple"));
});

test("child id changes option order without changing the answer", () => {
  const apple = wordbank.words.find((word) => word.slug === "apple");
  const left = buildListeningQuestion(apple, wordbank.words, {
    childId: "child-a",
    assetBase: "/",
  });
  const right = buildListeningQuestion(apple, wordbank.words, {
    childId: "child-b",
    assetBase: "/",
  });
  assert.equal(left.answer, "apple");
  assert.equal(right.answer, "apple");
  assert.notDeepEqual(
    left.choices.map((choice) => choice.value),
    right.choices.map((choice) => choice.value),
  );
  assert.equal(seedFrom("a"), seedFrom("a"));
});

test("approved listening pool prefers apple first", () => {
  const pool = listeningPoolFromWordbank(wordbank, { assetBase: "/" });
  assert.ok(pool.length >= 1);
  assert.equal(pool[0].id, "english-apple");
  assert.equal(pool[0].choices.length, 4);
});

test("play stage fills the viewport chrome instead of the home card", () => {
  const apple = buildListeningQuestion(
    wordbank.words.find((word) => word.slug === "apple"),
    wordbank.words,
    { assetBase: "/" },
  );
  const html = playStageMarkup({
    question: apple,
    state: {
      animationMode: false,
      questionIndex: 0,
      answered: false,
      soundOn: true,
      activityComplete: false,
    },
    total: 3,
  });
  assert.match(html, /play-stage/);
  assert.match(html, /id="quizPanel"/);
  assert.match(html, /id="finishSession"/);
  assert.match(html, /听一听/);
  assert.doesNotMatch(html, /feature-hub/);
  assert.doesNotMatch(html, />Apple</);
});

test("choice images use jpeg, not png", () => {
  assert.match(choiceImageSrc("apple", "/"), /apple\.jpg$/);
  assert.ok(existsSync(join("public", "assets", "choices", "apple.jpg")));
});
