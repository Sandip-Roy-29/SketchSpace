export const toWorld = (clientX, clientY, offset, scale) => {
  return {
    x: (clientX - offset.x) / scale,
    y: (clientY - offset.y) / scale,
  };
};
