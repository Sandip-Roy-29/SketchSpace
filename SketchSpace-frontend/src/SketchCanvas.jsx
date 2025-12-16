import { useRef, useState, useLayoutEffect } from "react"

const SketchCanvas = () => {
    const canvasRef = useRef(null) 
    const[scale,setScale] = useState(1)
    const [offset,setOffset] = useState({x:0,y:0})
    
    useLayoutEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save;
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
      ctx.fillRect(100,250,200,200)
      ctx.restore;

    },[scale,offset])
return (
    <canvas
    ref={canvasRef}
    width={window.innerWidth}
    height={window.innerHeight}
    />
)
}

export default SketchCanvas