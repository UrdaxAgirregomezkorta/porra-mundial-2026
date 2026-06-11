'use client'

import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft, Target, Trophy, Award, Crown } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { getTeamName } from '@/lib/teams'

export default function PlayerProfile() {
  const params = useParams()
  const id = params.id as string

  const [participant, setParticipant] = useState<any>(null)
  const [groupPreds, setGroupPreds] = useState<any[]>([])
  const [bracketPreds, setBracketPreds] = useState<any[]>([])
  const [awardPreds, setAwardPreds] = useState<any[]>([])
  const [matches, setMatches] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function loadData() {
      // Cargar participante
      const { data: part, error: partErr } = await supabase
        .from('participants')
        .select('*')
        .eq('id', id)
        .single()

      if (partErr || !part) {
        setError(true)
        setLoading(false)
        return
      }

      // Cargar predicciones de grupos
      const { data: gPreds } = await supabase
        .from('predictions_groups')
        .select('*')
        .eq('participant_id', id)

      // Cargar predicciones de brackets
      const { data: bPreds } = await supabase
        .from('predictions_brackets')
        .select('*')
        .eq('participant_id', id)

      // Cargar premios
      const { data: aPreds } = await supabase
        .from('predictions_awards')
        .select('*')
        .eq('participant_id', id)

      // Cargar todos los partidos para mapear IDs
      const { data: matchData } = await supabase
        .from('matches')
        .select('*')

      const matchMap: Record<string, any> = {}
      matchData?.forEach(m => { matchMap[m.id] = m })

      setParticipant(part)
      setGroupPreds(gPreds || [])
      setBracketPreds(bPreds || [])
      setAwardPreds(aPreds || [])
      setMatches(matchMap)
      setLoading(false)
    }
    loadData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="animate-pulse flex flex-col items-center">
          <Crown className="w-16 h-16 text-emerald-500/50 mb-4" />
          <p className="text-slate-400 font-medium">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (error || !participant) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-slate-400 gap-4">
        <p className="text-2xl font-bold">Jugador no encontrado</p>
        <Link href="/" className="text-emerald-400 hover:text-emerald-300 transition-colors">← Volver a Clasificación</Link>
      </div>
    )
  }

  const stageLabels: Record<string, string> = {
    'round_32': '16avos',
    'round_16': 'Octavos',
    'quarterfinal': 'Cuartos',
    'semifinal': 'Semifinal',
    'final': 'Final',
  }

  const categoryLabels: Record<string, string> = {
    'winner': '🏆 Campeón',
    'top_scorer_1': '⚽ Pichichi 1',
    'top_scorer_2': '⚽ Pichichi 2',
    'top_scorer_award': '🥇 Bota de Oro',
    'mvp': '🌟 MVP',
    'young_player': '🌱 Mejor Joven',
  }

  // Agrupar brackets por stage
  const bracketsByStage: Record<string, string[]> = {}
  bracketPreds.forEach(bp => {
    if (!bracketsByStage[bp.stage]) bracketsByStage[bp.stage] = []
    bracketsByStage[bp.stage].push(bp.predicted_team)
  })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation */}
        <Link href="/" className="inline-flex items-center text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Clasificación
        </Link>

        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative mt-8">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/20 to-transparent rounded-3xl blur-xl" />
          <Card className="bg-slate-900/60 border-slate-700/50 backdrop-blur-xl relative overflow-hidden">
            <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-md animate-pulse" />
                <Avatar className="h-28 w-28 border-4 border-slate-800 shadow-2xl relative z-10">
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
                </div>
              </div>
              <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 shadow-inner flex flex-col items-center justify-center min-w-[140px]">
                <p className="text-sm font-medium text-slate-400 mb-1 uppercase tracking-wider">Puntos</p>
                <p className="text-5xl font-black font-mono text-emerald-400 drop-shadow-sm">{participant.total_points}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Predicciones de Fase de Grupos */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            Fase de Grupos
            <Badge className="bg-slate-800 text-slate-400 ml-2">{groupPreds.length} pronósticos</Badge>
          </h2>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {groupPreds.map((pred) => {
              const match = matches[pred.match_id]
              if (!match) return null
              return (
                <div key={pred.id} className="flex items-center justify-between px-4 py-3 bg-slate-900/40 border border-slate-800/50 rounded-xl hover:bg-slate-800/50 transition-colors">
                  <span className="text-sm text-slate-300 truncate flex-1">
                    {getTeamName(match.home_team)} vs {getTeamName(match.away_team)}
                  </span>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="font-mono text-sm font-bold text-emerald-400">
                      {pred.predicted_home_score}-{pred.predicted_away_score}
                    </span>
                    {match.home_score !== null && (
                      <span className="font-mono text-xs text-slate-500">
                        ({match.home_score}-{match.away_score})
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Predicciones de Cuadro Final */}
        {Object.keys(bracketsByStage).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-400" />
              Cuadro Final
            </h2>
            <div className="space-y-4">
              {['round_32', 'round_16', 'quarterfinal', 'semifinal', 'final'].map(stage => {
                const teams = bracketsByStage[stage]
                if (!teams || teams.length === 0) return null
                return (
                  <div key={stage} className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">{stageLabels[stage] || stage}</h3>
                    <div className="flex flex-wrap gap-2">
                      {teams.map((team, i) => (
                        <Badge key={i} className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-3 py-1">
                          {getTeamName(team)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Premios */}
        {awardPreds.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              Premios y Trofeos
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {awardPreds.map((award) => (
                <div key={award.id} className="flex items-center justify-between px-4 py-3 bg-slate-900/40 border border-slate-800/50 rounded-xl">
                  <span className="text-sm font-medium text-slate-400">{categoryLabels[award.category] || award.category}</span>
                  <span className="font-bold text-yellow-400">{award.predicted_value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  )
}
