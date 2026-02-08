import { useState, useEffect } from "react";
import { C } from "../../assets/colors";

export default function Card({ children, style, onClick, hoverable }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: C.white,
        borderRadius: "20px",
        padding: "24px",
        boxShadow:
          hover && hoverable
            ? "0 12px 40px rgba(0,0,0,0.1)"
            : "0 2px 12px rgba(0,0,0,0.06)",
        transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
        transform: hover && hoverable ? "translateY(-4px)" : "translateY(0)",
        cursor: hoverable ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
