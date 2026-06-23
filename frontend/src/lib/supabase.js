import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfig = {
  url,
  publishableKey,
  isConfigured: Boolean(url && publishableKey),
};

if (!supabaseConfig.isConfigured) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY is missing — auth will not work.',
  );
}

export const supabase = createClient(url ?? '', publishableKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
