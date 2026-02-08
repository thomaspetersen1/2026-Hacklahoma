import { useState, useEffect } from "react";
import { C } from "../assets/colors";

export default function RecommendationCard({ item, index }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 100);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateY(0) scale(1)"
          : "translateY(20px) scale(0.96)",
        transition: `all 0.5s cubic-bezier(.4,0,.2,1) ${index * 0.08}s`,
      }}
    >
      <Card hoverable style={{ height: "100%" }}>
        <div
          style={{
            width: "100%",
            height: "120px",
            borderRadius: "14px",
            background: `linear-gradient(135deg, ${item.color1}, ${item.color2})`,
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "40px",
          }}
        >
          {item.emoji}
        </div>
        <h3
          style={{
            margin: "0 0 6px",
            fontFamily: "'Playfair Display', serif",
            fontSize: "18px",
            color: C.black,
            fontWeight: 600,
          }}
        >
          {item.name}
        </h3>
        <p
          style={{
            margin: "0 0 12px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "13px",
            color: C.greyLight,
            lineHeight: 1.5,
          }}
        >
          {item.desc}
        </p>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {item.tags.map((t) => (
            <span
              key={t}
              style={{
                padding: "4px 12px",
                borderRadius: "999px",
                background: C.pink,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "11px",
                color: C.grey,
                fontWeight: 500,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
