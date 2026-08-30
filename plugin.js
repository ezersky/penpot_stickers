/**
 * Stickers — plugin.js (sandbox context)
 *
 * ВАЖНО (fix после реального теста в Penpot): раньше стикер собирался как SVG и
 * вставлялся через createShapeFromSvg. Оказалось: (а) заливка фона не применялась —
 * похоже, `filter="url(#...)"` в SVG ломал парсинг всего <rect>, включая fill;
 * (б) текст превращался в кривые — Penpot исторически плохо импортирует <text> из SVG,
 * это давно известное и незакрытое ограничение самого Penpot, не баг генерации SVG.
 *
 * Теперь фигуры создаются НАПРЯМУЮ через нативный API: penpot.createRectangle() для фона
 * и penpot.createText() для заголовка/текста — это гарантированно редактируемые нативные
 * фигуры Penpot, никакого SVG-импорта в этом плагине больше нет.
 */

console.log("[Stickers] plugin.js loaded");

penpot.ui.open("Stickers", "index.html", { width: 360, height: 560 });

const CASCADE_STEP = 24;
const CASCADE_MAX = 6;
let insertCount = 0;

function nextAnchor(width, height) {
  let base = { x: 0, y: 0 };
  try {
    const vp = penpot.viewport;
    if (vp && vp.center) {
      base = { x: vp.center.x - width / 2, y: vp.center.y - height / 2 };
    }
  } catch (e) {
    // используем (0,0), если viewport недоступен
  }
  const cascadeIndex = insertCount % CASCADE_MAX;
  insertCount += 1;
  return { x: base.x + cascadeIndex * CASCADE_STEP, y: base.y + cascadeIndex * CASCADE_STEP };
}

function createBackground(plan, anchor) {
  const rect = penpot.createRectangle();
  rect.name = "Sticker background";
  rect.x = anchor.x;
  rect.y = anchor.y;
  rect.resize(plan.width, plan.height);
  rect.fills = [{ fillColor: plan.bg, fillOpacity: 1 }];
  rect.borderRadius = plan.radius;
  return rect;
}

function createTitleText(plan, anchor) {
  const text = penpot.createText(plan.title);
  text.x = anchor.x + plan.padding;
  text.y = anchor.y + plan.padding;
  text.fontFamily = plan.fontFamily;
  text.fontSize = String(plan.titleFontSize);
  text.fontWeight = "700";
  text.fills = [{ fillColor: plan.textColor, fillOpacity: 1 }];
  text.growType = "auto-height";
  text.resize(plan.width - plan.padding * 2, plan.titleFontSize * 1.4);
  return text;
}

function createBodyText(plan, anchor, titleHeight) {
  if (!plan.text) return null;
  const text = penpot.createText(plan.text);
  text.x = anchor.x + plan.padding;
  text.y = anchor.y + plan.padding + titleHeight + plan.titleBodyGap;
  text.fontFamily = plan.fontFamily;
  text.fontSize = String(plan.bodyFontSize);
  text.fontWeight = "400";
  text.fills = [{ fillColor: plan.textColor, fillOpacity: 1 }];
  text.growType = "auto-height";
  text.resize(plan.width - plan.padding * 2, plan.bodyFontSize * 1.4);
  return text;
}

function insertSticker(plan) {
  const anchor = nextAnchor(plan.width, plan.height);

  const background = createBackground(plan, anchor);
  const titleText = createTitleText(plan, anchor);
  // высота заголовка после auto-height недоступна синхронно во всех окружениях одинаково
  // надёжно, поэтому используем ту же оценку (titleFontSize*1.4), что и при resize() —
  // это тот же источник истины, что и сама фигура заголовка.
  const titleHeight = plan.titleFontSize * 1.4;
  const bodyText = createBodyText(plan, anchor, titleHeight);

  const shapes = [background, titleText];
  if (bodyText) shapes.push(bodyText);

  const group = penpot.group(shapes);
  if (!group) {
    throw new Error("Не удалось сгруппировать фигуры стикера (penpot.group вернул null).");
  }
  group.name = plan.title ? `Sticker — ${plan.title}` : "Sticker";

  return { id: group.id, x: anchor.x, y: anchor.y };
}

penpot.ui.onMessage((message) => {
  if (!message || message.type !== "insert-sticker") return;
  console.log("[Stickers] plugin.js received message:", message.type);
  try {
    const result = insertSticker(message.plan);
    penpot.ui.sendMessage({ type: "insert-sticker-result", ok: true, ...result });
  } catch (err) {
    console.error("[Stickers] insert-sticker failed:", err);
    penpot.ui.sendMessage({ type: "insert-sticker-result", ok: false, message: String((err && err.message) || err) });
  }
});
