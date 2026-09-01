/**
 * Stickers — plugin.js (sandbox context)
 *
 * v6: Простая версия для проверки загрузки
 */

console.log("[Stickers] plugin.js loaded - VERSION 2026-08-31-11-11");

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

  // Создаем заголовок с autolayout контейнером
  const headerContainer = penpot.createBoard();
  headerContainer.name = "Header";
  headerContainer.resize(plan.width - plan.padding * 2, plan.titleFontSize * 1.4);

  const headerFlex = headerContainer.addFlexLayout();
  headerFlex.dir = 'column';
  headerFlex.alignItems = 'start';
  headerFlex.justifyContent = 'start';
  headerFlex.rowGap = 0;
  headerFlex.columnGap = 0;
  headerFlex.topPadding = 0;
  headerFlex.rightPadding = 0;
  headerFlex.bottomPadding = 0;
  headerFlex.leftPadding = 0;

  // Настраиваем auto height для контейнера заголовка
  headerContainer.verticalSizing = 'auto';
  headerContainer.horizontalSizing = 'fixed';

  const titleText = penpot.createText(plan.title);
  titleText.name = "Title";
  titleText.fontFamily = plan.fontFamily;
  titleText.fontSize = String(plan.titleFontSize);
  titleText.fontWeight = "700";
  titleText.fills = [{ fillColor: plan.textColor, fillOpacity: 1 }];
  titleText.resize(plan.width - plan.padding * 2, plan.titleFontSize * 1.4);
  titleText.growType = "auto-height";

  // Добавляем текст в контейнер
  headerContainer.appendChild(titleText);

  // Настраиваем layoutChild для текста внутри flex контейнера
  if (titleText.layoutChild) {
    titleText.layoutChild.horizontalSizing = 'fill';
    titleText.layoutChild.verticalSizing = 'auto';
  }

  // Добавляем контейнер заголовка в главный контейнер
  container.appendChild(headerContainer);

  // Настраиваем layoutChild для контейнера заголовка внутри главного flex контейнера
  if (headerContainer.layoutChild) {
    headerContainer.layoutChild.horizontalSizing = 'fill';
    headerContainer.layoutChild.verticalSizing = 'auto';
  }

  console.log("[Stickers] Header container added");

  // Создаем body текст с autolayout контейнером
  if (plan.text) {
    const textContainer = penpot.createBoard();
    textContainer.name = "Text";
    textContainer.resize(plan.width - plan.padding * 2, plan.bodyFontSize * 1.4);

    const textFlex = textContainer.addFlexLayout();
    textFlex.dir = 'column';
    textFlex.alignItems = 'start';
    textFlex.justifyContent = 'start';
    textFlex.rowGap = 0;
    textFlex.columnGap = 0;
    textFlex.topPadding = 0;
    textFlex.rightPadding = 0;
    textFlex.bottomPadding = 0;
    textFlex.leftPadding = 0;

    // Настраиваем auto height для контейнера текста
    textContainer.verticalSizing = 'auto';
    textContainer.horizontalSizing = 'fixed';

    const bodyText = penpot.createText(plan.text);
    bodyText.name = "Body";
    bodyText.fontFamily = plan.fontFamily;
    bodyText.fontSize = String(plan.bodyFontSize);
    bodyText.fontWeight = "400";
    bodyText.fills = [{ fillColor: plan.textColor, fillOpacity: 1 }];
    bodyText.resize(plan.width - plan.padding * 2, plan.bodyFontSize * 1.4);
    bodyText.growType = "auto-height";

    // Добавляем текст в контейнер
    textContainer.appendChild(bodyText);

    // Настраиваем layoutChild для текста внутри flex контейнера
    if (bodyText.layoutChild) {
      bodyText.layoutChild.horizontalSizing = 'fill';
      bodyText.layoutChild.verticalSizing = 'auto';
    }

    // Добавляем контейнер текста в главный контейнер
    container.appendChild(textContainer);

    // Настраиваем layoutChild для контейнера текста внутри главного flex контейнера
    if (textContainer.layoutChild) {
      textContainer.layoutChild.horizontalSizing = 'fill';
      textContainer.layoutChild.verticalSizing = 'auto';
    }

    console.log("[Stickers] Text container added");
  }

  console.log("[Stickers] Sticker with nested autolayouts created successfully");
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
