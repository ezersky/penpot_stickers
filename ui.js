/**
 * Stickers — ui.js (iframe context, no direct `penpot` access)
 *
 * ВАЖНО (fix после реального теста в Penpot): раньше стикер собирался как один SVG и
 * вставлялся через createShapeFromSvg — из-за этого (а) заливка фона не применялась
 * (похоже, `filter="url(#...)"` в SVG ломал парсинг всего <rect>, включая fill) и
 * (б) текст превращался в кривые — Penpot исторически плохо импортирует <text> из SVG.
 * Теперь ui.js только считает раскладку (палитра, оценка высоты карточки под текст),
 * а сами фигуры создаёт plugin.js напрямую: penpot.createRectangle() + penpot.createText() —
 * это гарантированно редактируемые нативные фигуры, никакого SVG.
 */

const STICKER_COLORS = [
  { id: "yellow", label: "Yellow", bg: "#FFF7C2" },
  { id: "red", label: "Red", bg: "#FFD9D2" },
  { id: "green", label: "Green", bg: "#E2F0BD" },
  { id: "blue", label: "Blue", bg: "#E0E9FF" },
  { id: "gray", label: "Gray", bg: "#F0F0F3" },
  { id: "purple", label: "Purple", bg: "#F2E2FC" },
];

const STICKER_TEXT_COLOR = "#202020";
const STICKER_WIDTH = 340;
const STICKER_MIN_HEIGHT = 160;
const STICKER_RADIUS = 12;
const STICKER_PADDING = 28;
const TITLE_FONT_SIZE = 20;
const TITLE_LINE_HEIGHT = 25;
const BODY_FONT_SIZE = 15;
const BODY_LINE_HEIGHT = 22;
const TITLE_BODY_GAP = 14;
const DEFAULT_FONT_FAMILY = "Work Sans";

function colorById(id) {
  return STICKER_COLORS.find((c) => c.id === id) || STICKER_COLORS[0];
}

// ---------------------------------------------------------------------------
// Перенос текста — используется только для ОЦЕНКИ высоты карточки-фона.
// Сам текст на холсте переносит нативный текстовый движок Penpot (fixed width,
// growType: 'auto-height') — точнее любой оценки по числу символов.
// ---------------------------------------------------------------------------

function wrapText(text, maxChars) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  words.forEach((w) => {
    const candidate = (current + " " + w).trim();
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = w;
    } else {
      current = candidate;
    }
  });
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

const TITLE_CHAR_W = TITLE_FONT_SIZE * 0.58;
const BODY_CHAR_W = BODY_FONT_SIZE * 0.52;

function maxCharsFor(charWidth) {
  const usableWidth = STICKER_WIDTH - STICKER_PADDING * 2;
  return Math.max(Math.floor(usableWidth / charWidth), 4);
}

function computeCardHeight(title, text) {
  const titleLines = wrapText(title || "Sticker", maxCharsFor(TITLE_CHAR_W));
  const bodyLines = text ? wrapText(text, maxCharsFor(BODY_CHAR_W)) : [];

  const titleBlockHeight = titleLines.length * TITLE_LINE_HEIGHT;
  const bodyBlockHeight = bodyLines.length * BODY_LINE_HEIGHT;

  const contentHeight =
    STICKER_PADDING + titleBlockHeight + (text ? TITLE_BODY_GAP + bodyBlockHeight : 0) + STICKER_PADDING;

  return Math.max(STICKER_MIN_HEIGHT, contentHeight);
}

// ---------------------------------------------------------------------------
// План стикера, отправляемый в plugin.js — никакого SVG, только данные для
// penpot.createRectangle() / penpot.createText().
// ---------------------------------------------------------------------------

function buildStickerPlan(options) {
  const opts = options || {};
  const color = colorById(opts.color);
  const title = (opts.title || "Sticker").trim() || "Sticker";
  const text = (opts.text || "").trim();
  const height = computeCardHeight(title, text);

  return {
    color: color.id,
    bg: color.bg,
    textColor: STICKER_TEXT_COLOR,
    title,
    text,
    width: STICKER_WIDTH,
    height,
    radius: STICKER_RADIUS,
    padding: STICKER_PADDING,
    titleFontSize: TITLE_FONT_SIZE,
    bodyFontSize: BODY_FONT_SIZE,
    titleBodyGap: TITLE_BODY_GAP,
    fontFamily: DEFAULT_FONT_FAMILY,
  };
}


// ---------------------------------------------------------------------------
// UI-обвязка (iframe, обычный DOM). Не выполняется в Node без document.
// Превью теперь HTML/CSS, а не SVG — точнее отражает перенос текста реальным браузерным
// движком и не зависит от createShapeFromSvg, который тут больше не используется вовсе.
// ---------------------------------------------------------------------------
if (typeof document !== "undefined") {

console.log("[Stickers] ui.js loaded");

const els = {
  swatches: document.getElementById("color-swatches"),
  titleInput: document.getElementById("title-input"),
  textInput: document.getElementById("text-input"),
  status: document.getElementById("status"),
  statusText: document.getElementById("status-text"),
  preview: document.getElementById("preview"),
  addBtn: document.getElementById("add-btn"),
};

let selectedColor = STICKER_COLORS[0].id;
let currentPlan = null;

function setStatus(text, mode) {
  els.statusText.textContent = text;
  els.status.classList.toggle("is-loading", mode === "loading");
  els.status.classList.toggle("is-success", mode === "success");
  els.status.classList.toggle("is-error", mode === "error");
}

function renderSwatches() {
  els.swatches.innerHTML = "";
  STICKER_COLORS.forEach((c) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "color-swatch";
    btn.classList.toggle("is-selected", c.id === selectedColor);
    btn.style.background = c.bg;
    btn.title = c.label;
    btn.addEventListener("click", () => {
      selectedColor = c.id;
      renderSwatches();
      recompute();
    });
    els.swatches.appendChild(btn);
  });
}

function renderPreview(plan) {
  els.preview.innerHTML = "";

  const card = document.createElement("div");
  card.className = "sticker-preview-card";
  card.style.background = plan.bg;
  card.style.color = plan.textColor;
  card.style.borderRadius = plan.radius + "px";
  card.style.padding = plan.padding + "px";
  card.style.width = plan.width + "px";
  card.style.minHeight = plan.height + "px";

  const title = document.createElement("div");
  title.className = "sticker-preview-title";
  title.style.fontSize = plan.titleFontSize + "px";
  title.textContent = plan.title;
  card.appendChild(title);

  if (plan.text) {
    const body = document.createElement("div");
    body.className = "sticker-preview-body";
    body.style.fontSize = plan.bodyFontSize + "px";
    body.style.marginTop = plan.titleBodyGap + "px";
    body.textContent = plan.text;
    card.appendChild(body);
  }

  els.preview.appendChild(card);
}

function recompute() {
  currentPlan = buildStickerPlan({
    color: selectedColor,
    title: els.titleInput.value,
    text: els.textInput.value,
  });
  renderPreview(currentPlan);
}

els.titleInput.addEventListener("input", recompute);
els.textInput.addEventListener("input", recompute);

els.addBtn.addEventListener("click", () => {
  if (!currentPlan) recompute();
  setStatus("Добавляю стикер…", "loading");
  window.parent.postMessage({ type: "insert-sticker", plan: currentPlan }, "*");
});

window.addEventListener("message", (event) => {
  const msg = event.data;
  if (!msg || msg.type !== "insert-sticker-result") return;
  if (msg.ok) {
    setStatus("Стикер добавлен на холст.", "success");
  } else {
    setStatus("Не удалось добавить стикер: " + msg.message, "error");
  }
});

renderSwatches();
recompute();

} // end DOM guard

if (typeof module !== "undefined") {
  module.exports = {
    STICKER_COLORS, colorById, wrapText, computeCardHeight, buildStickerPlan,
    STICKER_WIDTH, STICKER_MIN_HEIGHT,
  };
}
