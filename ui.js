/**
 * penpot_stickers — ui.js (iframe context, no direct `penpot` access)
 *
 * Строит SVG стикера (цветная карточка + заголовок + текст) и отправляет его в plugin.js,
 * который вставляет через penpot.createShapeFromSvg() — заголовок и текст остаются
 * редактируемыми нативными текстовыми фигурами Penpot, а не растром.
 *
 * Цвета и пропорции сняты напрямую со скриншота референса.
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
const STICKER_HEIGHT = 160;
const STICKER_RADIUS = 12;
const STICKER_PADDING = 28;
const TITLE_FONT_SIZE = 20;
const TITLE_LINE_HEIGHT = 25;
const BODY_FONT_SIZE = 15;
const BODY_LINE_HEIGHT = 22;
const TITLE_BODY_GAP = 14;
const SHADOW_BLUR = 6;
const SHADOW_OFFSET_Y = 3;

function colorById(id) {
  return STICKER_COLORS.find((c) => c.id === id) || STICKER_COLORS[0];
}

function escapeXml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---------------------------------------------------------------------------
// Перенос текста по ширине (примерная оценка по числу символов на строку)
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

// ---------------------------------------------------------------------------
// Сборка SVG
// ---------------------------------------------------------------------------

function buildStickerSvg(options) {
  const opts = options || {};
  const color = colorById(opts.color);
  const title = opts.title || "";
  const text = opts.text || "";

  const titleLines = wrapText(title, maxCharsFor(TITLE_CHAR_W));
  const bodyLines = wrapText(text, maxCharsFor(BODY_CHAR_W));

  const titleBlockHeight = titleLines.length * TITLE_LINE_HEIGHT;
  const bodyBlockHeight = text ? bodyLines.length * BODY_LINE_HEIGHT : 0;

  const contentHeight =
    STICKER_PADDING + titleBlockHeight + (text ? TITLE_BODY_GAP + bodyBlockHeight : 0) + STICKER_PADDING;
  const height = Math.max(STICKER_HEIGHT, contentHeight);
  const width = STICKER_WIDTH;

  const titleX = STICKER_PADDING;
  let cursorY = STICKER_PADDING + TITLE_FONT_SIZE * 0.8;

  const titleTspans = titleLines
    .map((line, i) => `<tspan x="${titleX}" ${i === 0 ? `y="${cursorY.toFixed(1)}"` : `dy="${TITLE_LINE_HEIGHT}"`}>${escapeXml(line)}</tspan>`)
    .join("");
  const titleSvg =
    `<text font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="${TITLE_FONT_SIZE}" ` +
    `font-weight="700" fill="${STICKER_TEXT_COLOR}">${titleTspans}</text>`;

  let bodySvg = "";
  if (text) {
    cursorY = STICKER_PADDING + titleBlockHeight + TITLE_BODY_GAP + BODY_FONT_SIZE * 0.8;
    const bodyTspans = bodyLines
      .map((line, i) => `<tspan x="${titleX}" ${i === 0 ? `y="${cursorY.toFixed(1)}"` : `dy="${BODY_LINE_HEIGHT}"`}>${escapeXml(line)}</tspan>`)
      .join("");
    bodySvg =
      `<text font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="${BODY_FONT_SIZE}" ` +
      `font-weight="400" fill="${STICKER_TEXT_COLOR}">${bodyTspans}</text>`;
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${(height + SHADOW_BLUR * 2 + SHADOW_OFFSET_Y).toFixed(1)}" ` +
    `viewBox="0 0 ${width} ${(height + SHADOW_BLUR * 2 + SHADOW_OFFSET_Y).toFixed(1)}">` +
    `<defs><filter id="stickerShadow" x="-20%" y="-20%" width="140%" height="160%">` +
    `<feDropShadow dx="0" dy="${SHADOW_OFFSET_Y}" stdDeviation="${SHADOW_BLUR}" flood-color="#000000" flood-opacity="0.15"/>` +
    `</filter></defs>` +
    `<rect x="0" y="0" width="${width}" height="${height.toFixed(1)}" rx="${STICKER_RADIUS}" fill="${color.bg}" filter="url(#stickerShadow)"/>` +
    titleSvg +
    bodySvg +
    `</svg>`;

  return { svg, width, height: height + SHADOW_BLUR * 2 + SHADOW_OFFSET_Y };
}

// ---------------------------------------------------------------------------
// UI-обвязка (iframe, обычный DOM). Не выполняется в Node без document.
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
let currentSticker = null;

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

function recompute() {
  const title = els.titleInput.value.trim();
  const text = els.textInput.value.trim();
  currentSticker = buildStickerSvg({ color: selectedColor, title: title || "Sticker", text });
  els.preview.innerHTML = currentSticker.svg;
}

els.titleInput.addEventListener("input", recompute);
els.textInput.addEventListener("input", recompute);

els.addBtn.addEventListener("click", () => {
  if (!currentSticker) recompute();
  const title = els.titleInput.value.trim();
  setStatus("Добавляю стикер…", "loading");
  window.parent.postMessage(
    {
      type: "insert-sticker",
      svg: currentSticker.svg,
      width: currentSticker.width,
      height: currentSticker.height,
      title,
    },
    "*"
  );
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
    STICKER_COLORS, colorById, wrapText, buildStickerSvg,
    STICKER_WIDTH, STICKER_HEIGHT,
  };
}
