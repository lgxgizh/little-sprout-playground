import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  bankIdFromTheme,
  buildContrastQuestion,
  resolveLoadedBank,
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
  normalizeListeningBankId,
  findListeningBank,
} from "../src/wordbank.js";
import { playStageMarkup } from "../src/play-ui.js";
import { choiceImageSrc } from "../src/listening.js";

const wordbank = JSON.parse(
  await readFile("public/content/wordbank.starters.json", "utf8"),
);
const catalog = JSON.parse(
  await readFile("public/content/wordbanks.json", "utf8"),
);
const movers = JSON.parse(
  await readFile("public/content/wordbank.movers.json", "utf8"),
);
const flyers = JSON.parse(
  await readFile("public/content/wordbank.flyers.json", "utf8"),
);
const concepts = JSON.parse(
  await readFile("public/content/wordbank.concepts.json", "utf8"),
);
const feelings = JSON.parse(
  await readFile("public/content/wordbank.feelings.json", "utf8"),
);
const actions = JSON.parse(
  await readFile("public/content/wordbank.actions.json", "utf8"),
);
const adjectives = JSON.parse(
  await readFile("public/content/wordbank.adjectives.json", "utf8"),
);
const loadedBanks = {
  "wordbank.starters.json": wordbank,
  starters: wordbank,
  "wordbank.movers.json": movers,
  movers: movers,
  "wordbank.flyers.json": flyers,
  flyers: flyers,
  "wordbank.concepts.json": concepts,
  concepts: concepts,
  "wordbank.feelings.json": feelings,
  feelings: feelings,
  "wordbank.actions.json": actions,
  actions: actions,
  "wordbank.adjectives.json": adjectives,
  adjectives: adjectives,
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
  assert.deepEqual(catalogBankFiles(catalog), [
    "wordbank.starters.json",
    "wordbank.movers.json",
    "wordbank.flyers.json",
    "wordbank.concepts.json",
    "wordbank.feelings.json",
    "wordbank.actions.json",
    "wordbank.adjectives.json",
  ]);
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

test("movers bank is registered and image-backed", () => {
  assert.ok(movers.words.length >= 48);
  assert.ok(movers.words.every((word) => word.level === "movers"));
  for (const slug of ["rabbit", "crocodile", "dolphin", "panda"]) {
    assert.ok(
      movers.words.some((word) => word.slug === slug),
      slug,
    );
  }
  assert.ok(!movers.words.some((word) => word.slug === "butterfly"));
  assert.ok(!movers.words.some((word) => word.slug === "strawberry"));
  const banks = listListeningBanks(catalog, loadedBanks);
  const entry = banks.find((bank) => bank.id === "movers");
  assert.ok(entry);
  assert.match(entry.label, /A1 Movers|Movers/);
  const pool = listeningPoolForBank(entry, loadedBanks, { assetBase: "/" });
  assert.equal(pool.length, entry.count);
  assert.ok(pool[0].choices.length >= 2);
});

test("flyers bank is registered and image-backed", () => {
  assert.ok(flyers.words.length >= 20);
  assert.ok(flyers.words.every((word) => word.level === "flyers"));
  for (const slug of ["camel", "butterfly", "strawberry", "castle"]) {
    assert.ok(
      flyers.words.some((word) => word.slug === slug),
      slug,
    );
  }
  const banks = listListeningBanks(catalog, loadedBanks);
  const entry = banks.find((bank) => bank.id === "flyers");
  assert.ok(entry);
  assert.match(entry.label, /A2 Flyers|Flyers/);
  const pool = listeningPoolForBank(entry, loadedBanks, { assetBase: "/" });
  assert.equal(pool.length, entry.count);
  assert.ok(pool[0].choices.length >= 2);
});

test("legacy movers-lite bank id maps to movers", () => {
  assert.equal(normalizeListeningBankId("movers-lite"), "movers");
  assert.equal(normalizeListeningBankId("movers"), "movers");
  const entry = findListeningBank(catalog, "movers-lite");
  assert.equal(entry?.id, "movers");
});

test("concepts bank builds contrast attribute prompts", () => {
  assert.equal(concepts.question_type, "contrast");
  const pair = concepts.pairs.find((item) => item.id === "size-dog");
  const big = buildContrastQuestion(
    pair,
    pair.prompts.find((item) => item.value === "big"),
    { childId: "kid-a", assetBase: "/", salt: "t1" },
  );
  assert.equal(big.answer, "dog-big");
  assert.match(big.prompt, /big/i);
  assert.match(big.speech, /big/i);
  assert.equal(big.question_type, "contrast");
  assert.ok(big.choices.length >= 2);
  assert.ok(
    big.choices.every((choice) => choice.imageSrc.includes("/assets/")),
  );

  const banks = listListeningBanks(catalog, loadedBanks);
  const entry = banks.find((bank) => bank.id === "concepts");
  assert.ok(entry);
  assert.ok(entry.count >= 8);
  const pool = listeningPoolForBank(entry, loadedBanks, {
    childId: "kid-b",
    assetBase: "/",
  });
  assert.equal(pool.length, entry.count);
  assert.ok(
    pool.some((question) => /Which one is tall/i.test(question.prompt)),
  );
  assert.ok(
    pool.some((question) => /Which one is empty/i.test(question.prompt)),
  );
  assert.ok(pool.some((question) => /Which one is red/i.test(question.prompt)));
});

test("size/height/fill contrasts stay pure 2-choice without cross-attribute pads", () => {
  const pair = concepts.pairs.find((item) => item.id === "size-dog");
  const allChoices = concepts.pairs.flatMap((item) => item.choices || []);
  const big = buildContrastQuestion(
    pair,
    pair.prompts.find((item) => item.value === "big"),
    { childId: "pad-a", padChoices: allChoices, allowPad: true },
  );
  assert.equal(big.choices.length, 2);
  assert.deepEqual(big.choices.map((choice) => choice.value).sort(), [
    "dog-big",
    "dog-small",
  ]);
  assert.ok(!big.choices.some((choice) => choice.value === "tree-tall"));

  const pool = listeningPoolForBank(
    { id: "concepts", file: "wordbank.concepts.json", theme: "all" },
    loadedBanks,
    { childId: "pad-b", assetBase: "/" },
  );
  const tall = pool.find((question) => /tall/i.test(question.prompt));
  assert.ok(tall);
  assert.equal(tall.choices.length, 2);
  assert.ok(
    !tall.choices.some(
      (choice) =>
        /big|small|full|empty/.test(choice.value) &&
        !choice.value.includes("tree"),
    ),
  );
});

test("resolveLoadedBank accepts pairs-only banks", () => {
  const pairsOnly = {
    schemaVersion: 1,
    question_type: "contrast",
    pairs: concepts.pairs,
  };
  const resolved = resolveLoadedBank(
    { id: "concepts-only", file: "pairs-only.json" },
    { "pairs-only.json": pairsOnly },
  );
  assert.equal(resolved, pairsOnly);
  assert.equal(
    resolveLoadedBank({ id: "missing", file: "nope.json" }, {}),
    null,
  );
});

test("feelings/actions/adjectives skill banks use natural prompts", () => {
  assert.ok(feelings.words.length >= 8);
  assert.ok(actions.words.length >= 20);
  assert.ok(adjectives.words.length >= 12);
  const happy = feelings.words.find((word) => word.slug === "happy");
  const run = actions.words.find((word) => word.slug === "run");
  const hot = adjectives.words.find((word) => word.slug === "hot");
  assert.match(happy.prompt_en, /happy/i);
  assert.doesNotMatch(happy.prompt_en, /the happy/i);
  assert.match(run.prompt_en, /running|Who is run/i);
  assert.match(hot.prompt_en, /hot/i);

  const banks = listListeningBanks(catalog, loadedBanks);
  for (const id of ["feelings", "actions", "adjectives"]) {
    const entry = banks.find((bank) => bank.id === id);
    assert.ok(entry, id);
    const pool = listeningPoolForBank(entry, loadedBanks, { assetBase: "/" });
    assert.equal(pool.length, entry.count);
    assert.ok(pool[0].choices.length === 4);
  }

  const happyQ = buildListeningQuestion(happy, feelings.words, {
    assetBase: "/",
  });
  assert.equal(happyQ.answer, "happy");
  assert.ok(
    happyQ.choices.every((choice) =>
      feelings.words.some((word) => word.slug === choice.value),
    ),
  );
  const picked = pickDistractors(happy, feelings.words, () => 0.2, 3);
  assert.ok(picked.every((word) => word.theme === "feelings"));
});

test("expanded movers and flyers include new picture nouns", () => {
  for (const slug of [
    "snake",
    "spider",
    "bat",
    "fox",
    "bridge",
    "island",
    "cave",
    "lighthouse",
    "owl",
    "squirrel",
    "hedgehog",
    "lobster",
    "skate",
    "skateboard",
    "scooter",
    "sledge",
  ]) {
    assert.ok(movers.words.some((word) => word.slug === slug), slug);
  }
  for (const slug of [
    "firefighter",
    "pirate",
    "clown",
    "dancer",
    "volcano",
    "desert",
    "jungle",
    "snowman",
    "astronaut",
    "queen",
    "chef",
    "doctor",
    "treasure",
    "compass",
    "map",
    "tent",
  ]) {
    assert.ok(flyers.words.some((word) => word.slug === slug), slug);
  }
});

test("batch2 feelings/actions/adjectives expansions are present", () => {
  for (const slug of [
    "hungry",
    "thirsty",
    "bored",
    "brave",
    "shy",
    "proud",
    "worried",
    "funny",
  ]) {
    assert.ok(feelings.words.some((word) => word.slug === slug), slug);
  }
  for (const slug of [
    "catch",
    "throw",
    "climb",
    "fall",
    "open",
    "look",
    "carry",
    "give",
  ]) {
    assert.ok(actions.words.some((word) => word.slug === slug), slug);
  }
  for (const slug of ["new", "old", "light", "dark"]) {
    assert.ok(adjectives.words.some((word) => word.slug === slug), slug);
  }
  assert.ok(feelings.words.length >= 16);
  assert.ok(actions.words.length >= 28);
  assert.ok(adjectives.words.length >= 16);
});

