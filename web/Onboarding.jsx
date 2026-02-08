import { useState, useEffect } from "react";
import { C } from "../assets/colors";
import PillToggle from "./modules/PillToggle";
import PrimaryButton from "./modules/PrimaryButton";
import ProgressDots from "./modules/ProgressDots";
import PageWrapper from "./modules/PageWrapper";
import Card from "./modules/Card";

const HOBBIES = [
  { label: "Art & Museums", icon: "🎨" },
  { label: "Food & Dining", icon: "🍜" },
  { label: "Nature & Parks", icon: "🌿" },
  { label: "Music & Concerts", icon: "🎵" },
  { label: "Sports & Fitness", icon: "⚡" },
  { label: "Shopping", icon: "🛍️" },
  { label: "Nightlife", icon: "🌙" },
  { label: "Photography", icon: "📸" },
  { label: "History & Culture", icon: "🏛️" },
  { label: "Wellness & Spa", icon: "🧘" },
  { label: "Coffee & Cafés", icon: "☕" },
  { label: "Books & Reading", icon: "📚" },
  { label: "Tech & Gaming", icon: "🎮" },
  { label: "Film & Theater", icon: "🎬" },
  { label: "Cooking", icon: "👨‍🍳" },
  { label: "Pets & Animals", icon: "🐾" },
];

function Onboarding({ onNext }) {
  const [logoVisible, setLogoVisible] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    setTimeout(() => setLogoVisible(true), 200);
    setTimeout(() => setContentVisible(true), 900);
  }, []);

  const toggle = (label) =>
    setSelected((s) =>
      s.includes(label) ? s.filter((x) => x !== label) : [...s, label],
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.green,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: "absolute",
          top: "-80px",
          right: "-80px",
          width: "260px",
          height: "260px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.25)",
          filter: "blur(1px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-60px",
          left: "-40px",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background: C.pink,
          opacity: 0.4,
          filter: "blur(2px)",
        }}
      />

      {/* Logo */}
      <div
        style={{
          opacity: logoVisible ? 1 : 0,
          transform: logoVisible ? "scale(1)" : "scale(0.8)",
          transition: "all 0.8s cubic-bezier(.4,0,.2,1)",
          marginBottom: "12px",
        }}
      >
    <div
      style={{
        width: "80px",
        height: "80px",
        borderRadius: "24px",
        background: "#F6CECE",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 8px 32px rgba(246, 206, 206, 0.6)",
        margin: "0 auto 16px",
      }}
    >
      <span style={{ fontSize: "36px" }}>✦</span>
    </div>
    <h1
      style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: "42px",
        fontWeight: 700,
        color: C.black,
        margin: 0,
        textAlign: "center",
        letterSpacing: "-0.5px",
      }}
    >
          SideQuest
        </h1>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "16px",
            color: C.grey,
            textAlign: "center",
            margin: "8px 0 0",
          }}
        >
          Life doesn't happen on a calendar.
        </p>
      </div>

      {/* Content */}
      <PageWrapper visible={contentVisible}>
        <Card style={{ marginTop: "32px", padding: "32px" }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "24px",
              fontWeight: 600,
              color: C.black,
              margin: "0 0 6px",
              textAlign: "center",
            }}
          >
            What sparks your quest?
          </h2>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "14px",
              color: C.greyLight,
              textAlign: "center",
              margin: "0 0 28px",
            }}
          >
            Pick at least 3 interests so we can personalize your adventure
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              justifyContent: "center",
            }}
          >
            {HOBBIES.map((h) => (
              <PillToggle
                key={h.label}
                label={h.label}
                icon={h.icon}
                selected={selected.includes(h.label)}
                onClick={() => toggle(h.label)}
              />
            ))}
          </div>

          {selected.length > 0 && (
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "13px",
                color: C.greyLight,
                textAlign: "center",
                margin: "20px 0 0",
                transition: "opacity 0.3s ease",
              }}
            >
              {selected.length} selected
              {selected.length < 3
                ? ` · pick ${3 - selected.length} more`
                : " · nice taste ✨"}
            </p>
          )}
        </Card>

        <div style={{ textAlign: "center", marginTop: "28px" }}>
          <ProgressDots current={0} total={3} />
          <div style={{ marginTop: "20px" }}>
            <PrimaryButton
              disabled={selected.length < 3}
              onClick={() => onNext(selected)}
            >
              Continue →
            </PrimaryButton>
          </div>
        </div>
      </PageWrapper>
    </div>
  );
}
export default Onboarding;
