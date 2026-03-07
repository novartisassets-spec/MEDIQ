import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials missing. Some features may not work.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Use service role for administrative tasks (securely in backend only)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
