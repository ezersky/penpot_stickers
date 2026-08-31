/**
 * Stickers — plugin.js (sandbox context)
 *
 * v6: Простая версия для проверки загрузки
 */

console.log("[Stickers] plugin.js loaded - VERSION 2026-08-31-11-05 SIMPLE");

penpot.ui.open("Stickers", "index.html", { width: 360, height: 560 });

const CASCADE_STEP = 24;
const CASCADE_MAX = 6;
let insertCount = 0;

function nextAnchor(width) {
  let base = { x: 0, y: 0 };
  try {
    const vp = penpot.viewport;
    if (vp && vp.center) {
      base = { x: vp.center.x - width / 2, y: vp.center.y - 100 };
    }
  } catch (e) {
    // используем (0,0), если viewport недоступен
  }
  const cascadeIndex = insertCount % CASCADE_MAX;
  insertCount += 1;
  return { x: base.x + cascadeIndex * CASCADE_STEP, y: base.y + cascadeIndex * CASCADE_STEP };
}

function insertSticker(plan) {
  const anchor = nextAnchor(plan.width);

  console.log("[Stickers] Creating simple sticker...");

  // Создаем простой Board без вложенных контейнеров
  const container = penpot.createBoard();
  container.name = "Sticker";
  container.x = anchor.x;
  container.y = anchor.y;
  container.resize(plan.width, 200);
  container.fills = [{ fillColor: plan.bg, fillOpacity: 1 }];
  container.borderRadius = plan.radius;

  // Добавляем flex layout
  const flex = container.addFlexLayout();
  flex.dir = 'column';
  flex.alignItems = 'start';
  flex.justifyContent = 'start';
  flex.rowGap = plan.titleBodyGap;
  flex.columnGap = 0;
  flex.topPadding = plan.padding;
  flex.rightPadding = plan.padding;
  flex.bottomPadding = plan.padding;
  flex.leftPadding = plan.padding;

  container.verticalSizing = 'auto';
  container.horizontalSizing = 'fix';

  // Создаем заголовок напрямую
  const titleText = penpot.createText(plan.title);
  titleText.name = "Title";
  titleText.fontFamily = plan.fontFamily;
  titleText.fontSize = String(plan.titleFontSize);
  titleText.fontWeight = "700";
  titleText.fills = [{ fillColor: plan.textColor, fillOpacity: 1 }];
  titleText.resize(plan.width - plan.padding * 2, plan.titleFontSize * 1.4);

  container.appendChild(titleText);
  titleText.growType = "auto-height";

  if (titleText.layoutChild) {
    titleText.layoutChild.horizontalSizing = 'fill';
  }

  // Создаем body текст напрямую
  if (plan.text) {
    const bodyText = penpot.createText(plan.text);
    bodyText.name = "Body";
    bodyText.fontFamily = plan.fontFamily;
    bodyText.fontSize = String(plan.bodyFontSize);
    bodyText.fontWeight = "400";
    bodyText.fills = [{ fillColor: plan.textColor, fillOpacity: 1 }];
    bodyText.resize(plan.width - plan.padding * 2, plan.bodyFontSize * 1.4);

    container.appendChild(bodyText);
    bodyText.growType = "auto-height";

    if (bodyText.layoutChild) {
      bodyText.layoutChild.horizontalSizing = 'fill';
    }
  }

  console.log("[Stickers] Simple sticker created successfully");
  return { id: container.id, x: anchor.x, y: anchor.y };
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
