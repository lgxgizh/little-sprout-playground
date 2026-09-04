import test from "node:test";
import assert from "node:assert/strict";
import {
  createDemoVideos,
  normalizeVideoEntry,
} from "../src/video-comprehension.js";

test("video-comprehension shim re-exports animation demo GIF", () => {
  const demos = createDemoVideos("/");
  assert.equal(demos.length, 1);
  assert.match(demos[0].src, /fox-apple\.gif$/);
  const ok = normalizeVideoEntry({
    id: "ok",
    title: "OK",
    sourceType: "asset",
    src: "/assets/stories/clip.gif",
    questions: [
      {
        id: "q1",
        prompt: "Find the circle",
        speech: "Find the circle",
        answer: "circle",
        choices: [
          { label: "Circle", emoji: "🟢", value: "circle", color: "#9ed9c4" },
          { label: "Star", emoji: "⭐", value: "star", color: "#f7c94b" },
        ],
      },
    ],
  });
  assert.equal(ok.title, "OK");
});
