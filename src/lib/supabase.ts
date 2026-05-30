import { createBrowserClient } from '@supabase/ssr'

// Aggressive cleaning to prevent "Invalid value" fetch errors
const sanitize = (val: string | undefined) => {
  if (!val) return '';
  // Remove whitespace and any invisible control characters/line breaks
  let cleaned = val.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
  // Remove trailing slashes which can cause malformed fetch requests
  return cleaned.endsWith('/') ? cleaned.slice(0, -1) : cleaned;
};

const supabaseUrl = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Defensive check for fetch error
const effectiveUrl = supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder-project.supabase.co';
const effectiveKey = supabaseAnonKey.length > 10 ? supabaseAnonKey : 'placeholder-key';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'REX ERROR: Supabase environment variables are missing!'
  );
} else {
  console.log(`REX DIAGNOSTIC: URL=[${effectiveUrl}] (Length: ${effectiveUrl.length})`);
}

export const supabase = createBrowserClient(effectiveUrl, effectiveKey);
