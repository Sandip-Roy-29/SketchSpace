import { useRef, useState, useLayoutEffect, useEffect } from "react";
import { toWorld, getEllementAtPosition } from "./math";
import { Toolbar } from "./Toolbar";

const SketchCanvas = () => {
  const canvasRef = useRef(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [elements, setElements] = useState(() => {
    const saved = localStorage.getItem("canvas-elements");
    return saved ? JSON.parse(saved) : [];
  });
  const [action, setAction] = useState("none");
  const [tool, setTool] = useState("hand");
  const [selectedId, setSelectedId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    localStorage.setItem("canvas-elements", JSON.stringify(elements));
  }, [elements]);

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
      if (el.type === "rect") {
        ctx.fillStyle = el.color;
        ctx.fillRect(el.x, el.y, el.width, el.height);
      }

      if (el.id === selectedId) {
        ctx.strokeStyle = "#0088ff";
        ctx.lineWidth = 3 / scale;
        ctx.strokeRect(el.x, el.y, el.width, el.height);
      }

      if (el.type === "pencil") {
        ctx.strokeStyle = el.color || "black";
        ctx.lineWidth = 3;
        (ctx.lineCap = "round"), (ctx.lineJoin = "round");

        ctx.beginPath();
        if (el.points.length > 0) {
          ctx.moveTo(el.points[0].x, el.points[0].y);
          for (let index = 1; index < el.points.length-1; index++) {
            const p1 = el.points[index];
            const p2 = el.points[index+1]
            
            const midPoint = {
              x: (p1.x + p2.x) / 2,
              y: (p1.y + p2.y) /2
            }

            ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
          }
          if (el.points.length>1) {
            const lastPoint = el.points[el.points.length-1]
            ctx.lineTo(lastPoint.x, lastPoint.y)
          }
        }
        ctx.stroke();
      }
    });

    ctx.restore();
  }, [scale, offset, elements, selectedId]);

  // ================= PAN =================
  const handleMouseDown = (e) => {
    const worldPos = toWorld(e.clientX, e.clientY, offset, scale);

    if (tool === "hand") {
      setAction("panning");
      setStartPan({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      });
    } else if (tool === "rectangle") {
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
      setElements((prev) => [...prev, newShaps]);
    } else if (tool === "pencil") {
      setAction("drawing");
      const newElements = {
        id: Date.now(),
        type: "pencil",
        points: [{ x: worldPos.x, y: worldPos.y }],
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      };

      setElements((prev) => [...prev, newElements]);
      setSelectedId(null);
    } else if (tool === "selection") {
      const selectedElement = getEllementAtPosition(
        worldPos.x,
        worldPos.y,
        elements
      );

      if (selectedElement) {
        setSelectedId(selectedElement.id);
        if (selectedElement.id === "rect") {
          setAction("moving");
          setDragOffset({
            x: worldPos.x - selectedElement.x,
            y: worldPos.y - selectedElement.y,
          });
        }
      } else {
        setSelectedId(null);
        setAction("none");
      }
    }
  };

  const handleMouseMove = (e) => {
    const worldPos = toWorld(e.clientX, e.clientY, offset, scale);

    if (action === "panning") {
      setOffset({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    } else if (action === "drawing") {
      setElements((prev) => {
        const newElements = [...prev];
        const currElements = newElements[newElements.length - 1];

        if (currElements.type === "rect") {
          currElements.width = worldPos.x - currElements.x;
          currElements.height = worldPos.y - currElements.y;
        }

        if (currElements.type === "pencil") {
          currElements.points = [
            ...currElements.points,
            { x: worldPos.x, y: worldPos.y },
          ];
        }

        return newElements;
      });
    } else if (action === "moving") {
      setElements((prev) =>
        prev.map((el) => {
          if (el.id === selectedId) {
            return {
              ...el,
              x: worldPos.x - dragOffset.x,
              y: worldPos.y - dragOffset.y,
            };
          }
          return el;
        })
      );
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

  const getCursor = () => {
    if (tool == "hand") {
      return action === "panning" ? "grabbing" : "grab";
    }
    if (tool === "selection") {
      return "default";
    }
    return "crosshair";
  };

  return (
    <>
      <Toolbar
        tool={tool}
        setTool={setTool}
        onClear={() => {
          setElements([]);
          localStorage.removeItem("canvas-elements");
        }}
      />
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{ display: "block", cursor: getCursor() }}
      />
    </>
  );
};

export default SketchCanvas;
