/** Testable parent model settings: local-first, remote advanced. */

import { escapeHtml } from "./quiz-ui.js";
import {
  MODEL_CAPABILITIES,
  catalogOptions,
  isAdapterModel,
  isOnDeviceOption,
  localCatalogOptions,
  modelCatalog,
  modelName,
  remoteCatalogOptions,
} from "./model-config.js";

function optionMarkup(item, selectedId) {
  return `<option value="${escapeHtml(item.id)}" ${
    selectedId === item.id ? "selected" : ""
  } title="${escapeHtml(item.name)} · ${escapeHtml(item.note || "")}">${escapeHtml(
    item.name,
  )} · ${escapeHtml(item.note || "")}</option>`;
}

function customFields(type, models, customModels) {
  const option = catalogOptions(type).find((item) => item.id === models[type]);
  if (option?.provider !== "custom") return "";
  const cfg = customModels[type] || {};
  const modelValue = cfg.model || option.remoteModel || "";
  return `<div class="custom-model-fields">
      <label><span>模型 ID</span><input data-custom-type="${type}" data-custom-field="model" value="${escapeHtml(modelValue)}" placeholder="例如 gpt-4o-mini 或 flux-schnell" /></label>
      <label><span>OpenAI 兼容接口</span><input data-custom-type="${type}" data-custom-field="baseUrl" value="${escapeHtml(cfg.baseUrl || "")}" placeholder="https://openrouter.ai/api/v1 ，可留空用 .env CUSTOM_API_BASE" /></label>
      ${
        type === "voice"
          ? `<label><span>音色 ID</span><input data-custom-type="${type}" data-custom-field="voiceId" value="${escapeHtml(cfg.voiceId || "")}" placeholder="alloy / nova / eve" /></label>`
          : ""
      }
    </div>`;
}

function localSelect(type, models) {
  const catalog = modelCatalog[type];
  const locals = localCatalogOptions(type);
  const current = models[type];
  const currentOption = catalogOptions(type).find(
    (item) => item.id === current,
  );
  const onDevice = isOnDeviceOption(currentOption);
  const extras =
    current && currentOption && !onDevice
      ? [
          {
            id: current,
            name: `远程 · ${currentOption.name}（见高级）`,
            note: currentOption.note || "",
          },
        ]
      : [];
  const options = [...locals, ...extras];
  return `<label class="model-setting">
    <span class="model-setting-label">
      <span class="model-setting-icon">${catalog?.icon || ""}</span>
      <span><b>${escapeHtml(catalog?.label || type)}</b><small>${escapeHtml(catalog?.hint || "")}</small></span>
    </span>
    <select data-model="${type}">${options.map((item) => optionMarkup(item, current)).join("")}</select>
  </label>`;
}

function remoteSelect(type, models) {
  const catalog = modelCatalog[type];
  const remotes = remoteCatalogOptions(type);
  if (!remotes.length) return "";
  const current = models[type];
  return `<label class="model-setting">
    <span class="model-setting-label">
      <span class="model-setting-icon">${catalog?.icon || ""}</span>
      <span><b>${escapeHtml(catalog?.label || type)}</b><small>${escapeHtml(catalog?.hint || "")}</small></span>
    </span>
    <select data-model="${type}">${remotes.map((item) => optionMarkup(item, current)).join("")}</select>
  </label>`;
}

function unwiredRemoteNote(type) {
  if (type === "vocab") {
    return `<p class="model-unwired-note">听力目前用本地词库随机抽题；远程选题暂不可用</p>`;
  }
  if (type === "image" || type === "video") {
    return `<p class="model-unwired-note">暂未接入孩子流程</p>`;
  }
  return "";
}

function remoteSelectMarked(type, models) {
  const markup = remoteSelect(type, models);
  if (!markup) return "";
  return `${markup}${unwiredRemoteNote(type)}`;
}

export function parentModelsMarkup({ models = {}, customModels = {} } = {}) {
  const primaryTypes = ["image", "voice", "vocab"];
  const anyRemote = MODEL_CAPABILITIES.some((type) =>
    isAdapterModel(type, models[type]),
  );
  const localPanel = primaryTypes
    .map((type) => localSelect(type, models))
    .join("");
  const vocabHonesty = `<p class="model-unwired-note" id="localVocabNote">听力目前用本地词库随机抽题；远程选题暂不可用</p>`;
  const animationNote = `<div class="model-setting model-local-note" id="localAnimationNote">
    <span class="model-setting-label">
      <span class="model-setting-icon">🎬</span>
      <span><b>动画提问</b><small>本地 GIF/图片问答。远程读片放在高级选项里。</small></span>
    </span>
  </div>`;
  const remoteOrder = ["image", "voice", "vocab", "video"];
  const remotePanel = remoteOrder
    .map((type) => remoteSelectMarked(type, models))
    .join("");
  const customs = MODEL_CAPABILITIES.map((type) =>
    customFields(type, models, customModels),
  ).join("");
  return `<p class="parent-lead">默认用本机。远程模型收进「高级」。xAI / OpenAI / Gemini 用对应密钥；FLUX、Qwen、DeepSeek 等走 OpenAI 兼容网关。也可以选「自定义」填任意模型 ID。</p>
    <div class="model-settings" id="localModelPanel">${localPanel}${vocabHonesty}${animationNote}</div>
    <details class="model-advanced" id="advancedModels"${anyRemote ? " open" : ""}>
      <summary>高级 / 远程模型</summary>
      <div class="model-settings">${remotePanel}</div>
    </details>
    ${customs}
    <div class="config-tip">当前语音：<b>${escapeHtml(modelName("voice", models))}</b> · 听力选题：本地词库 · 当前图片：<b>${escapeHtml(modelName("image", models))}</b></div>
    <div class="data-tools"><button class="small-action" id="exportData">导出学习档案</button><button class="small-action" id="importData">导入学习档案</button><input id="importFile" type="file" accept="application/json,.json" hidden /></div>`;
}
