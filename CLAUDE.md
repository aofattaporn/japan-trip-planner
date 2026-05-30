# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server (Vite HMR)
npm run build     # production build → dist/
npm run preview   # preview the production build locally
npm run lint      # ESLint
```

There are no tests. There is no type-checking (plain JSX, not TypeScript).

## Environment

Copy `.env.example` to `.env` and fill in both variables before running locally:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

These are injected at build time by Vite. The CI pipeline reads them from GitHub Actions secrets (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

## Architecture

**Stack:** React 19, Vite 6, Tailwind CSS v4 (via `@tailwindcss/vite`), Supabase (auth + database), React Leaflet, `date-fns`, `lucide-react`. Deployed as a PWA to GitHub Pages at `/japan-trip-planner/` (set in `vite.config.js` `base`).

**Routing:** `src/App.jsx` — three routes (`/login`, `/`, `/trips/:tripId`) wrapped in `ProtectedRoute` / `PublicRoute` guards that read from `AuthContext`. Auth state is `undefined` while loading, `null` when logged out, or a user object when authenticated.

**Auth:** `src/contexts/AuthContext.jsx` — thin wrapper around `supabase.auth`. Google OAuth only (no email/password). The `useAuth()` hook exposes `{ user, signOut }`.

**Data layer:** All database access is direct Supabase client calls from page components — there is no dedicated data-access layer or React Query. The single Supabase client is exported from `src/lib/supabase.js`.

**Database schema (inferred):**
- `trips` — user's trips (`id`, `name`, `start_date`, `end_date`, `user_id`)
- `days` — one row per calendar date in a trip (`id`, `trip_id`, `date`, `active_plan_id`)
- `plans` — alternative itineraries for a day (`id`, `day_id`, `name`)
- `activities` — items in a plan (`id`, `plan_id`, `title`, `time`, `type`, `note`, `price_jpy`, `lat`, `lng`)

**TripDetailPage pattern:** On load, auto-generates `days` + a default "Plan A" for any date in the trip's range that doesn't have a row yet. State is held locally; mutations write to Supabase then update local state directly.

**Map:** `src/components/map/MapView.jsx` uses CartoDB Voyager tiles (English labels). After activities are rendered, it fetches nearby train stations via the Overpass API (`src/lib/overpass.js`) within 1 km of the centroid. Place search in `ActivityForm` uses Nominatim (`src/lib/geocode.js`) with 400 ms debounce.

**Activity types:** Defined in `src/lib/constants.js` (`ACTIVITY_TYPES`). `restaurant` is the only type that requires a price.

**Plan tabs:** Each day can have multiple plans (Plan A, Plan B, …). Only the active plan's activities are shown and counted in the budget. `BudgetSummary` aggregates across all days using their active plans.

**Mobile layout:** `TripDetailPage` uses a `mobileTab` toggle (`'plan'` | `'map'`) to switch between the activity list and the map. On `lg+` both panels are visible side-by-side.

## Deployment

Pushes to `main` trigger the GitHub Actions workflow (`.github/workflows/deploy.yml`), which builds and deploys to GitHub Pages automatically.
