console.log("[Sticker Generator] plugin.js loaded");

// Открываем нативный интерфейс Penpot UI
penpot.ui.open("Sticker Generator", "index.html", { width: 260, height: 270 });

// ИСПРАВЛЕНИЕ: В современном API Penpot слушатель сообщений вешается напрямую на объект penpot, а не на penpot.ui
penpot.on("message", async (message) => {
  // Проверяем валидность пришедшего из index.html сообщения
  if (message && message.type === "create-sticker") {
    const text = message.text || "Стикер";
    const color = message.color || "#ffffff";

    // 1. Создаем текстовый объект
    const textShape = penpot.createText();
    if (!textShape) return;
    
    textShape.name = "Sticker Text";
    textShape.characters = text;
    
    // Задаем шрифт по умолчанию Inter 15px
    textShape.fontFamily = "Inter";
    textShape.fontSize = 15;

    // Включаем word wrap: фиксируем ширину текстового блока, высота подстроится под текст
    textShape.resize(200, 0); 
    textShape.growType = "auto-height"; 

    // Применяем темно-серый цвет для текста (высокий контраст)
    textShape.fills = [{
      type: "solid",
      color: "#1e293b",
      opacity: 1
    }];

    // Ждем, пока Penpot обсчитает геометрию текстовых строк после переноса
    await penpot.waitForLayoutUpdate(); 

    const textWidth = textShape.width;
    const textHeight = textShape.height;

    // Задаем внутренние отступы (padding)
    const paddingX = 24;
    const paddingY = 20;

    // Вычисляем итоговый размер подложки стикера
    const rectWidth = textWidth + (paddingX * 2);
    const rectHeight = textHeight + (paddingY * 2);

    // 2. Создаем прямоугольную подложку
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

    // Добавляем мягкую тень под стикер
    rect.shadows = [{
      type: "drop-shadow",
      color: "#000000",
      opacity: 0.12,
      offsetX: 0,
      offsetY: 4,
      blur: 10,
      spread: 0
    }];

    // Центрируем текст внутри подложки с учетом отступов
    textShape.x = paddingX;
    textShape.y = paddingY;

    // 3. Объединяем прямоугольник и текст в одну группу
    const group = penpot.createGroup([rect, textShape]);
    if (group) {
      group.name = `Sticker: ${text.slice(0, 15)}...`;
      
      // Позиционируем по центру текущего экрана дизайнера
      group.x = penpot.viewport.center.x - (rectWidth / 2);
      group.y = penpot.viewport.center.y - (rectHeight / 2);

      // Автоматически выделяем созданный стикер
      penpot.selection = [group];
    }
  }
});

