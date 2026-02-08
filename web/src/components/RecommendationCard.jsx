import { useState, useEffect } from "react";
import { C } from "../assets/colors";
import Card from "./modules/Card";

/* ─── Emoji mapping by place type ─── */
const TYPE_EMOJI = {
  bar: "🍺",
  restaurant: "🍽️",
  cafe: "☕",
  coffee_shop: "☕",
  park: "🌿",
  museum: "🏛️",
  art_gallery: "🎨",
  movie_theater: "🎬",
  bowling_alley: "🎳",
  gym: "💪",
  spa: "🧘",
  shopping_mall: "🛍️",
  store: "🛒",
  book_store: "📚",
  library: "📖",
  night_club: "🌙",
  bakery: "🥐",
  clothing_store: "👗",
  zoo: "🐾",
  aquarium: "🐠",
  amusement_park: "🎢",
  stadium: "⚽",
  church: "⛪",
  tourist_attraction: "📸",
  lodging: "🏨",
  campground: "⛺",
  florist: "🌸",
  pet_store: "🐶",
  food: "🍜",
  point_of_interest: "📍",
  establishment: "🏢",
};

function getEmoji(types) {
  if (!types || types.length === 0) return "📍";
  for (const t of types) {
    if (TYPE_EMOJI[t]) return TYPE_EMOJI[t];
  }
  return "📍";
}

/* ─── Gradient pairs by type ─── */
function getGradient(types) {
  const t = types?.[0] || "";
  const gradients = {
    bar: ["#ffd883", "#f6ecec"],
    restaurant: ["#ff9a9e", "#fecfef"],
    cafe: ["#d3efa4", "#ffd883"],
    park: ["#d3efa4", "#a8edea"],
    museum: ["#667eea", "#764ba2"],
    art_gallery: ["#f6ecec", "#e8d5f5"],
    night_club: ["#764ba2", "#667eea"],
    bakery: ["#ffecd2", "#fcb69f"],
    default: ["#ffd883", "#f6ecec"],
  };
  return gradients[t] || gradients.default;
}

/* ─── Price level display ─── */
function PriceDisplay({ level }) {
  return (
    <span
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "13px",
        fontWeight: 600,
        color: C.grey,
      }}
    >
      {"$".repeat(level || 1)}
      <span style={{ color: "#d4d4d4" }}>{"$".repeat(4 - (level || 1))}</span>
    </span>
  );
}

/* ─── Star rating ─── */
function StarRating({ rating }) {
  return (
    <span
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "13px",
        color: C.grey,
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <span style={{ color: "#fbbf24" }}>★</span> {rating?.toFixed(1) || "N/A"}
    </span>
  );
}

export default function RecommendationCard({ item, index, onCardClick }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 100);
    return () => clearTimeout(t);
  }, [index]);

  const emoji = getEmoji(item.types);
  const [color1, color2] = getGradient(item.types);

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
      <Card
        hoverable
        style={{ height: "100%", cursor: "pointer" }}
        onClick={() => onCardClick && onCardClick(item)}
      >
        {/* Header image or gradient fallback */}
        <div
          style={{
            width: "100%",
            height: "140px",
            borderRadius: "14px",
            background: `linear-gradient(135deg, ${color1}, ${color2})`,
            marginBottom: "16px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {item.photoUri ? (
            <img
              src={item.photoUri}
              alt={item.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "40px",
              }}
            >
              {emoji}
            </div>
          )}

          {/* Open now badge */}
          {item.openNow && (
            <span
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "#22c55e",
                color: "#fff",
                fontSize: "11px",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: "999px",
              }}
            >
              Open Now
            </span>
          )}

          {/* Fit score badge */}
          {item.fitScore != null && (
            <span
              style={{
                position: "absolute",
                top: "10px",
                left: "10px",
                background: "rgba(255,255,255,0.9)",
                color: C.black,
                fontSize: "11px",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: "999px",
              }}
            >
              {Math.round(item.fitScore * 100)}% match
            </span>
          )}
        </div>

        {/* Name */}
        <h3
          style={{
            margin: "0 0 4px",
            fontFamily: "'Playfair Display', serif",
            fontSize: "18px",
            color: C.black,
            fontWeight: 600,
          }}
        >
          {item.name}
        </h3>

        {/* Address */}
        <p
          style={{
            margin: "0 0 10px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "13px",
            color: C.greyLight,
            lineHeight: 1.4,
          }}
        >
          {item.address}
        </p>

        {/* Rating + Price + Time */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "12px",
            flexWrap: "wrap",
          }}
        >
          <StarRating rating={item.rating} />
          <PriceDisplay level={item.priceLevel} />
          {item.totalMinutes && (
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "13px",
                color: C.grey,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              🕐 {item.totalMinutes} min total
            </span>
          )}
        </div>

        {/* Reason code tags */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {item.reasonCodes?.map((reason) => (
            <span
              key={reason}
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
              {reason}
            </span>
          ))}
          {item.types?.slice(0, 3).map((type) => (
            <span
              key={type}
              style={{
                padding: "4px 12px",
                borderRadius: "999px",
                background: C.green,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "11px",
                color: C.grey,
                fontWeight: 500,
                textTransform: "capitalize",
              }}
            >
              {type.replace(/_/g, " ")}
            </span>
          ))}
        </div>

        {/* Navigate Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${item.location.lat},${item.location.lng}&travelmode=driving`;
            window.open(mapsUrl, "_blank");
          }}
          style={{
            width: "100%",
            marginTop: "16px",
            padding: "12px",
            borderRadius: "999px",
            border: "none",
            background: C.yellow,
            color: C.black,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: "0 2px 8px rgba(255,216,131,0.3)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow =
              "0 4px 12px rgba(255,216,131,0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(255,216,131,0.3)";
          }}
        >
          <span>🧭</span>
          Navigate
        </button>
      </Card>
    </div>
  );
}
