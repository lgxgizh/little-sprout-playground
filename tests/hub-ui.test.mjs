import test from "node:test";
import assert from "node:assert/strict";
import {
  homeHubMarkup,
  listeningHubMarkup,
  videoHubMarkup,
} from "../src/hub-ui.js";

test("kid home only offers listening and video Q&A", () => {
  const html = homeHubMarkup({ childName: "小米" });
  assert.match(html, /嗨，小米/);
  assert.match(html, /英语听力测试/);
  assert.match(html, /看视频提问/);
  assert.match(html, /data-feature="listening"/);
  assert.match(html, /data-feature="video"/);
  assert.match(html, /flashcards\/food\/apple\.jpg/);
  assert.match(html, /fox-apple\.gif/);
  assert.doesNotMatch(html, /Try one now/);
  assert.doesNotMatch(html, /Which one is the apple/);
  assert.doesNotMatch(html, /demo-quiz/);
  assert.doesNotMatch(html, /找颜色/);
});

test("video hub shows its own fox demo, not a listening quiz", () => {
  const html = videoHubMarkup({
    demo: {
      id: "demo-fox-apple",
      title: "Fox finds an apple",
      src: "/assets/stories/fox-apple.gif",
      mediaType: "image",
    },
    others: [
      {
        id: "custom-1",
        title: "My clip",
        description: "Watch, then tap",
        durationLabel: "short",
      },
    ],
  });
  assert.match(html, /看视频提问/);
  assert.match(html, /DEMO/);
  assert.match(html, /开始提问/);
  assert.match(html, /fox-apple\.gif/);
  assert.match(html, /id="startVideoDemo"/);
  assert.match(html, /My clip/);
  assert.doesNotMatch(html, /英语听力测试/);
  assert.doesNotMatch(html, /Which one is the apple/);
});

test("listening hub lets you pick a word bank and question count", () => {
  const html = listeningHubMarkup({
    themes: [
      { id: "all", label: "全部", count: 110 },
      { id: "food", label: "食物", count: 24 },
    ],
    selectedTheme: "food",
    counts: [5, 8, 10, 12],
    selectedCount: 8,
    available: 24,
    previews: [{ src: "/assets/flashcards/food/apple.jpg", lemma: "apple" }],
  });
  assert.match(html, /英语听力测试/);
  assert.match(html, /词库/);
  assert.match(html, /每次几题/);
  assert.match(html, /data-listening-theme="food"/);
  assert.match(html, /data-listening-count="8"/);
  assert.match(html, /开始 8 题/);
  assert.match(html, /随机抽/);
  assert.match(html, /flashcards\/food\/apple\.jpg/);
  assert.doesNotMatch(html, /Try one now/);
});
