/**
 * Stickers — plugin.js (sandbox context)
 *
 * v4: каждый текстовый слой обёрнут в СВОЮ доску с flex-autolayout (auto-height, width
 * 100% относительно родителя), а не просто добавлен как текстовая фигура напрямую в
 * сticker-доску.
 *
 * ВАЖНО про autolayout: официально подтверждённый баг Penpot (issue #8520, март 2026,
 * severity: High) — `flex.verticalSizing = 'auto'` может тихо не обнимать высоту контента.
 * Баг воспроизведён на доске с НЕСКОЛЬКИМИ разнородными детьми. Обёртка "один текст —
 * одна доска" — это более простой, изолированный случай (один ребёнок), для которого
 * авто-высота имеет больше шансов сработать корректно. Тем не менее, внешняя доска
 * стикера (у которой несколько детей — обе текстовые обёртки) всё ещё подстрахована
 * явным resize() под заранее посчитанную высоту — на случай, если баг проявится и здесь.
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

/**
 * Оборачивает один текстовый слой в отдельную доску с flex-autolayout:
 * verticalSizing: 'auto' (обнимает высоту текста), horizontalSizing: 'fill' (100% ширины
 * родителя). Возвращает саму доску-обёртку — именно её нужно добавлять в сticker-доску,
 * а не текст напрямую.
 *
 * text.width задаётся НАПРЯМУЮ (не через resize) — это даёт тексту фиксированную ширину
 * для переноса строк независимо от того, сработает ли horizontalSizing:'fill' у обёртки
 * (нашли рабочий паттерн с прямым присвоением text.width, а не resize()).
 */
function createTextWrapper(content, fontFamily, fontSize, fontWeight, textColor, wrapWidth) {
  const wrapper = penpot.createBoard();
  wrapper.name = "Text";
  wrapper.fills = [];

  const flex = wrapper.addFlexLayout();
  flex.dir = "row";
  flex.topPadding = 0;
  flex.rightPadding = 0;
  flex.bottomPadding = 0;
  flex.leftPadding = 0;
  flex.horizontalSizing = "fill"; // width: 100% относительно родителя (сticker-доски)
  flex.verticalSizing = "auto"; // auto-height — обнимает высоту текста

  const text = penpot.createText(content);
  text.fontFamily = fontFamily;
  text.fontSize = String(fontSize);
  text.fontWeight = String(fontWeight);
  text.fills = [{ fillColor: textColor, fillOpacity: 1 }];
  text.growType = "auto-height";
  text.width = wrapWidth;

  wrapper.appendChild(text);
  return wrapper;
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
  flex.verticalSizing = "auto"; // на будущее, если Penpot починит issue #8520

  const titleWrapper = createTextWrapper(plan.title, plan.fontFamily, plan.titleFontSize, "700", plan.textColor);
  board.appendChild(titleWrapper);

  if (plan.text) {
    const bodyWrapper = createTextWrapper(plan.text, plan.fontFamily, plan.bodyFontSize, "400", plan.textColor);
    board.appendChild(bodyWrapper);
  }

  // Страховка для внешней доски (несколько разнородных детей — ровно тот случай, где
  // issue #8520 воспроизводится надёжнее всего): явно фиксируем высоту.
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
