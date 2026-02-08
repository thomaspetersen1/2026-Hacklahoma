import { useState, useEffect } from "react";
import { C } from "../../assets/colors";

export default function CustomSlider({
  value,
  onChange,
  min,
  max,
  step,
  formatLabel,
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ position: "relative", padding: "12px 0" }}>
      {/* Floating label */}
      <div
        style={{
          position: "absolute",
          left: `calc(${pct}% - 28px)`,
          top: "-36px",
          background: C.yellow,
          color: C.black,
          padding: "4px 14px",
          borderRadius: "999px",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "14px",
          fontWeight: 600,
          boxShadow: "0 4px 12px rgba(255,216,131,0.4)",
          transition: "left 0.15s ease",
          whiteSpace: "nowrap",
        }}
      >
        {formatLabel ? formatLabel(value) : value}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: C.yellow, cursor: "pointer" }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "13px",
          color: C.greyLight,
          marginTop: "4px",
        }}
      >
        <span>{formatLabel ? formatLabel(min) : min}</span>
        <span>{formatLabel ? formatLabel(max) : max}</span>
      </div>
    </div>
  );
}
