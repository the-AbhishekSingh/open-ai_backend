import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

async function deleteDummyGrants() {
  // Delete grants where the name contains '#', which matches the dummy pattern
  const { error } = await supabase
    .from('grants')
    .delete()
    .ilike('name', '%#%');

  if (error) {
    console.error('Error deleting dummy grants:', error);
  } else {
    console.log('Dummy grants deleted successfully!');
  }
}

deleteDummyGrants(); 