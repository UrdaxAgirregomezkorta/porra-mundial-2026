'use client'

import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Trophy, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function MatchesPage() {
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase
        .from('matches')
        .select('*')
        .order('kickoff_time', { ascending: true })
      
      setMatches(data || [])
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="animate-pulse flex flex-col items-center">
          <Calendar className="w-16 h-16 text-emerald-500/50 mb-4" />
          <p className="text-slate-400 font-medium">Cargando partidos...</p>
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
            Partidos
          </h1>
          <Link href="/" className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors">
            Volver
          </Link>
        </div>

        {/* Grid de Partidos */}
        <div className="grid gap-6 md:grid-cols-2">
          {matches.map((match, i) => (
            <motion.div 
              key={match.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md hover:bg-slate-800/60 transition-all group overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/50">
                    <Badge variant={match.status === 'FINISHED' ? 'secondary' : 'default'} className={
                      match.status === 'FINISHED' 
                        ? "bg-slate-800 text-slate-400" 
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }>
                      {match.status === 'FINISHED' ? 'Finalizado' : match.status === 'IN_PLAY' ? 'En Juego' : 'Próximamente'}
                    </Badge>
                    <div className="flex items-center text-xs font-mono text-slate-400">
                      <Clock className="w-3 h-3 mr-1" />
                      {match.kickoff_time 
                        ? new Date(match.kickoff_time).toLocaleDateString('es-ES', { 
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                          })
                        : 'Por definir'}
                    </div>
                  </div>
                  
                  <div className="p-6 flex justify-between items-center relative">
                    {/* Home Team */}
                    <div className="flex flex-col items-center flex-1">
                      <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-3 shadow-inner">
                        <span className="font-bold text-slate-300 text-sm">{match.home_team.substring(0, 3).toUpperCase()}</span>
                      </div>
                      <span className="font-bold text-center group-hover:text-emerald-400 transition-colors">{match.home_team}</span>
                    </div>

                    {/* Score */}
                    <div className="flex flex-col items-center flex-1 px-4">
                      <div className="bg-slate-950 px-4 py-2 rounded-lg border border-slate-800 font-mono text-2xl font-black tracking-widest shadow-inner">
                        {match.home_score ?? '-'} : {match.away_score ?? '-'}
                      </div>
                      <span className="text-xs text-slate-500 mt-2 font-medium uppercase tracking-wider">{match.stage.replace('_', ' ')}</span>
                    </div>

                    {/* Away Team */}
                    <div className="flex flex-col items-center flex-1">
                      <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-3 shadow-inner">
                        <span className="font-bold text-slate-300 text-sm">{match.away_team.substring(0, 3).toUpperCase()}</span>
                      </div>
                      <span className="font-bold text-center group-hover:text-emerald-400 transition-colors">{match.away_team}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
