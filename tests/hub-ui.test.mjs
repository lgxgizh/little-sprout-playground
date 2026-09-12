import test from "node:test";
import assert from "node:assert/strict";
import { homeHubMarkup, videoHubMarkup } from "../src/hub-ui.js";

test("kid home only offers listening and video Q&A", () => {
  const html = homeHubMarkup({ childName: "小米" });
  assert.match(html, /小米/);
  assert.match(html, /英语听力测试/);
  assert.match(html, /看视频提问/);
  assert.match(html, /data-feature="listening"/);
  assert.match(html, /data-feature="video"/);
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
  assert.match(html, /开始提问/);
  assert.match(html, /fox-apple\.gif/);
  assert.match(html, /id="startVideoDemo"/);
  assert.match(html, /My clip/);
  assert.doesNotMatch(html, /英语听力测试/);
  assert.doesNotMatch(html, /Which one is the apple/);
});
