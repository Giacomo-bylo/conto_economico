import { createClient } from '@supabase/supabase-js';

// NOTE: In a real production environment, these should be environment variables.
// For the purpose of this demo, placeholders are used. User must replace them.
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);