console.log("[Sticker Generator] plugin.js loaded");

// Инициализируем интерфейс плагина
penpot.ui.open("Sticker Generator", "index.html", { width: 260, height: 270 });

// Универсальный обработчик сообщений
const handleMessage = async (message) => {
  if (message && message.type === "create-sticker") {
    const text = message.text || "Стикер";
    const color = message.color || "#ffffff";

    // 1. Создаем текстовый шейп
    const textShape = penpot.createText();
    if (!textShape) return;
    
    textShape.name = "Sticker Text";
    textShape.characters = text;
    
    // Дефолтный шрифт Inter 15px
    textShape.fontFamily = "Inter";
    textShape.fontSize = 15;

    // Включаем автоперенос (word wrap)
    textShape.resize(200, 0); 
    textShape.growType = "auto-height"; 

    // Цвет текста (темный графит)
    textShape.fills = [{
      type: "solid",
      color: "#1e293b",
      opacity: 1
    }];

    // Ждем обновления лейаута Penpot для точного расчета высоты текста
    await penpot.waitForLayoutUpdate(); 

    const textWidth = textShape.width;
    const textHeight = textShape.height;

    // Внутренние отступы
    const paddingX = 24;
    const paddingY = 20;

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

    // Эффект мягкой тени
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

    // 3. Группируем элементы на холсте
    const group = penpot.createGroup([rect, textShape]);
    if (group) {
      group.name = `Sticker: ${text.slice(0, 12)}...`;
      
      // Центрируем относительно экрана пользователя
      group.x = penpot.viewport.center.x - (rectWidth / 2);
      group.y = penpot.viewport.center.y - (rectHeight / 2);

      // Фокусируем выделение
      penpot.selection = [group];
    }
  }
};

// ЗАЩИТА ОТ КОНФЛИКТОВ API: Проверяем, какой метод подписки доступен в текущей версии Penpot
if (typeof penpot.on === "function") {
  // Актуальный современный метод
  penpot.on("message", handleMessage);
} else if (penpot.ui && typeof penpot.ui.on === "function") {
  // Устаревший метод (на случай, если движок инстанса требует его)
  penpot.ui.on("message", handleMessage);
} else {
  // Глобальный фолбек для старых сборок среды
  window.addEventListener("message", (event) => {
    if (event.data) handleMessage(event.data);
  });
}
