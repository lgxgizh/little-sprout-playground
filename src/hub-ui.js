/** Kid-facing home: only listening test and video Q&A. */

import { escapeHtml } from "./quiz-ui.js";

export function homeHubMarkup({ childName = "Sunny" } = {}) {
  return `<section class="home-hub" id="featureHub">
    <div class="home-hub-hello">
      <p>${escapeHtml(childName)}</p>
      <h1>选一个开始</h1>
    </div>
    <div class="home-hub-grid">
      <button class="home-feature" data-feature="listening" type="button">
        <h2>英语听力测试</h2>
        <p>听一句英文，点一张图</p>
      </button>
      <button class="home-feature" data-feature="video" type="button">
        <h2>看视频提问</h2>
        <p>先看短片，再点图片</p>
      </button>
    </div>
  </section>`;
}

export function videoHubMarkup({
  demo,
  others = [],
  parentSummary = "Picture answers after watching",
} = {}) {
  if (!demo) {
    return `<section class="video-hub" id="videoHub">
      <header class="hub-bar">
        <button type="button" class="text-btn" id="backHome">返回</button>
        <h1>看视频提问</h1>
      </header>
      <p class="hub-empty">还没有可以看的短片。</p>
    </section>`;
  }
  const isImage =
    demo.mediaType === "image" ||
    /\.(gif|png|webp|jpe?g)(\?|$)/i.test(demo.src || "");
  const media = isImage
    ? `<img class="video-demo-media" src="${escapeHtml(demo.src)}" alt="${escapeHtml(demo.title || "Demo")}" />`
    : `<video class="video-demo-media" src="${escapeHtml(demo.src)}" poster="${escapeHtml(demo.poster || "")}" controls playsinline></video>`;
  const extra = others
    .map(
      (item) =>
        `<button class="video-more-item" data-animation="${escapeHtml(item.id)}" type="button">${escapeHtml(item.title)}</button>`,
    )
    .join("");
  return `<section class="video-hub" id="videoHub">
    <header class="hub-bar">
      <button type="button" class="text-btn" id="backHome">返回</button>
      <h1>看视频提问</h1>
    </header>
    <div class="video-demo" id="videoDemo">
      <div class="video-demo-frame">${media}</div>
      <div class="video-demo-copy">
        <h2>${escapeHtml(demo.title || "短片")}</h2>
        <p>看完短片，再点图片</p>
        <button class="primary-btn" id="startVideoDemo" type="button" data-animation="${escapeHtml(demo.id)}">开始提问</button>
      </div>
    </div>
    ${extra ? `<div class="video-hub-more">${extra}</div>` : ""}
  </section>`;
}

export function listeningHubMarkup({
  themes = [],
  selectedTheme = "all",
  counts = [5, 8, 10, 12],
  selectedCount = 8,
  available = 0,
} = {}) {
  const theme = themes.find((item) => item.id === selectedTheme) || themes[0];
  const pool = theme?.count || available || 0;
  const nextCount = Math.max(1, Math.min(selectedCount, pool || selectedCount));
  const themeButtons = themes
    .map((item) => {
      const active = item.id === selectedTheme ? "is-active" : "";
      return `<button class="chip ${active}" type="button" data-listening-theme="${escapeHtml(item.id)}">${escapeHtml(item.label)} ${item.count}</button>`;
    })
    .join("");
  const countButtons = counts
    .map((count) => {
      const disabled = pool > 0 && count > pool;
      const active = count === selectedCount ? "is-active" : "";
      return `<button class="chip ${active}" type="button" data-listening-count="${count}" ${disabled ? "disabled" : ""}>${count} 题</button>`;
    })
    .join("");
  return `<section class="listen-hub" id="listenHub">
    <header class="hub-bar">
      <button type="button" class="text-btn" id="backHome">返回</button>
      <h1>英语听力测试</h1>
    </header>
    <div class="listen-setup">
      <div class="listen-group">
        <h2>词库</h2>
        <div class="chip-row">${themeButtons}</div>
      </div>
      <div class="listen-group">
        <h2>每次几题</h2>
        <div class="chip-row">${countButtons}</div>
        <p class="listen-note">一次 ${nextCount} 题。词库里有 ${pool} 个词，不会在这一轮里重复。</p>
      </div>
      <button class="primary-btn" id="startListening" type="button" ${pool ? "" : "disabled"}>开始 ${nextCount} 题</button>
    </div>
  </section>`;
}
