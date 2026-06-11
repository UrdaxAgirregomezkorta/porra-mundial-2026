import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const apiToken = process.env.API_FOOTBALL_KEY;

const TLA_TO_DB_CODE: Record<string, string[]> = {
  'RSA': ['SUD'],
  'KOR': ['COR'],
  'GER': ['ALE'],
  'ENG': ['ING'],
  'JPN': ['JAP'],
  'SWE': ['SUE', 'SWE'],
  'IRN': ['IRA'],
  'EGY': ['EGI'],
  'NZL': ['NZ'],
  'CUW': ['CUR'],
  'SCO': ['ESC'],
  'KSA': ['ARA', 'ARB'],
  'NED': ['PBJ'],
  'BIH': ['B&H'],
  'CPV': ['CAB'],
  'CMR': ['CMF'],
  'COD': ['RDC'],
}

function getDbCodes(tla: string): string[] {
  return TLA_TO_DB_CODE[tla] || [tla]
}

function calculateGroupMatchPoints(homeScore: number, awayScore: number, predHome: number, predAway: number) {
  if (homeScore === null || awayScore === null) return 0;
  if (homeScore === predHome && awayScore === predAway) return 3;
  const matchResult = homeScore > awayScore ? 1 : homeScore < awayScore ? -1 : 0;
  const predResult = predHome > predAway ? 1 : predHome < predAway ? -1 : 0;
  if (matchResult === predResult) return 1;
  return 0;
}

async function run() {
  console.log("Fetching from football-data.org...");
  const response = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
    headers: { 'X-Auth-Token': apiToken as string },
    cache: 'no-store'
  });

  if (!response.ok) {
    console.error("API error", response.status, await response.text());
    return;
  }
  
  const data = await response.json();
  const matches = data.matches;

  console.log(`Found ${matches?.length || 0} fixtures from API.`);

  if (matches && matches.length > 0) {
    const { data: dbMatches } = await supabase.from('matches').select('*');
    if (dbMatches) {
      for (const fixture of matches) {
        const statusMap: Record<string, string> = {
          'FINISHED': 'FINISHED',
          'AWARDED': 'FINISHED',
          'IN_PLAY': 'IN_PLAY',
          'PAUSED': 'IN_PLAY',
          'LIVE': 'IN_PLAY',
          'TIMED': 'PENDING',
          'SCHEDULED': 'PENDING',
          'POSTPONED': 'PENDING',
          'SUSPENDED': 'PENDING',
          'CANCELLED': 'PENDING'
        };

        const mappedStatus = statusMap[fixture.status] || 'PENDING';
        const homeTlas = getDbCodes(fixture.homeTeam?.tla || '');
        const awayTlas = getDbCodes(fixture.awayTeam?.tla || '');

        const dbMatch = dbMatches.find(m => 
          homeTlas.includes(m.home_team) && awayTlas.includes(m.away_team)
        );

        if (dbMatch) {
          let homeScore = fixture.score?.fullTime?.home ?? fixture.score?.halfTime?.home;
          let awayScore = fixture.score?.fullTime?.away ?? fixture.score?.halfTime?.away;
          
          if (homeScore === undefined) homeScore = null;
          if (awayScore === undefined) awayScore = null;

          await supabase
            .from('matches')
            .update({
              home_score: homeScore,
              away_score: awayScore,
              status: mappedStatus,
              kickoff_time: fixture.utcDate
            })
            .eq('id', dbMatch.id);
        }
      }
    }
  }

  console.log("Recalculating points...");
  const { data: updatedMatches } = await supabase.from('matches').select('*').not('home_score', 'is', null);
  if (updatedMatches) {
    for (const match of updatedMatches) {
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

run();
