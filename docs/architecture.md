# FocusPoint Architecture

FocusPoint is organized as a Supabase-first monorepo. The React app is the only runnable application today, shared study-domain logic is isolated for reuse, and Supabase-owned backend artifacts live in their own top-level boundary.

## Repository Layout

```txt
apps/web/          React 19 + Vite frontend, PWA assets, app routing, UI features
packages/shared/  Curriculum data, priority engine, local cache/sync facade
supabase/         Database/schema documentation, migrations, seed placeholders
docs/             Product and architecture documentation
```

## Frontend

`apps/web/src/app/main.jsx` initializes the local data facade, mounts React, and composes the router, theme provider, and auth provider.

Feature UI lives under `apps/web/src/features`:

- `auth`: sign-in/sign-up and onboarding
- `dashboard`: recommended study actions and progress
- `courses`: course management and lesson tracking
- `exams`: exam countdowns
- `pomodoro`: focus timer
- `timetable`: calendar and notification scheduler
- `settings`: profile, preferences, notifications, and resources

Reusable browser-specific code lives under `apps/web/src/shared`, including Supabase client creation, React contexts, and notification helpers.

## Shared Domain Logic

`packages/shared` contains code that is not tied to React rendering:

- `curriculum/curriculumData`: read-only curriculum templates
- `priority/priorityEngine`: dashboard scoring and countdown helpers
- `study-data/mockDatabase`: localStorage cache, compatibility projections, and Supabase hydration/save facade

The web app imports this package through `@focuspoint/shared/*`.

## Backend Boundary

Supabase remains the backend. The browser uses `@supabase/supabase-js` with:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

There is no custom Node API server in this structure. Future schema migrations, generated database types, and seed SQL should live under `supabase/`.
