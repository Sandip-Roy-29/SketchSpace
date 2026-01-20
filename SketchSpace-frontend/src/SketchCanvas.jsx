import { useRef, useState, useEffect, useLayoutEffect, useCallback } from "react";
import { toWorld, getElementAtPosition } from "./math";
import Toolbar from "./Toolbar";
import rough from "roughjs";

const SketchCanvas = () => {
  const canvasRef = useRef(null);
  const textareaRef = useRef(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [action, setAction] = useState("none");
  const [elements,setElements] = useState(() =>{
    const save = localStorage.getItem("canvas-elements");
    return save ? JSON.parse(save) : [];
  });
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [writingPos, setWritingPos] = useState({ screenX: 0, screenY: 0, worldX:0, worldY: 0 });
  const [selectedId,setSelectedId] = useState(null);
  const [tool,setTool] = useState("none");

  const activeElement = elements.find(el => el.id === selectedId);

  useEffect(() =>{
    localStorage.setItem("canvas-elements",JSON.stringify(elements));
  },[elements])

  const updateElement = (id, overrides) => {
  setElements(prev =>
    prev.map(el =>
      el.id === id ? { ...el, ...overrides } : el
    )
  );
};


  useEffect(() => {
  const original = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  return () => document.body.style.overflow = original;
}, []);


  useEffect(() => {
    if (action === "writing" && textareaRef.current) {
      setTimeout(() => textareaRef.current.focus(), 0);
    }
  }, [action]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rc = rough.canvas(canvas);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, offset.x, offset.y);

    elements.forEach((el) => {
      if (el.type === "rect") {
        rc.rectangle(el.x,el.y,el.width,el.height,{
          stroke: el.color,
          strokeWidth: 2,
          roughness: 2,
          fill: el.color,
          fillStyle: "zigzag-line",
        });
        if (el.id === selectedId) {
            ctx.strokeStyle = "#0088ff";
            ctx.lineWidth = 3 / scale;
            ctx.strokeRect(el.x, el.y, el.width, el.height);
        }
      }
      if (el.type === "pencil") {
        ctx.strokeStyle = el.color || "black";
        ctx.lineWidth = el.strokeWidth || 3;
        ctx.lineCap = "round"; 
        ctx.lineJoin = "round";
        ctx.beginPath();
        if (el.points.length > 0) {
          ctx.moveTo(el.points[0].x, el.points[0].y);
          for (let index = 1; index < el.points.length - 1; index++) {
            const p1 = el.points[index];
            const p2 = el.points[index + 1];
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
      setSelectedId("null");
      setStartPan({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    } 
    else if (tool === "rect") {
      setAction("drawing");
      const newShape = {
        id: Date.now(),
        type: "rect",
        x: worldPos.x,
        y: worldPos.y,
        width: 0,
        height: 0,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      };
      setElements((prev) => [...prev,newShape]);
      setSelectedId(null);
    } 
    else if (tool === "pencil") {
      setAction("drawing");
      const newShape = {
        id: Date.now(),
        type: "pencil",
        points: [{ x: worldPos.x, y: worldPos.y }],
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        strokeWidth: 3,
      };
      setElements((prev) => [...prev,newShape]);
      setSelectedId(null);
    } 
    else if (tool === "text") {
      setAction("writing");
      setSelectedId(null);
      setWritingPos({
        screenX: e.clientX,
        screenY: e.clientY,
        worldX: worldPos.x,
        worldY: worldPos.y,
      });
    }else{
    const selectedElement = getElementAtPosition(worldPos.x, worldPos.y, elements);
    if (selectedElement) {
      setSelectedId(selectedElement.id);
        
      if (selectedElement.type === "rect") {
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
    const worldPos = toWorld(e.clientX, e.clientY, scale, offset);

    if (action === "panning") {
      setOffset({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    } 
    else if (action === "drawing") {
      setElements((prev) => {
        const newElements = [...prev];
        const curr = newElements[newElements.length - 1];

        const update = {
          ...curr,
          width: worldPos.x - curr.x,
          height: worldPos.y - curr.y
        }

        newElements[newElements.length - 1] = update;
        return newElements;
      });
    } 
    else if (action === "moving") {
      setElements((prev) => prev.map((el) => {
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

  const handleWheel = useCallback((e) => {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      const zoomIntensity = 0.1;
      const direction = e.deltaY < 0 ? 1 : -1;
      const newScale = scale * Math.exp(zoomIntensity * direction);
      const worldPos = toWorld(e.clientX, e.clientY, scale, offset);
  
      setScale(newScale);
      setOffset({
        x: e.clientX - worldPos.x * newScale,
        y: e.clientY - worldPos.y * newScale,
      });
      return;
    }

    const panSpeed = 1 / scale;

    const trackPad = Math.abs(e.deltaX) > 0 && Math.abs(e.deltaY) < 40;

    if(trackPad){
      setOffset((prev) => ({
        x: prev.x - e.deltaX * panSpeed,
        y: prev.y - e.deltaY * panSpeed,
      }))
    }else{
      if(e.shiftKey){
        setOffset((prev) => ({
          ...prev,
          x: prev.x - e.deltaY * panSpeed,
        }))
      }else{
        setOffset((prev) => ({
          ...prev,
          y: prev.y - e.deltaY * panSpeed,
        }))
      }
    }
  },[offset,scale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if(!canvas) return;

    canvas.addEventListener("wheel", handleWheel, { passive: false});
    return () => canvas.removeEventListener("wheel", handleWheel);
  },[handleWheel]);

  const handleBlur = (e) => {
    const text = e.target.value;
    if (text.trim() !== "") {
      setElements(prev => [
        ...prev,
        {
          id: Date.now(),
          type: "text",
          x: writingPos.worldX,
          y: writingPos.worldY,
          text: text,
          color: "black",
      }]);
    }
    setAction("none");
    setTool("selection");
  };

  const getCursor = () => {
    if (tool === "text") return "text";
    if (tool === "hand") return action === "panning" ? "grabbing" : "grab";
    if (tool === "rect") return "crosshair";
    return "default";
  };

  return (
    <>
      <Toolbar
        tool={tool}
        setTool={setTool}
        onClear={() => setElements([])}
      />
      
      {activeElement && (
        <div style={{ position: "fixed", top: 10, right: 10, zIndex: 10, background: "white", padding: "10px", border: "1px solid #ccc", display: "flex", flexDirection: "column", gap: "5px", borderRadius: "5px" }}>
          <span style={{ fontWeight: "bold", fontSize: "14px" }}>Properties</span>
          <label style={{ fontSize: "12px" }}>
            <input
              type="color"
              value={activeElement.color || "#000000"}
              onChange={(e) => updateElement(activeElement.id, { color: e.target.value })}
              style={{ marginLeft: "5px" }}
            />
          </label>
          {activeElement.type === "pencil" && (
            <label style={{ fontSize: "12px" }}>
              <input
                type="range" min="1" max="20"
                value={activeElement.strokeWidth || 3}
                onChange={(e) => updateElement(activeElement.id, { strokeWidth: parseInt(e.target.value) })}
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
            position: "fixed", top: writingPos.screenY, left: writingPos.screenX,
            background: "transparent", border: "1px dashed #0088ff", font: "24px sans-serif", color: "black", zIndex: 20, outline: "none", margin: 0, padding: 0,
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
        style={{ display: "block", cursor: getCursor() }}
      />
    </>
  );
};

export default SketchCanvas;