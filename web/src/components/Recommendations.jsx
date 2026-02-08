import { useState, useEffect } from "react";
import { C } from "../assets/colors";
import PageWrapper from "./modules/PageWrapper";
import ProgressDots from "./modules/ProgressDots";
import GhostButton from "./modules/GhostButton";
import PrimaryButton from "./modules/PrimaryButton";
import PillToggle from "./modules/PillToggle";

import { getSuggestions } from "../services/api";

const VIBES = ["Chill", "Adventurous", "Romantic", "Social", "Solo", "Artsy"];

function Recommendations({ onBack, preferences }) {
  const [visible, setVisible] = useState(false);
  const [activeVibe, setActiveVibe] = useState(null);
  const [items, setItems] = useState([]);
  const [suggestions, setSuggestions] = useState([]); // ← was missing
  const [loading, setLoading] = useState(false); // ← was missing
  const [error, setError] = useState(null); // ← was missing
  const [refreshKey, setRefreshKey] = useState(0);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  // 1. Fetch from API
  const handleGo = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSuggestions({
        vibe: preferences.hobbies,
        time: preferences.hours,
        city: preferences.city || "",
        priceRange: preferences.priceRange || "",
      });

      setSuggestions(data);

      if (data.length === 0) {
        setError("No suggestions found. Try different options.");
      }
    } catch (err) {
      setError("Failed to get suggestions. Error: " + err);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch on mount and when refreshing
  useEffect(() => {
    handleGo();
  }, [refreshKey]);

  // 3. Filter the fetched results by vibe
  const pickItems = () => {
    let pool = [...suggestions]; // ← was [data] which doesn't exist here

    if (activeVibe) {
      const vibeMatch = pool.filter((r) =>
        r.tags?.some((t) => t.toLowerCase() === activeVibe.toLowerCase()),
      );
      if (vibeMatch.length >= 3) pool = vibeMatch;
    }

    const shuffled = pool.sort(() => Math.random() - 0.5);
    setItems(shuffled.slice(0, 6));
  };

  // 4. Re-filter whenever suggestions or vibe changes
  useEffect(() => {
    if (suggestions.length > 0) {
      // ← was pool which doesn't exist here
      pickItems();
    }
  }, [suggestions, activeVibe]);

  // 5. Refresh = new API call
  const handleRefresh = () => {
    setSpinning(true);
    setItems([]);
    setTimeout(() => {
      setRefreshKey((k) => k + 1);
      setSpinning(false);
    }, 400);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.green,
        padding: "48px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative elements */}
      <div
        style={{
          position: "absolute",
          top: "-40px",
          right: "-60px",
          width: "220px",
          height: "220px",
          borderRadius: "50%",
          background: C.pink,
          opacity: 0.35,
          filter: "blur(2px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          left: "-80px",
          width: "180px",
          height: "180px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.3)",
          filter: "blur(2px)",
        }}
      />

      <PageWrapper visible={visible}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "8px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "36px",
                fontWeight: 700,
                color: C.black,
                margin: "0 0 6px",
                letterSpacing: "-0.3px",
              }}
            >
              Your picks ✦
            </h1>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "15px",
                color: C.grey,
                margin: 0,
              }}
            >
              Curated just for you — tap to explore
            </p>
          </div>

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              border: "none",
              background: C.white,
              cursor: "pointer",
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              transition: "all 0.3s ease",
              transform: spinning ? "rotate(360deg)" : "rotate(0)",
              flexShrink: 0,
            }}
            title="Refresh recommendations"
          >
            🔄
          </button>
        </div>

        {/* Vibe filters */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            padding: "16px 0",
            scrollbarWidth: "none",
          }}
        >
          <PillToggle
            label="All"
            selected={activeVibe === null}
            onClick={() => setActiveVibe(null)}
          />
          {VIBES.map((v) => (
            <PillToggle
              key={v}
              label={v}
              selected={activeVibe === v}
              onClick={() => setActiveVibe(activeVibe === v ? null : v)}
            />
          ))}
        </div>

        {/* Recommendation grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "16px",
            marginTop: "16px",
          }}
        >
          {items.map((item, i) => (
            <RecommendationCard
              key={`${refreshKey}-${item.name}`}
              item={item}
              index={i}
            />
          ))}
        </div>

        {items.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
              fontFamily: "'DM Sans', sans-serif",
              color: C.greyLight,
            }}
          >
            Finding your vibe...
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "36px" }}>
          <ProgressDots current={2} total={3} />
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <GhostButton onClick={onBack}>← Back</GhostButton>
            <PrimaryButton onClick={handleRefresh}>
              Shuffle Picks ✦
            </PrimaryButton>
          </div>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "13px",
              color: C.greyLight,
              marginTop: "16px",
            }}
          >
            Not vibing? Try a different filter or shuffle for fresh picks
          </p>
        </div>
      </PageWrapper>
    </div>
  );
}
export default Recommendations;
