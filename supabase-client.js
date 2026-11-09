import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import {
  isSupabaseConfigured,
  STORAGE_BUCKET,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from './supabase-config.js';

let client;

export { isSupabaseConfigured, STORAGE_BUCKET };

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured yet. Add your publishable key in supabase-config.js.');
  }

  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return client;
}
