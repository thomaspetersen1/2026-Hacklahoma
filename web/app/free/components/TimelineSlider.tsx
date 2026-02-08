"use client";

import { useState } from "react";

const PRESET_VALUES = [15, 30, 45, 60, 90] as const;
const MIN = 15;
const MAX = 120;

export function TimelineSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [customValue, setCustomValue] = useState(value);

  // Snap to preset if close (within 3 minutes)
  const snapToPreset = (val: number) => {
    for (const preset of PRESET_VALUES) {
      if (Math.abs(val - preset) <= 3) return preset;
    }
    return val;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = Number(e.target.value);
    const snapped = snapToPreset(raw);
    setCustomValue(raw);
    onChange(snapped);
  };

  const handlePresetClick = (preset: number) => {
    setCustomValue(preset);
    onChange(preset);
  };

  return (
    <div className="relative space-y-6">
      {/* Preset ticks and labels */}
      <div className="flex justify-between px-2 pb-2">
        {PRESET_VALUES.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => handlePresetClick(v)}
            className="group relative flex flex-col items-center gap-1 transition-all"
          >
            <div
              className={`h-2 w-0.5 rounded-full transition-all ${
                value === v
                  ? "bg-[var(--accent)]"
                  : "bg-white/20 group-hover:bg-white/40"
              }`}
            />
            <span
              className={`text-xs transition-all ${
                value === v
                  ? "text-[var(--accent)] font-semibold"
                  : "text-white/50 group-hover:text-white/70"
              }`}
            >
              {v}
            </span>
          </button>
        ))}
      </div>

      {/* Range input */}
      <input
        type="range"
        min={MIN}
        max={MAX}
        step={1}
        value={customValue}
        onChange={handleChange}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={() => setIsDragging(false)}
        className="timeline-slider"
        aria-label="Time window in minutes"
      />

      {/* Current value display */}
      <div className="text-center">
        <span className="text-5xl font-semibold text-white/95">
          {value}
        </span>
        <span className="ml-2 text-lg text-white/60">min</span>
      </div>
    </div>
  );
}
