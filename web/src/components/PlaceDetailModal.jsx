import { C } from "../assets/colors";
import { useState, useEffect } from "react";

/**
 * PlaceDetailModal - Reordered for demo
 * 1. Time breakdown
 * 2. Match score & reasoning
 * 3. Viewer profile (preferences)
 * 4. Learning behavior (Thompson Sampling)
 * 5. Navigate button
 */
export default function PlaceDetailModal({ place, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
  }, []);

  if (!place) return null;

  const handleNavigate = () => {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.location.lat},${place.location.lng}&travelmode=driving`;
    window.open(mapsUrl, "_blank");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 999,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: visible
            ? "translate(-50%, -50%) scale(1)"
            : "translate(-50%, -50%) scale(0.95)",
          width: "90%",
          maxWidth: "600px",
          maxHeight: "85vh",
          background: C.white,
          borderRadius: "24px",
          zIndex: 1000,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          overflow: "hidden",
          opacity: visible ? 1 : 0,
          transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
        }}
      >
        {/* Scrollable Content */}
        <div
          style={{
            overflowY: "auto",
            maxHeight: "85vh",
            padding: "32px",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "24px",
            }}
          >
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "28px",
                fontWeight: 700,
                color: C.black,
                margin: 0,
                flex: 1,
                paddingRight: "12px",
              }}
            >
              {place.name}
            </h2>
            <button
              onClick={onClose}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "none",
                background: C.pink,
                cursor: "pointer",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>

          {/* Photo */}
          {place.photoUri && (
            <div
              style={{
                width: "100%",
                height: "200px",
                borderRadius: "16px",
                overflow: "hidden",
                marginBottom: "20px",
                background: "linear-gradient(135deg, #ffd883, #f6ecec)",
              }}
            >
              <img
                src={place.photoUri}
                alt={place.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          )}

          {/* Address */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <span style={{ fontSize: "16px", flexShrink: 0 }}>📍</span>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "15px",
                color: C.grey,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {place.address}
            </p>
          </div>

          {/* Rating, Price, Status */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              marginBottom: "24px",
              paddingBottom: "24px",
              borderBottom: `2px solid ${C.pink}`,
            }}
          >
            {place.rating && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#fbbf24", fontSize: "16px" }}>★</span>
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: C.black,
                  }}
                >
                  {place.rating.toFixed(1)}
                </span>
                {place.userRatingsTotal && (
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "13px",
                      color: C.greyLight,
                    }}
                  >
                    ({place.userRatingsTotal} reviews)
                  </span>
                )}
              </div>
            )}

            {place.priceLevel && (
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: C.grey,
                }}
              >
                {"$".repeat(place.priceLevel)}
                <span style={{ color: "#d4d4d4" }}>
                  {"$".repeat(4 - place.priceLevel)}
                </span>
              </div>
            )}

            {place.openNow !== undefined && (
              <div
                style={{
                  padding: "4px 12px",
                  borderRadius: "999px",
                  background: place.openNow ? "#22c55e" : "#ef4444",
                  color: "#fff",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {place.openNow ? "Open Now" : "Closed"}
              </div>
            )}
          </div>

          {/* SECTION 1: Time Breakdown */}
          <div
            style={{
              background: C.green,
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "24px",
            }}
          >
            <h3
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "18px",
                fontWeight: 700,
                color: C.black,
                margin: "0 0 16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              ⏱️ Time Breakdown
            </h3>

            <div
              style={{
                background: C.white,
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "13px",
                      color: C.grey,
                    }}
                  >
                    Travel time
                  </span>
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: C.black,
                    }}
                  >
                    {place.travelMinutes} min
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "13px",
                      color: C.grey,
                    }}
                  >
                    Time at location
                  </span>
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: C.black,
                    }}
                  >
                    {place.dwellMinutes} min
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "6px",
                    borderTop: `1px solid ${C.pink}`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: C.black,
                    }}
                  >
                    Total time
                  </span>
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: C.black,
                    }}
                  >
                    {place.totalMinutes} min
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Match Score & Reasoning */}
          <div style={{ marginBottom: "24px" }}>
            {/* Fit Score */}
            <div
              style={{
                background: `linear-gradient(135deg, ${C.yellow}, ${C.pink})`,
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "16px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "48px",
                  fontWeight: 700,
                  fontFamily: "'Playfair Display', serif",
                  color: C.black,
                  marginBottom: "8px",
                }}
              >
                {Math.round(place.fitScore * 100)}%
              </div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "16px",
                  fontWeight: 600,
                  color: C.grey,
                }}
              >
                Match Score
              </div>
            </div>

            {/* Why We Chose This */}
            {(place.vibeMatch?.length > 0 || place.reasonCodes?.length > 0) && (
              <div>
                <h4
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: C.black,
                    margin: "0 0 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  💡 Why This Match
                </h4>

                {/* Vibe Matches */}
                {place.vibeMatch && place.vibeMatch.length > 0 && (
                  <div style={{ marginBottom: "12px" }}>
                    <div
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: C.grey,
                        marginBottom: "8px",
                      }}
                    >
                      ✨ Matches Your Vibes
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {place.vibeMatch.map((vibe) => (
                        <span
                          key={vibe}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "999px",
                            background: C.yellow,
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: C.black,
                            textTransform: "capitalize",
                          }}
                        >
                          {vibe}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reason Codes */}
                {place.reasonCodes && place.reasonCodes.length > 0 && (
                  <div>
                    <div
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: C.grey,
                        marginBottom: "8px",
                      }}
                    >
                      📍 Why Recommended
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {place.reasonCodes.map((reason, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "10px 12px",
                            background: C.pink,
                            borderRadius: "8px",
                          }}
                        >
                          <span style={{ fontSize: "14px" }}>
                            {getReasonIcon(reason)}
                          </span>
                          <span
                            style={{
                              fontFamily: "'DM Sans', sans-serif",
                              fontSize: "13px",
                              color: C.grey,
                            }}
                          >
                            {reason}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 3: Viewer Profile */}
          <div style={{ marginBottom: "24px" }}>
            <h4
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "16px",
                fontWeight: 700,
                color: C.black,
                margin: "0 0 12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              👤 Viewer Profile{" "}
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "10px",
                  fontWeight: 600,
                  background: C.pink,
                  padding: "2px 8px",
                  borderRadius: "999px",
                  color: C.grey,
                }}
              >
                Demo Data
              </span>
            </h4>
            <div
              style={{
                background: C.white,
                border: `2px solid ${C.pink}`,
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <ProfileStat
                  label="Food & Dining"
                  value={0.8}
                />
                <ProfileStat
                  label="Outdoor Activities"
                  value={0.6}
                />
                <ProfileStat
                  label="Entertainment"
                  value={0.7}
                />
                <ProfileStat
                  label="Culture & Arts"
                  value={0.5}
                />
                <ProfileStat
                  label="Price Sensitivity"
                  value={0.4}
                />
                <ProfileStat
                  label="Adventure Level"
                  value={0.75}
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: Learning Behavior */}
          <div style={{ marginBottom: "24px" }}>
            <h4
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "16px",
                fontWeight: 700,
                color: C.black,
                margin: "0 0 12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              🧠 How We Learn{" "}
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "10px",
                  fontWeight: 600,
                  background: "#dbeafe",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  color: "#3b82f6",
                }}
              >
                Thompson Sampling
              </span>
            </h4>
            <div
              style={{
                background: "#dbeafe",
                border: "2px solid #3b82f6",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "13px",
                  color: C.grey,
                  marginBottom: "16px",
                  lineHeight: 1.6,
                }}
              >
                Every interaction you have (likes, visits, dismissals) updates our Thompson Sampling bandit. The system tracks what types of places you engage with in different contexts and adjusts future recommendations accordingly.
              </div>

              {/* Learning Examples */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <LearningBehavior
                  action="Visited coffee shop (15 min)"
                  impact="Coffee preference +0.12"
                  direction="up"
                />
                <LearningBehavior
                  action="Dismissed restaurant (too far)"
                  impact="Distance sensitivity -0.08"
                  direction="down"
                />
                <LearningBehavior
                  action="Clicked 'like' on museum"
                  impact="Culture interest +0.15"
                  direction="up"
                />
              </div>
            </div>
          </div>

          {/* Navigate Button */}
          <button
            onClick={handleNavigate}
            style={{
              width: "100%",
              padding: "18px",
              borderRadius: "999px",
              border: "none",
              background: C.yellow,
              color: C.black,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "18px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 16px rgba(255,216,131,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 8px 28px rgba(255,216,131,0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 16px rgba(255,216,131,0.4)";
            }}
          >
            <span style={{ fontSize: "20px" }}>🧭</span>
            Navigate with Google Maps
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * Profile stat bar component
 */
function ProfileStat({ label, value }) {
  const percentage = Math.round((value || 0) * 100);
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "6px",
        }}
      >
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "12px",
            color: C.grey,
            fontWeight: 500,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "12px",
            fontWeight: 600,
            color: C.black,
          }}
        >
          {percentage}%
        </span>
      </div>
      <div
        style={{
          width: "100%",
          height: "6px",
          background: "#e0e0e0",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            background: C.yellow,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

/**
 * Learning behavior example
 */
function LearningBehavior({ action, impact, direction }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.5)",
        borderRadius: "8px",
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <span style={{ fontSize: "14px" }}>
        {direction === "up" ? "📈" : "📉"}
      </span>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "12px",
            fontWeight: 600,
            color: C.black,
          }}
        >
          {action}
        </div>
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "11px",
            color: direction === "up" ? "#16a34a" : "#dc2626",
            fontWeight: 500,
          }}
        >
          {impact}
        </div>
      </div>
    </div>
  );
}

/**
 * Map reason text to emoji icon
 */
function getReasonIcon(reason) {
  const lower = reason.toLowerCase();
  if (lower.includes("vibe")) return "✨";
  if (lower.includes("walk") || lower.includes("travel") || lower.includes("min"))
    return "🚶";
  if (lower.includes("time") || lower.includes("fit")) return "⏰";
  if (lower.includes("open")) return "🟢";
  if (lower.includes("rating") || lower.includes("popular")) return "⭐";
  if (lower.includes("near") || lower.includes("close")) return "📍";
  if (lower.includes("weather")) return "☀️";
  return "✓";
}
