import test from "node:test";
import assert from "node:assert/strict";
import { courses } from "../src/content.js";
import { createDefaultChild } from "../src/storage.js";
import { renderApp } from "../src/ui.js";

function context(overrides = {}) {
  const child = createDefaultChild({ nickname: "小米" });
  const { state: stateOverrides = {}, ...rest } = overrides;
  return {
    assetBase: "./",
    courses,
    models: {
      image: "local-image",
      voice: "browser-speech",
      vocab: "adaptive-picture",
      video: "local-video",
    },
    profile: child.profile,
    children: [child],
    child,
    state: {
      view: "home",
      soundOn: true,
      modal: false,
      parentGate: false,
      parentUnlocked: false,
      parentTab: "child",
      activityCourse: "english",
      questionIndex: 0,
      answered: false,
      correct: false,
      activityComplete: false,
      baselineTest: false,
      baselineCorrect: 0,
      aiPlanning: false,
      speechPractice: "idle",
      speechFeedback: "",
      story: null,
      offlineTaskDone: false,
      selectedChoice: null,
      ...stateOverrides,
    },
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
    next: {
      course: courses.find((course) => course.id === "english"),
      reason: "还没玩过，一起试试看",
    },
    dailyProgress: { answers: 0, target: 3 },
    ...rest,
  };
}

test("home view is a child hub with Chinese chrome", () => {
  const html = renderApp(context());
  assert.match(html, /小栗子乐园/);
  assert.match(html, /点一张图，开始玩/);
  assert.match(html, /Which one is an apple\?/);
  assert.match(html, /打开就能玩/);
  assert.match(html, /英语耳朵/);
  assert.doesNotMatch(html, /Question model/);
});

test("home demo quiz can show a found-it state", () => {
  const html = renderApp(
    context({
      state: {
        demoAnswered: true,
        demoCorrect: true,
        demoChoice: "apple",
      },
    }),
  );
  assert.match(html, /找到啦！这就是小栗子乐园/);
  assert.match(html, /再玩 3 题/);
});

test("play view fills the board with English question and Chinese controls", () => {
  const html = renderApp(
    context({
      state: {
        view: "play",
        activityCourse: "english",
        questionIndex: 0,
        answered: false,
      },
    }),
  );
  assert.match(html, /Which one is an apple\?/);
  assert.match(html, /听一听/);
  assert.match(html, /跟我说/);
  assert.match(html, /休息一下/);
  assert.doesNotMatch(html, /data-tab="home"/);
});

test("parent settings are tabbed and gated", () => {
  const gated = renderApp(
    context({
      state: { modal: true, parentGate: true, parentUnlocked: false },
    }),
  );
  assert.match(gated, /长按进入设置/);
  const open = renderApp(
    context({
      state: {
        modal: true,
        parentGate: false,
        parentUnlocked: true,
        parentTab: "growth",
      },
    }),
  );
  assert.match(open, /本周成长卡/);
  assert.match(open, /data-parent-tab="child"/);
});

test("parent settings list Grok adapters for image, voice, planning, and video", () => {
  const html = renderApp(
    context({
      state: {
        modal: true,
        parentGate: false,
        parentUnlocked: true,
        parentTab: "settings",
      },
    }),
  );
  assert.match(html, /Grok Imagine/);
  assert.match(html, /Grok TTS/);
  assert.match(html, /Grok 4\.6/);
  assert.match(html, /视频理解/);
  assert.match(html, /请模型看一看|本地播放/);
});
