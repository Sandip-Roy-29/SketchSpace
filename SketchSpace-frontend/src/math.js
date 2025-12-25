export const toWorld = (screenX, screenY, scale, offset) => {
  return {
    x: (screenX - offset.x) / scale,
    y: (screenY - offset.y) / scale,
  };
};

export const getElementAtPosition = (x, y, elements) => {
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];

    // Only hit test Rectangles for now
    if (el.type === "rect") {
      const minX = Math.min(el.x, el.x + el.width);
      const maxX = Math.max(el.x, el.x + el.width);
      const minY = Math.min(el.y, el.y + el.height);
      const maxY = Math.max(el.y, el.y + el.height);

      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        return el;
      }
    }
  }
  return null;
};
