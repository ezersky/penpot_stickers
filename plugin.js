console.log("[Sticker Generator] plugin.js loaded");

// Точка входа плагина для Penpot 2.17
export function main(context) {
  const { ui, on } = context;

  // Открываем UI
  if (ui && typeof ui.open === "function") {
    ui.open("Sticker Generator", "index.html", { width: 260, height: 270 });
  } else {
    console.warn("[Sticker Generator] context.ui.open is not available");
    return;
  }

  // Универсальный обработчик сообщений
  const handleMessage = async (message) => {
    if (!message || message.type !== "create-sticker") return;

    const text = message.text || "Стикер";
    const color = message.color || "#ffffff";

    // 1. Создаем текстовый шейп
    if (typeof context.createText !== "function") {
      console.error("[Sticker Generator] context.createText is not available");
      return;
    }

    const textShape = context.createText();
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
    if (typeof context.waitForLayoutUpdate === "function") {
      await context.waitForLayoutUpdate();
    }

    const textWidth = textShape.width || 0;
    const textHeight = textShape.height || 0;

    // Внутренние отступы
    const paddingX = 24;
    const paddingY = 20;

    const rectWidth = textWidth + paddingX * 2;
    const rectHeight = textHeight + paddingY * 2;

    // 2. Создаем прямоугольную подложку
    if (typeof context.createRectangle !== "function") {
      console.error("[Sticker Generator] context.createRectangle is not available");
      return;
    }

    const rect = context.createRectangle();
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
    if (typeof context.createGroup !== "function") {
      console.error("[Sticker Generator] context.createGroup is not available");
      return;
    }

    const group = context.createGroup([rect, textShape]);
    if (!group) return;

    group.name = `Sticker: ${text.slice(0, 12)}${text.length > 12 ? "..." : ""}`;

    // Центрирование относительно вьюпорта
    let viewportCenterX = 0;
    let viewportCenterY = 0;

    if (context.viewport && context.viewport.center) {
      viewportCenterX = context.viewport.center.x;
      viewportCenterY = context.viewport.center.y;
    } else if (context.viewport) {
      viewportCenterX = (context.viewport.width || 0) / 2;
      viewportCenterY = (context.viewport.height || 0) / 2;
    }

    group.x = viewportCenterX - rectWidth / 2;
    group.y = viewportCenterY - rectHeight / 2;

    // Выделяем созданную группу
    if (context.selection !== undefined) {
      context.selection = [group];
    }
  };

  // Подписка на сообщения от UI через context.on
  // В этом API событие "message" должно быть валидным
  if (typeof on === "function") {
    on("message", handleMessage);
  } else {
    console.warn("[Sticker Generator] context.on is not available");
  }
}
