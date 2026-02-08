import { useState, useEffect } from "react";
import { C } from "../assets/colors";
import PageWrapper from "./modules/PageWrapper";
import Card from "./modules/Card";
import CustomSlider from "./modules/Slider";
import ProgressDots from "./modules/ProgressDots";
import GhostButton from "./modules/GhostButton";
import PrimaryButton from "./modules/PrimaryButton";

const TRANSPORT = [
  { label: "Car", icon: "🚗", desc: "Drive anywhere" },
  { label: "Bike", icon: "🚲", desc: "Pedal-powered" },
  { label: "Walking", icon: "🚶", desc: "On foot" },
];

function Questionnaire({ onNext, onBack }) {
  const [visible, setVisible] = useState(false);
  const [hours, setHours] = useState(2);
  const [transport, setTransport] = useState(null);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  const formatTime = (val) => {
    if (val === 0.5) return "30 min";
    if (val === 1) return "1 hour";
    return `${val} hours`;
  };

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
      {/* Decorative blob */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "-100px",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.2)",
          filter: "blur(2px)",
        }}
      />

      <PageWrapper visible={visible}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "36px",
              fontWeight: 700,
              color: C.black,
              margin: "0 0 8px",
              letterSpacing: "-0.3px",
            }}
          >
            Plan your quest
          </h1>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "15px",
              color: C.grey,
              margin: 0,
            }}
          >
            Help us understand your ideal outing
          </p>
        </div>

        {/* Time constraint card */}
        <Card style={{ padding: "32px", marginBottom: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                background: C.pink,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
              }}
            >
              ⏳
            </span>
            <div>
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "20px",
                  color: C.black,
                  margin: 0,
                  fontWeight: 600,
                }}
              >
                How much time do you have?
              </h3>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "13px",
                  color: C.greyLight,
                  margin: "2px 0 0",
                }}
              >
                Slide to set your availability
              </p>
            </div>
          </div>
          <div style={{ marginTop: "40px", padding: "0 8px" }}>
            <CustomSlider
              value={hours}
              onChange={setHours}
              min={0.5}
              max={4}
              step={0.5}
              formatLabel={formatTime}
            />
          </div>
        </Card>

        {/* Transportation card */}
        <Card style={{ padding: "32px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            <span
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                background: C.pink,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
              }}
            >
              🗺️
            </span>
            <div>
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "20px",
                  color: C.black,
                  margin: 0,
                  fontWeight: 600,
                }}
              >
                How are you getting around?
              </h3>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "13px",
                  color: C.greyLight,
                  margin: "2px 0 0",
                }}
              >
                Pick your mode of travel
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            {TRANSPORT.map((t) => {
              const sel = transport === t.label;
              return (
                <button
                  key={t.label}
                  onClick={() => setTransport(t.label)}
                  style={{
                    flex: 1,
                    padding: "20px 12px",
                    borderRadius: "16px",
                    border: sel ? `2px solid ${C.black}` : "2px solid #e0e0e0",
                    background: sel ? C.yellow : C.white,
                    cursor: "pointer",
                    transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
                    transform: sel ? "scale(1.04)" : "scale(1)",
                    boxShadow: sel
                      ? "0 6px 20px rgba(255,216,131,0.4)"
                      : "0 1px 4px rgba(0,0,0,0.05)",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>
                    {t.icon}
                  </div>
                  <div
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "15px",
                      fontWeight: 600,
                      color: C.black,
                    }}
                  >
                    {t.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "12px",
                      color: C.greyLight,
                      marginTop: "2px",
                    }}
                  >
                    {t.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <div style={{ textAlign: "center", marginTop: "28px" }}>
          <ProgressDots current={1} total={3} />
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              gap: "12px",
              justifyContent: "center",
            }}
          >
            <GhostButton onClick={onBack}>← Back</GhostButton>
            <PrimaryButton
              disabled={!transport}
              onClick={() => onNext({ hours, transport })}
            >
              See Recommendations →
            </PrimaryButton>
          </div>
        </div>
      </PageWrapper>
    </div>
  );
}
export default Questionnaire;
