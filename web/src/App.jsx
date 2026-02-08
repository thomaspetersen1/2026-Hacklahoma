import "./App.css";
import { useState, useEffect } from "react";
import { C } from "./assets/colors";
import Onboarding from "./components/Onboarding";
import Questionnaire from "./components/Questionnaire";
import Recommendations from "./components/Recommendations";

export default function App() {
  const [page, setPage] = useState(0);
  const [hobbies, setHobbies] = useState([]);
  const [prefs, setPrefs] = useState({});

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

  if (page === 0) {
    return (
      <Onboarding
        onNext={(selected) => {
          setHobbies(selected);
          setPage(1);
        }}
      />
    );
  }

  if (page === 1) {
    return (
      <Questionnaire
        onBack={() => setPage(0)}
        onNext={(data) => {
          setPrefs(data);
          setPage(2);
        }}
      />
    );
  }

  return (
    <Recommendations
      onBack={() => setPage(1)}
      preferences={{ hobbies, ...prefs }}
    />
  );
}
