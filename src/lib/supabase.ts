import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Defensive check for fetch error
const effectiveUrl = supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder-project.supabase.co';
const effectiveKey = supabaseAnonKey.length > 10 ? supabaseAnonKey : 'placeholder-key';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'REX ERROR: Supabase environment variables are missing! ' +
    'Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your Vercel Project Settings.'
  );
}

export const supabase = createBrowserClient(effectiveUrl, effectiveKey);
