import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("kid listening pool is not loaded from questions.en.json", async () => {
  const source = await readFile("src/app.js", "utf8");
  assert.doesNotMatch(source, /questions\.en\.json/);
  assert.doesNotMatch(source, /loadQuestionPack/);
  assert.doesNotMatch(source, /normalizeContentQuestion/);
});
