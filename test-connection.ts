import { supabase } from './src/lib/supabase';

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  try {
    const { data, error } = await supabase.from('products').select('*').limit(1);
    
    if (error) {
      console.error('Connection failed:', error.message);
      process.exit(1);
    }
    
    console.log('Connection successful!');
    console.log('Data (if any):', data);
  } catch (err) {
    console.error('An unexpected error occurred:', err);
    process.exit(1);
  }
}

testConnection();
