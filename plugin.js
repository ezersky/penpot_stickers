function insertSticker(plan) {
  const anchor = nextAnchor(plan.width);

  console.log("[Stickers] Creating main sticker container...");

  // ========================================
  // 1. СОЗДАЕМ ГЛАВНЫЙ КОНТЕЙНЕР (Sticker)
  // ========================================
  const container = penpot.createBoard();
  container.name = "Sticker";
  container.x = anchor.x;
  container.y = anchor.y;
  
  // Задаем базовый размер. Высота автоматически адаптируется.
  container.resize(plan.width, 100); 
  container.fills = [{ fillColor: plan.bg, fillOpacity: 1 }];
  container.borderRadius = plan.radius;

  // Тень для карточки
  container.shadows = [{
    style: 'drop-shadow',
    offsetX: 0,
    offsetY: 2,
    blur: 8,
    spread: 0,
    hidden: false,
    color: { color: '#000000', opacity: 0.15 }
  }];

  // Настраиваем Flex Layout для главного контейнера
  const mainFlex = container.addFlexLayout();
  mainFlex.dir = 'column';              // Элементы идут сверху вниз
  mainFlex.alignItems = 'stretch';      // Растягиваем элементы на всю ширину
  mainFlex.justifyContent = 'start';
  mainFlex.rowGap = plan.titleBodyGap;  // Динамический отступ между Title и Body
  mainFlex.columnGap = 0;
  mainFlex.topPadding = plan.padding;
  mainFlex.rightPadding = plan.padding;
  mainFlex.bottomPadding = plan.padding;
  mainFlex.leftPadding = plan.padding;

  // Управляем сайзингом главного контейнера
  container.horizontalSizing = 'fix';   // Ширина жестко фиксирована (plan.width)
  container.verticalSizing = 'auto';    // Высота растет сама по мере добавления текста

  // ========================================
  // 2. СОЗДАЕМ И ВЛОЖАЕМ ТЕКСТ ЗАГОЛОВКА (Title)
  // ========================================
  const titleText = penpot.createText(plan.title);
  titleText.name = "Title";
  titleText.fontFamily = plan.fontFamily;
  titleText.fontSize = String(plan.titleFontSize);
  titleText.fontWeight = "700";
  titleText.fills = [{ fillColor: plan.textColor, fillOpacity: 1 }];

  // Сначала добавляем текстовый слой напрямую в Sticker
  container.appendChild(titleText);

  // Настраиваем поведение текстового блока сразу после вложения
  titleText.growType = "auto-height";   // Автоперенос строк и рост вниз
  titleText.horizontalSizing = 'fill'; // Заполнить ширину контейнера (минус padding)
  titleText.verticalSizing = 'auto';    // Высота зависит от контента

  console.log("[Stickers] Title added directly to Sticker");

  // ========================================
  // 3. СОЗДАЕМ И ВЛОЖАЕМ ОСНОВНОЙ ТЕКСТ (Body)
  // ========================================
  if (plan.text) {
    const bodyText = penpot.createText(plan.text);
    bodyText.name = "Body";
    bodyText.fontFamily = plan.fontFamily;
    bodyText.fontSize = String(plan.bodyFontSize);
    bodyText.fontWeight = "400";
    bodyText.fills = [{ fillColor: plan.textColor, fillOpacity: 1 }];

    // Добавляем слой текста напрямую в Sticker ниже заголовка
    container.appendChild(bodyText);

    // Настраиваем поведение
    bodyText.growType = "auto-height";   // Автоперенос строк и рост вниз
    bodyText.horizontalSizing = 'fill'; // Заполнить ширину контейнера (минус padding)
    bodyText.verticalSizing = 'auto';    // Высота зависит от контента

    console.log("[Stickers] Body added directly to Sticker");
  }

  console.log("[Stickers] Sticker created successfully without nested layout bugs");
  return { id: container.id, x: anchor.x, y: anchor.y };
}
