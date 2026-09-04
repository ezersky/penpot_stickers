/**
 * Stickers — plugin.js (sandbox context)
 *
 * v5: упростили обратно — Header и Text лежат НАПРЯМУЮ внутри доски-стикера (без
 * отдельных досок-обёрток на каждый текст), с growType: 'auto-height'. Ширину текстам
 * отдельно не задаём вообще: flex.alignItems = 'stretch' на колонке растягивает детей на
 * всю ширину доски сам — это заодно обходит стороной ловушку text.width (свойство только
 * для чтения, прямое присваивание кидает TypeError в реальном Penpot: "Cannot set
 * property width ... which has only a getter"; единственный рабочий способ — .resize(),
 * но здесь он вообще не нужен).
 *
 * ВАЖНО про autolayout: официально подтверждённый баг Penpot (issue #8520, март 2026,
 * severity: High) — `flex.verticalSizing = 'auto'` может тихо не обнимать высоту контента
 * доски. Выставляем его на будущее (вдруг починят), но не полагаемся: высота доски-стикера
 * дополнительно фиксируется явным resize() под заранее посчитанное значение (ui.js,
 * buildStickerPlan) — это гарантированный воркэраунд, предложенный самими авторами issue.
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

function createStickerText(content, fontFamily, fontSize, fontWeight, textColor) {
  const text = penpot.createText(content);
  text.fontFamily = fontFamily;
  text.fontSize = String(fontSize);
  text.fontWeight = String(fontWeight);
  text.fills = [{ fillColor: textColor, fillOpacity: 1 }];
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
  flex.alignItems = "stretch"; // растягивает Header/Text на всю ширину доски — ширину текста отдельно не задаём
  flex.justifyContent = "start";
  flex.verticalSizing = "auto"; // на будущее, если Penpot починит issue #8520

  const titleText = createStickerText(plan.title, plan.fontFamily, plan.titleFontSize, "700", plan.textColor);
  titleText.name = "Header";
  board.appendChild(titleText);

  if (plan.text) {
    const bodyText = createStickerText(plan.text, plan.fontFamily, plan.bodyFontSize, "400", plan.textColor);
    bodyText.name = "Text";
    board.appendChild(bodyText);
  }

  // Страховка: несколько разнородных детей — ровно тот случай, где issue #8520
  // воспроизводится надёжнее всего, поэтому явно фиксируем высоту доски.
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
