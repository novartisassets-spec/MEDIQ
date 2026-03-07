import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

// We provide placeholders to prevent the app from crashing on initialization
// if the .env file isn't set up yet.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
