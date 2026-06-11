import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env keys");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: participants, error: pError } = await supabase
    .from('participants')
    .select('*');
  
  if (pError) {
    console.error("Error loading participants:", pError);
    return;
  }

  console.log(`Found ${participants.length} participants in DB:`);
  for (const p of participants) {
    const { count: gCount } = await supabase
      .from('predictions_groups')
      .select('*', { count: 'exact', head: true })
      .eq('participant_id', p.id);
    
    const { count: bCount } = await supabase
      .from('predictions_brackets')
      .select('*', { count: 'exact', head: true })
      .eq('participant_id', p.id);

    const { count: aCount } = await supabase
      .from('predictions_awards')
      .select('*', { count: 'exact', head: true })
      .eq('participant_id', p.id);

    console.log(`- ${p.name} (id: ${p.id}): points=${p.total_points}, groupPredsCount=${gCount}, bracketPredsCount=${bCount}, awardPredsCount=${aCount}`);
  }
}

run();
