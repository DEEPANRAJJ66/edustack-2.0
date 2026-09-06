// ==============================================================================
// EDUSTACK 2.0 BACKEND — SUPABASE ADMIN CLIENT
// ==============================================================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseBackendConfigured = Boolean(
  supabaseUrl && 
  supabaseServiceRoleKey && 
  !supabaseUrl.includes('your-project-id') &&
  !supabaseServiceRoleKey.includes('your-supabase-service-role-key')
);

export const supabaseAdmin = isSupabaseBackendConfigured
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
