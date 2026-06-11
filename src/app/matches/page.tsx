import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Calendar } from 'lucide-react'

export const revalidate = 0

export default async function MatchesPage() {
  // Obtenemos los partidos (idealmente filtrados por fecha de hoy, pero aquí mostraremos los primeros 10 para probar)
  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      *,
      predictions_groups (
        predicted_home_score,
        predicted_away_score,
        points_earned,
        participants (
          name
        )
      )
    `)
    .limit(10) // Muestra 10 partidos para probar la UI

  if (error) {
    console.error('Error fetching matches:', error)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <Link href="/" className="inline-flex items-center text-sm text-slate-400 hover:text-emerald-400 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver a la clasificación
        </Link>

        <header className="space-y-4 py-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-emerald-400" />
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Partidos
            </h1>
          </div>
          <p className="text-slate-400">
            Consulta los resultados y qué ha apostado cada persona en la fase de grupos.
          </p>
        </header>

        <div className="space-y-6">
          {matches?.map((match) => (
            <Card key={match.id} className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-800 pb-4">
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="text-slate-300 border-slate-700 bg-slate-800/50 uppercase">
                    {match.stage.replace('_', ' ')}
                  </Badge>
                  <span className="text-sm font-medium text-slate-400">
                    {match.status === 'PENDING' ? 'Próximamente' : match.status === 'FINISHED' ? 'Finalizado' : 'En Juego'}
                  </span>
                </div>
                <CardTitle className="text-center text-2xl font-bold mt-4 flex justify-center items-center gap-4">
                  <span>{match.home_team}</span>
                  <Badge className="text-lg px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {match.home_score !== null ? match.home_score : '-'} : {match.away_score !== null ? match.away_score : '-'}
                  </Badge>
                  <span>{match.away_team}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Apuestas de los amigos:</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {match.predictions_groups?.map((pred: any, idx: number) => {
                    const exact = pred.points_earned === 3
                    const partial = pred.points_earned === 1
                    const borderClass = exact ? 'border-emerald-500/50 bg-emerald-500/10' : partial ? 'border-blue-500/50 bg-blue-500/10' : 'border-slate-800 bg-slate-900/50'
                    const textClass = exact ? 'text-emerald-400' : partial ? 'text-blue-400' : 'text-slate-300'

                    return (
                      <div key={idx} className={`p-2 rounded-md border ${borderClass} flex flex-col items-center justify-center text-center`}>
                        <span className="text-xs font-semibold text-slate-400 mb-1">{pred.participants?.name}</span>
                        <span className={`text-lg font-bold ${textClass}`}>
                          {pred.predicted_home_score} - {pred.predicted_away_score}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  )
}
