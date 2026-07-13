const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Use anon key since we might not have service role key, wait, RLS might block it.
);

async function wipeAvatars() {
  console.log('Please execute this SQL in your Supabase SQL Editor:');
  console.log('UPDATE public.users SET avatar_url = NULL;');
}

wipeAvatars();
