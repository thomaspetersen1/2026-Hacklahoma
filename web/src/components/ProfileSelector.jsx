import { useState, useRef, useEffect } from "react";
import { C } from "../assets/colors";

/**
 * Hardcoded demo personas with their locations
 */
const PERSONAS = {
  alex: {
    id: "alex",
    name: "Alex",
    city: "Norman",
    emoji: "☕",
    description: "Chill coffee lover",
  },
  jordan: {
    id: "jordan",
    name: "Jordan",
    city: "Norman",
    emoji: "🏃",
    description: "Active & outdoorsy",
  },
  sam: {
    id: "sam",
    name: "Sam",
    city: "Norman",
    emoji: "🎨",
    description: "Creative & cultured",
  },
  maya: {
    id: "maya",
    name: "Maya",
    city: "OKC",
    emoji: "🍽️",
    description: "Foodie adventurer",
  },
  chris: {
    id: "chris",
    name: "Chris",
    city: "Dallas",
    emoji: "🎵",
    description: "Social butterfly",
  },
};

export default function ProfileSelector({ selectedProfile, onProfileChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState("up"); // "up" or "down"
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Detect if dropdown should open downward (if near top of page)
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // If button is in top 150px of viewport, open downward instead
      setOpenDirection(rect.top < 150 ? "down" : "up");
    }
  }, [isOpen]);

  const currentProfile = selectedProfile ? PERSONAS[selectedProfile] : null;

  return (
    <div
      ref={dropdownRef}
      style={{
        position: "relative",
        display: "inline-block",
        zIndex: 1100,
      }}
    >
      {/* Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "10px 16px",
          borderRadius: "999px",
          border: `2px solid ${C.black}`,
          background: currentProfile ? C.yellow : C.white,
          color: C.black,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          minWidth: "160px",
          justifyContent: "center",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {currentProfile ? (
          <>
            <span style={{ fontSize: "16px" }}>{currentProfile.emoji}</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "12px", fontWeight: 700 }}>
                {currentProfile.name}
              </div>
              <div style={{ fontSize: "10px", opacity: 0.7 }}>
                {currentProfile.city}
              </div>
            </div>
          </>
        ) : (
          <>
            <span>👤</span>
            <span>Select Persona</span>
          </>
        )}
      </button>

      {/* Dropdown Menu - Opens up or down based on screen position */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            ...(openDirection === "up"
              ? { bottom: "100%", marginBottom: "12px" }
              : { top: "100%", marginTop: "12px" }
            ),
            right: 0,
            background: C.white,
            border: `2px solid ${C.black}`,
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            zIndex: 1001,
            minWidth: "220px",
            maxHeight: "280px",
            overflowY: "auto",
          }}
        >
          {Object.values(PERSONAS).map((persona) => (
            <button
              key={persona.id}
              onClick={() => {
                onProfileChange(persona.id);
                setIsOpen(false);
              }}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "none",
                background:
                  selectedProfile === persona.id ? C.yellow : C.white,
                color: C.black,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "14px",
                fontWeight: selectedProfile === persona.id ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
                textAlign: "left",
                borderBottom:
                  Object.values(PERSONAS)[Object.values(PERSONAS).length - 1]
                    ?.id !== persona.id
                    ? `1px solid ${C.pink}`
                    : "none",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
              onMouseEnter={(e) => {
                if (selectedProfile !== persona.id) {
                  e.currentTarget.style.background = C.pink;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedProfile !== persona.id) {
                  e.currentTarget.style.background = C.white;
                }
              }}
            >
              <span style={{ fontSize: "20px", flexShrink: 0 }}>{persona.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>{persona.name}</div>
                <div style={{ fontSize: "12px", opacity: 0.6 }}>
                  {persona.city}
                </div>
              </div>
              {selectedProfile === persona.id && (
                <span style={{ fontSize: "18px", flexShrink: 0 }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
