// ==============================================================================
// EDUSTACK 2.0 — SUPABASE CLIENT CONFIGURATION
// ==============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = (rawUrl && rawUrl.startsWith('https://') && !rawUrl.includes('your-project-id'))
  ? rawUrl
  : 'https://fobymcyikluggrwgravo.supabase.co';

const supabaseAnonKey = (rawKey && (rawKey.startsWith('sb_publishable_') || rawKey.startsWith('eyJ')) && !rawKey.includes('your-supabase-anon-key'))
  ? rawKey
  : 'sb_publishable_2BE14KH5kECGXvtI1eRu8w_nKlwHseT';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
