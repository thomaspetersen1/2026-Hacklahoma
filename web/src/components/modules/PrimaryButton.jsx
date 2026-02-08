import { useState, useEffect } from "react";
import { C } from "../../assets/colors";

export default function PrimaryButton({ children, onClick, disabled, style }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "16px 48px",
        borderRadius: "999px",
        border: "none",
        background: disabled ? "#e0e0e0" : C.yellow,
        color: disabled ? "#999" : C.black,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "17px",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
        transform: hover && !disabled ? "translateY(-2px)" : "translateY(0)",
        boxShadow:
          hover && !disabled
            ? "0 8px 28px rgba(255,216,131,0.5)"
            : "0 4px 16px rgba(255,216,131,0.25)",
        letterSpacing: "0.3px",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
