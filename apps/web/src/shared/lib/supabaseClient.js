import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Supabase client — nullable.
 *
 * In production the env vars are injected by Netlify's environment variable
 * settings (Site → Environment variables), NOT by a committed .env file.
 * The .env file is gitignored and used for local development only.
 *
 * If the env vars are missing (e.g. someone clones the public repo without
 * setting up Netlify), we export `null` instead of crashing.
 */
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const isSupabaseConfigured = Boolean(supabase);
