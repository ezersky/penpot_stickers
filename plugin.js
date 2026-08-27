console.log("[Sticker Generator] plugin.js loaded");

// Открываем UI только если penpot.ui.open доступен
if (penpot && penpot.ui && typeof penpot.ui.open === "function") {
  penpot.ui.open("Sticker Generator", "index.html", { width: 260, height: 270 });
} else {
  console.warn("[Sticker Generator] penpot.ui.open is not available");
}

// Универсальный обработчик сообщений
const handleMessage = async (message) => {
  if (!message || message.type !== "create-sticker") return;

  const text = message.text || "Стикер";
  const color = message.color || "#ffffff";

  // 1. Создаем текстовый шейп
  if (typeof penpot.createText !== "function") {
    console.error("[Sticker Generator] penpot.createText is not available");
    return;
  }

  const textShape = penpot.createText();
  if (!textShape) return;

  textShape.name = "Sticker Text";

  // Пробуем несколько вариантов имени свойства для текста
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

  // Внутренние отступы
  const paddingX = 24;
  const paddingY = 20;

  const rectWidth = textWidth + paddingX * 2;
  const rectHeight = textHeight + paddingY * 2;

  // 2. Создаем прямоугольную подложку
  if (typeof penpot.createRectangle !== "function") {
    console.error("[Sticker Generator] penpot.createRectangle is not available");
    return;
  }

  const rect = penpot.createRectangle();
  if (!rect) return;

  rect.name = "Sticker Base";
  rect.resize(rectWidth, rectHeight);
  rect.borderRadius = 8;

  rect.fills = [{
    type: "solid",
    color: color,
    opacity: 1
  }];

  rect.shadows = [{
    type: "drop-shadow",
    color: "#000000",
    opacity: 0.12,
    offsetX: 0,
    offsetY: 4,
    blur: 10,
    spread: 0
  }];

  // Центрируем текст на подложке
  textShape.x = paddingX;
  textShape.y = paddingY;

  // 3. Группируем элементы
  if (typeof penpot.createGroup !== "function") {
    console.error("[Sticker Generator] penpot.createGroup is not available");
    return;
  }

  const group = penpot.createGroup([rect, textShape]);
  if (!group) return;

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

  // Выделяем созданную группу
  if (penpot.selection !== undefined) {
    penpot.selection = [group];
  }
};

// Подписка на сообщения от UI
// В Penpot 2.17 penpot.ui.on отсутствует, поэтому используем window.addEventListener
if (penpot.ui && typeof penpot.ui.on === "function") {
  penpot.ui.on("message", handleMessage);
} else {
  window.addEventListener("message", (event) => {
    if (event && event.data) {
      handleMessage(event.data);
    }
  });
}
