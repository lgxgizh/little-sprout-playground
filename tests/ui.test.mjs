import test from "node:test";
import assert from "node:assert/strict";
import { homeHubMarkup } from "../src/hub-ui.js";
import { parentModelsMarkup } from "../src/parent-ui.js";
import {
  listeningEncouragement,
  listeningResultMarkup,
  playStageMarkup,
} from "../src/play-ui.js";
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

test("listening end screen shows score bands and actions", () => {
  const high = listeningResultMarkup({ correct: 8, total: 8 });
  assert.match(high, /listeningResult/);
  assert.match(high, /8 \/ 8 · 100%/);
  assert.match(high, /太棒了/);
  assert.match(high, /id="restartListening"/);
  assert.match(high, /id="backHomeFromResult"/);
  assert.match(high, /再来一次/);
  assert.match(high, /回主页/);
  assert.equal(listeningEncouragement(80).icon, "🌟");
  assert.equal(listeningEncouragement(50).icon, "🎈");
  assert.equal(listeningEncouragement(20).icon, "🌱");
  const mid = listeningResultMarkup({ correct: 5, total: 8 });
  assert.match(mid, /很不错/);
  const anim = listeningResultMarkup({
    correct: 2,
    total: 3,
    mode: "animation",
    detail: "Replay anytime",
  });
  assert.match(anim, /animationResult/);
  assert.match(anim, /restartAnimation/);
  assert.match(anim, /Replay anytime/);
});

test("wrong answer dock offers retry same question, not next", () => {
  const wrong = playStageMarkup({
    question: {
      id: "english-apple",
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
      answered: true,
      correct: false,
      selectedChoice: "banana",
      activityComplete: false,
      soundOn: true,
      aiPlanning: false,
      encouragement: "再试一次 · Try this one again",
    },
    total: 8,
  });
  assert.match(wrong, /id="retryQuestion"/);
  assert.match(wrong, /再选一次/);
  assert.doesNotMatch(wrong, /id="nextQuestion"/);

  const right = playStageMarkup({
    question: {
      id: "english-apple",
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
      answered: true,
      correct: true,
      selectedChoice: "apple",
      activityComplete: false,
      soundOn: true,
      aiPlanning: false,
      encouragement: "对了 · You found it!",
    },
    total: 8,
  });
  assert.match(right, /id="nextQuestion"/);
  assert.doesNotMatch(right, /id="retryQuestion"/);
});
