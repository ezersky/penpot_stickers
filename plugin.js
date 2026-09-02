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
  container.resize(plan.width, 100); 
  container.fills = [{ fillColor: plan.bg, fillOpacity: 1 }];
  container.borderRadius = plan.radius;

  // Тень для главного контейнера
  container.shadows = [{
    style: 'drop-shadow',
    offsetX: 0,
    offsetY: 2,
    blur: 8,
    spread: 0,
    hidden: false,
    color: { color: '#000000', opacity: 0.15 }
  }];

  // Включаем автолейаут (Flex) для главного контейнера
  const mainFlex = container.addFlexLayout();
  mainFlex.dir = 'column';              
  mainFlex.alignItems = 'stretch';      // Дочерние элементы растягиваются по ширине
  mainFlex.justifyContent = 'start';
  mainFlex.rowGap = plan.titleBodyGap;  
  mainFlex.columnGap = 0;
  mainFlex.topPadding = plan.padding;
  mainFlex.rightPadding = plan.padding;
  mainFlex.bottomPadding = plan.padding;
  mainFlex.leftPadding = plan.padding;

  // Настройка размеров главного контейнера
  container.horizontalSizing = 'fix';   // Фиксированная ширина карточки
  container.verticalSizing = 'auto';    // Высота зависит от контента

  // ========================================
  // 2. СОЗДАЕМ HEADER И ВЛОЖЕННЫЙ ТЕКСТ
  // ========================================
  const headerAutolayout = penpot.createBoard();
  headerAutolayout.name = "Header";
  headerAutolayout.fills = [];

  const headerFlex = headerAutolayout.addFlexLayout();
  headerFlex.dir = 'column';
  headerFlex.alignItems = 'stretch';
  headerFlex.justifyContent = 'start';

  // Создаем текст заголовка
  const titleText = penpot.createText(plan.title);
  titleText.name = "Title";
  titleText.fontFamily = plan.fontFamily;
  titleText.fontSize = String(plan.titleFontSize);
  titleText.fontWeight = "700";
  titleText.fills = [{ fillColor: plan.textColor, fillOpacity: 1 }];

  // ПОРЯДОК ВАЖЕН: Сначала вкладываем элементы друг в друга
  headerAutolayout.appendChild(titleText);
  container.appendChild(headerAutolayout);

  // ПОРЯДОК ВАЖЕН: Настраиваем sizing ТОЛЬКО ПОСЛЕ вложения в контейнеры
  titleText.growType = "auto-height";
  titleText.horizontalSizing = 'fill';
  titleText.verticalSizing = 'auto';

  headerAutolayout.horizontalSizing = 'fill';
  headerAutolayout.verticalSizing = 'auto';

  console.log("[Stickers] Header attached and configured");

  // ========================================
  // 3. СОЗДАЕМ TEXT И ВЛОЖЕННЫЙ ТЕКСТ
  // ========================================
  if (plan.text) {
    const textAutolayout = penpot.createBoard();
    textAutolayout.name = "Text";
    textAutolayout.fills = [];

    const textFlex = textAutolayout.addFlexLayout();
    textFlex.dir = 'column';
    textFlex.alignItems = 'stretch';
    textFlex.justifyContent = 'start';

    // Создаем текст body
    const bodyText = penpot.createText(plan.text);
    bodyText.name = "Body";
    bodyText.fontFamily = plan.fontFamily;
    bodyText.fontSize = String(plan.bodyFontSize);
    bodyText.fontWeight = "400";
    bodyText.fills = [{ fillColor: plan.textColor, fillOpacity: 1 }];

    // ПОРЯДОК ВАЖЕН: Сначала вкладываем элементы друг в друга
    textAutolayout.appendChild(bodyText);
    container.appendChild(textAutolayout);

    // ПОРЯДОК ВАЖЕН: Настраиваем sizing ТОЛЬКО ПОСЛЕ вложения в контейнеры
    bodyText.growType = "auto-height";
    bodyText.horizontalSizing = 'fill';
    bodyText.verticalSizing = 'auto';

    textAutolayout.horizontalSizing = 'fill';
    textAutolayout.verticalSizing = 'auto';

    console.log("[Stickers] Text attached and configured");
  }

  console.log("[Stickers] Sticker created successfully");
  return { id: container.id, x: anchor.x, y: anchor.y };
}
