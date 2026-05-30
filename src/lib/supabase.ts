import { createBrowserClient } from '@supabase/ssr'

// We use .trim() to remove any invisible spaces or newlines that might have been accidentally copied.
// Hidden characters in the URL or headers will cause the "Invalid value" fetch error.
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

// Defensive check for fetch error
const effectiveUrl = supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder-project.supabase.co';
const effectiveKey = supabaseAnonKey.length > 10 ? supabaseAnonKey : 'placeholder-key';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'REX ERROR: Supabase environment variables are missing! ' +
    'Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your Vercel Project Settings.'
  );
} else {
  // Safe logging for debugging
  console.log(`REX DIAGNOSTIC: URL loaded (${effectiveUrl.substring(0, 15)}...), Key loaded (${effectiveKey.substring(0, 10)}...)`);
}

export const supabase = createBrowserClient(effectiveUrl, effectiveKey);
