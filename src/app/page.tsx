'use client'

import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Trophy, Calendar, Medal, BarChart3 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function LeaderboardPage() {
  const [participants, setParticipants] = useState<any[]>([])
  const [error, setError] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('total_points', { ascending: false })

      if (error) setError(error)
      else setParticipants(data || [])
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="animate-pulse flex flex-col items-center">
          <Trophy className="w-16 h-16 text-emerald-500/50 mb-4" />
          <p className="text-slate-400 font-medium">Sailkapena kargatzen...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-400">
        <h2 className="text-2xl font-bold mb-4">Konexio errorea</h2>
        <pre className="bg-slate-900 p-4 rounded text-left overflow-auto text-xs">{JSON.stringify(error, null, 2)}</pre>
      </div>
    )
  }

  const top3 = participants.slice(0, 3)
  const rest = participants.slice(3)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header Premium */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 pt-8 pb-4"
        >
          <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-4 ring-1 ring-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <Trophy className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter bg-gradient-to-br from-white via-slate-100 to-slate-400 bg-clip-text text-transparent drop-shadow-sm">
            2026ko Mundiala
          </h1>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-emerald-400 mt-2">
            AISAO porria
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <Link href="/matches" className="inline-flex items-center justify-center px-6 py-3 bg-slate-900/50 hover:bg-slate-800 text-emerald-400 rounded-full border border-slate-700/50 backdrop-blur-md transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] font-medium">
              <Calendar className="w-5 h-5 mr-2" />
              Partidak
            </Link>
            <Link href="/stats" className="inline-flex items-center justify-center px-6 py-3 bg-slate-900/50 hover:bg-slate-800 text-purple-400 rounded-full border border-slate-700/50 backdrop-blur-md transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] font-medium">
              <BarChart3 className="w-5 h-5 mr-2" />
              Estatistikak
            </Link>
          </div>
        </motion.header>

        {/* Podium Top 3 */}
        {top3.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mt-12 mb-16">
            {/* 2nd Place — order-2 en móvil, order-1 en desktop (izquierda) */}
            {top3[1] && (
              <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="order-2 md:order-1">
                <Link href={`/player/${top3[1].id}`}>
                  <Card className="bg-slate-900/40 border-slate-700/50 backdrop-blur-xl hover:bg-slate-800/50 transition-all cursor-pointer overflow-hidden group">
                    <CardContent className="p-6 flex flex-col items-center relative">
                      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent opacity-50" />
                      <Avatar className="h-20 w-20 border-4 border-slate-400/30 mb-4 shadow-[0_0_15px_rgba(148,163,184,0.2)] group-hover:scale-110 transition-transform">
                        <AvatarFallback className="bg-slate-800 text-xl font-bold text-slate-300">{top3[1].name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <Medal className="w-6 h-6 text-slate-300 mb-2" />
                      <h3 className="font-bold text-xl text-white">{top3[1].name}</h3>
                      <p className="text-2xl font-black text-slate-300 font-mono mt-1">{top3[1].total_points} pts</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            )}

            {/* 1st Place — order-1 en móvil (primero), order-2 en desktop (centro) */}
            {top3[0] && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="order-1 md:order-2 z-10 relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 rounded-2xl blur opacity-25 animate-pulse" />
                <Link href={`/player/${top3[0].id}`}>
                  <Card className="bg-slate-900/60 border-yellow-500/30 backdrop-blur-xl hover:bg-slate-800/80 transition-all cursor-pointer relative overflow-hidden group">
                    <CardContent className="p-8 flex flex-col items-center">
                      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
                      <Avatar className="h-28 w-28 border-4 border-yellow-500/50 mb-4 shadow-[0_0_30px_rgba(234,179,8,0.3)] group-hover:scale-110 transition-transform">
                        <AvatarFallback className="bg-slate-800 text-2xl font-bold text-yellow-400">{top3[0].name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <Trophy className="w-8 h-8 text-yellow-400 mb-2 drop-shadow-md" />
                      <h3 className="font-extrabold text-2xl text-white">{top3[0].name}</h3>
                      <p className="text-4xl font-black text-yellow-400 font-mono mt-2 drop-shadow-md">{top3[0].total_points} pts</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            )}

            {/* 3rd Place — order-3 en ambos */}
            {top3[2] && (
              <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="order-3">
                <Link href={`/player/${top3[2].id}`}>
                  <Card className="bg-slate-900/40 border-amber-700/30 backdrop-blur-xl hover:bg-slate-800/50 transition-all cursor-pointer overflow-hidden group">
                    <CardContent className="p-6 flex flex-col items-center relative">
                      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-600 to-transparent opacity-50" />
                      <Avatar className="h-20 w-20 border-4 border-amber-600/30 mb-4 shadow-[0_0_15px_rgba(217,119,6,0.15)] group-hover:scale-110 transition-transform">
                        <AvatarFallback className="bg-slate-800 text-xl font-bold text-amber-500">{top3[2].name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <Medal className="w-6 h-6 text-amber-600 mb-2" />
                      <h3 className="font-bold text-xl text-white">{top3[2].name}</h3>
                      <p className="text-2xl font-black text-amber-500 font-mono mt-1">{top3[2].total_points} pts</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            )}
          </div>
        )}

        {/* Rest of the List */}
        <div className="space-y-3">
          {rest.map((participant, index) => (
            <motion.div 
              key={participant.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + (index * 0.05) }}
            >
              <Link href={`/player/${participant.id}`}>
                <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800/50 rounded-xl hover:bg-slate-800/60 hover:border-slate-700 transition-all backdrop-blur-md group">
                  <div className="flex items-center gap-4">
                    <div className="w-8 text-center text-slate-500 font-bold font-mono">
                      {index + 4}
                    </div>
                    <Avatar className="h-10 w-10 border border-slate-700 shadow-sm group-hover:border-emerald-500/50 transition-colors">
                      <AvatarFallback className="bg-slate-800 text-xs text-slate-300 group-hover:text-emerald-400">
                        {participant.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold tracking-wide text-slate-200 group-hover:text-white transition-colors">
                      {participant.name}
                    </span>
                  </div>
                  <div className="font-mono text-lg font-bold text-emerald-400/90 group-hover:text-emerald-400">
                    {participant.total_points} <span className="text-xs text-slate-500 font-sans font-normal">pts</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  )
}
