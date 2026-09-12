import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

test("word bank catalog and packs stay image-backed", async () => {
  const catalog = JSON.parse(
    await readFile("public/content/wordbanks.json", "utf8"),
  );
  assert.equal(catalog.schemaVersion, 1);
  assert.ok(catalog.banks.some((bank) => bank.id === "movers"));
  assert.ok(catalog.banks.some((bank) => bank.id === "flyers"));
  assert.ok(catalog.banks.some((bank) => bank.id === "concepts"));
  assert.ok(catalog.banks.some((bank) => bank.id === "feelings"));
  assert.ok(catalog.banks.some((bank) => bank.id === "actions"));
  assert.ok(catalog.banks.some((bank) => bank.id === "adjectives"));
  assert.ok(!catalog.banks.some((bank) => bank.id === "movers-lite"));

  const minWordsByFile = {
    "wordbank.flyers.json": 12,
    "wordbank.feelings.json": 8,
    "wordbank.actions.json": 12,
    "wordbank.adjectives.json": 4,
  };

  for (const fileName of [
    "wordbank.starters.json",
    "wordbank.movers.json",
    "wordbank.flyers.json",
    "wordbank.concepts.json",
    "wordbank.feelings.json",
    "wordbank.actions.json",
    "wordbank.adjectives.json",
  ]) {
    const pack = JSON.parse(
      await readFile(`public/content/${fileName}`, "utf8"),
    );
    assert.equal(pack.schemaVersion, 1);
    if (fileName === "wordbank.concepts.json") {
      assert.equal(pack.question_type, "contrast");
      assert.ok(pack.pairs.length >= 4);
      for (const pair of pack.pairs) {
        assert.ok(pair.prompts?.length >= 1);
        assert.ok(pair.choices?.length >= 2);
        for (const choice of pair.choices) {
          assert.ok(existsSync(join("public", choice.image)));
        }
      }
      continue;
    }
    assert.ok(Array.isArray(pack.words));
    const minWords = minWordsByFile[fileName] ?? 20;
    assert.ok(pack.words.length >= minWords, fileName);
    for (const word of pack.words) {
      assert.equal(typeof word.prompt_en, "string");
      assert.equal(typeof word.speech, "string");
      assert.match(word.image, /\.jpg$/);
      assert.ok(existsSync(join("public", word.image)), word.image);
      for (const text of [word.prompt_en, word.speech, word.lemma]) {
        assert.doesNotMatch(text, /[\u4e00-\u9fff]/);
      }
    }
  }
});

test("legacy questions.en.json is gone from content", async () => {
  assert.equal(existsSync("public/content/questions.en.json"), false);
});
