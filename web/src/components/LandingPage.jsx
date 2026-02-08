import { useState, useEffect, useRef, onStart } from "react";

const C = {
  green: "#d3efa4",
  greenDark: "#b8d98a",
  yellow: "#ffd883",
  yellowLight: "#ffedbe",
  pink: "#f6ecec",
  black: "#1a1a1a",
  grey: "#4a4a4a",
  greyLight: "#7a7a7a",
  white: "#fff",
  cream: "#fdfcf8",
};

/* ─── Scroll reveal hook ─── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

/* ═══════════════════════════════════════════
   NAV BAR
   ═══════════════════════════════════════════ */
function NavBar({ onStart }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: "16px 40px",
        background: scrolled ? "rgba(211,239,164,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        transition: "all 0.4s ease",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: scrolled
          ? "1px solid rgba(0,0,0,0.06)"
          : "1px solid transparent",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: C.yellow,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            boxShadow: "0 2px 8px rgba(255,216,131,0.4)",
          }}
        >
          ⚔️
        </div>
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "22px",
            fontWeight: 700,
            color: C.black,
            letterSpacing: "-0.5px",
          }}
        >
          Sidequest
        </span>
      </div>
      <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
        {["How It Works", "Features", "About"].map((t) => (
          <a
            key={t}
            href={`#${t.toLowerCase().replace(/\s/g, "-")}`}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "15px",
              fontWeight: 500,
              color: C.grey,
              textDecoration: "none",
              transition: "color 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.target.style.color = C.black)}
            onMouseLeave={(e) => (e.target.style.color = C.grey)}
          >
            {t}
          </a>
        ))}
        <button
          style={{
            padding: "10px 28px",
            borderRadius: "999px",
            border: "none",
            background: C.yellow,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "15px",
            fontWeight: 600,
            color: C.black,
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(255,216,131,0.35)",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-1px)";
            e.target.style.boxShadow = "0 6px 24px rgba(255,216,131,0.5)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 16px rgba(255,216,131,0.35)";
          }}
          onClick={() => onStart && onStart()}
        >
          Get Started
        </button>
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════
   HERO SECTION
   ═══════════════════════════════════════════ */
function Hero({ onStart }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setTimeout(() => setLoaded(true), 150);
  }, []);

  const floatingItems = [
    { emoji: "☕", top: "15%", left: "8%", delay: "0s", size: "48px" },
    { emoji: "🎨", top: "22%", right: "12%", delay: "0.3s", size: "42px" },
    { emoji: "🌿", bottom: "28%", left: "6%", delay: "0.6s", size: "44px" },
    { emoji: "🎵", bottom: "18%", right: "9%", delay: "0.9s", size: "40px" },
    { emoji: "🍜", top: "55%", left: "3%", delay: "1.2s", size: "38px" },
    { emoji: "📸", top: "45%", right: "5%", delay: "0.4s", size: "36px" },
  ];

  return (
    <section
      style={{
        minHeight: "100vh",
        background: C.green,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: "120px 40px 80px",
      }}
    >
      {/* Gradient orbs */}
      <div
        style={{
          position: "absolute",
          top: "-15%",
          right: "-10%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,216,131,0.3) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-10%",
          left: "-8%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(246,236,236,0.5) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Floating emoji */}
      {floatingItems.map((item, i) => (
        <div
          key={i}
          className="float-item"
          style={{
            position: "absolute",
            fontSize: item.size,
            top: item.top,
            left: item.left,
            right: item.right,
            bottom: item.bottom,
            opacity: loaded ? 0.6 : 0,
            transform: loaded ? "translateY(0)" : "translateY(30px)",
            transition: `all 0.8s cubic-bezier(.4,0,.2,1) ${item.delay}`,
            animation: loaded
              ? `softFloat 6s ease-in-out ${item.delay} infinite`
              : "none",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {item.emoji}
        </div>
      ))}

      {/* Hero content */}
      <div
        style={{
          textAlign: "center",
          position: "relative",
          zIndex: 2,
          maxWidth: "780px",
        }}
      >
        {/* Badge */}
        <div
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.7s cubic-bezier(.4,0,.2,1) 0.1s",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 20px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(8px)",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "14px",
              fontWeight: 500,
              color: C.grey,
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#22c55e",
              }}
            />
            Your adventure starts here
          </span>
        </div>

        {/* Main heading */}
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(48px, 7vw, 86px)",
            fontWeight: 700,
            color: C.black,
            margin: "28px 0 0",
            lineHeight: 1.05,
            letterSpacing: "-2px",
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(30px)",
            transition: "all 0.8s cubic-bezier(.4,0,.2,1) 0.25s",
          }}
        >
          Every day is a<br />
          <span
            style={{
              position: "relative",
              display: "inline-block",
            }}
          >
            <span style={{ position: "relative", zIndex: 1 }}>Sidequest</span>
            <span
              style={{
                position: "absolute",
                bottom: "8px",
                left: "-4px",
                right: "-4px",
                height: "18px",
                background: C.yellow,
                borderRadius: "4px",
                zIndex: 0,
                opacity: 0.6,
                transform: loaded ? "scaleX(1)" : "scaleX(0)",
                transformOrigin: "left",
                transition: "transform 0.8s cubic-bezier(.4,0,.2,1) 0.9s",
              }}
            />
          </span>
        </h1>

        {/* Sub text */}
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "clamp(17px, 2vw, 21px)",
            color: C.grey,
            maxWidth: "540px",
            margin: "24px auto 0",
            lineHeight: 1.65,
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.7s cubic-bezier(.4,0,.2,1) 0.5s",
          }}
        >
          Tell us what you love, how much time you have, and how you're getting
          around. We'll curate the perfect local adventure — just for you.
        </p>

        {/* CTA buttons */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            marginTop: "40px",
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.7s cubic-bezier(.4,0,.2,1) 0.7s",
            flexWrap: "wrap",
          }}
        >
          <button
            style={{
              padding: "18px 44px",
              borderRadius: "999px",
              border: "none",
              background: C.yellow,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "18px",
              fontWeight: 600,
              color: C.black,
              cursor: "pointer",
              boxShadow: "0 8px 32px rgba(255,216,131,0.4)",
              transition: "all 0.3s ease",
              letterSpacing: "0.2px",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-3px)";
              e.target.style.boxShadow = "0 12px 40px rgba(255,216,131,0.55)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 8px 32px rgba(255,216,131,0.4)";
            }}
            onClick={() => onStart && onStart()}
          >
            Start Your Quest ⚔️
          </button>

          <button
            style={{
              padding: "18px 44px",
              borderRadius: "999px",
              border: `2px solid ${C.black}`,
              background: "transparent",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "18px",
              fontWeight: 500,
              color: C.black,
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = C.pink;
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "transparent";
            }}
          >
            See How It Works
          </button>
        </div>

        {/* Social proof */}
        <div
          style={{
            marginTop: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.7s ease 1.1s",
          }}
        >
          <div style={{ display: "flex" }}>
            {["🧑‍💻", "👩‍🎨", "🧑‍🍳", "👩‍🔬"].map((e, i) => (
              <div
                key={i}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: C.white,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  border: `2px solid ${C.green}`,
                  marginLeft: i > 0 ? "-10px" : 0,
                  position: "relative",
                  zIndex: 4 - i,
                }}
              >
                {e}
              </div>
            ))}
          </div>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "14px",
              color: C.greyLight,
              margin: 0,
            }}
          >
            Built at <strong style={{ color: C.black }}>Hacklahoma 2026</strong>
          </p>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        style={{
          position: "absolute",
          bottom: "32px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          opacity: loaded ? 0.5 : 0,
          transition: "opacity 0.7s ease 1.4s",
          animation: "softBounce 2s ease-in-out infinite",
        }}
      >
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "12px",
            color: C.grey,
          }}
        >
          Scroll
        </span>
        <span style={{ fontSize: "16px" }}>↓</span>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   HOW IT WORKS
   ═══════════════════════════════════════════ */
function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Pick Your Interests",
      desc: "Choose from hobbies like art, food, music, nature, and more. We learn what excites you so every suggestion feels personal.",
      emoji: "🎯",
      color: C.yellow,
      mockup: ["🎨 Art", "🍜 Food", "🌿 Nature", "🎵 Music", "☕ Cafés"],
    },
    {
      num: "02",
      title: "Set Your Constraints",
      desc: "Slide to tell us how much time you have — from a quick 30-minute detour to a full 4-hour adventure. Pick your ride too.",
      emoji: "⏳",
      color: C.pink,
      mockup: ["🚗 Car", "🚲 Bike", "🚶 Walk"],
    },
    {
      num: "03",
      title: "Get Curated Picks",
      desc: "We surface 6 hyper-relevant spots near you — rated, timed, and tagged. Filter by vibe, shuffle for fresh picks, and go.",
      emoji: "✨",
      color: C.green,
      mockup: ["★ 4.5", "🕐 45 min", "Open Now"],
    },
  ];

  return (
    <section
      id="how-it-works"
      style={{
        padding: "120px 40px",
        background: C.cream,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          right: "-200px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.green}33 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
      />

      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <SectionHeader
          tag="How It Works"
          title="Three steps to your perfect outing"
          subtitle="No endless scrolling. No decision fatigue. Just tell us about you and we handle the rest."
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "32px",
            marginTop: "64px",
          }}
        >
          {steps.map((step, i) => (
            <StepCard key={i} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ tag, title, subtitle }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      style={{
        textAlign: "center",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transition: "all 0.8s cubic-bezier(.4,0,.2,1)",
      }}
    >
      <span
        style={{
          display: "inline-block",
          padding: "6px 18px",
          borderRadius: "999px",
          background: C.yellow,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "13px",
          fontWeight: 600,
          color: C.black,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          boxShadow: "0 2px 8px rgba(255,216,131,0.3)",
        }}
      >
        {tag}
      </span>
      <h2
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(32px, 4.5vw, 52px)",
          fontWeight: 700,
          color: C.black,
          margin: "20px 0 0",
          lineHeight: 1.15,
          letterSpacing: "-1px",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "17px",
            color: C.greyLight,
            maxWidth: "560px",
            margin: "16px auto 0",
            lineHeight: 1.6,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

function StepCard({ step, index }) {
  const [ref, visible] = useReveal();
  const isEven = index % 2 === 0;

  return (
    <div
      ref={ref}
      style={{
        display: "flex",
        gap: "40px",
        alignItems: "center",
        flexDirection: isEven ? "row" : "row-reverse",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: `all 0.8s cubic-bezier(.4,0,.2,1) ${index * 0.15}s`,
      }}
    >
      {/* Text side */}
      <div style={{ flex: 1 }}>
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "64px",
            fontWeight: 700,
            color: C.black,
            opacity: 0.5,
            lineHeight: 1,
            display: "block",
            marginBottom: "8px",
          }}
        >
          {step.num}
        </span>
        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "28px",
            fontWeight: 600,
            color: C.black,
            margin: "0 0 12px",
          }}
        >
          {step.emoji} {step.title}
        </h3>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "16px",
            color: C.grey,
            lineHeight: 1.7,
            margin: 0,
            maxWidth: "440px",
          }}
        >
          {step.desc}
        </p>
      </div>

      {/* Visual mockup */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: C.white,
            borderRadius: "24px",
            padding: "32px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.06)",
            border: "1px solid rgba(0,0,0,0.04)", // ← this is the border
            minWidth: "280px",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "8px",
              borderRadius: "999px",
              background: step.color,
              marginBottom: "24px",
              opacity: 0.6,
            }}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {step.mockup.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: "10px 20px",
                  borderRadius: "999px",
                  background: step.color,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: C.black,
                  opacity: 0.85,
                  transition: "all 0.2s",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   FEATURES SECTION
   ═══════════════════════════════════════════ */
function Features() {
  const features = [
    {
      icon: "🗺️",
      title: "Hyper-Local",
      desc: "Results powered by Google Maps — real ratings, real hours, real walking distances from where you are right now.",
    },
    {
      icon: "🧠",
      title: "Vibe Matching",
      desc: "Our scoring engine weighs your interests, time budget, and transport to surface only what truly fits.",
    },
    {
      icon: "⚡",
      title: "Instant Refresh",
      desc: "Not feeling the picks? Shuffle for fresh suggestions or switch the vibe filter — no reloading, no waiting.",
    },
    {
      icon: "🎛️",
      title: "Smart Filters",
      desc: "Filter by mood — chill, adventurous, romantic, social. The same city feels different depending on your energy.",
    },
    {
      icon: "💰",
      title: "Price Aware",
      desc: "Every spot shows its price level so you can plan your day without surprises. Dollar signs, not guesswork.",
    },
    {
      icon: "🕐",
      title: "Time-Fit Scoring",
      desc: "Each suggestion includes total time — travel plus dwell. Everything we show fits inside your available window.",
    },
  ];

  return (
    <section
      id="features"
      style={{
        padding: "120px 40px",
        background: C.green,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: "-100px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "700px",
          height: "400px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <SectionHeader
          tag="Features"
          title="Built for spontaneous people"
          subtitle="Everything you need to stop overthinking and start exploring."
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
            marginTop: "56px",
          }}
        >
          {features.map((f, i) => (
            <FeatureCard key={i} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, index }) {
  const [ref, visible] = useReveal();
  const [hover, setHover] = useState(false);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: C.white,
        borderRadius: "20px",
        padding: "32px",
        boxShadow: hover
          ? "0 16px 48px rgba(0,0,0,0.1)"
          : "0 2px 12px rgba(0,0,0,0.04)",
        transition: `all 0.5s cubic-bezier(.4,0,.2,1) ${index * 0.08}s`,
        transform: visible
          ? hover
            ? "translateY(-6px)"
            : "translateY(0)"
          : "translateY(30px)",
        opacity: visible ? 1 : 0,
        border: "1px solid rgba(0,0,0,0.04)",
        cursor: "default",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "16px",
          background: C.pink,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "28px",
          marginBottom: "20px",
          transition: "transform 0.3s ease",
          transform: hover ? "scale(1.1) rotate(-5deg)" : "scale(1)",
        }}
      >
        {feature.icon}
      </div>
      <h3
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "20px",
          fontWeight: 600,
          color: C.black,
          margin: "0 0 10px",
        }}
      >
        {feature.title}
      </h3>
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "15px",
          color: C.greyLight,
          lineHeight: 1.65,
          margin: 0,
        }}
      >
        {feature.desc}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ABOUT / VISION SECTION
   ═══════════════════════════════════════════ */
function About() {
  const [ref, visible] = useReveal();

  return (
    <section
      id="about"
      style={{
        padding: "120px 40px",
        background: C.cream,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          ref={ref}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(30px)",
            transition: "all 0.8s cubic-bezier(.4,0,.2,1)",
            textAlign: "center",
          }}
        >
          <span
            style={{ fontSize: "48px", display: "block", marginBottom: "24px" }}
          >
            ⚔️
          </span>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              color: C.black,
              margin: "0 0 24px",
              lineHeight: 1.2,
              letterSpacing: "-0.5px",
            }}
          >
            Life's too short for
            <br />
            "I don't know, what do <em>you</em> want to do?"
          </h2>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "18px",
              color: C.grey,
              lineHeight: 1.75,
              margin: "0 0 20px",
            }}
          >
            Sidequest was born from a simple frustration — you finally have free
            time, but you spend half of it scrolling through options and the
            other half debating with friends. We believe discovering your city
            should feel like an adventure, not a chore.
          </p>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "18px",
              color: C.grey,
              lineHeight: 1.75,
              margin: "0 0 32px",
            }}
          >
            Our engine combines your personal interests with real-time data —
            ratings, hours, distance, pricing — to give you curated picks that
            actually fit your day. No accounts. No ads. Just you and your next
            great experience.
          </p>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 28px",
              borderRadius: "16px",
              background: C.pink,
              border: "1px solid rgba(0,0,0,0.04)",
            }}
          >
            <span style={{ fontSize: "20px" }}>🏗️</span>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "15px",
                fontWeight: 500,
                color: C.grey,
              }}
            >
              Built with ♥ at{" "}
              <strong style={{ color: C.black }}>Hacklahoma 2026</strong> in
              Norman, OK
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   CTA SECTION
   ═══════════════════════════════════════════ */
function CTA({ onStart }) {
  const [ref, visible] = useReveal();

  return (
    <section
      style={{
        padding: "100px 40px",
        background: C.green,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,216,131,0.3) 0%, transparent 60%)",
          filter: "blur(60px)",
        }}
      />

      <div
        ref={ref}
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.8s cubic-bezier(.4,0,.2,1)",
        }}
      >
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(36px, 5vw, 56px)",
            fontWeight: 700,
            color: C.black,
            margin: "0 0 20px",
            letterSpacing: "-1px",
            lineHeight: 1.1,
          }}
        >
          Ready for your
          <br />
          next sidequest?
        </h2>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "18px",
            color: C.grey,
            margin: "0 0 40px",
            lineHeight: 1.6,
          }}
        >
          It takes 30 seconds to set up. Zero accounts, zero commitment.
        </p>
        <button
          style={{
            padding: "20px 56px",
            borderRadius: "999px",
            border: "none",
            background: C.yellow,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "20px",
            fontWeight: 700,
            color: C.black,
            cursor: "pointer",
            boxShadow: "0 8px 40px rgba(255,216,131,0.45)",
            transition: "all 0.3s ease",
            letterSpacing: "0.3px",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-4px) scale(1.02)";
            e.target.style.boxShadow = "0 16px 56px rgba(255,216,131,0.6)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0) scale(1)";
            e.target.style.boxShadow = "0 8px 40px rgba(255,216,131,0.45)";
          }}
          onClick={() => onStart && onStart()}
        >
          Start Exploring ⚔️
        </button>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════ */
function Footer() {
  return (
    <footer
      style={{
        padding: "40px",
        background: C.black,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "20px" }}>⚔️</span>
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "18px",
            fontWeight: 700,
            color: C.white,
          }}
        >
          Sidequest
        </span>
      </div>
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "14px",
          color: "#888",
          margin: 0,
        }}
      >
        Hacklahoma 2026 · Norman, OK
      </p>
    </footer>
  );
}

/* ═══════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════ */
export default function LandingPage({ onStart }) {
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.textContent = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { margin: 0; -webkit-font-smoothing: antialiased; }
      html { scroll-behavior: smooth; }
      @keyframes softFloat {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-18px); }
      }
      @keyframes softBounce {
        0%, 100% { transform: translateX(-50%) translateY(0); }
        50% { transform: translateX(-50%) translateY(8px); }
      }
      ::selection { background: #ffd883; color: #1a1a1a; }
      @media (max-width: 768px) {
        nav > div:last-child > a { display: none !important; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <div>
      <NavBar onStart={onStart} />
      <Hero onStart={onStart} />
      <HowItWorks />
      <Features />
      <About />
      <CTA onStart={onStart} />
      <Footer />
    </div>
  );
}
