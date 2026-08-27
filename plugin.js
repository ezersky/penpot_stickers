console.log("[Sticker Generator] plugin.js loaded");

// Открываем интерфейс
penpot.ui.open("Sticker Generator", "index.html", { width: 260, height: 270 });

// Асинхронный слушатель событий
penpot.ui.on("message", async (message) => {
  if (message && message.type === "create-sticker") {
    const text = message.text || "Стикер";
    const color = message.color || "#ffffff";

    // 1. Создаем текстовый шейп
    const textShape = penpot.createText();
    if (!textShape) return;
    
    textShape.name = "Sticker Text";
    textShape.characters = text;
    
    // Применяем настройки шрифта по умолчанию
    textShape.fontFamily = "Inter";
    textShape.fontSize = 15;

    // ВАЖНО ДЛЯ WORD WRAP:
    // Задаем базовую фиксированную ширину текстового контейнера (например, 200px)
    textShape.resize(200, 0); 
    // Включаем авто-высоту. Теперь длинный текст будет переноситься на новые строки!
    textShape.growType = "auto-height"; 

    // Настраиваем цвет шрифта (темный графит)
    textShape.fills = [{
      type: "solid",
      color: "#1e293b",
      opacity: 1
    }];

    // Асинхронно ждем, пока Penpot сделает перенос строк и обсчитает реальную итоговую высоту
    await penpot.waitForLayoutUpdate(); 

    // Получаем финальные размеры текста после переноса слов
    const textWidth = textShape.width;
    const textHeight = textShape.height;

    // Внутренние поля-отступы вокруг текста (padding)
    const paddingX = 24; // Чуть увеличим для красоты длинных текстов
    const paddingY = 20;

    // Рассчитываем размер подложки
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

    // Реалистичная мягкая тень
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

    // 3. Собираем в группу на холсте
    const group = penpot.createGroup([rect, textShape]);
    if (group) {
      group.name = `Sticker: ${text.slice(0, 15)}...`;
      
      // Помещаем ровно по центру экрана пользователя
      group.x = penpot.viewport.center.x - (rectWidth / 2);
      group.y = penpot.viewport.center.y - (rectHeight / 2);

      // Фокусируем выделение на новом объекте
      penpot.selection = [group];
    }
  }
});
