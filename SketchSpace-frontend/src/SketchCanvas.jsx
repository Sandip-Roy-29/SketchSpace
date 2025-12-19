import { useRef, useState, useLayoutEffect } from "react";
import { toWorld } from "./math";

const SketchCanvas = () => {
  const canvasRef = useRef(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [elements, setElements] = useState([]);
  const [action, setAction] = useState("none");
  const [tool,setTool] = useState("hand");

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
    const worldPos = toWorld(e.clientX,e.clientY,offset,scale);

    if(tool === "hand"){
      setAction("panning");
      setStartPan({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      });
    }

    else if(tool === "rectangle"){
      setAction("drawing");
      const newShaps = {
        id: Date.now(),
        type: "rect",
        x: worldPos.x,
        y: worldPos.y,
        width: 0,
        height: 0,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      }; 
      setElements((prev) => [...prev,newShaps]);
    }
  };

  const handleMouseMove = (e) => {
    const worldPos = toWorld(e.clientX,e.clientY,offset,scale)

    if(action === "panning"){
      setOffset({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }

    else if(action === "drawing"){
      setElements((prev) => {
        const newElements = [...prev];
        const currElements = newElements[newElements.length-1]

        currElements.width = worldPos.x - currElements.x;
        currElements.height = worldPos.y - currElements.y;

        return newElements;
      })
    }

  };

  const handleMouseUp = () => setAction("none");

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
    <>
      <div
        style={{
          position: "fixed",
          top: 10,
          left: 10,
          zIndex: 10,
          display: "flex",
          gap: 10,
        }}
      >
        <button
          onClick={() => setTool("hand")}
          style={{
            background: tool === "hand" ? "#ddd" : "#fff",
            padding: "10px",
          }}
        >
          ✋ Hand (Pan)
        </button>
        <button
          onClick={() => setTool("rectangle")}
          style={{
            background: tool === "rectangle" ? "#ddd" : "#fff",
            padding: "10px",
          }}
        >
          ⬜ Rectangle
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
        style={{ display: "block", cursor: tool === "hand" ? "grab" : "crosshair" }}
      />
    </>
  );
};

export default SketchCanvas;
