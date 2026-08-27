console.log("[Sticker Generator] plugin.js loaded");

console.log("[Sticker Generator] penpot keys:", Object.keys(penpot || {}));

if (penpot.ui) {
  console.log("[Sticker Generator] penpot.ui keys:", Object.keys(penpot.ui));
} else {
  console.log("[Sticker Generator] penpot.ui is undefined");
}

// Пробуем открыть UI
if (penpot && penpot.ui && typeof penpot.ui.open === "function") {
  penpot.ui.open("Sticker Generator", "index.html", { width: 260, height: 270 });
} else {
  console.warn("[Sticker Generator] penpot.ui.open is not available");
}

// Пока не подписываемся на сообщения, чтобы не было ошибки
