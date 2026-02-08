import React from "react";

function SuggestionList({ suggestions = [] }) {
  if (!Array.isArray(suggestions)) return null;

  if (suggestions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto text-center text-white">
        <p className="bg-white/10 rounded-lg p-6">
          No suggestions yet — try selecting vibes and hitting Go.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {suggestions.map((s) => (
        <div key={s.id || s.name} className="bg-white rounded-lg shadow p-4">
          <div className="h-40 bg-gray-100 rounded overflow-hidden mb-3 flex items-center justify-center">
            {s.photoUri ? (
              <img
                src={s.photoUri}
                alt={s.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-400">No image</div>
            )}
          </div>
          <h3 className="text-lg font-semibold mb-1 text-gray-900">{s.name}</h3>
          {s.address && (
            <div className="text-sm text-gray-600 mb-2">{s.address}</div>
          )}
          <div className="text-sm text-gray-700 mb-2">
            {s.travelMinutes != null && (
              <span>{s.travelMinutes} min travel • </span>
            )}
            {s.dwellMinutes != null && (
              <span>{s.dwellMinutes} min at place • </span>
            )}
            {s.totalMinutes != null && <span>{s.totalMinutes} min total</span>}
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-gray-500">
              {s.vibeMatch && s.vibeMatch.length > 0
                ? s.vibeMatch.join(", ")
                : "Vibes: N/A"}
            </div>
            <div className="text-sm font-semibold text-purple-600">
              {s.fitScore ?? "-"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SuggestionList;
