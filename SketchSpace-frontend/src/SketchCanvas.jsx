import { useRef, useState, useLayoutEffect } from "react";
import { toWorld } from "./math";

const SketchCanvas = () => {
  const canvasRef = useRef(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [elements, setElements] = useState([
    {
      id: 1,
      type: "rect",
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      color: "red",
    },
    {
      id: 2,
      type: "rect",
      x: 300,
      y: 200,
      width: 150,
      height: 100,
      color: "blue",
    },
  ]);
  const [isPanning, setIsPanning] = useState(false);

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

    elements.forEach((el) => {
      ctx.fillStyle = el.color;
      if (el.type == "rect") {
        ctx.fillRect(el.x, el.y, el.width, el.height);
      }
    });

    ctx.restore();
  }, [scale, offset, elements]);

  // ================= PAN =================
  const handleMouseDown = (e) => {
    setIsPanning(true);
    setStartPan({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    });
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setOffset({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    } else {
      return;
    }
  };

  const handleMouseUp = () => setIsPanning(false);

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

  const addRandomShape = () => {
    const newShaps = {
      id: Date.now(),
      type: "rect",
      x: Math.random() * 500,
      y: Math.random() * 500,
      width: Math.random() * 100,
      height: Math.random() * 100,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`, // Random Color
    };
    setElements([...elements, newShaps]);
  };

  return (
    <>
      <div style={{ position: "fixed", top: 10, left: 10, zIndex: 10 }}>
        <button
          onClick={addRandomShape}
          style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}
        >
          + Add Random Box
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{ display: "block", cursor: isPanning ? "grabbing" : "grab" }}
      />
    </>
  );
};

export default SketchCanvas;
