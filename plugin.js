/**
 * Stickers — plugin.js (sandbox context)
 *
 * v6: два фикса по итогам реального теста.
 *
 * 1) verticalSizing: 'fit-content', а не 'auto'. По подтверждённому интерфейсу Penpot
 *    FlexLayout принимает три значения — "fill" | "auto" | "fit-content". Похоже, именно
 *    "fit-content" — та опция, что в UI Penpot подписана как "Fit content" и реально
 *    заставляет доску обнимать высоту контента; "auto", которое использовалось раньше,
 *    было попросту неверным значением с моей стороны (не то же самое, что баг #8520).
 *
 * 2) Header/Text схлопывались до 1px. growType: 'auto-height' означает "ширина
 *    фиксирована, высота растёт под контент" — а не "оба измерения сами по себе".
 *    alignItems:'stretch' одного факта растягивания на всю ширину доски не гарантирует
 *    для текстовых фигур. Явно фиксируем стартовую ширину текста через .resize(w, h) —
 *    .width напрямую присвоить нельзя (см. v5: TypeError, свойство только для чтения),
 *    но .resize() работает, это тот же метод, что и у Rectangle/Board. Высоту передаём
 *    из оценки ui.js (buildStickerPlan.titleHeight/bodyHeight) — дальше growType:
 *    'auto-height' сам подправит высоту под реальный рендер текста.
 *
 * Высота внешней доски-стикера всё ещё дополнительно подстрахована явным resize() —
 * доска с несколькими разнородными детьми (Header + Text) это тот случай, где
 * issue #8520 (https://github.com/penpot/penpot/issues/8520) воспроизводится надёжнее
 * всего, даже если verticalSizing теперь правильный.
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

function createStickerText(content, fontFamily, fontSize, fontWeight, textColor, width, height) {
  const text = penpot.createText(content);
  text.fontFamily = fontFamily;
  text.fontSize = String(fontSize);
  text.fontWeight = String(fontWeight);
  text.fills = [{ fillColor: textColor, fillOpacity: 1 }];
  // Стартовый размер — ОБЯЗАТЕЛЬНО через resize(), не через .width (только для чтения).
  text.resize(width, height);
  text.growType = "auto-height";
  return text;
}

function insertSticker(plan) {
  const anchor = nextAnchor(plan.width, plan.height);

  const board = penpot.createBoard();
  board.x = anchor.x;
  board.y = anchor.y;
  board.fills = [{ fillColor: plan.bg, fillOpacity: 1 }];
  board.borderRadius = plan.radius;

  // Тень снизу под стикером.
  board.shadows = [
    {
      style: "drop-shadow",
      offsetX: 0,
      offsetY: 4,
      blur: 12,
      spread: 0,
      color: { color: "#000000", opacity: 0.18 },
      hidden: false,
    },
  ];

  const flex = board.addFlexLayout();
  flex.dir = "column";
  flex.rowGap = plan.titleBodyGap;
  flex.topPadding = plan.padding;
  flex.rightPadding = plan.padding;
  flex.bottomPadding = plan.padding;
  flex.leftPadding = plan.padding;
  flex.alignItems = "stretch";
  flex.justifyContent = "start";
  flex.verticalSizing = "fit-content"; // "Fit content (Vertical)" — доска обнимает высоту контента

  const titleText = createStickerText(
    plan.title, plan.fontFamily, plan.titleFontSize, "700", plan.textColor,
    plan.textWidth, plan.titleHeight
  );
  titleText.name = "Header";
  board.appendChild(titleText);

  if (plan.text) {
    const bodyText = createStickerText(
      plan.text, plan.fontFamily, plan.bodyFontSize, "400", plan.textColor,
      plan.textWidth, plan.bodyHeight
    );
    bodyText.name = "Text";
    board.appendChild(bodyText);
  }

  // Страховка: несколько разнородных детей — тот случай, где issue #8520 воспроизводится
  // надёжнее всего, поэтому дополнительно явно фиксируем высоту доски.
  board.resize(plan.width, plan.height);

  board.name = plan.title ? `Sticker — ${plan.title}` : "Sticker";

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
