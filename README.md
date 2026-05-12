# FocusPoint

FocusPoint is a study planning app for students preparing for exams like A-Level, IGCSE, and similar courses. It helps you organize subjects, track topic confidence, plan study time, count down to exam papers, and run focus sessions from one place.

The app is built around a simple idea: your course progress and exam dates should help you decide what to study next.

## Core Features

- **Dashboard**: shows progress, upcoming exams, today's schedule, and a recommended next study move.
- **Lesson Tracker**: tracks topic confidence from not started through mastered.
- **Course Management**: adds curriculum templates or custom courses, sections, and topics.
- **Exam Countdown**: records exam papers and highlights what is coming soon.
- **Timetable**: manages study events, to-dos, recurring entries, and linked all-day exam entries.
- **Pomodoro**: runs focus and break timers with saved timer state and notes.

## How It Works at a Glance

FocusPoint runs as a React app in the browser. Your study workspace is saved locally first so the app can keep working with browser-stored data.

When Supabase is configured and you sign in, FocusPoint also syncs your workspace to Supabase. Supabase is the backend boundary for authentication and remote study data. There is no custom Node API server.

The canonical course model is `userCourses`. Older `subjects` and `topics` shapes are compatibility projections derived from `userCourses` for screens and helpers that still consume them.

## Getting Started (Local Run)

Install dependencies:

```bash
npm install
```

Start the development server:

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

Optional Supabase environment variables can be placed in a local `.env` file at the repo root:

```txt
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Only use publishable browser keys in these variables. Do not put service-role or secret keys in the frontend environment.

## Tech Stack

- React 19 and Vite
- React Router
- Tailwind CSS v4 plus custom CSS
- Supabase client for auth and sync
- Local browser storage for the primary cache
- Shared domain package for curriculum data, priority scoring, and study-data helpers
- Vite PWA plugin for installable app assets and service worker registration

## FAQ-Style Notes

**Where is my data stored?**  
FocusPoint stores the main workspace in browser `localStorage` under `focuspoint_db`. It also uses a few smaller local keys for theme, timetable zoom, and pomodoro state.

**Does FocusPoint require Supabase?**  
No. The app can run with local browser storage. Supabase adds authentication and remote workspace sync when `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are configured.

**What does Supabase store?**  
The current client expects user-owned workspace data for profiles, settings, study courses, exams, timetable entries, and resources. Resource records are metadata-only in the current implementation; uploaded file contents are not persisted by the app.

**Is there offline support?**  
FocusPoint is configured as a PWA with app manifest assets and an auto-updating service worker. Study data is local-first through `localStorage`; the current docs do not define a separate offline conflict-resolution system beyond the local cache and Supabase sync behavior.

**Where should developers look next?**  
See [docs/developer-guide.md](docs/developer-guide.md) for architecture, data model, Supabase boundary, and contribution rules.
