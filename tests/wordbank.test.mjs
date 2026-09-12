import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  bankIdFromTheme,
  buildListeningQuestion,
  catalogBankFiles,
  clampListeningCount,
  recommendedListeningCount,
  visibleListeningCounts,
  listListeningBanks,
  listWordbankThemes,
  listeningPoolForBank,
  listeningPoolFromWordbank,
  mulberry32,
  pickDistractors,
  pickListeningRound,
  seedFrom,
} from "../src/wordbank.js";
import { playStageMarkup } from "../src/play-ui.js";
import { choiceImageSrc } from "../src/listening.js";

const wordbank = JSON.parse(
  await readFile("public/content/wordbank.starters.json", "utf8"),
);
const catalog = JSON.parse(
  await readFile("public/content/wordbanks.json", "utf8"),
);
const loadedBanks = {
  "wordbank.starters.json": wordbank,
  starters: wordbank,
};

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

test("wordbank catalog lists full pack and theme packs", () => {
  assert.equal(catalog.schemaVersion, 1);
  assert.deepEqual(catalogBankFiles(catalog), ["wordbank.starters.json"]);
  const banks = listListeningBanks(catalog, loadedBanks);
  const full = banks.find((bank) => bank.id === "starters");
  const food = banks.find((bank) => bank.id === "starters-food");
  assert.ok(full.count >= 80);
  assert.equal(full.theme, "all");
  assert.ok(food.count >= 8);
  assert.equal(food.theme, "food");
  assert.equal(bankIdFromTheme(catalog, "animals"), "starters-animals");
  assert.equal(bankIdFromTheme(catalog, "all"), "starters");
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
  assert.match(html, /Listen/);
  assert.doesNotMatch(html, /feature-hub/);
  assert.doesNotMatch(html, />Apple</);
});

test("wordbank themes expose approved counts", () => {
  const themes = listWordbankThemes(wordbank);
  const all = themes.find((item) => item.id === "all");
  const food = themes.find((item) => item.id === "food");
  assert.ok(all.count >= 80);
  assert.ok(food.count >= 8);
  assert.equal(clampListeningCount(12, 8), 8);
  assert.equal(clampListeningCount(8, 110), 8);
  const foodPool = listeningPoolFromWordbank(wordbank, { theme: "food" });
  assert.ok(foodPool.every((question) => question.id.startsWith("english-")));
  assert.equal(foodPool.length, food.count);
});

test("selecting a theme pack bank filters the listening pool", () => {
  const foodBank = listListeningBanks(catalog, loadedBanks).find(
    (bank) => bank.id === "starters-food",
  );
  const pool = listeningPoolForBank(foodBank, loadedBanks, { assetBase: "/" });
  assert.equal(pool.length, foodBank.count);
  assert.ok(pool.every((question) => question.id.startsWith("english-")));
});

test("listening rounds shuffle and do not repeat", () => {
  const pool = listeningPoolFromWordbank(wordbank, { theme: "food" });
  const left = pickListeningRound(pool, 8, mulberry32(1));
  const right = pickListeningRound(pool, 8, mulberry32(2));
  assert.equal(left.length, 8);
  assert.equal(new Set(left.map((item) => item.id)).size, 8);
  assert.notDeepEqual(
    left.map((item) => item.id),
    right.map((item) => item.id),
  );
});

test("choice images use jpeg, not png", () => {
  assert.match(choiceImageSrc("apple", "/"), /apple\.jpg$/);
  assert.ok(existsSync(join("public", "assets", "choices", "apple.jpg")));
});

test("starter words have no leftover audio fields", () => {
  for (const word of wordbank.words) {
    assert.equal("audio" in word, false, word.lemma);
  }
});

test("recommended listening counts hide oversized chips", () => {
  assert.equal(recommendedListeningCount(4, 8), 4);
  assert.equal(recommendedListeningCount(5, 8), 5);
  assert.equal(recommendedListeningCount(8, 8), 8);
  assert.equal(recommendedListeningCount(24, 8), 8);
  assert.deepEqual(visibleListeningCounts(4), [4]);
  assert.deepEqual(visibleListeningCounts(5), [5]);
  assert.deepEqual(visibleListeningCounts(8), [5, 8]);
  assert.deepEqual(visibleListeningCounts(24), [5, 8, 10, 12]);
});
