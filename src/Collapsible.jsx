// Collapsible.jsx
import { useState } from "react";

const Collapsible = ({ title, children }) => {
  const [open, setOpen] = useState(true);

  return (
    <div
      style={{
        marginBottom: "10px",
        border: "1px solid #ccc",
        borderRadius: "6px",
        padding: "10px",
        backgroundColor: "#f8f9fa",
      }}
    >
      <div
        onClick={() => setOpen(!open)}
        style={{
          cursor: "pointer",
          fontWeight: "bold",
          fontSize: "16px",
          color: "#007bff",
          marginBottom: "5px",
        }}
      >
        {title} {open ? "▲" : "▼"}
      </div>
      {open && <div>{children}</div>}
    </div>
  );
};

export default Collapsible;
