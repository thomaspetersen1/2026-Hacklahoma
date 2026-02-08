import { useState, useEffect } from "react";
import { C } from "../../assets/colors";

export default function GhostButton({ children, onClick, style }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "12px 28px",
        borderRadius: "999px",
        border: `1.5px solid ${C.black}`,
        background: hover ? C.pink : "transparent",
        color: C.black,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "15px",
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.25s ease",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
