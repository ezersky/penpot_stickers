/**
 * Stickers — plugin.js (sandbox context)
 *
 * v5: Тестовая версия - проверяем доступные методы для Board
 */

console.log("[Stickers] plugin.js loaded");

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

  console.log("[Stickers] Creating board...");

  // Создаем Board
  const container = penpot.createBoard();

  console.log("[Stickers] Board created, available methods:", Object.keys(container));
  console.log("[Stickers] Checking for addFlexLayout:", typeof container.addFlexLayout);

  container.name = plan.title ? `Sticker — ${plan.title}` : "Sticker";
  container.x = anchor.x;
  container.y = anchor.y;
  container.resize(plan.width, 200);
  container.fills = [{ fillColor: plan.bg, fillOpacity: 1 }];
  container.borderRadius = plan.radius;

  // Пробуем добавить flex layout, если метод существует
  if (typeof container.addFlexLayout === 'function') {
    console.log("[Stickers] addFlexLayout exists, trying to call...");
    try {
      const flex = container.addFlexLayout();
      console.log("[Stickers] Flex layout added successfully!");

      flex.dir = 'column';
      flex.alignItems = 'start';
      flex.justifyContent = 'start';
      flex.rowGap = plan.titleBodyGap;
      flex.columnGap = 0;
      flex.topPadding = plan.padding;
      flex.rightPadding = plan.padding;
      flex.bottomPadding = plan.padding;
      flex.leftPadding = plan.padding;

      // ВАЖНО: устанавливаем sizing для самого контейнера
      flex.verticalSizing = 'auto'; // Fit content vertical
      flex.horizontalSizing = 'fix'; // Фиксированная ширина
    } catch (e) {
      console.error("[Stickers] Failed to add flex layout:", e);
      throw e;
    }
  } else {
    console.warn("[Stickers] addFlexLayout method not found!");
  }

  // Создаем заголовок
  const titleText = penpot.createText(plan.title);
  titleText.name = "Title";
  titleText.fontFamily = plan.fontFamily;
  titleText.fontSize = String(plan.titleFontSize);
  titleText.fontWeight = "700";
  titleText.fills = [{ fillColor: plan.textColor, fillOpacity: 1 }];
  titleText.growType = "auto-height";
  titleText.resize(plan.width - plan.padding * 2, plan.titleFontSize * 1.4);

  container.appendChild(titleText);

  // Пытаемся настроить layoutChild, если доступно
  if (titleText.layoutChild) {
    console.log("[Stickers] layoutChild available on titleText");
    try {
      titleText.layoutChild.horizontalSizing = 'fill';
      titleText.layoutChild.verticalSizing = 'auto';
    } catch (e) {
      console.error("[Stickers] Failed to set layoutChild:", e);
    }
  }

  // Создаем body текст
  if (plan.text) {
    const bodyText = penpot.createText(plan.text);
    bodyText.name = "Body";
    bodyText.fontFamily = plan.fontFamily;
    bodyText.fontSize = String(plan.bodyFontSize);
    bodyText.fontWeight = "400";
    bodyText.fills = [{ fillColor: plan.textColor, fillOpacity: 1 }];
    bodyText.growType = "auto-height";
    bodyText.resize(plan.width - plan.padding * 2, plan.bodyFontSize * 1.4);

    container.appendChild(bodyText);

    if (bodyText.layoutChild) {
      try {
        bodyText.layoutChild.horizontalSizing = 'fill';
        bodyText.layoutChild.verticalSizing = 'auto';
      } catch (e) {
        console.error("[Stickers] Failed to set layoutChild on body:", e);
      }
    }
  }

  console.log("[Stickers] Sticker created successfully");
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
