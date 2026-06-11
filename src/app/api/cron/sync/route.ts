import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { calculateGroupMatchPoints } from '@/lib/scoring'

export async function GET(request: Request) {
  // Verificación de seguridad de Vercel Cron (opcional en Hobby, pero recomendada)
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // 1. Fetch a la API real de API-Football (RapidAPI) para obtener resultados del Mundial 2026
    const apiKey = process.env.API_FOOTBALL_KEY
    if (!apiKey) {
      console.warn('API_FOOTBALL_KEY no está configurada. Saltando actualización de la API.')
    } else {
      // League 1 es el Mundial (World Cup) en API-Football. Temporada 2026.
      // Usamos el endpoint directo oficial en lugar de RapidAPI
      const response = await fetch('https://v3.football.api-sports.io/fixtures?league=1&season=2026', {
        headers: {
          'x-apisports-key': apiKey
        },
        // Evitamos cache agresivo en el fetch para tener resultados siempre frescos
        cache: 'no-store' 
      })

      if (response.ok) {
        const data = await response.json()
        const fixtures = data.response

        if (fixtures && fixtures.length > 0) {
          // Actualizar los resultados en nuestra base de datos
          for (const fixture of fixtures) {
            // Solo actualizamos si el partido ha empezado o terminado
            if (['1H', '2H', 'HT', 'FT', 'PEN', 'AET'].includes(fixture.fixture.status.short)) {
              await supabase
                .from('matches')
                .update({
                  home_score: fixture.goals.home,
                  away_score: fixture.goals.away,
                  status: fixture.fixture.status.short === 'FT' ? 'FINISHED' : 'IN_PLAY'
                })
                .eq('api_fixture_id', fixture.fixture.id)
            }
          }
        }
      }
    }

    // 2. Obtener todos los partidos en juego o terminados para recalcular puntos
    // Por ahora recalculamos todo para los partidos que tienen resultado real.
    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .not('home_score', 'is', null)

    if (!matches) return NextResponse.json({ success: true, message: 'No matches to update' })

    // 2. Recalcular puntos de la fase de grupos
    for (const match of matches) {
      if (match.stage === 'group') {
        const { data: predictions } = await supabase
          .from('predictions_groups')
          .select('*')
          .eq('match_id', match.id)

        if (predictions) {
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

    // 3. Recalcular puntos totales por participante sumando predictions_groups
    const { data: participants } = await supabase.from('participants').select('*')
    if (participants) {
      for (const p of participants) {
        // Sumar fase de grupos
        const { data: pGroups } = await supabase
          .from('predictions_groups')
          .select('points_earned')
          .eq('participant_id', p.id)
        
        const sumGroups = pGroups?.reduce((acc, curr) => acc + (curr.points_earned || 0), 0) || 0

        // En el futuro sumaremos los brackets y awards aquí.
        const totalPoints = sumGroups

        await supabase
          .from('participants')
          .update({ total_points: totalPoints })
          .eq('id', p.id)
      }
    }

    return NextResponse.json({ success: true, message: 'Points synced and recalculated successfully.' })
  } catch (error) {
    console.error('Cron Error:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
