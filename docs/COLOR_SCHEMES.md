# SideQuest Color Schemes

All colors use OKLCH color space for premium, predictable rendering. Swap color schemes by changing CSS variables in `:root` — no component code changes needed.

---

## Color Scheme 1: Black & White (Current - Recommended for Demo)

**Philosophy:** Minimal, authoritative, premium. Matches Uber aesthetic.

```css
:root {
  /* Dark backgrounds */
  --background: oklch(0.05 0.01 0);
  --surface: oklch(0.08 0.01 0);
  --surface-elevated: oklch(0.12 0.01 0);

  /* Text & foreground */
  --foreground: oklch(0.95 0.01 100);
  --muted: oklch(0.70 0.01 100);
  --muted-2: oklch(0.55 0.01 100);

  /* Cards & glass morphism */
  --card: oklch(0.10 0.01 0 / 0.6);
  --card-border: oklch(1 0.02 100 / 0.15);

  /* Accent colors */
  --accent: oklch(0.95 0.02 100);        /* Bright white CTA */
  --accent-2: oklch(0.50 0.01 100);      /* Mid gray secondary */
  --accent-3: oklch(0.30 0.01 100);      /* Dark gray tertiary */

  /* Shadows */
  --shadow: 0 20px 80px oklch(0 0 0 / 0.55);
}
```

**When to use:** Demo, pitch, production-grade. Feels expensive.

---

## Color Scheme 2: Green & Dark (Alternative - Warmer, Friendlier)

**Philosophy:** Approachable, energetic, "go" energy. Green + dark gray = modern startup.

```css
:root {
  /* Dark backgrounds (stay neutral) */
  --background: oklch(0.05 0.01 0);
  --surface: oklch(0.08 0.01 0);
  --surface-elevated: oklch(0.12 0.01 0);

  /* Text & foreground (stay neutral) */
  --foreground: oklch(0.95 0.01 100);
  --muted: oklch(0.70 0.01 100);
  --muted-2: oklch(0.55 0.01 100);

  /* Cards & glass morphism (stay neutral) */
  --card: oklch(0.10 0.01 0 / 0.6);
  --card-border: oklch(1 0.02 100 / 0.15);

  /* Accent colors - GREEN for energy */
  --accent: oklch(0.72 0.12 145);        /* Muted emerald CTA (premium green, not neon) */
  --accent-2: oklch(0.60 0.08 140);      /* Darker green secondary */
  --accent-3: oklch(0.50 0.01 100);      /* Gray tertiary (fallback) */

  /* Shadows (same, but with green tint option) */
  --shadow: 0 20px 80px oklch(0 0 0 / 0.55);
}
```

**Color values explained:**
- `oklch(0.72 0.12 145)` — 72% lightness (visible), 0.12 chroma (muted, not neon), 145° hue (emerald green)
- 0.12 chroma = sophisticated green (not lime/neon)
- Use on buttons, active states, accent elements ONLY
- Backgrounds stay pure black = maintains premium feel

**When to use:** If you want "friendly tech" vibe while keeping premium. Good for post-launch.

---

## Color Scheme 3: Green + Yellow (NOT recommended, but here if you want to experiment)

**Philosophy:** Cozy, playful, warm. Signals "approachable indie app."

⚠️ **Warning:** This reduces perceived premium-ness. Only use if brand repositioning is intentional.

```css
:root {
  /* Dark backgrounds */
  --background: oklch(0.05 0.01 0);
  --surface: oklch(0.08 0.01 0);
  --surface-elevated: oklch(0.12 0.01 0);

  /* Text */
  --foreground: oklch(0.95 0.01 100);
  --muted: oklch(0.70 0.01 100);
  --muted-2: oklch(0.55 0.01 100);

  /* Cards */
  --card: oklch(0.10 0.01 0 / 0.6);
  --card-border: oklch(1 0.02 100 / 0.15);

  /* Accent colors - GREEN + YELLOW */
  --accent: oklch(0.70 0.12 145);        /* Emerald for primary CTA */
  --accent-2: oklch(0.72 0.14 85);       /* Yellow for secondary/attention */
  --accent-3: oklch(0.50 0.01 100);      /* Gray fallback */

  /* Shadows */
  --shadow: 0 20px 80px oklch(0 0 0 / 0.55);
}
```

**Why this is less premium:**
- Two warm colors = visual competition (where do eyes go?)
- Yellow on dark = warns/alerts feeling (signals "caution," not "go")
- Together they read "friendly startup," not "elite tech"

**Only use if:**
- Brand is explicitly "warm & community-first"
- Target audience is kids/beginner (not young professionals)
- You want to stand out from minimalist competitors

---

## How to Use These Schemes

### Option 1: Static Scheme (Lock in One)
Just use whichever `:root` block above. No changes needed in components.

### Option 2: Theme Toggle (Add Dark/Light Mode Support)

Create `globals.css` with multiple themes:

```css
/* Default (Black & White) */
:root {
  --background: oklch(0.05 0.01 0);
  --accent: oklch(0.95 0.02 100);
  /* ... rest of black theme ... */
}

/* Opt-in: Green & Dark Theme */
[data-theme="green"] {
  --accent: oklch(0.72 0.12 145);
  --accent-2: oklch(0.60 0.08 140);
  /* ... rest of green theme ... */
}

/* Opt-in: Green + Yellow Theme (not recommended) */
[data-theme="warm"] {
  --accent: oklch(0.70 0.12 145);
  --accent-2: oklch(0.72 0.14 85);
  /* ... rest of warm theme ... */
}
```

Then in `layout.tsx`:

```tsx
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [theme, setTheme] = useState("default");

  return (
    <html lang="en" data-theme={theme}>
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>
        {children}
        {/* Theme switcher button */}
        <div className="fixed bottom-4 right-4 flex gap-2">
          <button onClick={() => setTheme("default")}>Black</button>
          <button onClick={() => setTheme("green")}>Green</button>
        </div>
      </body>
    </html>
  );
}
```

---

## Component Guarantees (All Already Built)

All of these color schemes work with your existing components because they use CSS variables:

✅ **`.glass`** — Glassmorphism (blur 14px, shadow, backdrop-filter)
✅ **`.chip`** — Active state styling
✅ **`SuggestionCard`** — Time breakdown, badges, navigate button
✅ **Buttons** — Hover brightness-105, active scale
✅ **Animations** — 480ms rise-in, 70ms stagger
✅ **Shadows** — `var(--shadow)` scales to all themes
✅ **Focus states** — `outline 2px solid var(--accent)` adapts
✅ **Typography** — Bebas Neue (display) + IBM Plex Sans (body)

**Change `--accent` and everything adapts automatically.**

---

## Recommendation for SideQuest

**Use: Black & White (Current)**

Reasons:
1. **Matches Uber vibe** — premium, minimal, authoritative
2. **Young adults respond to** — feels modern, not cozy
3. **Highest contrast** — accessibility (WCAG AAA)
4. **Signals quality** — neutral palette = expensive (like luxury fashion)

**Green & Dark works as backup** if brand ever shifts to "friendly/warm" positioning.

**Green + Yellow: Skip.** It works technically, but signals "indie/casual," not "elite."

---

## OKLCH Color Values Reference

### Premiu Green (If You Ever Switch)

```
Emerald: oklch(0.72 0.12 145)      ← Primary CTA
Dark Green: oklch(0.60 0.08 140)   ← Secondary CTA
```

### Premium Yellow (Not Recommended)

```
Warm Yellow: oklch(0.72 0.14 85)   ← Attention/warmth
```

### Why These Specific Values?

- **0.72 lightness** = visible on `oklch(0.05)` background, not washed out
- **0.12 chroma** = saturated enough to see, not neon
- **145° hue** = true emerald (not lime, not teal)
- **85° hue** = warm yellow (not acid/sour)

All designed to feel premium when paired with pure black backgrounds.
