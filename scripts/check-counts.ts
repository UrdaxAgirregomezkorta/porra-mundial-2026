import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data: groups } = await supabase.from('predictions_groups').select('match_id, participant_id');
  
  const matchCounts: Record<string, number> = {};
  groups?.forEach(g => {
    matchCounts[g.match_id] = (matchCounts[g.match_id] || 0) + 1;
  });

  const counts = Object.values(matchCounts);
  const distinctCounts = [...new Set(counts)].sort((a,b)=>a-b);
  
  console.log(`Total predictions: ${groups?.length}`);
  console.log(`Matches have these prediction counts:`, distinctCounts);
  
  for (const c of distinctCounts) {
    const numMatches = counts.filter(x => x === c).length;
    console.log(`- ${numMatches} matches have ${c} predictions`);
  }
}

run();
