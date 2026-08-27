console.log("[Sticker Generator] plugin.js loaded");

// Хелпер: HEX -> RGB (0–1)
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r: r / 255, g: g / 255, b: b / 255 };
}

// Открываем UI
if (penpot && penpot.ui && typeof penpot.ui.open === "function") {
  penpot.ui.open("Sticker Generator", "index.html", { width: 260, height: 350 });
} else {
  console.warn("[Sticker Generator] penpot.ui.open is not available");
}

// Универсальный обработчик сообщений
const handleMessage = async (message) => {
  console.log("[Sticker Generator] handleMessage called with:", message);

  if (!message || message.type !== "create-sticker") {
    console.log("[Sticker Generator] ignoring message, type:", message?.type);
    return;
  }

  console.log("[Sticker Generator] creating sticker, text:", message.text, "color:", message.color);

  const text = message.text || "Стикер";
  const color = message.color || "#ffffff";

  // Внутренние отступы
  const paddingX = 24;
  const paddingY = 20;

  // 1. СНАЧАЛА создаем прямоугольную подложку
  let rect;
  try {
    rect = penpot.createRectangle({
      width: 200,
      height: 200
    });
  } catch (e1) {
    try {
      rect = penpot.createRectangle(200, 100);
    } catch (e2) {
      rect = penpot.createRectangle();
      if (rect) {
        rect.resize(200, 100);
      }
    }
  }

  if (!rect) {
    console.error("[Sticker Generator] createRectangle failed");
    return;
  }

  rect.name = "Sticker Base";
  rect.borderRadius = 8;

  // 2. ПОТОМ создаем текстовый шейп
  let textShape;
  try {
    textShape = penpot.createText({
      text: text,
      fontFamily: "Inter",
      fontSize: 15
    });
  } catch (e1) {
    try {
      textShape = penpot.createText(text, "Inter", 15);
    } catch (e2) {
      console.error("[Sticker Generator] createText failed:", e1, e2);
      return;
    }
  }

  if (!textShape) {
    console.error("[Sticker Generator] createText returned null/undefined");
    return;
  }

  textShape.name = "Sticker Text";

  // Устанавливаем текст через правильное свойство
  if ("characters" in textShape) {
    textShape.characters = text;
  } else if ("text" in textShape) {
    textShape.text = text;
  } else if ("content" in textShape) {
    textShape.content = text;
  }

  textShape.fontFamily = "Inter";
  textShape.fontSize = 15;

  // Задаём ширину, высоту минимальную
  textShape.resize(200, 1);

  // Пробуем включить авто-высоту разными способами
  if ("growType" in textShape) {
    textShape.growType = "auto-height";
  } else if ("autoHeight" in textShape) {
    textShape.autoHeight = true;
  }

  // Ждем обновления лейаута
  if (typeof penpot.waitForLayoutUpdate === "function") {
    await penpot.waitForLayoutUpdate();
  }

  const textWidth = textShape.width || 0;
  const textHeight = textShape.height || 0;

  const rectWidth = textWidth + paddingX * 2;
  const rectHeight = textHeight + paddingY * 2;

  // Изменяем размер прямоугольника
  rect.resize(rectWidth, rectHeight);

  // Центрируем текст на подложке
  textShape.x = paddingX;
  textShape.y = paddingY;

  // 3. Группируем элементы
  let group;
  try {
    group = penpot.group([rect, textShape]);
  } catch (e) {
    console.error("[Sticker Generator] group failed:", e);
    return;
  }

  if (!group) {
    console.error("[Sticker Generator] group returned null/undefined");
    return;
  }

  group.name = `Sticker: ${text.slice(0, 12)}${text.length > 12 ? "..." : ""}`;

  // Центрирование относительно вьюпорта
  let viewportCenterX = 0;
  let viewportCenterY = 0;

  if (penpot.viewport && penpot.viewport.center) {
    viewportCenterX = penpot.viewport.center.x;
    viewportCenterY = penpot.viewport.center.y;
  } else if (penpot.viewport) {
    viewportCenterX = (penpot.viewport.width || 0) / 2;
    viewportCenterY = (penpot.viewport.height || 0) / 2;
  }

  group.x = viewportCenterX - rectWidth / 2;
  group.y = viewportCenterY - rectHeight / 2;

  // 4. Устанавливаем цвет прямоугольника через penpot.shapesColors
  console.log("[Sticker Generator] calling shapesColors with rect:", rect, "color:", color);
  try {
    penpot.shapesColors(rect, color);
    console.log("[Sticker Generator] shapesColors success");
  } catch (e) {
    console.error("[Sticker Generator] shapesColors failed:", e);
  }

  // Выделяем созданную группу
  if (penpot.selection !== undefined) {
    penpot.selection = [group];
  }

  console.log("[Sticker Generator] sticker created successfully");
};

// Подписка на сообщения от UI через penpot.ui.onMessage
console.log("[Sticker Generator] penpot.ui.onMessage exists:", typeof penpot.ui?.onMessage === "function");

if (penpot.ui && typeof penpot.ui.onMessage === "function") {
  penpot.ui.onMessage(handleMessage);
  console.log("[Sticker Generator] subscribed to onMessage");
} else {
  console.warn("[Sticker Generator] penpot.ui.onMessage is not available");
}
