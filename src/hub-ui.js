/** Kid-facing home: only listening test and Animation Q&A. */

import { escapeHtml } from "./quiz-ui.js";
import {
  recommendedListeningCount,
  visibleListeningCounts,
} from "./wordbank.js";

export function homeHubMarkup({ childName = "Sunny", assetBase = "/" } = {}) {
  const base = assetBase.endsWith("/") ? assetBase : `${assetBase}/`;
  const listenPics = [
    "assets/flashcards/food/apple.jpg",
    "assets/flashcards/animals/cat.jpg",
    "assets/flashcards/animals/dog.jpg",
    "assets/flashcards/toys/ball.jpg",
  ];
  return `<section class="home-hub" id="featureHub">
    <div class="home-hub-hello">
      <p>嗨，${escapeHtml(childName)}</p>
      <h1>今天玩哪一个？</h1>
    </div>
    <div class="home-hub-grid">
      <article class="home-feature home-feature-listen" data-feature="listening">
        <div class="home-feature-pics">${listenPics
          .map((src) => `<img src="${escapeHtml(base + src)}" alt="" />`)
          .join("")}</div>
        <div>
          <h2>英语听力测试</h2>
          <p>听一句英文，点一张图。</p>
        </div>
        <button class="primary-btn feature-start" data-feature="listening" type="button"><span>开始</span><span class="arrow">→</span></button>
      </article>
      <article class="home-feature home-feature-video" data-feature="video">
        <div class="home-feature-pics home-feature-pics-wide">
          <img src="${escapeHtml(base)}assets/stories/fox-apple.gif" alt="" />
        </div>
        <div>
          <h2>动画提问</h2>
          <p>先看动画，再听问题、点图片。</p>
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
        <h1>动画提问</h1>
      </header>
      <p class="hub-empty">还没有可以看的动画。</p>
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
      <h1>动画提问</h1>
    </header>
    <div class="video-demo" id="videoDemo">
      <div class="video-demo-frame">${media}</div>
      <div class="video-demo-copy">
        <span class="eyebrow">DEMO · 小演示</span>
        <h2>${escapeHtml(demo.title || "Watch, then tap")}</h2>
        <p>先看这一段动画，再听问题、点图片。</p>
        <button class="primary-btn" id="startVideoDemo" type="button" data-animation="${escapeHtml(demo.id)}"><span>开始提问</span><span class="arrow">→</span></button>
        <small class="media-status">${escapeHtml(parentSummary)}</small>
      </div>
    </div>
    ${extra ? `<div class="video-hub-more"><h3>更多动画</h3><div class="media-grid">${extra}</div></div>` : ""}
  </section>`;
}

/**
 * Listening setup: pick a concrete 单词库 (full pack or theme pack), then 题量.
 * `banks` is preferred; legacy `themes` still works for older callers/tests.
 */
export function listeningHubMarkup({
  banks = null,
  selectedBankId = "",
  themes = [],
  selectedTheme = "all",
  counts = [5, 8, 10, 12],
  selectedCount = 8,
  available = 0,
  previews = [],
  activeBankLabel = "",
} = {}) {
  const useBanks = Array.isArray(banks) && banks.length > 0;
  const options = useBanks
    ? banks
    : themes.map((item) => ({
        id: item.id,
        label: item.label,
        count: item.count,
      }));
  const selectedId = useBanks
    ? selectedBankId || options[0]?.id || ""
    : selectedTheme || options[0]?.id || "all";
  const selected =
    options.find((item) => item.id === selectedId) || options[0] || null;
  const pool = selected?.count || available || 0;
  const visibleCounts = visibleListeningCounts(pool, counts);
  const nextCount = recommendedListeningCount(pool, selectedCount);
  const bankLabel = activeBankLabel || selected?.label || "";
  const bankDesc = selected?.description || "";
  const unit = selected?.question_type === "contrast" ? "题" : "词";
  const selectOptions = options
    .map((item) => {
      const selectedAttr = item.id === selected?.id ? " selected" : "";
      return `<option value="${escapeHtml(item.id)}"${selectedAttr}>${escapeHtml(item.label)}（${item.count}）</option>`;
    })
    .join("");
  const bankPicker = useBanks
    ? `<label class="listen-bank-select"><span class="vis-hidden">单词库</span><select id="listeningBankSelect">${selectOptions}</select></label>`
    : `<div class="chip-row bank-row">${options
        .map((item) => {
          const active = item.id === selected?.id ? "is-active" : "";
          return `<button class="chip ${active}" type="button" data-listening-theme="${escapeHtml(item.id)}">${escapeHtml(item.label)} <span class="chip-count">${item.count}</span></button>`;
        })
        .join("")}</div>`;
  const countButtons = visibleCounts
    .map((count) => {
      const active = count === nextCount ? "is-active" : "";
      return `<button class="chip ${active}" type="button" data-listening-count="${count}">${count} 题</button>`;
    })
    .join("");
  const preview = previews.length
    ? `<div class="listen-preview">${previews
        .map(
          (item) =>
            `<img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.lemma || "")}" />`,
        )
        .join("")}</div>`
    : "";
  return `<section class="listen-hub" id="listenHub">
    <header class="hub-bar">
      <button type="button" class="play-leave" id="backHome">← 返回</button>
      <h1>英语听力测试</h1>
    </header>
    <div class="listen-setup">
      <div class="listen-group">
        <h2>单词库</h2>
        <p class="listen-active">当前：${escapeHtml(bankLabel || "未选择")}${pool ? ` · ${pool} ${unit}` : ""}</p>
        ${bankPicker}
        ${bankDesc ? `<p class="listen-bank-desc">${escapeHtml(bankDesc)}</p>` : ""}
        ${preview}
      </div>
      <div class="listen-group">
        <h2>每次几题</h2>
        <div class="chip-row">${countButtons}</div>
        <p class="listen-note">一次 ${nextCount} 题，从「${escapeHtml(bankLabel || "单词库")}」里随机抽，这一轮不重复。</p>
      </div>
      <button class="primary-btn" id="startListening" type="button" ${pool ? "" : "disabled"}><span>开始 ${nextCount} 题</span><span class="arrow">→</span></button>
    </div>
  </section>`;
}
