"use client";

import Link from "next/link";
import { type CSSProperties, useEffect, useState, useSyncExternalStore } from "react";

interface PersonaProfile {
  category_food: number;
  category_outdoor: number;
  category_entertainment: number;
  category_culture: number;
  price_sensitivity: number;
  adventure_level: number;
}

interface Persona {
  name: string;
  description: string;
  profile: PersonaProfile;
}

const PROFILE_LABELS: { key: keyof PersonaProfile; label: string; color: string }[] = [
  { key: "category_food", label: "Food", color: "var(--accent)" },
  { key: "category_outdoor", label: "Outdoor", color: "#6ee7ff" },
  { key: "category_entertainment", label: "Entertainment", color: "#ff5ea8" },
  { key: "category_culture", label: "Culture", color: "#c4a7ff" },
  { key: "price_sensitivity", label: "Price", color: "#ffd166" },
  { key: "adventure_level", label: "Adventure", color: "#ff8a5c" },
];

function stagger(i: number): CSSProperties {
  return { ["--i" as string]: i };
}

const USER_ID_STORAGE_KEY = "sidequest_userId";
const USER_ID_CHANGE_EVENT = "sidequest:userIdChange";

function subscribeToUserIdChanges(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(USER_ID_CHANGE_EVENT, callback as EventListener);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(USER_ID_CHANGE_EVENT, callback as EventListener);
  };
}

function getStoredUserIdSnapshot(): string | null {
  return localStorage.getItem(USER_ID_STORAGE_KEY);
}

function getStoredUserIdServerSnapshot(): string | null {
  return null;
}

function setStoredUserId(nextUserId: string | null) {
  if (nextUserId) {
    localStorage.setItem(USER_ID_STORAGE_KEY, nextUserId);
  } else {
    localStorage.removeItem(USER_ID_STORAGE_KEY);
  }

  window.dispatchEvent(new Event(USER_ID_CHANGE_EVENT));
}

export default function ProfilePage() {
  const [personas, setPersonas] = useState<Record<string, Persona>>({});
  const [loading, setLoading] = useState(true);
  const selectedId = useSyncExternalStore(
    subscribeToUserIdChanges,
    getStoredUserIdSnapshot,
    getStoredUserIdServerSnapshot,
  );

  // Load personas from ML service on mount
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    fetch(`${apiUrl}/api/profiles`)
      .then((r) => r.json())
      .then((data) => {
        if (data.profiles) setPersonas(data.profiles);
      })
      .catch(() => {
        // Fallback: hardcoded personas if ML service is down
        setPersonas({
          alex: {
            name: "Alex",
            description: "Chill coffee lover. Walks everywhere. Prefers cozy, affordable spots.",
            profile: { category_food: 0.8, category_outdoor: 0.2, category_entertainment: 0.4, category_culture: 0.3, price_sensitivity: 0.3, adventure_level: 0.3 },
          },
          jordan: {
            name: "Jordan",
            description: "Active and outdoorsy. Always exploring. Willing to drive for a good trail.",
            profile: { category_food: 0.3, category_outdoor: 0.9, category_entertainment: 0.6, category_culture: 0.1, price_sensitivity: 0.5, adventure_level: 0.8 },
          },
          sam: {
            name: "Sam",
            description: "Creative and cultured. Museums, galleries, bookstores. Transit rider.",
            profile: { category_food: 0.4, category_outdoor: 0.3, category_entertainment: 0.5, category_culture: 0.9, price_sensitivity: 0.6, adventure_level: 0.5 },
          },
        });
      })
      .finally(() => setLoading(false));
  }, []);

  function selectPersona(id: string) {
    if (selectedId === id) {
      // Deselect
      setStoredUserId(null);
    } else {
      setStoredUserId(id);
    }
  }

  const selected = selectedId ? personas[selectedId] : null;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-10 sm:px-8">
      <header className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <Link
            href="/"
            className="font-[var(--font-display)] text-2xl tracking-wider hover:opacity-90"
          >
            Sorcerer Troop
          </Link>
          <span className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
            Profile
          </span>
        </div>
        <Link
          href="/free"
          className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 transition hover:bg-white/10"
        >
          Route me{selected ? ` as ${selected.name}` : ""}
        </Link>
      </header>

      <main className="mt-10 grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
        {/* Persona selection */}
        <section className="glass reveal rounded-3xl p-6">
          <h1 className="font-[var(--font-display)] text-4xl leading-[0.95] tracking-wide sm:text-5xl">
            Who are you
            <span className="block text-[var(--accent)]">today?</span>
          </h1>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            Pick a persona. Same place, same time window — different person gets
            different recommendations.
          </p>

          <div className="stagger mt-8 grid gap-3">
            {loading ? (
              <>
                <div className="glass h-20 rounded-2xl" style={stagger(0)} />
                <div className="glass h-20 rounded-2xl" style={stagger(1)} />
                <div className="glass h-20 rounded-2xl" style={stagger(2)} />
              </>
            ) : (
              Object.entries(personas).map(([id, persona], i) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectPersona(id)}
                  className="chip w-full rounded-2xl p-4 text-left transition hover:bg-white/10"
                  data-active={selectedId === id}
                  style={stagger(i)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-white/95">
                      {persona.name}
                    </span>
                    {selectedId === id && (
                      <span className="rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[11px] font-semibold text-black">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {persona.description}
                  </p>
                </button>
              ))
            )}
          </div>

          {selectedId && (
            <button
              type="button"
              onClick={() => selectPersona(selectedId)}
              className="mt-4 text-xs text-[var(--muted-2)] underline decoration-white/20 underline-offset-4 transition hover:text-white/70"
            >
              Clear selection (use neutral profile)
            </button>
          )}
        </section>

        {/* Profile visualization */}
        <section className="reveal">
          <div className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                {selected ? `${selected.name}'s Profile` : "Neutral Profile"}
              </h2>
              <span className="text-xs text-[var(--muted)]">6 dimensions</span>
            </div>

            <div className="mt-6 space-y-4">
              {PROFILE_LABELS.map(({ key, label, color }) => {
                const value = selected
                  ? selected.profile[key]
                  : 0.5;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/80">{label}</span>
                      <span className="text-[var(--muted)]">
                        {Math.round(value * 100)}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${value * 100}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/70">
              How it works
            </p>
            <p className="mt-2 text-sm text-white/90">
              Each persona has different category affinities. The ML model uses
              these as features to{" "}
              <span className="text-[var(--accent)]">
                personalize the ranking
              </span>
              . After each interaction, the profile updates in real-time.
            </p>
          </div>
        </section>
      </main>

      <footer className="mt-auto pt-12 text-xs text-[var(--muted-2)]">
        <Link href="/" className="hover:text-white/60">
          ← Back to home
        </Link>
      </footer>
    </div>
  );
}
