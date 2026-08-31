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
  // Сначала resize с фиксированной шириной
  text.resize(plan.width - plan.padding * 2, plan.titleFontSize * 1.4);
  // Потом устанавливаем auto-height для динамической подстройки
  text.growType = "auto-height";
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
  // Сначала resize с фиксированной шириной
  text.resize(plan.width - plan.padding * 2, plan.bodyFontSize * 1.4);
  // Потом устанавливаем auto-height для динамической подстройки
  text.growType = "auto-height";
  return text;
}

function insertSticker(plan) {
  // Вычисляем реальную высоту ДО создания якоря и фигур
  const titleHeight = plan.titleFontSize * 1.4;
  let calculatedHeight = plan.padding + titleHeight + plan.padding;

  if (plan.text) {
    // Улучшенная оценка высоты с учетом реального переноса строк
    // Используем более точный коэффициент для Work Sans (0.52 вместо 0.5)
    const avgCharWidth = plan.bodyFontSize * 0.52;
    const availableWidth = plan.width - plan.padding * 2;
    const charsPerLine = Math.floor(availableWidth / avgCharWidth);

    // Учитываем переносы строк в тексте
    const lines = plan.text.split('\n');
    let totalLines = 0;
    lines.forEach(line => {
      const lineLength = line.length || 1;
      totalLines += Math.ceil(lineLength / charsPerLine);
    });

    // Высота строки для body текста: fontSize * lineHeight (1.5)
    const bodyHeight = totalLines * (plan.bodyFontSize * 1.5);
    calculatedHeight = plan.padding + titleHeight + plan.titleBodyGap + bodyHeight + plan.padding;
  }

  const finalHeight = Math.max(plan.height, calculatedHeight);

  // Используем финальную высоту для якоря
  const anchor = nextAnchor(plan.width, finalHeight);

  // Создаем фон с правильной высотой
  const background = createBackground(plan, anchor);
  background.resize(plan.width, finalHeight);

  const titleText = createTitleText(plan, anchor);
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
