import test from "node:test";
import assert from "node:assert/strict";
import {
  catalogOptions,
  defaultModels,
  imagePromptFor,
  isAdapterModel,
  modelName,
  resolveModels,
} from "../src/model-config.js";

test("legacy OpenAI placeholders migrate to local or Grok adapters", () => {
  const resolved = resolveModels({
    image: "gpt-image-1",
    voice: "gpt-4o-mini-tts",
    vocab: "gpt-4o-mini",
    video: "unknown",
  });
  assert.equal(resolved.image, "local-image");
  assert.equal(resolved.voice, "grok-tts");
  assert.equal(resolved.vocab, "grok-4.6");
  assert.equal(resolved.video, "local-video");
});

test("defaults stay fully offline", () => {
  const defaults = defaultModels();
  assert.equal(defaults.image, "local-image");
  assert.equal(defaults.voice, "browser-speech");
  assert.equal(defaults.vocab, "adaptive-picture");
  assert.equal(defaults.video, "local-video");
  assert.equal(isAdapterModel("voice", defaults.voice), false);
  assert.equal(isAdapterModel("image", "grok-imagine-image"), true);
  assert.equal(
    modelName("image", { image: "grok-imagine-image" }),
    "Grok Imagine 2.0",
  );
});

test("mainstream xAI and OpenAI models are optional adapter choices", () => {
  const images = catalogOptions("image").map((item) => item.id);
  const voices = catalogOptions("voice").map((item) => item.id);
  const planners = catalogOptions("vocab").map((item) => item.id);
  const videos = catalogOptions("video").map((item) => item.id);
  assert.deepEqual(
    ["grok-imagine-fast", "openai-gpt-image", "openai-dall-e-3"].every((id) =>
      images.includes(id),
    ),
    true,
  );
  assert.deepEqual(
    ["grok-tts-ara", "grok-tts-luna", "openai-tts-1"].every((id) =>
      voices.includes(id),
    ),
    true,
  );
  assert.deepEqual(
    ["grok-4.5", "grok-4.3", "grok-4.1-fast", "openai-gpt-4o-mini"].every(
      (id) => planners.includes(id),
    ),
    true,
  );
  assert.ok(videos.includes("openai-gpt-4o-vision"));
  assert.equal(isAdapterModel("vocab", "openai-gpt-4o-mini"), true);
});

test("image prompts stay English and preschool-safe", () => {
  const prompt = imagePromptFor({
    speech: "Which one is an apple?",
    prompt: "Find the apple",
  });
  assert.match(prompt, /apple/i);
  assert.match(prompt, /no text/i);
  assert.doesNotMatch(prompt, /[\u3400-\u9fff]/);
});
