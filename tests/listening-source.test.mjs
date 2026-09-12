import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

test("kid listening pool is not loaded from questions.en.json", async () => {
  const source = await readFile("src/app.js", "utf8");
  assert.doesNotMatch(source, /questions\.en\.json/);
  assert.doesNotMatch(source, /loadQuestionPack/);
  assert.doesNotMatch(source, /normalizeContentQuestion/);
});

test("runtime demos do not reference shapes-hello.mp4", async () => {
  const animation = await readFile("src/animation-quiz.js", "utf8");
  const app = await readFile("src/app.js", "utf8");
  assert.doesNotMatch(animation, /shapes-hello\.mp4/);
  assert.doesNotMatch(app, /shapes-hello\.mp4/);
  assert.equal(existsSync("public/assets/media/shapes-hello.mp4"), false);
});
