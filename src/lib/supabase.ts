import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Using untyped client — our hand-written Database type doesn't satisfy the
// Supabase JS v2 generic constraint. Run `supabase gen types typescript` to
// get auto-generated types that work with the generic.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
