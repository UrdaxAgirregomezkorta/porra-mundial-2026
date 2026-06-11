import Link from 'next/link'
import { supabase } from '@/lib/supabase'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trophy, Calendar } from 'lucide-react'

// Asegurar que la página siempre es dinámica para el ranking en tiempo real
export const revalidate = 0

export default async function LeaderboardPage() {
  const { data: participants, error } = await supabase
    .from('participants')
    .select('*')
    .order('total_points', { ascending: false })

  if (error) {
    console.error('Error fetching participants:', error)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header className="text-center space-y-4 py-8">
          <Badge variant="outline" className="text-emerald-400 border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-sm">
            FIFA World Cup 2026
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
            Clasificación Global
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto mb-6">
            Sigue en directo los puntos de la porra. Los resultados se actualizan automáticamente tras cada partido.
          </p>
          <div className="flex justify-center mt-6">
            <Link href="/matches">
              <Button variant="outline" className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-emerald-400">
                <Calendar className="w-4 h-4 mr-2" />
                Ver todos los partidos y apuestas
              </Button>
            </Link>
          </div>
        </header>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Trophy className="w-5 h-5 text-yellow-500" /> Leaderboard
            </CardTitle>
            <CardDescription className="text-slate-400">
              Top 17 participantes de la quiniela
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-slate-800">
              <Table>
                <TableHeader className="bg-slate-900/80">
                  <TableRow className="border-slate-800 hover:bg-slate-900/50">
                    <TableHead className="w-[80px] text-center font-bold text-slate-300">Pos</TableHead>
                    <TableHead className="font-bold text-slate-300">Participante</TableHead>
                    <TableHead className="text-right font-bold text-slate-300">Puntos Totales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants?.map((participant, index) => (
                    <TableRow 
                      key={participant.id} 
                      className="border-slate-800 transition-colors hover:bg-slate-800/50 cursor-pointer"
                    >
                      <TableCell className="text-center font-medium">
                        {index === 0 ? (
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-500 mx-auto font-bold text-lg">1</span>
                        ) : index === 1 ? (
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-300/20 text-slate-300 mx-auto font-bold text-lg">2</span>
                        ) : index === 2 ? (
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-700/20 text-amber-600 mx-auto font-bold text-lg">3</span>
                        ) : (
                          <span className="text-slate-500">{index + 1}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/player/${participant.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                          <Avatar className="h-9 w-9 border border-slate-700">
                            <AvatarFallback className="bg-slate-800 text-xs text-slate-300">
                              {participant.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold tracking-wide text-emerald-400 hover:text-emerald-300 underline-offset-4 hover:underline">
                            {participant.name}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="font-mono text-sm px-3 py-1 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all">
                          {participant.total_points} pts
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!participants || participants.length === 0) && (
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableCell colSpan={3} className="h-32 text-center text-slate-500">
                        Esperando datos. Configura la BD y ejecuta el script de ingesta.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
      </div>
    </div>
  )
}
