import { useState, useEffect } from "react";
import { C } from "../../assets/colors";

export default function PillToggle({ label, selected, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 22px",
        borderRadius: "999px",
        border: selected ? `2px solid ${C.black}` : `2px solid #c8c8c8`,
        background: selected ? C.yellow : C.white,
        color: C.black,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "15px",
        fontWeight: selected ? 600 : 400,
        cursor: "pointer",
        transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
        transform: selected ? "scale(1.05)" : "scale(1)",
        boxShadow: selected
          ? "0 4px 16px rgba(255,216,131,0.4)"
          : "0 1px 4px rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      {icon && <span style={{ fontSize: "18px" }}>{icon}</span>}
      {label}
    </button>
  );
}
