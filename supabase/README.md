# FocusPoint Supabase Boundary

FocusPoint uses Supabase for authentication and remote workspace sync. The frontend still keeps a localStorage cache through `@focuspoint/shared/study-data/mockDatabase`, then hydrates from and saves to Supabase after authentication.

## Expected Tables

The current client code expects these public tables to exist and be protected by user-scoped RLS policies:

- `profiles`
- `user_settings`
- `study_courses`
- `exams`
- `timetable_entries`
- `resources`

Each user-owned table should include a `user_id` column that maps to `auth.uid()`, except `profiles`, where the primary user identifier is `id`.

## Environment Variables

The web app reads Supabase credentials from the repo root environment:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Only publishable/anon browser keys belong in frontend env vars. Never expose service-role or secret keys to the Vite app.

## Folder Policy

- Put schema migrations in `supabase/migrations/`.
- Put generated database types in `supabase/types/`.
- Keep seed data or local bootstrap SQL in `supabase/seed.sql`.
- Do not add a custom server here unless the product intentionally moves beyond Supabase client-side access.
