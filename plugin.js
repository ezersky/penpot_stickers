/**
 * Stickers — plugin.js (sandbox context)
 *
 * v3: доска с flex-layout (autolayout) вместо трёх независимо позиционированных фигур,
 * плюс тень снизу под стикером.
 *
 * ВАЖНО про autolayout: официально подтверждённый баг Penpot (issue #8520, март 2026,
 * severity: High) — `flex.verticalSizing = 'auto'` тихо не работает: сеттер принимает
 * значение, геттер честно возвращает "auto", но доска физически НЕ обнимает высоту
 * контента. Официальный воркэраунд от авторов бага — тот, что применён здесь: посчитать
 * нужную высоту самостоятельно и явно вызвать resize(). Autolayout всё равно применяется
 * (flex-колонка с padding/gap) — он даёт корректное выравнивание заголовка и текста друг
 * относительно друга и одинаковые отступы со всех сторон, просто высоту доски мы
 * подстраховываем сами, а не полагаемся на "auto"/"fit-content" по вертикали.
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
  // Высота посчитана заранее в ui.js (buildStickerPlan) — не полагаемся на flex-autoheight,
  // см. комментарий про issue #8520 в шапке файла.
  board.resize(plan.width, plan.height);
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
  // Задаём "auto" на будущее (если Penpot когда-нибудь починит issue #8520, стикер начнёт
  // обниматься по высоте сам собой) — но НЕ полагаемся на это сегодня, высота уже зафиксирована
  // явным resize() выше.
  flex.verticalSizing = "auto";
  flex.horizontalSizing = "fix";

  const titleText = createStickerText(plan.title, plan.fontFamily, plan.titleFontSize, "700", plan.textColor);
  board.appendChild(titleText);

  if (plan.text) {
    const bodyText = createStickerText(plan.text, plan.fontFamily, plan.bodyFontSize, "400", plan.textColor);
    board.appendChild(bodyText);
  }

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
