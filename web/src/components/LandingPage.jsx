import { useState } from "react";
import SuggestionList from "./SuggestionList";
import { getSuggestions } from "../services/api";

function LandingPage() {
  const [formData, setFormData] = useState({
    time: 2,
    priceRange: 2,
    vibe: [],
    city: "Norman, Oklahoma",
  });

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const vibes = ["food", "outdoor", "entertainment", "culture"];

  const toggleVibe = (vibe) => {
    setFormData((prev) => ({
      ...prev,
      vibe: prev.vibe.includes(vibe)
        ? prev.vibe.filter((v) => v !== vibe)
        : [...prev.vibe, vibe],
    }));
  };

  const handleGo = async () => {
    if (formData.vibe.length === 0) {
      setError("Please select at least one vibe");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getSuggestions({
        vibe: formData.vibe,
        time: formData.time,
        city: formData.city,
        priceRange: formData.priceRange,
      });

      setSuggestions(data);

      if (data.length === 0) {
        setError("No suggestions found. Try different options.");
      }
    } catch (err) {
      setError(
        "Failed to get suggestions. Make sure backend is running. Error: " +
          err,
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-10">
          Find Your Next Activity
        </h1>

        <div className="bg-white rounded-xl shadow-2xl p-8 mb-10">
          {/* City */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              placeholder="Enter city"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          {/* Time */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Time Available: {formData.time} hours
            </label>
            <input
              type="range"
              min="0.5"
              max="8"
              step="0.5"
              value={formData.time}
              onChange={(e) =>
                setFormData({ ...formData, time: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>30 min</span>
              <span>8 hrs</span>
            </div>
          </div>

          {/* Price Range */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Price Range
            </label>
            <select
              value={formData.priceRange}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  priceRange: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition"
            >
              <option value={1}>$ - Cheap</option>
              <option value={2}>$$ - Moderate</option>
              <option value={3}>$$$ - Expensive</option>
              <option value={4}>$$$$ - Luxury</option>
            </select>
          </div>

          {/* Vibe */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Vibe
            </label>
            <div className="flex flex-wrap gap-3">
              {vibes.map((vibe) => (
                <button
                  key={vibe}
                  type="button"
                  onClick={() => toggleVibe(vibe)}
                  className={`px-6 py-2 rounded-lg font-semibold transition capitalize ${
                    formData.vibe.includes(vibe)
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {vibe}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Go Button */}
          <button
            onClick={handleGo}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg text-lg transition disabled:cursor-not-allowed"
          >
            {loading ? "Loading..." : "Go"}
          </button>
        </div>

        {/* Suggestion List */}
        <SuggestionList suggestions={suggestions} />
      </div>
    </div>
  );
}

export default LandingPage;
