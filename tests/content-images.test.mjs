import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

test("wordbank flashcard JPEGs exist on disk", async () => {
  const wordbank = JSON.parse(
    await readFile("public/content/wordbank.starters.json", "utf8"),
  );
  assert.ok(wordbank.words.length >= 80);
  for (const word of wordbank.words) {
    assert.ok(word.image, `${word.lemma} needs an image`);
    assert.ok(existsSync(join("public", word.image)), `missing ${word.image}`);
  }
});
