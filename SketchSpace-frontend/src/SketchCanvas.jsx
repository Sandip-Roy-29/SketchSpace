import { useRef, useState, useLayoutEffect } from "react";
import { toWorld } from "./math";

const SketchCanvas = () => {
  const canvasRef = useRef(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // ================= DRAW =================
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, offset.x, offset.y);

    // Grid
    const gridSize = 50;
    ctx.beginPath();
    ctx.lineWidth = 1 / scale;
    ctx.strokeStyle = "#ddd";

    for (let x = -2000; x <= 2000; x += gridSize) {
      ctx.moveTo(x, -2000);
      ctx.lineTo(x, 2000);
    }
    for (let y = -2000; y <= 2000; y += gridSize) {
      ctx.moveTo(-2000, y);
      ctx.lineTo(2000, y);
    }

    ctx.stroke();

    ctx.fillStyle = "blue";
    ctx.fillRect(100, 250, 200, 200);

    ctx.restore();
  }, [scale, offset]);

  // ================= PAN =================
  const handleMouseDown = (e) => {
    setPanning(true);
    setStartPan({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!panning) return;

    setOffset({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y,
    });
  };

  const handleMouseUp = () => setPanning(false);

  // ================= ZOOM =================
  const handleWheel = (e) => {
    e.preventDefault();

    const zoomIntensity = 0.2;
    const direction = e.deltaY < 0 ? 1 : -1;
    const newScale = scale * Math.exp(zoomIntensity * direction);

    const worldPos = toWorld(e.clientX, e.clientY, offset, scale);

    setScale(newScale);
    setOffset({
      x: e.clientX - worldPos.x * newScale,
      y: e.clientY - worldPos.y * newScale,
    });
  };

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      style={{ display: "block", cursor: panning ? "grabbing" : "grab" }}
    />
  );
};

export default SketchCanvas;
