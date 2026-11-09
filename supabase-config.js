
export const SUPABASE_URL =
  'https://owlpjjlafihuxezwtzvi.supabase.co';

export const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_XgBJ4_g7BwYAmTI4gI6a0g_4SBvRgTu';

export const STORAGE_BUCKET = 'catalog-images';

export function isSupabaseConfigured() {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_PUBLISHABLE_KEY &&
    SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_') &&
    SUPABASE_PUBLISHABLE_KEY !== 'YOUR_SUPABASE_PUBLISHABLE_KEY'
  );
}
