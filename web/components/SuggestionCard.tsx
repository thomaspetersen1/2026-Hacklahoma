"use client";

import type { Suggestion } from "@/lib/types";

function timeBreakdown(s: Suggestion) {
  return `${s.travelMinutes}m there · ${s.dwellMinutes}m hang · ${s.travelMinutes}m back · ${s.bufferMinutes}m buffer`;
}

export function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  return (
    <article className="glass rounded-3xl p-5 transition hover:border-white/25">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
              {suggestion.category}
            </span>
            {suggestion.openNow === true ? (
              <span className="inline-flex items-center rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                open now
              </span>
            ) : null}
          </div>

          <h3 className="mt-3 truncate text-lg font-semibold text-white/95">
            {suggestion.name}
          </h3>
          {suggestion.address ? (
            <p className="mt-1 truncate text-xs text-[var(--muted-2)]">
              {suggestion.address}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
            <span className="text-white/90">
              fits in {suggestion.totalMinutes}m
            </span>
            <span aria-hidden="true" className="text-white/20">
              /
            </span>
            <span>{timeBreakdown(suggestion)}</span>
          </div>

          {suggestion.reason && suggestion.reason.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestion.reason.slice(0, 3).map((r) => (
                <span
                  key={r}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80"
                >
                  {r}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <a
            href={suggestion.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-black transition hover:brightness-105"
          >
            Navigate
          </a>
          <div className="text-right text-xs text-[var(--muted-2)]">
            {suggestion.travelMinutes}m away
          </div>
        </div>
      </div>
    </article>
  );
}

