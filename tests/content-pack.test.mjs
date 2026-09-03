import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("English content pack follows the safe question schema", async () => {
  const source = await readFile("public/content/questions.en.json", "utf8");
  const pack = JSON.parse(source);
  assert.equal(pack.schemaVersion, 1);
  assert.equal(pack.locale, "en-US");
  assert.ok(Array.isArray(pack.questions));
  assert.ok(pack.questions.length > 0);

  for (const question of pack.questions) {
    assert.match(question.id, /^english-/);
    assert.ok([1, 2, 3].includes(question.difficulty));
    assert.equal(typeof question.prompt, "string");
    assert.equal(typeof question.speech, "string");
    assert.equal(typeof question.answer, "string");
    assert.ok(question.choices.length >= 2 && question.choices.length <= 4);
    assert.ok(
      question.choices.some((choice) => choice.value === question.answer),
    );
    for (const text of [
      question.prompt,
      question.speech,
      ...question.choices.map((choice) => choice.label),
    ]) {
      assert.doesNotMatch(text, /[\u4e00-\u9fff]/);
    }
  }
});
