import test from "node:test";
import assert from "node:assert/strict";
import { homeHubMarkup } from "../src/hub-ui.js";
import { parentModelsMarkup } from "../src/parent-ui.js";
import { playStageMarkup } from "../src/play-ui.js";
import { defaultModels } from "../src/model-config.js";

test("home view is the live kid hub with Chinese chrome", () => {
  const html = homeHubMarkup({ childName: "小米" });
  assert.match(html, /嗨，小米/);
  assert.match(html, /今天玩哪一个/);
  assert.match(html, /英语听力测试/);
  assert.match(html, /动画提问/);
  assert.doesNotMatch(html, /Question model/);
  assert.doesNotMatch(html, /找颜色/);
});

test("play view fills the board with English prompt and Chinese leave control", () => {
  const html = playStageMarkup({
    question: {
      id: "english-apple",
      visual: "🍎",
      prompt: "Which one is an apple?",
      answer: "apple",
      choices: [
        { label: "Apple", emoji: "🍎", value: "apple", color: "#ff6b5e" },
        { label: "Banana", emoji: "🍌", value: "banana", color: "#f7c94b" },
      ],
    },
    state: {
      animationMode: false,
      baselineTest: false,
      questionIndex: 0,
      answered: false,
      correct: false,
      selectedChoice: null,
      activityComplete: false,
      soundOn: true,
      aiPlanning: false,
    },
    total: 8,
  });
  assert.match(html, /Which one is an apple\?/);
  assert.match(html, /英语听力测试/);
  assert.match(html, /Listen/);
  assert.match(html, /Leave/);
  assert.doesNotMatch(html, /data-tab="home"/);
});

test("parent models stay local-first and fold remotes away", () => {
  const html = parentModelsMarkup({
    models: defaultModels(),
    customModels: {},
  });
  assert.match(html, /id="localModelPanel"/);
  assert.match(html, /高级 \/ 远程模型/);
  assert.match(html, /动画提问/);
  assert.doesNotMatch(html.split('id="advancedModels"')[0], /Grok Imagine/);
});
