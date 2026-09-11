export const MODEL_STORAGE_KEY = "little-sprout-models";
export const MODEL_CAPABILITIES = ["image", "voice", "vocab", "video"];

export function hasRemoteAdapter() {
  return Boolean(
    (typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_API_BASE_URL?.replace(/\/$/, "")) ||
    "",
  );
}

const MODEL_ALIASES = {
  "gpt-image-1": "local-image",
  "flux-schnell": "grok-imagine-image",
  "gpt-4o-mini-tts": "grok-tts",
  "gpt-4o-mini": "grok-4.6",
};

function localOption(id, name, note) {
  return { id, name, note, mode: "local" };
}

function adapterOption(id, name, note, provider, remoteModel, extra = {}) {
  return {
    id,
    name,
    note,
    mode: "adapter",
    provider,
    remoteModel,
    ...extra,
  };
}

export const modelCatalog = {
  image: {
    label: "图片",
    icon: "🖼️",
    hint: "题目插画。远程模型只根据已审核英文提示生成，不上传孩子照片。SuperGrok 会员不能代替 API。",
    defaultId: "local-image",
    options: [
      localOption("local-image", "本地图片 / 表情", "无需接口 · 默认"),
      adapterOption(
        "grok-imagine-image",
        "Grok Imagine 2.0",
        "xAI · 儿童插画",
        "xai",
        "grok-imagine-image-2.0",
      ),
      adapterOption(
        "grok-imagine-fast",
        "Grok Imagine Fast",
        "xAI · 更快更便宜",
        "xai",
        "grok-imagine-image",
      ),
      adapterOption(
        "openai-gpt-image",
        "GPT Image 1",
        "OpenAI · 可选",
        "openai",
        "gpt-image-1",
      ),
      adapterOption(
        "openai-dall-e-3",
        "DALL·E 3",
        "OpenAI · 可选",
        "openai",
        "dall-e-3",
      ),
    ],
  },
  voice: {
    label: "语音",
    icon: "🔊",
    hint: "朗读题目和鼓励语。跟读默认仍在浏览器本地完成。",
    defaultId: "browser-speech",
    options: [
      {
        id: "browser-speech",
        name: "浏览器语音",
        note: "无需密钥 · 默认",
        mode: "browser",
      },
      localOption(
        "local-audio",
        "本地音频",
        "播放 public/assets/audio 中的英语文件",
      ),
      adapterOption(
        "grok-tts",
        "Grok TTS · Eve",
        "xAI · 默认英语声",
        "xai",
        "grok-tts",
        {
          voiceId: "eve",
        },
      ),
      adapterOption(
        "grok-tts-ara",
        "Grok TTS · Ara",
        "xAI · 更轻快",
        "xai",
        "grok-tts",
        {
          voiceId: "ara",
        },
      ),
      adapterOption(
        "grok-tts-luna",
        "Grok TTS · Luna",
        "xAI · 教育向",
        "xai",
        "grok-tts",
        { voiceId: "luna" },
      ),
      adapterOption(
        "openai-tts-1",
        "OpenAI TTS",
        "OpenAI · 可选",
        "openai",
        "tts-1",
        { voiceId: "nova" },
      ),
      adapterOption(
        "openai-tts-hd",
        "OpenAI TTS HD",
        "OpenAI · 更高音质",
        "openai",
        "tts-1-hd",
        { voiceId: "nova" },
      ),
    ],
  },
  vocab: {
    label: "题目规划",
    icon: "🧩",
    hint: "只从已审核候选题里选题，不让模型现场编题。",
    defaultId: "adaptive-picture",
    options: [
      localOption("adaptive-picture", "本地自适应", "根据最近作答调整 · 默认"),
      localOption("local-question-bank", "本地题库", "按顺序使用已审核题目"),
      adapterOption(
        "grok-4.6",
        "Grok 4.6",
        "xAI · 旗舰选题",
        "xai",
        "grok-4.6",
      ),
      adapterOption("grok-4.5", "Grok 4.5", "xAI · 更快", "xai", "grok-4.5"),
      adapterOption("grok-4.3", "Grok 4.3", "xAI · 更便宜", "xai", "grok-4.3"),
      adapterOption(
        "grok-4.1-fast",
        "Grok 4.1 Fast",
        "xAI · 低延迟",
        "xai",
        "grok-4.1-fast",
      ),
      adapterOption(
        "openai-gpt-4o-mini",
        "GPT-4o mini",
        "OpenAI · 可选",
        "openai",
        "gpt-4o-mini",
      ),
      adapterOption(
        "openai-gpt-4o",
        "GPT-4o",
        "OpenAI · 可选",
        "openai",
        "gpt-4o",
      ),
    ],
  },
  video: {
    label: "视频理解",
    icon: "🎬",
    hint: "只分析故事架上的本地短片，不开启摄像头。SuperGrok 会员不能把 grok.com 的额度接到这里。",
    defaultId: "local-video",
    options: [
      localOption("local-video", "本地播放", "只播放，不做分析 · 默认"),
      adapterOption(
        "grok-4.6-vision",
        "Grok 4.6 看一看",
        "xAI · 旗舰理解",
        "xai",
        "grok-4.6",
      ),
      adapterOption(
        "grok-4.5-vision",
        "Grok 4.5 看一看",
        "xAI · 更快",
        "xai",
        "grok-4.5",
      ),
      adapterOption(
        "grok-4.3-vision",
        "Grok 4.3 看一看",
        "xAI · 更便宜",
        "xai",
        "grok-4.3",
      ),
      adapterOption(
        "openai-gpt-4o-vision",
        "GPT-4o 看一看",
        "OpenAI · 可选",
        "openai",
        "gpt-4o",
      ),
    ],
  },
};

export function catalogOptions(type) {
  return modelCatalog[type]?.options || [];
}

export function modelOption(type, id) {
  return catalogOptions(type).find((item) => item.id === id) || null;
}

export function modelName(type, models) {
  return modelOption(type, models?.[type])?.name || models?.[type] || "";
}

export function isAdapterModel(type, id) {
  return modelOption(type, id)?.mode === "adapter";
}

export function defaultModels() {
  return Object.fromEntries(
    MODEL_CAPABILITIES.map((type) => [type, modelCatalog[type].defaultId]),
  );
}

export function resolveModels(saved = {}) {
  const resolved = defaultModels();
  for (const type of MODEL_CAPABILITIES) {
    const raw = typeof saved[type] === "string" ? saved[type] : "";
    const mapped = MODEL_ALIASES[raw] || raw;
    if (modelOption(type, mapped)) resolved[type] = mapped;
  }
  return resolved;
}

export function imagePromptFor(question) {
  const prompt = String(question?.speech || question?.prompt || "").trim();
  if (!prompt) return "";
  return `Preschool picture book illustration, warm, simple, no text, no logos, no photorealistic children. Scene: ${prompt}`;
}
