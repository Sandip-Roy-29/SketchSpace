export const toWorld = (clientX, clientY, offset, scale) => {
  return {
    x: (clientX - offset.x) / scale,
    y: (clientY - offset.y) / scale,
  };
};

export const getElementAtPosition = (x, y, elements) => {
  for (let index = elements.length - 1; index >= 0; index--) {
    const el = elements[index];

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
