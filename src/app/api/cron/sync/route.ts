import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { calculateGroupMatchPoints } from '@/lib/scoring'

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

export async function GET(request: Request) {
  // Verificación de seguridad de Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const apiToken = process.env.API_FOOTBALL_KEY
    if (!apiToken) {
      console.warn('API_FOOTBALL_KEY no está configurada. Saltando actualización.')
      return NextResponse.json({ success: false, error: 'Missing API Token' }, { status: 500 })
    }

    // Rate Limiting Check & Fetch
    const response = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
      headers: {
        'X-Auth-Token': apiToken
      },
      cache: 'no-store' 
    })

    // Leer cabeceras para controlar el rate limit según instrucción directa
    const requestsAvailable = parseInt(response.headers.get('x-requests-available-minute') || '10', 10)
    const timeToReset = parseInt(response.headers.get('x-requestcounter-reset') || '60', 10)
    
    console.log(`Rate Limit: ${requestsAvailable} requests left this minute. Resets in ${timeToReset}s.`)
    
    if (requestsAvailable < 2) {
      console.warn('Rate limit almost reached, cooling down for future requests...')
      // Si hubiera un bucle, haríamos await sleep(timeToReset * 1000) aquí.
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error:', response.status, errorText)
      return NextResponse.json({ success: false, error: 'API Fetch failed' }, { status: response.status })
    }

    const data = await response.json()
    const matches = data.matches

    if (matches && matches.length > 0) {
      // 1. Obtener los partidos de la DB para hacer match localmente (más seguro)
      const { data: dbMatches } = await supabase.from('matches').select('*')
      
      if (dbMatches) {
        for (const fixture of matches) {
          // football-data.org status: TIMED, SCHEDULED, LIVE, IN_PLAY, PAUSED, FINISHED, POSTPONED, SUSPENDED, CANCELLED
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
          }

          const mappedStatus = statusMap[fixture.status] || 'PENDING'
          if (mappedStatus) {
            const homeTlas = getDbCodes(fixture.homeTeam?.tla || '')
            const awayTlas = getDbCodes(fixture.awayTeam?.tla || '')

            // Encontrar el partido correspondiente en nuestra DB
            const dbMatch = dbMatches.find(m => 
              homeTlas.includes(m.home_team) && awayTlas.includes(m.away_team)
            )

            if (dbMatch) {
              let homeScore = fixture.score?.fullTime?.home ?? fixture.score?.halfTime?.home
              let awayScore = fixture.score?.fullTime?.away ?? fixture.score?.halfTime?.away
              
              if (homeScore === undefined) homeScore = null
              if (awayScore === undefined) awayScore = null

              await supabase
                .from('matches')
                .update({
                  home_score: homeScore,
                  away_score: awayScore,
                  status: mappedStatus,
                  kickoff_time: fixture.utcDate
                })
                .eq('id', dbMatch.id)
            }
          }
        }
      }
    }

    // 2. Obtener partidos que ya tengan resultado para recalcular
    const { data: updatedMatches } = await supabase
      .from('matches')
      .select('*')
      .not('home_score', 'is', null)

    if (updatedMatches) {
      for (const match of updatedMatches) {
        if (match.stage === 'group') {
          // Usar paginación igual que en la web
          let predictions: any[] = []
          let page = 0
          while (true) {
            const { data: pageData } = await supabase
              .from('predictions_groups')
              .select('*')
              .eq('match_id', match.id)
              .range(page * 1000, (page + 1) * 1000 - 1)
            if (!pageData || pageData.length === 0) break
            predictions.push(...pageData)
            if (pageData.length < 1000) break
            page++
          }

          for (const pred of predictions) {
            const points = calculateGroupMatchPoints(
              match.home_score, match.away_score, 
              pred.predicted_home_score, pred.predicted_away_score
            )
            await supabase
              .from('predictions_groups')
              .update({ points_earned: points })
              .eq('id', pred.id)
          }
        }
      }
    }

    // 3. Recalcular puntos totales por participante
    const { data: participants } = await supabase.from('participants').select('*')
    if (participants) {
      for (const p of participants) {
        let pGroups: any[] = []
        let page = 0
        while (true) {
          const { data: pageData } = await supabase
            .from('predictions_groups')
            .select('points_earned')
            .eq('participant_id', p.id)
            .range(page * 1000, (page + 1) * 1000 - 1)
          if (!pageData || pageData.length === 0) break
          pGroups.push(...pageData)
          if (pageData.length < 1000) break
          page++
        }
        
        const sumGroups = pGroups.reduce((acc, curr) => acc + (curr.points_earned || 0), 0)

        await supabase
          .from('participants')
          .update({ total_points: sumGroups })
          .eq('id', p.id)
      }
    }

    return NextResponse.json({ success: true, message: 'Points synced and recalculated successfully.' })
  } catch (error) {
    console.error('Cron Error:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

