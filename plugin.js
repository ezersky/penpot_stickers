/**
 * Stickers — plugin.js (sandbox context)
 *
 * v4: Использует Board с addFlexLayout() для автоматической подстройки высоты.
 * Board автоматически растягивается под содержимое благодаря flex layout.
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

  // 1. Создаем Board как контейнер
  const container = penpot.createBoard();
  container.name = plan.title ? `Sticker — ${plan.title}` : "Sticker";
  container.x = anchor.x;
  container.y = anchor.y;

  // ВАЖНО: resize() ПЕРЕД addFlexLayout()
  container.resize(plan.width, 200);

  container.fills = [{ fillColor: plan.bg, fillOpacity: 1 }];
  container.borderRadius = plan.radius;

  // 2. Добавляем flex layout ПОСЛЕ resize()
  const flex = container.addFlexLayout();

  // 3. Настраиваем flex layout для вертикального расположения
  flex.dir = 'column';
  flex.alignItems = 'start';
  flex.justifyContent = 'start';

  // 4. Настраиваем отступы и расстояния
  flex.rowGap = plan.titleBodyGap;
  flex.columnGap = 0;
  flex.topPadding = plan.padding;
  flex.rightPadding = plan.padding;
  flex.bottomPadding = plan.padding;
  flex.leftPadding = plan.padding;

  // 5. Создаем заголовок
  const titleText = penpot.createText(plan.title);
  titleText.name = "Title";
  titleText.fontFamily = plan.fontFamily;
  titleText.fontSize = String(plan.titleFontSize);
  titleText.fontWeight = "700";
  titleText.fills = [{ fillColor: plan.textColor, fillOpacity: 1 }];
  titleText.growType = "auto-height";
  titleText.resize(plan.width - plan.padding * 2, plan.titleFontSize * 1.4);

  // 6. Добавляем заголовок в контейнер
  container.appendChild(titleText);

  // 7. Настраиваем sizing для заголовка через layoutChild
  titleText.layoutChild.horizontalSizing = 'fill';
  titleText.layoutChild.verticalSizing = 'auto';

  // 8. Создаем body текст, если есть
  if (plan.text) {
    const bodyText = penpot.createText(plan.text);
    bodyText.name = "Body";
    bodyText.fontFamily = plan.fontFamily;
    bodyText.fontSize = String(plan.bodyFontSize);
    bodyText.fontWeight = "400";
    bodyText.fills = [{ fillColor: plan.textColor, fillOpacity: 1 }];
    bodyText.growType = "auto-height";
    bodyText.resize(plan.width - plan.padding * 2, plan.bodyFontSize * 1.4);

    // 9. Добавляем body в контейнер
    container.appendChild(bodyText);

    // 10. Настраиваем sizing для body через layoutChild
    bodyText.layoutChild.horizontalSizing = 'fill';
    bodyText.layoutChild.verticalSizing = 'auto';
  }

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
