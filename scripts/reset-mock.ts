import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

function calculateGroupMatchPoints(homeScore: number | null, awayScore: number | null, predHome: number, predAway: number) {
  if (homeScore === null || awayScore === null) return 0;
  if (homeScore === predHome && awayScore === predAway) return 3;
  const matchResult = homeScore > awayScore ? 1 : homeScore < awayScore ? -1 : 0;
  const predResult = predHome > predAway ? 1 : predHome < predAway ? -1 : 0;
  if (matchResult === predResult) return 1;
  return 0;
}

async function run() {
  console.log("Reseteando resultado MEX - SUD a estado original...");
  
  const { data: dbMatch, error } = await supabase
    .from('matches')
    .update({ home_score: null, away_score: null, status: 'PENDING' })
    .eq('home_team', 'MEX')
    .eq('away_team', 'SUD')
    .select()
    .single();

  if (error || !dbMatch) {
    console.error("Error al resetear el partido:", error);
    return;
  }

  console.log("Recalculando puntos (poniendo a cero)...");
  const { data: predictions } = await supabase.from('predictions_groups').select('*').eq('match_id', dbMatch.id);
  if (predictions) {
    for (const pred of predictions) {
      const points = calculateGroupMatchPoints(dbMatch.home_score, dbMatch.away_score, pred.predicted_home_score, pred.predicted_away_score);
      await supabase.from('predictions_groups').update({ points_earned: points }).eq('id', pred.id);
    }
  }

  const { data: participants } = await supabase.from('participants').select('*');
  if (participants) {
    for (const p of participants) {
      const { data: pGroups } = await supabase.from('predictions_groups').select('points_earned').eq('participant_id', p.id);
      const sumGroups = pGroups?.reduce((acc, curr) => acc + (curr.points_earned || 0), 0) || 0;
      await supabase.from('participants').update({ total_points: sumGroups }).eq('id', p.id);
    }
  }

  console.log("¡Todo reseteado!");
}

run();
