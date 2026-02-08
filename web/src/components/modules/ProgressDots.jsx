import { useState, useEffect } from "react";
import { C } from "../../assets/colors";

export default function ProgressDots({ current, total }) {
  return (
    <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? "32px" : "10px",
            height: "10px",
            borderRadius: "999px",
            background: i === current ? C.yellow : "#d4d4d4",
            transition: "all 0.4s cubic-bezier(.4,0,.2,1)",
            boxShadow:
              i === current ? "0 2px 8px rgba(255,216,131,0.5)" : "none",
          }}
        />
      ))}
    </div>
  );
}
