import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'

export const revalidate = 0

export default async function PlayerProfile({ params }: { params: { id: string } }) {
  const { id } = params

  const { data: participant, error } = await supabase
    .from('participants')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !participant) {
    notFound()
  }

  // Cargar predicciones de grupos del participante con la info del partido
  const { data: groupPredictions } = await supabase
    .from('predictions_groups')
    .select(`
      *,
      matches (
        home_team,
        away_team,
        home_score,
        away_score,
        stage
      )
    `)
    .eq('participant_id', id)

  // Cargar premios
  const { data: awards } = await supabase
    .from('predictions_awards')
    .select('*')
    .eq('participant_id', id)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <Link href="/" className="inline-flex items-center text-sm text-slate-400 hover:text-emerald-400 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver a la clasificación
        </Link>

        <header className="flex items-center gap-6 py-4">
          <Avatar className="h-20 w-20 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/20">
            <AvatarFallback className="bg-slate-900 text-2xl text-emerald-400 font-bold">
              {participant.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">{participant.name}</h1>
            <p className="text-slate-400 mt-1">Puntos Totales: <span className="text-emerald-400 font-mono font-bold text-lg">{participant.total_points}</span></p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tarjeta de Premios Individuales y Campeón */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl">Apuestas a Largo Plazo</CardTitle>
              <CardDescription className="text-slate-400">Campeón y premios individuales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {awards?.map((award) => (
                  <div key={award.id} className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                    <span className="text-sm font-medium text-slate-400 capitalize">
                      {award.category.replace(/_/g, ' ')}
                    </span>
                    <Badge variant="outline" className="bg-slate-800 text-slate-200 border-slate-700">
                      {award.predicted_value}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta de Estadísticas de Fase de Grupos */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl">Fase de Grupos</CardTitle>
              <CardDescription className="text-slate-400">Aciertos exactos y tendencias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {groupPredictions?.filter(p => p.matches.home_score !== null).slice(0, 5).map((pred) => {
                  const exact = pred.matches.home_score === pred.predicted_home_score && pred.matches.away_score === pred.predicted_away_score
                  const isPending = pred.matches.home_score === null

                  return (
                    <div key={pred.id} className="flex justify-between items-center bg-slate-800/30 p-3 rounded-lg border border-slate-800">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{pred.matches.home_team} vs {pred.matches.away_team}</span>
                        <span className="text-xs text-slate-400">
                          Real: <span className="text-white">{pred.matches.home_score}-{pred.matches.away_score}</span> | 
                          Apuesta: <span className="text-white">{pred.predicted_home_score}-{pred.predicted_away_score}</span>
                        </span>
                      </div>
                      <div>
                        {exact ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">3 pts</Badge>
                        ) : pred.points_earned && pred.points_earned > 0 ? (
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">1 pts</Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-400 border-red-400/20">0 pts</Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
                <p className="text-xs text-center text-slate-500 italic mt-4">Mostrando los últimos 5 resultados...</p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
