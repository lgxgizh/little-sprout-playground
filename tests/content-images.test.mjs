import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { questionBank } from "../src/content.js";

test("demo questions use generated sticker files", () => {
  for (const questions of Object.values(questionBank)) {
    for (const question of questions) {
      assert.ok(question.image, `${question.id} needs an image`);
      assert.ok(
        existsSync(join("public", question.image)),
        `missing ${question.image}`,
      );
      for (const choice of question.choices) {
        assert.ok(
          choice.image,
          `${question.id}:${choice.value} needs an image`,
        );
        assert.ok(
          existsSync(join("public", choice.image)),
          `missing ${choice.image}`,
        );
      }
    }
  }
});
