/**
 * Stickers — plugin.js (sandbox context)
 *
 * v5: Тестовая версия - проверяем доступные методы для Board
 */

console.log("[Stickers] plugin.js loaded - VERSION 2026-08-31-10-55");

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

  console.log("[Stickers] Creating main sticker container...");

  // ========================================
  // 1. СОЗДАЕМ ГЛАВНЫЙ КОНТЕЙНЕР (Board)
  // ========================================
  const container = penpot.createBoard();
  container.name = "Sticker";
  container.x = anchor.x;
  container.y = anchor.y;
  container.resize(plan.width, 200); // Базовый размер, изменится автоматически
  container.fills = [{ fillColor: plan.bg, fillOpacity: 1 }];
  container.borderRadius = plan.radius;

  // Тень для главного контейнера
  container.shadows = [{
    style: 'drop-shadow',
    offsetX: 0,
    offsetY: 2,
    blur: 8,
    spread: 0,
    hidden: false,
    color: {
      color: '#000000',
      opacity: 0.15
    }
  }];

  // Включаем автолейаут (Flex) для главного контейнера
  const mainFlex = container.addFlexLayout();
  mainFlex.dir = 'column';              // Вертикальное расположение
  mainFlex.alignItems = 'start';
  mainFlex.justifyContent = 'start';
  mainFlex.rowGap = plan.titleBodyGap;  // Отступ между Header и Text
  mainFlex.columnGap = 0;
  mainFlex.topPadding = plan.padding;
  mainFlex.rightPadding = plan.padding;
  mainFlex.bottomPadding = plan.padding;
  mainFlex.leftPadding = plan.padding;

  // ВАЖНО: sizing для автоматического изменения размера
  container.verticalSizing = 'auto';     // Высота подстраивается под контент

  console.log("[Stickers] Main container with autolayout created");

  // ========================================
  // 2. СОЗДАЕМ HEADER (Board с автолейаутом)
  // ========================================
  const headerAutolayout = penpot.createBoard();
  headerAutolayout.name = "Header";

  // Убираем фон у Header (делаем прозрачным)
  headerAutolayout.fills = [];

  // Включаем автолейаут для Header
  const headerFlex = headerAutolayout.addFlexLayout();
  headerFlex.dir = 'column';
  headerFlex.alignItems = 'start';
  headerFlex.justifyContent = 'start';
  headerFlex.rowGap = 0;
  headerFlex.columnGap = 0;
  headerFlex.topPadding = 0;
  headerFlex.rightPadding = 0;
  headerFlex.bottomPadding = 0;
  headerFlex.leftPadding = 0;

  // Создаем текст заголовка
  const titleText = penpot.createText(plan.title);
  titleText.name = "Title";
  titleText.fontFamily = plan.fontFamily;
  titleText.fontSize = String(plan.titleFontSize);
  titleText.fontWeight = "700";
  titleText.fills = [{ fillColor: plan.textColor, fillOpacity: 1 }];

  // ВАЖНО: устанавливаем только ширину, без высоты
  titleText.width = plan.width - plan.padding * 2;

  // ВАЖНО: устанавливаем growType для auto-height
  titleText.growType = "auto-height";

  // Добавляем текст в Header
  headerAutolayout.appendChild(titleText);

  console.log("[Stickers] titleText created with growType:", titleText.growType);

  // Настраиваем sizing для Header
  headerAutolayout.verticalSizing = 'auto';   // Высота подстраивается
  headerAutolayout.horizontalSizing = 'auto'; // Fit content (Horizontal)

  // Добавляем Header в главный контейнер
  container.appendChild(headerAutolayout);

  console.log("[Stickers] Header autolayout created");

  // ========================================
  // 3. СОЗДАЕМ TEXT (Board с автолейаутом)
  // ========================================
  if (plan.text) {
    const textAutolayout = penpot.createBoard();
    textAutolayout.name = "Text";

    // Убираем фон у Text (делаем прозрачным)
    textAutolayout.fills = [];

    // Включаем автолейаут для Text
    const textFlex = textAutolayout.addFlexLayout();
    textFlex.dir = 'column';
    textFlex.alignItems = 'start';
    textFlex.justifyContent = 'start';
    textFlex.rowGap = 0;
    textFlex.columnGap = 0;
    textFlex.topPadding = 0;
    textFlex.rightPadding = 0;
    textFlex.bottomPadding = 0;
    textFlex.leftPadding = 0;

    // Создаем текст body
    const bodyText = penpot.createText(plan.text);
    bodyText.name = "Body";
    bodyText.fontFamily = plan.fontFamily;
    bodyText.fontSize = String(plan.bodyFontSize);
    bodyText.fontWeight = "400";
    bodyText.fills = [{ fillColor: plan.textColor, fillOpacity: 1 }];

    // ВАЖНО: устанавливаем только ширину, без высоты
    bodyText.width = plan.width - plan.padding * 2;

    // ВАЖНО: устанавливаем growType для auto-height
    bodyText.growType = "auto-height";


    // Добавляем текст в Text
    textAutolayout.appendChild(bodyText);

    console.log("[Stickers] bodyText created with growType:", bodyText.growType);

    // Настраиваем sizing для Text
    textAutolayout.verticalSizing = 'auto';   // Высота подстраивается
    textAutolayout.horizontalSizing = 'auto'; // Fit content (Horizontal)

    // Добавляем Text в главный контейнер
    container.appendChild(textAutolayout);

    console.log("[Stickers] Text autolayout created");
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
