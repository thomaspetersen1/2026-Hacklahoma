# Sorcerer Troop — Tech Stack

**Fast to build, durable for production, TypeScript end-to-end.**

---

## Core Stack (Already Installed)
- **Next.js 16** — App Router, server actions, edge functions
- **React 19** — Latest, server components
- **TypeScript 5** — Type safety everywhere
- **Tailwind CSS 4** — Utility-first styling

---

## Add These

### UI & Components
- **shadcn/ui** — Pre-built accessible components, copy-paste
- **lucide-react** — Icons, tree-shakeable

### Backend & Database
- **Supabase** — Postgres + Google OAuth + real-time
- **@googlemaps/google-maps-services-js** — Places API, Routes API (server-side)

### Forms & Validation
- **react-hook-form** — Fast forms
- **zod** — Type-safe validation

### Utilities
- **date-fns** — Lightweight date/time library

---

## External APIs (All Free Tier)
- **Google Places API (New)** — Nearby search, place details
- **Google Routes API** — Travel time (walk/drive/transit)
- **Google Maps JS API** — Frontend map display (script tag)
- **OpenWeather API** — Weather conditions (native fetch, no library)

---

## Hosting
- **Vercel** — Next.js hosting, auto-deploy from GitHub
- **Supabase** — Database + auth hosting

---

## Install Command

```bash
npm install @supabase/supabase-js @googlemaps/google-maps-services-js lucide-react date-fns react-hook-form zod @hookform/resolvers && npx shadcn@latest init -y
```

---

## What We're NOT Using
- ❌ Prisma (Supabase client is simpler)
- ❌ tRPC (server actions are enough)
- ❌ Redux/Zustand (React hooks + URL state)
- ❌ React Query (server actions cache automatically)
- ❌ Axios (native fetch)
