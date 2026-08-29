/**
 * penpot_stickers — plugin.js (sandbox context)
 *
 * Единственное место с доступом к `penpot`. Принимает готовый SVG стикера от ui.js
 * и вставляет его через createShapeFromSvg — заголовок и текст остаются редактируемыми
 * текстовыми фигурами. Каждый следующий стикер в рамках одной сессии плагина смещается
 * по каскаду, чтобы не вставать точно поверх предыдущего.
 */

console.log("[Stickers] plugin.js loaded");

penpot.ui.open("Stickers", "index.html", { width: 360, height: 560 });

const CASCADE_STEP = 24;
const CASCADE_MAX = 6; // после 6 сдвигов — начинаем сначала (по кругу)
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

function insertSticker(msg) {
  const group = penpot.createShapeFromSvg(msg.svg);
  if (!group) {
    throw new Error("Penpot не смог создать фигуры из SVG (createShapeFromSvg вернул null).");
  }
  const anchor = nextAnchor(msg.width, msg.height);
  if (typeof group.x === "number") {
    group.x = anchor.x;
    group.y = anchor.y;
  }
  group.name = msg.title ? `Sticker — ${msg.title}` : "Sticker";
  return { id: group.id, x: anchor.x, y: anchor.y };
}

penpot.ui.onMessage((message) => {
  if (!message || message.type !== "insert-sticker") return;
  console.log("[Stickers] plugin.js received message:", message.type);
  try {
    const result = insertSticker(message);
    penpot.ui.sendMessage({ type: "insert-sticker-result", ok: true, ...result });
  } catch (err) {
    console.error("[Stickers] insert-sticker failed:", err);
    penpot.ui.sendMessage({ type: "insert-sticker-result", ok: false, message: String((err && err.message) || err) });
  }
});
