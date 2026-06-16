const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function run() {
  const env = fs.readFileSync('.env.local', 'utf-8');
  const url = env.split('NEXT_PUBLIC_SUPABASE_URL=')[1].split('\n')[0].trim();
  const key = env.split('NEXT_PUBLIC_SUPABASE_ANON_KEY=')[1].split('\n')[0].trim();
  const apiToken = env.split('API_FOOTBALL_KEY=')[1].split('\n')[0].trim();

  const supabase = createClient(url, key);

  console.log("Fetching scorers...");
  const res = await fetch('https://api.football-data.org/v4/competitions/WC/scorers?limit=100', {
    headers: { 'X-Auth-Token': apiToken }
  });
  const data = await res.json();
  const officialScorers = data.scorers || [];
  console.log(`Found ${officialScorers.length} scorers.`);

  console.log("Fetching awards...");
  const { data: awards } = await supabase.from('predictions_awards').select('*').in('category', ['top_scorer_1', 'top_scorer_2']);
  console.log(`Found ${awards.length} top_scorer predictions.`);

  const normalize = (n) => (n || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  let updatedCount = 0;
  for (const pred of awards) {
    let goals = 0;
    const normPred = normalize(pred.predicted_value);
    const predWords = normPred.split(' ').filter(w => w.length > 3 || w === normPred);

    const matchedScorer = officialScorers.find(s => {
      const normOff = normalize(s.player?.name || '');
      const offWords = normOff.split(' ');
      if (normPred === normOff) return true;
      if (predWords.length > 0 && predWords.some(w => offWords.includes(w))) return true;
      return false;
    });

    if (matchedScorer) {
      goals = matchedScorer.goals || 0;
      console.log(`Matched: ${pred.predicted_value} -> ${matchedScorer.player.name} (${goals} goals)`);
    } else {
       // console.log(`Not matched: ${pred.predicted_value}`);
    }

    const multiplier = pred.category === 'top_scorer_1' ? 5 : 2;
    const points = goals * multiplier;

    if (pred.points_earned !== points) {
      console.log(`Updating ${pred.predicted_value} (ID: ${pred.id}) to ${points} points.`);
      await supabase.from('predictions_awards').update({ points_earned: points }).eq('id', pred.id);
      updatedCount++;
    }
  }

  console.log(`Updated ${updatedCount} award predictions.`);

  console.log("Recalculating participant totals...");
  const { data: participants } = await supabase.from('participants').select('*');
  for (const p of participants) {
    const { data: groups } = await supabase.from('predictions_groups').select('points_earned').eq('participant_id', p.id);
    const { data: aws } = await supabase.from('predictions_awards').select('points_earned').eq('participant_id', p.id);
    const { data: brackets } = await supabase.from('predictions_brackets').select('points_earned').eq('participant_id', p.id);
    
    const sumG = groups.reduce((a, b) => a + (b.points_earned || 0), 0);
    const sumA = aws.reduce((a, b) => a + (b.points_earned || 0), 0);
    const sumB = brackets.reduce((a, b) => a + (b.points_earned || 0), 0);
    
    const total = sumG + sumA + sumB;
    if (p.total_points !== total) {
      console.log(`Updating participant ${p.name} from ${p.total_points} to ${total}`);
      await supabase.from('participants').update({ total_points: total }).eq('id', p.id);
    }
  }
  console.log("Done.");
}

run().catch(console.error);
