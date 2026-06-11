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
    // Aquí iría el fetch a la API de RapidAPI (API-Football)
    // const res = await fetch('https://v3.football.api-sports.io/fixtures?league=1&season=2026&date=...', { ... })
    // Simularemos la lógica asumiendo que hemos obtenido resultados nuevos.
    
    // 1. Obtener todos los partidos en juego o terminados (sin puntos asignados aún a los participantes)
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
