"use client";

import Link from "next/link";
import { useReducer, useMemo, useState, useEffect, type CSSProperties } from "react";
import { AnimatePresence } from "framer-motion";
import type { Suggestion, TravelMode, Vibe, FlowStep, FlowState, FlowAction } from "@/lib/types";
import { SuggestionCard } from "@/components/SuggestionCard";
import { MorphingCard } from "./components/MorphingCard";
import { TimelineSlider } from "./components/TimelineSlider";
import { TransportPicker } from "./components/TransportPicker";
import { FlowProgress } from "./components/FlowProgress";

const VIBES: Vibe[] = [
  "Chill",
  "Social",
  "Active",
  "Creative",
  "Outdoors",
  "Surprise",
];

function formatMode(mode: TravelMode) {
  switch (mode) {
    case "WALK":
      return "Walk";
    case "DRIVE":
      return "Drive";
    case "TRANSIT":
      return "Transit";
  }
}

function stagger(i: number): CSSProperties {
  return { ["--i" as string]: i };
}

// Flow reducer logic
const initialFlowState: FlowState = {
  step: "time",
  timeValue: 45,
  transportMode: "WALK",
  vibe: undefined,
};

function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case "SET_TIME":
      return { ...state, timeValue: action.value };
    case "NEXT_STEP":
      if (state.step === "time") {
        return { ...state, step: "transport" };
      }
      return state;
    case "SELECT_TRANSPORT":
      return { ...state, transportMode: action.mode, step: "results" };
    case "SET_VIBE":
      return { ...state, vibe: action.vibe };
    case "RESET":
      return initialFlowState;
    default:
      return state;
  }
}

export default function FreeNowPage() {
  const [flowState, dispatch] = useReducer(flowReducer, initialFlowState);
  const { step, timeValue, transportMode, vibe } = flowState;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Load userId from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("sidequest_userId");
    if (stored) setUserId(stored);
  }, []);

  const maxTravelMinutes = useMemo(() => {
    if (transportMode === "WALK")
      return Math.min(15, Math.max(7, Math.floor(timeValue / 5)));
    if (transportMode === "TRANSIT")
      return Math.min(20, Math.max(8, Math.floor(timeValue / 4)));
    return Math.min(25, Math.max(10, Math.floor(timeValue / 3)));
  }, [transportMode, timeValue]);

  async function getLocation() {
    if (!navigator.geolocation) {
      throw new Error("Geolocation is not available in this browser.");
    }

    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 15000,
      });
    });

    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  }

  async function handleTransportSelect(mode: TravelMode) {
    dispatch({ type: "SELECT_TRANSPORT", mode });
    setLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const loc = await getLocation();
      setOrigin(loc);

      // Call the Express server (port 3001)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/api/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          windowMinutes: timeValue,
          origin: loc,
          travelMode: mode,
          vibe: vibe === "Surprise" ? undefined : vibe,
          maxTravelMinutes,
          userId: userId || undefined,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error || `Suggest failed (${res.status})`);
      }

      const body = (await res.json()) as { suggestions: Suggestion[] };
      setSuggestions(body.suggestions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-10 sm:px-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <Link
            href="/"
            className="font-[var(--font-display)] text-2xl tracking-wider hover:opacity-90"
          >
            SideQuest
          </Link>
          <span className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
            I&apos;m Free Now
          </span>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          {userId && (
            <Link
              href="/profile"
              className="rounded-full border border-[rgba(182,255,46,0.3)] bg-[rgba(182,255,46,0.08)] px-3 py-1 text-xs text-[var(--accent)] transition hover:bg-[rgba(182,255,46,0.15)]"
            >
              as {userId.charAt(0).toUpperCase() + userId.slice(1)}
            </Link>
          )}
          {!userId && (
            <Link
              href="/profile"
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/60 transition hover:bg-white/10"
            >
              Set profile
            </Link>
          )}
          <span className="text-xs text-[var(--muted)]">max travel</span>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/85">
            {maxTravelMinutes} min
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="mt-10 grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        {/* Left panel - Morphing flow */}
        <section className="glass reveal rounded-3xl p-6">
          <h1 className="font-[var(--font-display)] text-5xl leading-[0.95] tracking-wide sm:text-6xl">
            Summon your next
            <span className="block text-[var(--accent)]">third place</span>
          </h1>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            Pick a window. Choose a vibe. We return options that fit—then hand
            off to navigation.
          </p>

          {/* Flow progress indicator */}
          <FlowProgress currentStep={step} className="mt-8" />

          {/* Morphing card area */}
          <div className="mt-8">
            <AnimatePresence mode="wait">
              {step === "time" && (
                <MorphingCard key="time">
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-white/70">
                        How much time do you have?
                      </p>
                    </div>
                    <TimelineSlider
                      value={timeValue}
                      onChange={(v) =>
                        dispatch({ type: "SET_TIME", value: v })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "NEXT_STEP" })}
                      className="w-full rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-black transition hover:brightness-105"
                    >
                      Next
                    </button>
                  </div>
                </MorphingCard>
              )}

              {step === "transport" && (
                <MorphingCard key="transport">
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-white/70">
                        How will you travel?
                      </p>
                    </div>
                    {!loading ? (
                      <TransportPicker onSelect={handleTransportSelect} />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[var(--accent)]" />
                        <p className="mt-4 text-sm text-white/60">
                          Finding your spots...
                        </p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "SET_TIME", value: timeValue })} // Go back
                      disabled={loading}
                      className="w-full rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10 disabled:opacity-50"
                    >
                      Back
                    </button>
                  </div>
                </MorphingCard>
              )}

              {step === "results" && (
                <MorphingCard key="results">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white/90">
                        Found {suggestions.length} spots
                      </p>
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "RESET" })}
                        className="text-xs text-[var(--accent)] transition hover:underline"
                      >
                        Start over
                      </button>
                    </div>
                    <p className="text-xs text-white/60">
                      {timeValue}m window · {formatMode(transportMode)} · {maxTravelMinutes}m max travel
                    </p>
                    {origin && (
                      <p className="text-xs text-white/40">
                        Location: {origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}
                      </p>
                    )}
                  </div>
                </MorphingCard>
              )}
            </AnimatePresence>
          </div>

          {/* Error message */}
          {error ? (
            <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {/* Persistent vibe picker */}
          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="text-xs uppercase tracking-[0.22em] text-white/70">
              Vibe (optional)
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {VIBES.map((v) => (
                <button
                  key={v}
                  type="button"
                  className="chip rounded-full px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                  data-active={vibe === v}
                  onClick={() =>
                    dispatch({
                      type: "SET_VIBE",
                      vibe: vibe === v ? undefined : v,
                    })
                  }
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Right panel - Suggestions */}
        <section className="reveal">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Suggestions</h2>
            <p className="text-xs text-[var(--muted)]">
              {suggestions.length ? `${suggestions.length} picks` : "Run transport"}
            </p>
          </div>

          <div className="stagger mt-4 grid gap-3">
            {loading ? (
              <>
                <div className="glass h-24 rounded-3xl" style={stagger(0)} />
                <div className="glass h-24 rounded-3xl" style={stagger(1)} />
                <div className="glass h-24 rounded-3xl" style={stagger(2)} />
              </>
            ) : null}

            {!loading && !suggestions.length ? (
              <div className="glass rounded-3xl p-6 text-sm text-[var(--muted)]">
                Select a time and transport mode to see suggestions.
              </div>
            ) : null}

            {suggestions.map((s, idx) => (
              <div key={s.id} style={stagger(idx)}>
                <SuggestionCard suggestion={s} />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
