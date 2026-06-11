export function calculateGroupMatchPoints(
  realHomeScore: number | null,
  realAwayScore: number | null,
  predictedHomeScore: number | null,
  predictedAwayScore: number | null
): number {
  if (realHomeScore === null || realAwayScore === null || predictedHomeScore === null || predictedAwayScore === null) {
    return 0
  }

  // Acierto exacto: 3 puntos
  if (realHomeScore === predictedHomeScore && realAwayScore === predictedAwayScore) {
    return 3
  }

  // Acierto de tendencia (1X2): 1 punto
  const realTendency = realHomeScore > realAwayScore ? '1' : realHomeScore < realAwayScore ? '2' : 'X'
  const predictedTendency = predictedHomeScore > predictedAwayScore ? '1' : predictedHomeScore < predictedAwayScore ? '2' : 'X'

  if (realTendency === predictedTendency) {
    return 1
  }

  return 0
}

export function getStagePoints(stage: string): number {
  switch (stage) {
    case 'round_32': return 10
    case 'round_16': return 15
    case 'quarterfinal': return 20
    case 'semifinal': return 25
    case 'final': return 30
    default: return 0
  }
}

export function getAwardPoints(category: string): number {
  switch (category) {
    case 'winner': return 40
    case 'top_scorer_award': return 15
    case 'mvp': return 20
    case 'young_player': return 15
    // Goleadores 1 y 2 van por goles marcados: 5pts y 2pts respectivamente. Eso se calculará aparte.
    default: return 0
  }
}
