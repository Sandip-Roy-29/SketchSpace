const Toolbar = ({ tool, setTool, onClear }) => {
  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        left: 10,
        zIndex: 10,
        display: "flex",
        gap: "10px",
      }}
    >
      <button
        onClick={() => setTool("selection")}
        style={{
          padding: "10px",
          background: tool === "selection" ? "#ddd" : "#fff",
        }}
      >
        ↖ Selection
      </button>

      <button
        onClick={() => setTool("hand")}
        style={{
          padding: "10px",
          background: tool === "hand" ? "#ddd" : "#fff",
        }}
      >
        ✋ Hand
      </button>

      <button
        onClick={() => setTool("rect")}
        style={{
          padding: "10px",
          background: tool === "rect" ? "#ddd" : "#fff",
        }}
      >
        ⬜ Rectangle
      </button>

      <button
        onClick={() => setTool("pencil")}
        style={{
          padding: "10px",
          background: tool === "pencil" ? "#ddd" : "#fff",
        }}
      >
        ✏️ Pencil
      </button>

      <button
        onClick={() => setTool("text")}
        style={{
          padding: "10px",
          background: tool === "text" ? "#ddd" : "#fff",
        }}
      >
        T Text
      </button>

      <button
        onClick={onClear}
        style={{ padding: "10px", background: "#ffdddd" }}
      >
        🗑️ Clear
      </button>
    </div>
  );
};

export default Toolbar;
