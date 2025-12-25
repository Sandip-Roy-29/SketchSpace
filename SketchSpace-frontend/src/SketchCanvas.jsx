import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { toWorld, getElementAtPosition } from "./math";
import Toolbar from "./Toolbar";

const GameCanvas = () => {
  const canvasRef = useRef(null);
  const textareaRef = useRef(null);

  const [elements, setElements] = useState(() => {
    const saved = localStorage.getItem("canvas-elements");
    return saved ? JSON.parse(saved) : [];
  });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState("selection");
  const [selectedId, setSelectedId] = useState(null);
  const [action, setAction] = useState("none");
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [writingPos, setWritingPos] = useState({
    screenX: 0,
    screenY: 0,
    worldX: 0,
    worldY: 0,
  });

  const activeElement = elements.find((el) => el.id === selectedId);

  const updateElement = (id, overrides) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...overrides } : el))
    );
  };

  useEffect(() => {
    localStorage.setItem("canvas-elements", JSON.stringify(elements));
  }, [elements]);

  useEffect(() => {
    if (action === "writing" && textareaRef.current) {
      setTimeout(() => textareaRef.current.focus(), 0);
    }
  }, [action]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, offset.x, offset.y);

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
        ctx.fillStyle = el.color || "blue";
        ctx.fillRect(el.x, el.y, el.width, el.height);
        if (el.id === selectedId) {
          ctx.strokeStyle = "#0088ff";
          ctx.lineWidth = 2 / scale;
          ctx.strokeRect(el.x, el.y, el.width, el.height);
        }
      }

      if (el.type === "pencil") {
        ctx.strokeStyle = el.color || "black";
        ctx.lineWidth = el.strokeWidth || 3; // Use custom thickness!
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        if (el.points.length > 0) {
          ctx.moveTo(el.points[0].x, el.points[0].y);
          for (let i = 1; i < el.points.length - 1; i++) {
            const p1 = el.points[i];
            const p2 = el.points[i + 1];
            const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
            ctx.quadraticCurveTo(p1.x, p1.y, mid.x, mid.y);
          }
          if (el.points.length > 1) {
            const last = el.points[el.points.length - 1];
            ctx.lineTo(last.x, last.y);
          }
        }
        ctx.stroke();
      }

      if (el.type === "text") {
        ctx.textBaseline = "top";
        ctx.font = "24px sans-serif";
        ctx.fillStyle = el.color || "black";
        ctx.fillText(el.text, el.x, el.y);
      }
    });

    ctx.restore();
  }, [scale, offset, elements, selectedId]);

  const handleMouseDown = (e) => {
    if (action === "writing") return;
    const worldPos = toWorld(e.clientX, e.clientY, scale, offset);

    if (tool === "hand") {
      setAction("panning");
      setStartPan({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    } else if (tool === "selection") {
      const clickedElement = getElementAtPosition(
        worldPos.x,
        worldPos.y,
        elements
      );
      if (clickedElement) {
        setSelectedId(clickedElement.id);
        if (clickedElement.type === "rect") {
          setAction("moving");
          setDragOffset({
            x: worldPos.x - clickedElement.x,
            y: worldPos.y - clickedElement.y,
          });
        }
      } else {
        setSelectedId(null);
        setAction("none");
      }
    } else if (tool === "rect") {
      setAction("drawing");
      const newElement = {
        id: Date.now(),
        type: "rect",
        x: worldPos.x,
        y: worldPos.y,
        width: 0,
        height: 0,
        color: "blue",
      };
      setElements((prev) => [...prev, newElement]);
      setSelectedId(null);
    } else if (tool === "pencil") {
      setAction("drawing");
      const newElement = {
        id: Date.now(),
        type: "pencil",
        points: [{ x: worldPos.x, y: worldPos.y }],
        color: "black",
        strokeWidth: 3,
      };
      setElements((prev) => [...prev, newElement]);
      setSelectedId(null);
    } else if (tool === "text") {
      setAction("writing");
      setWritingPos({
        screenX: e.clientX,
        screenY: e.clientY,
        worldX: worldPos.x,
        worldY: worldPos.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    const worldPos = toWorld(e.clientX, e.clientY, scale, offset);

    if (action === "panning") {
      setOffset({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    } else if (action === "drawing") {
      setElements((prev) => {
        const copy = [...prev];
        const current = copy[copy.length - 1];
        if (current.type === "rect") {
          current.width = worldPos.x - current.x;
          current.height = worldPos.y - current.y;
        }
        if (current.type === "pencil") {
          current.points = [
            ...current.points,
            { x: worldPos.x, y: worldPos.y },
          ];
        }
        return copy;
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

  const handleMouseUp = () => {
    if (action === "writing") return;
    setAction("none");
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const wheel = e.deltaY < 0 ? 1 : -1;
    const newScale = Math.exp(wheel * zoomIntensity) * scale;
    const worldPos = toWorld(e.clientX, e.clientY, scale, offset);

    setScale(newScale);
    setOffset({
      x: e.clientX - worldPos.x * newScale,
      y: e.clientY - worldPos.y * newScale,
    });
  };

  const handleBlur = (e) => {
    const text = e.target.value;
    if (text.trim() !== "") {
      setElements((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "text",
          x: writingPos.worldX,
          y: writingPos.worldY,
          text: text,
          color: "black",
        },
      ]);
    }
    setAction("none");
    setTool("selection");
  };

  const getCursor = () => {
    if (tool === "text") return "text";
    if (tool === "hand") return action === "panning" ? "grabbing" : "grab";
    if (tool === "selection") return "default";
    return "crosshair";
  };

  return (
    <div>
      <Toolbar
        tool={tool}
        setTool={setTool}
        onClear={() => {
          setElements([]);
          localStorage.removeItem("canvas-elements");
        }}
      />

      {activeElement && (
        <div
          style={{
            position: "fixed",
            top: 10,
            right: 10,
            zIndex: 10,
            background: "white",
            padding: "10px",
            border: "1px solid #ccc",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            borderRadius: "5px",
          }}
        >
          <span style={{ fontWeight: "bold", fontSize: "14px" }}>
            Properties
          </span>

          <label style={{ fontSize: "12px" }}>
            Color:
            <input
              type="color"
              value={activeElement.color || "#000000"}
              onChange={(e) =>
                updateElement(activeElement.id, { color: e.target.value })
              }
              style={{ marginLeft: "5px" }}
            />
          </label>

          {activeElement.type === "pencil" && (
            <label style={{ fontSize: "12px" }}>
              <input
                type="range"
                min="1"
                max="20"
                value={activeElement.strokeWidth || 3}
                onChange={(e) =>
                  updateElement(activeElement.id, {
                    strokeWidth: parseInt(e.target.value),
                  })
                }
              />
            </label>
          )}
        </div>
      )}

      {action === "writing" && (
        <textarea
          ref={textareaRef}
          onBlur={handleBlur}
          style={{
            position: "fixed",
            top: writingPos.screenY,
            left: writingPos.screenX,
            background: "transparent",
            border: "1px dashed #0088ff",
            font: "24px sans-serif",
            color: "black",
            zIndex: 20,
            outline: "none",
            margin: 0,
            padding: 0,
          }}
        />
      )}

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
    </div>
  );
};

export default GameCanvas;
