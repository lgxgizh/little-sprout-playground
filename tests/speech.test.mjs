import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("speech module exports speakWithVoice and speak", () => {
  const source = readFileSync(
    new URL("../src/speech.js", import.meta.url),
    "utf8",
  );
  assert.match(source, /export async function speakWithVoice/);
  assert.match(source, /export function speak\(/);
  assert.match(source, /local-audio/);
  assert.match(source, /assets\/audio/);
  assert.match(source, /tts-fallback/);
});
