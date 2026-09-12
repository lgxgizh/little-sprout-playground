import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const WORD_BANKS = [
  "wordbank.starters.json",
  "wordbank.movers.json",
  "wordbank.flyers.json",
  "wordbank.feelings.json",
  "wordbank.actions.json",
  "wordbank.adjectives.json",
];

test("wordbank flashcard JPEGs exist on disk", async () => {
  for (const fileName of WORD_BANKS) {
    const wordbank = JSON.parse(
      await readFile(`public/content/${fileName}`, "utf8"),
    );
    assert.ok(Array.isArray(wordbank.words), fileName);
    assert.ok(wordbank.words.length >= 4, fileName);
    for (const word of wordbank.words) {
      assert.ok(word.image, `${fileName}:${word.lemma} needs an image`);
      assert.ok(
        existsSync(join("public", word.image)),
        `missing ${word.image}`,
      );
    }
  }
});
