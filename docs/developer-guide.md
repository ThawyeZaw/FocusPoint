# FocusPoint Developer Guide

This guide is for maintainers, contributors, and AI agents working in the FocusPoint repository. It describes the current implementation, not a proposed rewrite.

## Project Purpose

FocusPoint is a client-side study management app for exam preparation. It helps students manage courses, track syllabus confidence, schedule study time, count down to exams, and run focus sessions. The Dashboard combines topic confidence, course weighting, and exam urgency to recommend what to study next.

## Repository/File Architecture

```txt
apps/web/          React 19 + Vite frontend, PWA assets, routing, UI features
packages/shared/  Curriculum templates, priority engine, study-data facade
supabase/         Supabase boundary for migrations, generated types, and seed SQL
docs/             Maintainer and agent documentation
```

Important frontend areas:

- `apps/web/src/app`: app entrypoint, providers, routes, and shell layout.
- `apps/web/src/features`: feature UI for auth, dashboard, courses, exams, pomodoro, timetable, and settings.
- `apps/web/src/shared`: browser-specific contexts, Supabase client setup, and utilities.
- `apps/web/src/styles/index.css`: Tailwind import and the custom design system.

Important shared areas:

- `packages/shared/src/curriculum/curriculumData.js`: read-only curriculum templates.
- `packages/shared/src/priority/priorityEngine.js`: Dashboard scoring and countdown helpers.
- `packages/shared/src/study-data/mockDatabase.js`: main localStorage and Supabase sync facade.
- `packages/shared/src/timetable`: shared timetable helpers.

## Runtime Architecture

The only runnable app today is the browser frontend in `apps/web`.

`apps/web/src/app/main.jsx` imports global styles, initializes the study-data facade with `db.init()`, and mounts React. The root is composed with `BrowserRouter`, `ThemeProvider`, `AuthProvider`, and `React.StrictMode`.

`apps/web/src/app/App.jsx` owns the app shell, navigation, route registration, and fallback redirects. Feature screens generally read from the shared `db` facade, keep local React state for their active view, write through facade methods, then refresh from `db`.

`packages/shared` contains domain code that is not tied to React rendering. The frontend imports it through `@focuspoint/shared/*`.

Supabase is the backend boundary. The browser uses `@supabase/supabase-js` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. There is no custom Node API server.

## Data Architecture

`packages/shared/src/study-data/mockDatabase.js` is the main data facade. It owns local cache loading, migrations, CRUD helpers, compatibility projections, and Supabase hydration/save behavior.

The main local database envelope is:

```ts
type FocusPointDatabase = {
  schemaVersion: number;
  user: User;
  settings: Settings;
  userCourses: Course[];
  subjects: Subject[];
  topics: Topic[];
  exams: Exam[];
  timetable: TimetableEntry[];
  resources: Resource[];
};
```

Canonical entities:

- `userCourses`: canonical course model. Each course has sections and section topics with confidence/status progress.
- `exams`: exam paper records linked to a course/subject projection by `subjectId`.
- `timetable`: events and to-dos, including all-day entries generated from exams.
- `resources`: metadata records linked to topics. File contents are not persisted in the current implementation.
- `settings`: academic level, exam sitting dates, preferences, accent color, and timezone.
- `user`: local profile-style user data.

Compatibility projections:

- `subjects` are derived from `userCourses` by projecting course-level fields into the older subject shape.
- `topics` are flattened from all `userCourses` sections for older screens and priority helpers.
- New course and topic behavior should update `userCourses` first, then regenerate projections through the existing facade patterns.

Topic confidence is the source for progress status:

```txt
0 = Not Started
1 = Beginner
2 = In Progress
3 = Reviewing
4 = Proficient
5 = Mastered
```

Persistence behavior:

- Main workspace cache: `localStorage` key `focuspoint_db`.
- Auxiliary keys include `focuspoint_theme`, `focuspoint_timetable_zoom`, `focuspoint_pomodoro_notes`, and `focuspoint_pomodoro_timer`.
- When Supabase is configured and a user is authenticated, `AuthProvider` connects the Supabase client, hydrates the workspace, and saves local changes back to Supabase through the facade.

## Database Schema Reference

The current client expects these public Supabase tables:

- `profiles`
- `user_settings`
- `study_courses`
- `exams`
- `timetable_entries`
- `resources`

Ownership and RLS expectations:

- User-owned tables should include `user_id` mapped to `auth.uid()`.
- `profiles` uses `id` as the primary user identifier.
- Public tables exposed through Supabase should use row-level security policies scoped to the authenticated user.
- Frontend code must use publishable browser keys only; service-role and secret keys must never be exposed to Vite.

Supabase folder policy:

- Put schema migrations in `supabase/migrations/`.
- Put generated database types in `supabase/types/`.
- Put seed or local bootstrap SQL in `supabase/seed.sql`.
- Keep Supabase as the backend boundary unless the product intentionally adds a separate backend.

## Developer Workflows

Install dependencies:

```bash
npm install
```

Run the web app in development:

```bash
npm run dev
```

Build the app:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Required environment variables for Supabase-backed auth and sync:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

The Vite config reads environment variables from the repo root. If these variables are missing, the Supabase client exports `null` and the app should continue to run with local browser storage.

## Contribution Rules for AI/Devs

- Put user-facing React UI in the relevant `apps/web/src/features/*` area.
- Put browser-only shared code in `apps/web/src/shared`.
- Put reusable domain logic in `packages/shared/src`.
- Treat `packages/shared/src/study-data/mockDatabase.js` as the data facade unless a deliberate data-layer refactor is being made.
- Treat `userCourses` as canonical; do not add new behavior that makes `subjects` or `topics` the source of truth.
- Keep schema migrations, generated types, and seed SQL under `supabase/`.
- Do not introduce a custom Node API server unless the architecture is intentionally changed and documented.
- Update this guide and the root README when behavior, setup, data shape, or Supabase expectations change.
- Keep runtime behavior unchanged during docs-only refactors.
