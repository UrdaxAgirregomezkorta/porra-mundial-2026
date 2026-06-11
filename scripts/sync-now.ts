import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const apiKey = process.env.API_FOOTBALL_KEY;

if (!supabaseUrl || !supabaseKey || !apiKey) {
  console.error("Missing env keys");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function calculateGroupMatchPoints(homeScore: number, awayScore: number, predHome: number, predAway: number) {
  if (homeScore === null || awayScore === null) return 0;
  if (homeScore === predHome && awayScore === predAway) return 3;
  const matchResult = homeScore > awayScore ? 1 : homeScore < awayScore ? -1 : 0;
  const predResult = predHome > predAway ? 1 : predHome < predAway ? -1 : 0;
  if (matchResult === predResult) return 1;
  return 0;
}

async function run() {
  console.log("Fetching live scores from API-Football...");
  const response = await fetch('https://v3.football.api-sports.io/fixtures?league=1&season=2026', {
    headers: { 'x-apisports-key': apiKey as string },
    cache: 'no-store'
  });

  if (!response.ok) {
    console.error("Failed to fetch from API-Football");
    return;
  }

  const data = await response.json();
  const fixtures = data.response;

  if (fixtures && fixtures.length > 0) {
    for (const fixture of fixtures) {
      if (['1H', '2H', 'HT', 'FT', 'PEN', 'AET'].includes(fixture.fixture.status.short)) {
        console.log(`Updating match: ${fixture.teams.home.name} vs ${fixture.teams.away.name} (${fixture.goals.home}-${fixture.goals.away}) status=${fixture.fixture.status.short}`);
        await supabase
          .from('matches')
          .update({
            home_score: fixture.goals.home,
            away_score: fixture.goals.away,
            status: fixture.fixture.status.short === 'FT' ? 'FINISHED' : 'IN_PLAY'
          })
          .eq('api_fixture_id', fixture.fixture.id);
      }
    }
  }

  console.log("Recalculating match predictions...");
  const { data: matches } = await supabase.from('matches').select('*').not('home_score', 'is', null);
  
  if (matches && matches.length > 0) {
    for (const match of matches) {
      if (match.stage === 'group') {
        const { data: predictions } = await supabase.from('predictions_groups').select('*').eq('match_id', match.id);
        if (predictions) {
          for (const pred of predictions) {
            const points = calculateGroupMatchPoints(match.home_score, match.away_score, pred.predicted_home_score, pred.predicted_away_score);
            await supabase.from('predictions_groups').update({ points_earned: points }).eq('id', pred.id);
          }
        }
      }
    }
  }

  console.log("Recalculating participant total points...");
  const { data: participants } = await supabase.from('participants').select('*');
  if (participants) {
    for (const p of participants) {
      const { data: pGroups } = await supabase.from('predictions_groups').select('points_earned').eq('participant_id', p.id);
      const sumGroups = pGroups?.reduce((acc, curr) => acc + (curr.points_earned || 0), 0) || 0;
      await supabase.from('participants').update({ total_points: sumGroups }).eq('id', p.id);
    }
  }

  console.log("Sync complete!");
}

run().catch(console.error);
