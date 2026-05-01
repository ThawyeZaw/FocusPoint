# FocusPoint Supabase Setup

1. Open your Supabase project dashboard.
2. Go to SQL Editor.
3. Run `focuspoint_setup.sql`.
4. In Authentication > Providers, enable Email auth.
5. In Authentication > URL Configuration, set:
   - Site URL: `http://localhost:5173` for local development.
   - Redirect URLs: `http://localhost:5173/**`, your production URL, and your Netlify preview wildcard.

The Vite app uses only the publishable key from `.env`. Do not add a service role or secret key to this frontend project.
