/** Kid-facing home: only listening test and video Q&A. */

import { escapeHtml } from "./quiz-ui.js";

export function homeHubMarkup({ childName = "Sunny" } = {}) {
  return `<section class="home-hub" id="featureHub">
    <div class="home-hub-hello">
      <p>嗨，${escapeHtml(childName)}</p>
      <h1>今天玩哪一个？</h1>
    </div>
    <div class="home-hub-grid">
      <article class="home-feature home-feature-listen" data-feature="listening">
        <span class="home-feature-icon">🎧</span>
        <div>
          <h2>英语听力测试</h2>
          <p>听一句英文，点一张图。</p>
        </div>
        <button class="primary-btn feature-start" data-feature="listening" type="button"><span>开始</span><span class="arrow">→</span></button>
      </article>
      <article class="home-feature home-feature-video" data-feature="video">
        <span class="home-feature-icon">🎬</span>
        <div>
          <h2>看视频提问</h2>
          <p>先看短片，再听问题、点图片。</p>
        </div>
        <button class="primary-btn feature-start" data-feature="video" type="button"><span>开始</span><span class="arrow">→</span></button>
      </article>
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
        <button type="button" class="play-leave" id="backHome">← 返回</button>
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
        `<article class="media-card"><div class="media-thumb">${item.poster ? `<img src="${escapeHtml(item.poster)}" alt=""/>` : `<span class="media-empty-icon">🎞️</span>`}<span class="media-duration">${escapeHtml(item.durationLabel || "")}</span></div><div class="media-card-copy"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description || "")}</p><button class="media-play" data-animation="${escapeHtml(item.id)}" type="button">▶ Watch &amp; answer</button></div></article>`,
    )
    .join("");
  return `<section class="video-hub" id="videoHub">
    <header class="hub-bar">
      <button type="button" class="play-leave" id="backHome">← 返回</button>
      <h1>看视频提问</h1>
    </header>
    <div class="video-demo" id="videoDemo">
      <div class="video-demo-frame">${media}</div>
      <div class="video-demo-copy">
        <span class="eyebrow">DEMO · 小演示</span>
        <h2>${escapeHtml(demo.title || "Watch, then tap")}</h2>
        <p>先看这一段短片，再听问题、点图片。</p>
        <button class="primary-btn" id="startVideoDemo" type="button" data-animation="${escapeHtml(demo.id)}"><span>开始提问</span><span class="arrow">→</span></button>
        <small class="media-status">${escapeHtml(parentSummary)}</small>
      </div>
    </div>
    ${extra ? `<div class="video-hub-more"><h3>More clips</h3><div class="media-grid">${extra}</div></div>` : ""}
  </section>`;
}
