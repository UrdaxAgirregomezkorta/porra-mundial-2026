import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft, Target, Trophy, Award, Crown } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation */}
        <Link href="/" className="inline-flex items-center text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Clasificación
        </Link>

        {/* Profile Header */}
        <div className="relative mt-8">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/20 to-transparent rounded-3xl blur-xl" />
          <Card className="bg-slate-900/60 border-slate-700/50 backdrop-blur-xl relative overflow-hidden">
            <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-md animate-pulse" />
                <Avatar className="h-32 w-32 border-4 border-slate-800 shadow-2xl relative z-10">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-emerald-600 text-3xl font-black text-white">
                    {participant.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="text-center md:text-left flex-1">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2">{participant.name}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <Badge variant="outline" className="bg-slate-800/50 border-slate-600 text-slate-300">
                    <Target className="w-3 h-3 mr-1" />
                    Mundial 2026
                  </Badge>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Crown className="w-3 h-3 mr-1" />
                    Jugador Activo
                  </Badge>
                </div>
              </div>
              <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 shadow-inner flex flex-col items-center justify-center min-w-[160px]">
                <p className="text-sm font-medium text-slate-400 mb-1 uppercase tracking-wider">Puntos Totales</p>
                <p className="text-5xl font-black font-mono text-emerald-400 drop-shadow-sm">{participant.total_points}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Apuestas placeholder */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
          
          <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md hover:border-emerald-500/30 transition-colors group">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-200">Fase de Grupos</h3>
              </div>
              <p className="text-slate-400 text-sm">Pronósticos de los 48 partidos de la primera fase. Aciertos exactos y tendencias.</p>
              <div className="mt-4 pt-4 border-t border-slate-800/50">
                <span className="text-xs text-slate-500 font-mono">0 / 48 completados</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md hover:border-emerald-500/30 transition-colors group">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <Trophy className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-200">Cuadro Final</h3>
              </div>
              <p className="text-slate-400 text-sm">Predicciones desde Octavos de Final hasta la Gran Final. Selecciones que avanzan de ronda.</p>
              <div className="mt-4 pt-4 border-t border-slate-800/50">
                <span className="text-xs text-slate-500 font-mono">0 / 16 completados</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md hover:border-emerald-500/30 transition-colors group">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-400 group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-200">Premios</h3>
              </div>
              <p className="text-slate-400 text-sm">Pichichi, Mejor Jugador (MVP), y el Campeón Absoluto del Torneo.</p>
              <div className="mt-4 pt-4 border-t border-slate-800/50">
                <span className="text-xs text-slate-500 font-mono">0 / 3 completados</span>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  )
}
