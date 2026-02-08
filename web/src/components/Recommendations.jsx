import { useState, useEffect } from "react";
import { C } from "../assets/colors";
import PageWrapper from "./modules/PageWrapper";
import ProgressDots from "./modules/ProgressDots";
import GhostButton from "./modules/GhostButton";
import PrimaryButton from "./modules/PrimaryButton";
import PillToggle from "./modules/PillToggle";

import { getSuggestions } from "../services/api";
import PlaceDetailModal from "./PlaceDetailModal";

const VIBES = [
  { label: "Chill", value: "chill" },
  { label: "Social", value: "social" },
  { label: "Active", value: "active" },
  { label: "Creative", value: "creative" },
  { label: "Outdoors", value: "outdoors" },
  { label: "Food", value: "food" },
  { label: "Late Night", value: "late-night" },
];
const PRICES = [
  { label: "$", value: 1 },
  { label: "$$", value: 2 },
  { label: "$$$", value: 3 },
];

function Recommendations({ onBack, preferences }) {
  const [visible, setVisible] = useState(false);
  const [activeVibes, setActiveVibes] = useState([]);
  const [activePrices, setActivePrices] = useState([]);
  const [items, setItems] = useState([]);
  const [suggestions, setSuggestions] = useState([]); // ← was missing
  const [loading, setLoading] = useState(false); // ← was missing
  const [error, setError] = useState(null); // ← was missing
  const [refreshKey, setRefreshKey] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);

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
        transport: preferences.transport,
        location: preferences.location || 'norman',
        userId: preferences.userId || null,
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

  // 2. Fetch on mount, when refreshing, or when preferences/profile changes
  useEffect(() => {
    handleGo();
  }, [refreshKey, preferences]);

  // 3. Re-filter whenever suggestions, price, or vibe changes
  useEffect(() => {
    if (suggestions.length === 0) return;

    let pool = [...suggestions];

    // Deduplicate by place name (different Walmart locations, etc.)
    const seen = new Set();
    pool = pool.filter((r) => {
      const key = r.name?.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Price filter — hide places not matching selected price levels
    if (activePrices.length > 0) {
      pool = pool.filter((r) => {
        const pl = r.priceLevel ?? 1;
        return activePrices.includes(pl);
      });
    }

    // Vibe filter — sort by relevance, don't hide anything
    if (activeVibes.length > 0) {
      pool.sort((a, b) => {
        const getVibes = (r) => [
          ...(r.vibeMatch || []),
          ...(r.vibeTags || []),
        ].map(v => v.toLowerCase());

        const aHits = activeVibes.filter(v => getVibes(a).includes(v)).length;
        const bHits = activeVibes.filter(v => getVibes(b).includes(v)).length;
        if (bHits !== aHits) return bHits - aHits;
        return (b.fitScore || 0) - (a.fitScore || 0);
      });
    }

    setItems(pool);
  }, [suggestions, activeVibes, activePrices]);

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

        {/* Filter rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px 0" }}>
          {/* Price filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: C.grey,
              minWidth: "44px",
            }}>
              💰 Price
            </span>
            <PillToggle
              label="All"
              selected={activePrices.length === 0}
              onClick={() => setActivePrices([])}
            />
            {PRICES.filter(p => p.value !== null).map((p) => (
              <PillToggle
                key={p.label}
                label={p.label}
                selected={activePrices.includes(p.value)}
                onClick={() =>
                  setActivePrices(
                    activePrices.includes(p.value)
                      ? activePrices.filter((v) => v !== p.value)
                      : [...activePrices, p.value]
                  )
                }
              />
            ))}
          </div>

          {/* Vibe filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", overflowX: "auto", scrollbarWidth: "none" }}>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: C.grey,
              minWidth: "44px",
            }}>
              ✨ Vibe
            </span>
            <PillToggle
              label="All"
              selected={activeVibes.length === 0}
              onClick={() => setActiveVibes([])}
            />
            {VIBES.map((v) => (
              <PillToggle
                key={v.value}
                label={v.label}
                selected={activeVibes.includes(v.value)}
                onClick={() =>
                  setActiveVibes(
                    activeVibes.includes(v.value)
                      ? activeVibes.filter((vibe) => vibe !== v.value)
                      : [...activeVibes, v.value]
                  )
                }
              />
            ))}
          </div>
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
              onCardClick={setSelectedPlace}
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
            {loading ? "Finding your vibe..." : "No suggestions found — try shuffling"}
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

      {/* Place Detail Modal */}
      {selectedPlace && (
        <PlaceDetailModal
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
        />
      )}
    </div>
  );
}
export default Recommendations;
