import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-10 sm:px-8">
      <header className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="font-[var(--font-display)] text-2xl tracking-wider">
            Sorcerer Troop
          </span>
          <span className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
            action routing
          </span>
        </div>
        <Link
          href="/free"
          className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 transition hover:bg-white/10"
        >
          Try demo
        </Link>
      </header>

      <main className="mt-14 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <section className="reveal">
          <h1 className="font-[var(--font-display)] text-[64px] leading-[0.9] tracking-wide sm:text-[88px]">
            Turn dead time into
            <span className="block text-[var(--accent)]">micro-adventures.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-7 text-[var(--muted)]">
            New city. New job. No default third places. Sorcerer Troop routes you
            to the next best spot that fits your time window and vibe.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/free"
              className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-black transition hover:brightness-105"
            >
              I&apos;m Free Now
            </Link>
            <span className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90">
              Utility, not a feed
            </span>
          </div>
        </section>

        <aside className="glass reveal rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Demo loop</p>
            <p className="text-xs text-[var(--muted)]">~30 seconds</p>
          </div>
          <ol className="mt-4 space-y-3 text-sm text-[var(--muted)]">
            <li>1) Pick a window (15-90 min)</li>
            <li>2) Choose a vibe (optional)</li>
            <li>3) Get 3-5 picks that all fit</li>
            <li>4) Tap + navigate</li>
          </ol>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/70">
              Principle
            </p>
            <p className="mt-2 text-sm text-white/90">
              <span className="text-[var(--accent)]">Fit</span> is a hard
              constraint. Everything else is preference.
            </p>
          </div>
        </aside>
      </main>

      <footer className="mt-auto pt-12 text-xs text-[var(--muted-2)]">
        Built for a hackathon: ship the loop, then harden the infrastructure.
      </footer>
    </div>
  );
}
