import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Supabase createClient will throw "Invalid value" fetch errors if the URL is empty or invalid.
// We use a valid-format placeholder to prevent the crash, but operations will fail gracefully with a 401/404.
const effectiveUrl = supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder-project.supabase.co';
const effectiveKey = supabaseAnonKey.length > 10 ? supabaseAnonKey : 'placeholder-key';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'REX ERROR: Supabase environment variables are missing! ' +
    'Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your Vercel Project Settings.'
  );
}

export const supabase = createClient(effectiveUrl, effectiveKey);
