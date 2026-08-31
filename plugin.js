/**
 * Stickers — plugin.js (sandbox context)
 *
 * v3: Использует Board с Flex Layout для автоматической подстройки высоты.
 * Board автоматически растягивается под содержимое благодаря layout: 'flex'
 * и direction: 'column' с фиксированной шириной.
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

  // Создаем Board как контейнер с flex layout
  const board = penpot.createBoard();
  board.name = plan.title ? `Sticker — ${plan.title}` : "Sticker";
  board.x = anchor.x;
  board.y = anchor.y;
  board.resize(plan.width, 200); // Начальная высота, автоматически подстроится
  board.fills = [{ fillColor: plan.bg, fillOpacity: 1 }];
  board.borderRadius = plan.radius;

  // Применяем flex layout для автоматической высоты
  board.layout = "flex";
  board.layoutFlex = {
    dir: "column",
    wrap: "nowrap",
    alignItems: "start",
    justifyContent: "start",
    rowGap: plan.titleBodyGap,
    columnGap: 0,
    paddingTop: plan.padding,
    paddingRight: plan.padding,
    paddingBottom: plan.padding,
    paddingLeft: plan.padding,
    verticalSizing: "auto", // Автоматическая высота
    horizontalSizing: "fix"  // Фиксированная ширина
  };

  // Создаем заголовок
  const titleText = penpot.createText(plan.title);
  titleText.fontFamily = plan.fontFamily;
  titleText.fontSize = String(plan.titleFontSize);
  titleText.fontWeight = "700";
  titleText.fills = [{ fillColor: plan.textColor, fillOpacity: 1 }];
  titleText.growType = "auto-height";
  titleText.resize(plan.width - plan.padding * 2, plan.titleFontSize * 1.4);

  // Добавляем заголовок в board
  board.appendChild(titleText);

  // Создаем body текст, если есть
  if (plan.text) {
    const bodyText = penpot.createText(plan.text);
    bodyText.fontFamily = plan.fontFamily;
    bodyText.fontSize = String(plan.bodyFontSize);
    bodyText.fontWeight = "400";
    bodyText.fills = [{ fillColor: plan.textColor, fillOpacity: 1 }];
    bodyText.growType = "auto-height";
    bodyText.resize(plan.width - plan.padding * 2, plan.bodyFontSize * 1.4);

    // Добавляем body в board
    board.appendChild(bodyText);
  }

  return { id: board.id, x: anchor.x, y: anchor.y };
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
