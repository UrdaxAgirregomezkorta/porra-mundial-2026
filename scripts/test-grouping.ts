import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data: matches } = await supabase.from('matches').select('*');
  
  const groupStageMatches = matches?.filter(m => m.stage === 'group') || []
  
  const adj: Record<string, Set<string>> = {}
  groupStageMatches.forEach(m => {
    if (!adj[m.home_team]) adj[m.home_team] = new Set()
    if (!adj[m.away_team]) adj[m.away_team] = new Set()
    adj[m.home_team].add(m.away_team)
    adj[m.away_team].add(m.home_team)
  })

  const visited = new Set<string>()
  const groups: { name: string, matches: any[] }[] = []
  
  let groupCharCode = 65 // 'A'

  const sortedMatches = [...groupStageMatches].sort((a,b) => {
    if (!a.kickoff_time) return 1;
    if (!b.kickoff_time) return -1;
    return new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime()
  })
  
  sortedMatches.forEach(m => {
    if (!visited.has(m.home_team)) {
      const q = [m.home_team]
      const groupTeams = new Set<string>()
      
      while (q.length > 0) {
        const curr = q.shift()!
        if (!visited.has(curr)) {
          visited.add(curr)
          groupTeams.add(curr)
          adj[curr]?.forEach(neighbor => {
            if (!visited.has(neighbor)) q.push(neighbor)
          })
        }
      }
      
      const gMatches = sortedMatches.filter(x => groupTeams.has(x.home_team) && groupTeams.has(x.away_team))
      
      groups.push({
        name: `Grupo ${String.fromCharCode(groupCharCode++)}`,
        matches: gMatches
      })
    }
  })

  console.log(`Encontrados ${groups.length} grupos.`);
  groups.forEach(g => console.log(`${g.name}: ${g.matches.length} partidos.`));
}

run();
