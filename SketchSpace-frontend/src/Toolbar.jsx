export const Toolbar = ({ tool, setTool, onClear }) => {
  return (
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
        onClick={() => setTool("selection")}
        style={{
          padding: 10,
          background: tool === "selection" ? "#ddd" : "#fff",
        }}
      >
        ↖ Selection
      </button>
      <button
        onClick={() => setTool("hand")}
        style={{ padding: 10, background: tool === "hand" ? "#ddd" : "#fff" }}
      >
        ✋ Hand
      </button>
      <button
        onClick={() => setTool("rectangle")}
        style={{
          padding: 10,
          background: tool === "rectangle" ? "#ddd" : "#fff",
        }}
      >
        ⬜ Rectangle
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
