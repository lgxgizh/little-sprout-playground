import test from "node:test";
import assert from "node:assert/strict";
import { defaultModels } from "../src/model-config.js";
import { parentModelsMarkup } from "../src/parent-ui.js";

test("parent models keep local catalogs on the primary panel", () => {
  const html = parentModelsMarkup({
    models: defaultModels(),
    customModels: {},
  });
  assert.match(html, /id="localModelPanel"/);
  assert.match(html, /高级 \/ 远程模型/);
  assert.match(html, /id="advancedModels"/);
  assert.match(html, /本地 GIF\/图片问答/);
  assert.match(html, /导出学习档案/);
  const primary = html.split('id="advancedModels"')[0];
  assert.match(primary, /浏览器语音/);
  assert.match(primary, /本地自适应/);
  assert.doesNotMatch(primary, /Grok Imagine/);
  assert.doesNotMatch(primary, /Grok 4\.6/);
  assert.doesNotMatch(primary, /Grok TTS/);
  assert.doesNotMatch(primary, /data-model="video"/);
  assert.doesNotMatch(primary, /视频理解/);
  assert.match(html, /动画提问/);
});

test("a remote selection stays visible on the primary select", () => {
  const html = parentModelsMarkup({
    models: {
      ...defaultModels(),
      image: "grok-imagine-image",
    },
    customModels: {},
  });
  assert.match(html, /远程 · Grok Imagine 2\.0（见高级）/);
  assert.match(
    html,
    /<details class="model-advanced" id="advancedModels" open>/,
  );
  const advanced = html.split('id="advancedModels"')[1];
  assert.match(advanced, /Grok Imagine 2\.0/);
  assert.match(advanced, /data-model="video"/);
  assert.match(advanced, /动画提问/);
});

test("parent UI states remote vocab does not drive listening", () => {
  const html = parentModelsMarkup({
    models: defaultModels(),
    customModels: {},
  });
  assert.match(html, /听力目前用本地词库随机抽题；远程选题暂不可用/);
  const advanced = html.split('id="advancedModels"')[1] || "";
  assert.match(advanced, /暂未接入孩子流程/);
});
