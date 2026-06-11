'use client'

import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, ChevronDown, ChevronUp, Users } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getTeamName } from '@/lib/teams'

function groupMatches(matches: any[]) {
  const groupStageMatches = matches.filter(m => m.stage === 'group')
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
        name: `${String.fromCharCode(groupCharCode++)} Taldea`,
        matches: gMatches
      })
    }
  })

  // Añadir fase eliminatoria como pestaña extra si la hubiera
  const knockoutMatches = matches.filter(m => m.stage !== 'group')
  if (knockoutMatches.length > 0) {
    groups.push({
      name: 'Kanporaketak',
      matches: knockoutMatches
    })
  }

  return groups
}

export default function MatchesPage() {
  const [matchGroups, setMatchGroups] = useState<{name: string, matches: any[]}[]>([])
  const [activeGroup, setActiveGroup] = useState<string>('')
  const [predictions, setPredictions] = useState<Record<string, any[]>>({})
  const [participants, setParticipants] = useState<Record<string, string>>({})
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      // Cargar partidos
      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .order('kickoff_time', { ascending: true, nullsFirst: false })

      // Agrupar
      const groups = groupMatches(matchData || [])
      setMatchGroups(groups)
      if (groups.length > 0) setActiveGroup(groups[0].name)

      // Cargar participantes para mapear IDs a nombres
      const { data: partData } = await supabase
        .from('participants')
        .select('id, name')

      const partMap: Record<string, string> = {}
      partData?.forEach(p => { partMap[p.id] = p.name })

      // Cargar todas las predicciones de grupos con paginación
      let predData: any[] = []
      let page = 0
      while (true) {
        const { data } = await supabase
          .from('predictions_groups')
          .select('*')
          .range(page * 1000, (page + 1) * 1000 - 1)
        if (!data || data.length === 0) break
        predData.push(...data)
        if (data.length < 1000) break
        page++
      }

      // Agrupar predicciones por match_id
      const predMap: Record<string, any[]> = {}
      predData?.forEach(pred => {
        if (!predMap[pred.match_id]) predMap[pred.match_id] = []
        predMap[pred.match_id].push(pred)
      })

      setParticipants(partMap)
      setPredictions(predMap)
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="animate-pulse flex flex-col items-center">
          <Calendar className="w-16 h-16 text-emerald-500/50 mb-4" />
          <p className="text-slate-400 font-medium">Partidak kargatzen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/50">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">
            Partidak
          </h1>
          <Link href="/" className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors">
            ← Sailkapena
          </Link>
        </div>

        {/* Tabs de Grupos */}
        {matchGroups.length > 0 && (
          <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-hide hide-scroll">
            {matchGroups.map(g => (
              <button
                key={g.name}
                onClick={() => setActiveGroup(g.name)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                  activeGroup === g.name 
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}

        {/* Grid de Partidos */}
        <div className="grid gap-4 md:grid-cols-2">
          {matchGroups.find(g => g.name === activeGroup)?.matches.map((match, i) => {
            const matchPreds = predictions[match.id] || []
            const isExpanded = expandedMatch === match.id

            return (
              <motion.div 
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                layout
              >
                <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md hover:bg-slate-800/60 transition-all group overflow-hidden">
                  <CardContent className="p-0">
                    {/* Header del partido */}
                    <div className="p-3 border-b border-slate-800/50 flex flex-col md:flex-row gap-2 justify-between items-start md:items-center bg-slate-900/50">
                      <div className="flex items-center gap-2">
                        <Badge variant={match.status === 'FINISHED' ? 'secondary' : 'default'} className={
                          match.status === 'FINISHED' 
                            ? "bg-slate-800 text-slate-400 text-xs" 
                            : match.status === 'IN_PLAY'
                            ? "bg-red-500/20 text-red-400 border border-red-500/30 text-xs animate-pulse"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs"
                        }>
                          {match.status === 'FINISHED' ? 'Amaituta' : match.status === 'IN_PLAY' ? '🔴 Jokoan' : 'Laster'}
                        </Badge>
                        {match.kickoff_time && (
                          <span className="text-xs text-slate-400 flex items-center gap-1 font-medium bg-slate-800/50 px-2 py-1 rounded-md">
                            <Clock className="w-3 h-3" />
                            {new Date(match.kickoff_time).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                        {match.stage.replace(/_/g, ' ')}
                      </span>
                    </div>
                    
                    {/* Marcador */}
                    <div className="p-5 flex justify-between items-center">
                      {/* Home Team */}
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-2 shadow-inner">
                          <span className="font-bold text-slate-300 text-[10px]">{match.home_team}</span>
                        </div>
                        <span className="font-semibold text-center text-sm leading-tight text-slate-200 group-hover:text-emerald-400 transition-colors">
                          {getTeamName(match.home_team)}
                        </span>
                      </div>

                      {/* Score */}
                      <div className="flex flex-col items-center px-3">
                        <div className="bg-slate-950 px-4 py-2 rounded-lg border border-slate-800 font-mono text-2xl font-bold tracking-widest shadow-inner text-emerald-400">
                          <span className="text-white">{match.home_score ?? '-'}</span>
                          <span className="text-slate-600 mx-1">:</span>
                          <span className="text-white">{match.away_score ?? '-'}</span>
                        </div>
                      </div>

                      {/* Away Team */}
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-2 shadow-inner">
                          <span className="font-bold text-slate-300 text-[10px]">{match.away_team}</span>
                        </div>
                        <span className="font-semibold text-center text-sm leading-tight text-slate-200 group-hover:text-emerald-400 transition-colors">
                          {getTeamName(match.away_team)}
                        </span>
                      </div>
                    </div>

                    {/* Botón para ver predicciones */}
                    {matchPreds.length > 0 && (
                      <>
                        <button
                          onClick={() => setExpandedMatch(isExpanded ? null : match.id)}
                          className="w-full px-4 py-2 border-t border-slate-800/50 flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-emerald-400 hover:bg-slate-800/30 transition-colors"
                        >
                          <Users className="w-3 h-3" />
                          {isExpanded ? 'Ezkutatu' : 'Ikusi'} pronostikoak ({matchPreds.length})
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-slate-800/50 bg-slate-950/50 p-3 space-y-1.5 max-h-72 overflow-y-auto">
                                {matchPreds
                                  .sort((a, b) => (participants[a.participant_id] || '').localeCompare(participants[b.participant_id] || ''))
                                  .map((pred) => (
                                  <div key={pred.id} className="flex items-center justify-between px-3 py-1.5 rounded-md bg-slate-900/50 hover:bg-slate-800/50 transition-colors">
                                    <span className="text-sm font-medium text-slate-300">
                                      {participants[pred.participant_id] || 'Ezezaguna'}
                                    </span>
                                    <span className="font-mono text-sm font-bold text-emerald-400">
                                      {pred.predicted_home_score} - {pred.predicted_away_score}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scroll::-webkit-scrollbar {
          display: none;
        }
        .hide-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  )
}
