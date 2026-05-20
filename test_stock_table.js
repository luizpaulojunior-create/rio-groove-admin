import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cvpobvvkhcqasumhfwps.supabase.co';
const supabaseAnonKey = 'sb_publishable_iR4bqbFa6WUtG5o1EOQUwQ_AETsl9S1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testStock() {
  const { data, error } = await supabase.from('stock').select('*').limit(1);
  console.log('Data:', data);
  console.log('Error:', error);
}

testStock();