'use client'

import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Trophy, Target, Users, TrendingUp, Award, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getTeamName } from '@/lib/teams'

export default function StatsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<{
    totalParticipants: number
    totalPredictions: number
    avgPoints: number
    maxPoints: number
    minPoints: number
    leaderName: string
    championVotes: Record<string, number>
    topScorerVotes: Record<string, number>
    mvpVotes: Record<string, number>
    mostPopularResults: { match: string; result: string; count: number }[]
  } | null>(null)

  useEffect(() => {
    async function loadData() {
      // Cargar participantes
      const { data: participants } = await supabase
        .from('participants')
        .select('*')
        .order('total_points', { ascending: false })

      // Cargar predicciones de premios
      const { data: awards } = await supabase
        .from('predictions_awards')
        .select('*')

      // Cargar predicciones de grupos con partidos (con paginación)
      let groupPreds: any[] = []
      let page = 0
      while (true) {
        const { data } = await supabase
          .from('predictions_groups')
          .select('*, matches(*)')
          .range(page * 1000, (page + 1) * 1000 - 1)
        if (!data || data.length === 0) break
        groupPreds.push(...data)
        if (data.length < 1000) break
        page++
      }

      // Cargar brackets (con paginación)
      let brackets: any[] = []
      let bracketPage = 0
      while (true) {
        const { data } = await supabase
          .from('predictions_brackets')
          .select('*')
          .range(bracketPage * 1000, (bracketPage + 1) * 1000 - 1)
        if (!data || data.length === 0) break
        brackets.push(...data)
        if (data.length < 1000) break
        bracketPage++
      }

      if (!participants) {
        setLoading(false)
        return
      }

      const points = participants.map(p => p.total_points)
      const avg = points.reduce((a, b) => a + b, 0) / points.length

      // Contar votos de campeón
      const championVotes: Record<string, number> = {}
      const topScorerVotes: Record<string, number> = {}
      const mvpVotes: Record<string, number> = {}

      awards?.forEach(a => {
        if (a.category === 'winner' && a.predicted_value) {
          championVotes[a.predicted_value] = (championVotes[a.predicted_value] || 0) + 1
        }
        if ((a.category === 'top_scorer_1' || a.category === 'top_scorer_2') && a.predicted_value) {
          topScorerVotes[a.predicted_value] = (topScorerVotes[a.predicted_value] || 0) + 1
        }
        if (a.category === 'mvp' && a.predicted_value) {
          mvpVotes[a.predicted_value] = (mvpVotes[a.predicted_value] || 0) + 1
        }
      })

      // Resultados más populares (pronósticos más repetidos por partido)
      const resultCounts: Record<string, Record<string, number>> = {}
      groupPreds?.forEach(pred => {
        if (pred.matches) {
          const matchKey = `${pred.matches.home_team} vs ${pred.matches.away_team}`
          const resultKey = `${pred.predicted_home_score}-${pred.predicted_away_score}`
          if (!resultCounts[matchKey]) resultCounts[matchKey] = {}
          resultCounts[matchKey][resultKey] = (resultCounts[matchKey][resultKey] || 0) + 1
        }
      })

      const mostPopularResults: { match: string; result: string; count: number }[] = []
      Object.entries(resultCounts).forEach(([match, results]) => {
        const sorted = Object.entries(results).sort((a, b) => b[1] - a[1])
        if (sorted[0]) {
          mostPopularResults.push({ match, result: sorted[0][0], count: sorted[0][1] })
        }
      })
      mostPopularResults.sort((a, b) => b.count - a.count)

      // Contar selecciones en final
      const finalTeams: Record<string, number> = {}
      brackets?.filter(b => b.stage === 'final').forEach(b => {
        finalTeams[b.predicted_team] = (finalTeams[b.predicted_team] || 0) + 1
      })

      setStats({
        totalParticipants: participants.length,
        totalPredictions: groupPreds?.length || 0,
        avgPoints: Math.round(avg * 10) / 10,
        maxPoints: Math.max(...points),
        minPoints: Math.min(...points),
        leaderName: participants[0]?.name || '-',
        championVotes,
        topScorerVotes,
        mvpVotes,
        mostPopularResults,
      })
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="animate-pulse flex flex-col items-center">
          <BarChart3 className="w-16 h-16 text-emerald-500/50 mb-4" />
          <p className="text-slate-400 font-medium">Calculando estadísticas...</p>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const sortedChampions = Object.entries(stats.championVotes).sort((a, b) => b[1] - a[1])
  const sortedScorers = Object.entries(stats.topScorerVotes).sort((a, b) => b[1] - a[1])
  const sortedMvps = Object.entries(stats.mvpVotes).sort((a, b) => b[1] - a[1])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/50">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">
            📊 Estadísticas
          </h1>
          <Link href="/" className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors">
            ← Clasificación
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Jugadores', value: stats.totalParticipants, icon: Users, color: 'text-blue-400' },
            { label: 'Pronósticos', value: stats.totalPredictions, icon: Target, color: 'text-emerald-400' },
            { label: 'Media Pts', value: stats.avgPoints, icon: TrendingUp, color: 'text-purple-400' },
            { label: 'Líder', value: stats.leaderName, icon: Trophy, color: 'text-yellow-400' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md">
                <CardContent className="p-4 text-center">
                  <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                  <p className="text-2xl font-black font-mono text-white">{stat.value}</p>
                  <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Campeón más votado */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            ¿Quién gana el Mundial?
          </h2>
          <div className="space-y-2">
            {sortedChampions.map(([team, votes], i) => {
              const pct = Math.round((votes / stats.totalParticipants) * 100)
              return (
                <div key={team} className="relative bg-slate-900/40 border border-slate-800/50 rounded-xl overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-yellow-500/10 rounded-xl"
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-slate-500 w-6">{i + 1}.</span>
                      <span className="font-bold text-white">{getTeamName(team)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-400">{votes} votos</span>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-mono">{pct}%</Badge>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Pichichi más votado */}
        {sortedScorers.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              Pichichi más votado
            </h2>
            <div className="grid gap-2 md:grid-cols-2">
              {sortedScorers.slice(0, 10).map(([player, votes]) => (
                <div key={player} className="flex items-center justify-between px-4 py-3 bg-slate-900/40 border border-slate-800/50 rounded-xl">
                  <span className="font-semibold text-slate-200">{player}</span>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">{votes} votos</Badge>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* MVP más votado */}
        {sortedMvps.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              MVP más votado
            </h2>
            <div className="grid gap-2 md:grid-cols-2">
              {sortedMvps.slice(0, 10).map(([player, votes]) => (
                <div key={player} className="flex items-center justify-between px-4 py-3 bg-slate-900/40 border border-slate-800/50 rounded-xl">
                  <span className="font-semibold text-slate-200">{player}</span>
                  <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30">{votes} votos</Badge>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Resultados más populares */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            Pronósticos más repetidos
          </h2>
          <div className="grid gap-2 md:grid-cols-2">
            {stats.mostPopularResults.slice(0, 12).map(({ match, result, count }) => {
              const [home, away] = match.split(' vs ')
              return (
                <div key={match} className="flex items-center justify-between px-4 py-3 bg-slate-900/40 border border-slate-800/50 rounded-xl">
                  <span className="text-sm text-slate-300 truncate flex-1">
                    {getTeamName(home)} vs {getTeamName(away)}
                  </span>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="font-mono text-sm font-bold text-blue-400">{result}</span>
                    <span className="text-xs text-slate-500">({count})</span>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

      </div>
    </div>
  )
}
