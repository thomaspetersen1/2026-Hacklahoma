import "./App.css";
import { useState, useEffect } from "react";
import { C } from "./assets/colors";
import Onboarding from "./components/Onboarding";
import Questionnaire from "./components/Questionnaire";
import Recommendations from "./components/Recommendations";
import LandingPage from "./components/LandingPage";
import ProfileSelector from "./components/ProfileSelector";

// Map profileId to location for location-based routing
const PROFILE_LOCATIONS = {
  alex: "norman",
  jordan: "norman",
  sam: "norman",
  maya: "okc",
  chris: "dallas",
};

export default function App() {
  const [page, setPage] = useState(-1);
  const [hobbies, setHobbies] = useState([]);
  const [prefs, setPrefs] = useState({});
  const [selectedProfile, setSelectedProfile] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  // Google Fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    // Global slider styles
    const style = document.createElement("style");
    style.textContent = `
      * { box-sizing: border-box; }
      body { margin: 0; background: ${C.green}; }
      input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        height: 8px;
        border-radius: 999px;
        background: #e0e0e0;
        outline: none;
      }
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: ${C.yellow};
        cursor: pointer;
        border: 3px solid ${C.white};
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      }
      input[type="range"]::-moz-range-thumb {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: ${C.yellow};
        cursor: pointer;
        border: 3px solid ${C.white};
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      }
      ::-webkit-scrollbar { display: none; }
    `;
    document.head.appendChild(style);
  }, []);

  // Handle profile selection
  const handleProfileChange = (profileId) => {
    setSelectedProfile(profileId);
    // If on onboarding, jump to questionnaire
    // If on questionnaire or recommendations, stay on current page (refresh happens automatically)
    if (page === 0) {
      setPage(1);
    }
    // Otherwise stay on current page — the effect hooks will refetch with new profile
  };
  if (page === -1) {
    return <LandingPage onStart={() => setPage(0)} />;
  }

  if (page === 0) {
    return (
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 1100,
          }}
        >
          <ProfileSelector
            selectedProfile={selectedProfile}
            onProfileChange={handleProfileChange}
          />
        </div>
        <Onboarding
          onNext={(selected) => {
            setHobbies(selected);
            setPage(1);
          }}
        />
      </div>
    );
  }

  if (page === 1) {
    return (
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 1100,
          }}
        >
          <ProfileSelector
            selectedProfile={selectedProfile}
            onProfileChange={handleProfileChange}
          />
        </div>
        <Questionnaire
          onBack={() => {
            setPage(0);
            setSelectedProfile(null);
          }}
          onNext={(data) => {
            setPrefs(data);
            setPage(2);
          }}
          selectedProfile={selectedProfile}
        />
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "fixed",
          top: "24px",
          right: "24px",
          zIndex: 1100,
        }}
      >
        <ProfileSelector
          selectedProfile={selectedProfile}
          onProfileChange={handleProfileChange}
        />
      </div>
      <Recommendations
        onBack={() => setPage(1)}
        preferences={{
          hobbies,
          ...prefs,
          location: selectedProfile ? PROFILE_LOCATIONS[selectedProfile] : undefined,
          userId: selectedProfile,
        }}
      />
    </div>
  );
}
