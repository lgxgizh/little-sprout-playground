import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const path = join(root, name);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index < 1) continue;
      const key = trimmed.slice(0, index).trim();
      let value = trimmed.slice(index + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadEnv();

const PORT = Number(process.env.ADAPTER_PORT || 8787);
const KEYS = {
  xai: process.env.XAI_API_KEY || "",
  openai: process.env.OPENAI_API_KEY || "",
};

function providerOf(body = {}) {
  if (body.provider === "openai" || body.provider === "xai")
    return body.provider;
  const model = String(body.model || "");
  if (
    model.startsWith("gpt-") ||
    model.startsWith("tts-") ||
    model.startsWith("dall-e")
  )
    return "openai";
  return "xai";
}

function upstream(provider) {
  if (provider === "openai") {
    return {
      provider,
      base: "https://api.openai.com/v1",
      key: KEYS.openai,
      missing: "missing_openai_key",
    };
  }
  return {
    provider: "xai",
    base: "https://api.x.ai/v1",
    key: KEYS.xai,
    missing: "missing_xai_key",
  };
}

function send(response, status, body, headers = {}) {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  response.writeHead(status, {
    "content-type":
      typeof body === "string"
        ? "text/plain; charset=utf-8"
        : "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    ...headers,
  });
  response.end(payload);
}

function sendBinary(response, buffer, contentType) {
  response.writeHead(200, {
    "content-type": contentType,
    "access-control-allow-origin": "*",
    "content-length": buffer.length,
  });
  response.end(buffer);
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function providerJson(provider, path, body, timeoutMs = 20000) {
  const { base, key, missing } = upstream(provider);
  if (!key) throw new Error(missing);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${base}${path}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`${provider}_${response.status}:${detail.slice(0, 240)}`);
    }
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function parseJsonFromText(text) {
  const raw = String(text || "").trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function chatJson(provider, model, messages) {
  const response = await providerJson(provider, "/chat/completions", {
    model: model || (provider === "openai" ? "gpt-4o-mini" : "grok-4.6"),
    temperature: 0,
    messages,
  });
  const payload = await response.json();
  return parseJsonFromText(payload.choices?.[0]?.message?.content);
}

async function handleNextQuestion(body) {
  const candidates = Array.isArray(body.candidates) ? body.candidates : [];
  const ids = candidates.map((item) => item.id).filter(Boolean);
  if (!ids.length) return null;
  const provider = providerOf(body);
  const result = await chatJson(provider, body.model, [
    {
      role: "system",
      content:
        'You pick one preschool question. Reply with JSON only: {"questionId":"<id>"}. Choose only from the given ids.',
    },
    {
      role: "user",
      content: JSON.stringify({
        learningContext: body.learningContext,
        candidateIds: ids,
      }),
    },
  ]);
  const questionId = ids.includes(result?.questionId)
    ? result.questionId
    : ids[0];
  return { questionId };
}

async function handleSpeak(body, response) {
  const text = String(body.text || "").slice(0, 240);
  if (!text) return send(response, 400, { error: "missing_text" });
  const provider = providerOf(body);
  const voice = body.voiceId || (provider === "openai" ? "nova" : "eve");
  const payload =
    provider === "openai"
      ? {
          model: body.model || "tts-1",
          input: text,
          voice,
        }
      : {
          text,
          voice_id: voice,
          language: body.language || "en",
        };
  const path = provider === "openai" ? "/audio/speech" : "/tts";
  const upstreamResponse = await providerJson(provider, path, payload);
  const buffer = Buffer.from(await upstreamResponse.arrayBuffer());
  sendBinary(
    response,
    buffer,
    upstreamResponse.headers.get("content-type") || "audio/mpeg",
  );
}

async function handleImage(body) {
  const prompt = String(body.prompt || "").slice(0, 500);
  if (!prompt) return null;
  const provider = providerOf(body);
  const payload =
    provider === "openai"
      ? {
          model: body.model || "gpt-image-1",
          prompt,
          n: 1,
          size: "1024x1024",
        }
      : {
          model: body.model || "grok-imagine-image-2.0",
          prompt,
          n: 1,
          aspect_ratio: "1:1",
        };
  const upstreamResponse = await providerJson(
    provider,
    "/images/generations",
    payload,
    30000,
  );
  const result = await upstreamResponse.json();
  const imageUrl = result.data?.[0]?.url;
  const b64 = result.data?.[0]?.b64_json;
  if (imageUrl) return { imageUrl };
  if (b64) return { imageUrl: `data:image/png;base64,${b64}` };
  return null;
}

async function mediaToDataUrl(url) {
  if (!url) return null;
  if (url.startsWith("data:")) return url;
  const local = url.match(/assets\/.+$/);
  if (local) {
    const filePath = join(root, "public", local[0].replace(/\\/g, "/"));
    if (existsSync(filePath)) {
      const buffer = readFileSync(filePath);
      const mime = filePath.endsWith(".png") ? "image/png" : "image/jpeg";
      return `data:${mime};base64,${buffer.toString("base64")}`;
    }
  }
  const response = await fetch(url);
  if (!response.ok) return null;
  const mime = response.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await response.arrayBuffer());
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

async function handleVideoAnalyze(body) {
  const media = body.media || {};
  const dataUrl = await mediaToDataUrl(media.url);
  const messages = [
    {
      role: "system",
      content:
        'You describe a preschool picture or short clip. Reply JSON only: {"title":"...","summary":"...","prompt":"..."}. Use simple English, at most 3 short sentences, no names, no scores.',
    },
  ];
  if (dataUrl) {
    messages.push({
      role: "user",
      content: [
        { type: "image_url", image_url: { url: dataUrl } },
        {
          type: "text",
          text: `Please look at this ${media.type || "image"} for a 3-year-old English game.`,
        },
      ],
    });
  } else {
    messages.push({
      role: "user",
      content: `Describe this preschool media titled ${media.title || media.id || "story"}.`,
    });
  }
  const result = await chatJson(providerOf(body), body.model, messages);
  if (!result?.summary) return null;
  return {
    title: String(result.title || media.title || "Picture story").slice(0, 80),
    summary: String(result.summary).slice(0, 400),
    prompt: String(result.prompt || "").slice(0, 160),
  };
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    send(response, 204, "");
    return;
  }
  if (request.method !== "POST") {
    send(response, 404, { error: "not_found" });
    return;
  }
  try {
    const body = await readJson(request);
    const url = request.url.split("?")[0];
    if (url === "/learning/next-question") {
      const result = await handleNextQuestion(body);
      return send(
        response,
        result ? 200 : 502,
        result || { error: "no_question" },
      );
    }
    if (url === "/learning/speak") {
      return handleSpeak(body, response);
    }
    if (url === "/learning/image") {
      const result = await handleImage(body);
      return send(
        response,
        result ? 200 : 502,
        result || { error: "no_image" },
      );
    }
    if (url === "/learning/video-analyze") {
      const result = await handleVideoAnalyze(body);
      return send(
        response,
        result ? 200 : 502,
        result || { error: "no_summary" },
      );
    }
    send(response, 404, { error: "not_found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "adapter_failed";
    if (message === "missing_xai_key" || message === "missing_openai_key") {
      send(response, 503, {
        error: message,
        hint:
          message === "missing_openai_key"
            ? "Set OPENAI_API_KEY in .env, then restart npm run adapter."
            : "Set XAI_API_KEY in .env, then restart npm run adapter. SuperGrok does not include API credits.",
      });
      return;
    }
    send(response, 502, { error: message });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  const keyState = [
    KEYS.xai ? "XAI_API_KEY ready" : "XAI_API_KEY missing",
    KEYS.openai ? "OPENAI_API_KEY ready" : "OPENAI_API_KEY optional",
  ].join(", ");
  console.log(
    `Little Sprout adapter on http://127.0.0.1:${PORT} (${keyState})`,
  );
});
