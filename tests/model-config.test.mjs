import test from "node:test";
import assert from "node:assert/strict";
import {
  CUSTOM_IDS,
  adapterFields,
  catalogOptions,
  defaultModels,
  imagePromptFor,
  isAdapterModel,
  isCustomModel,
  isOnDeviceOption,
  localCatalogOptions,
  modelCatalog,
  modelName,
  remoteCatalogOptions,
  normalizeCustomConfig,
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
  assert.ok(images.includes("google-gemini-flash-image"));
  assert.ok(images.includes(CUSTOM_IDS.image));
  assert.ok(planners.includes("deepseek-chat"));
  assert.ok(videos.includes("qwen-vl-max"));
  assert.ok(isCustomModel(CUSTOM_IDS.video));
});

test("custom OpenAI-compatible fields override the catalog model id", () => {
  const custom = normalizeCustomConfig({
    image: {
      model: "my-flux",
      baseUrl: "https://openrouter.ai/api/v1",
    },
  });
  const fields = adapterFields("image", CUSTOM_IDS.image, custom);
  assert.equal(fields.provider, "custom");
  assert.equal(fields.model, "my-flux");
  assert.equal(fields.baseUrl, "https://openrouter.ai/api/v1");
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

test("local vs remote catalogs split on-device from adapters", () => {
  assert.ok(
    localCatalogOptions("image").every((item) => isOnDeviceOption(item)),
  );
  assert.ok(
    remoteCatalogOptions("image").every((item) => !isOnDeviceOption(item)),
  );
  assert.ok(
    localCatalogOptions("voice").some((item) => item.id === "browser-speech"),
  );
  assert.ok(
    remoteCatalogOptions("image").some(
      (item) => item.id === "grok-imagine-image",
    ),
  );
  assert.equal(modelCatalog.video.label, "动画提问");
  assert.match(modelCatalog.video.hint, /GIF|图片/);
});
