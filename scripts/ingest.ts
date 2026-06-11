import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno de .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Faltan las credenciales de Supabase en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Iniciando ingesta del CSV...");
  const csvPath = path.resolve(process.cwd(), 'predictions.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');

  const records = parse(fileContent, {
    skip_empty_lines: true,
    relax_column_count: true,
  });

  // La fila 3 (índice 2) contiene los nombres de los partidos y las cabeceras
  const headers = records[2];
  const groupMatchNames = headers.slice(2, 74);

  // 1. Crear Partidos de Fase de Grupos
  console.log("Insertando partidos de fase de grupos...");
  const matchIdMap = new Map<string, string>(); // 'MEX VS SUD' -> uuid

  for (const matchStr of groupMatchNames) {
    if (!matchStr.includes(' VS ')) continue;
    const [home, away] = matchStr.split(' VS ').map((s: string) => s.trim());
    
    // Insertar si no existe
    const { data: existingMatch } = await supabase
      .from('matches')
      .select('id')
      .eq('home_team', home)
      .eq('away_team', away)
      .eq('stage', 'group')
      .single();

    if (existingMatch) {
      matchIdMap.set(matchStr.trim(), existingMatch.id);
    } else {
      const { data: newMatch, error } = await supabase
        .from('matches')
        .insert({ home_team: home, away_team: away, stage: 'group' })
        .select('id')
        .single();
      
      if (error) console.error("Error insertando partido:", error);
      if (newMatch) matchIdMap.set(matchStr.trim(), newMatch.id);
    }
  }

  // 2. Insertar Participantes y Predicciones
  // Las filas de participantes van desde el índice 3 hasta el 19
  for (let i = 3; i <= 19; i++) {
    const row = records[i];
    if (!row || !row[1]) continue;

    const participantName = row[1].trim();
    console.log(`Procesando participante: ${participantName}`);

    // Insertar Participante
    let participantId;
    const { data: existingPart } = await supabase
      .from('participants')
      .select('id')
      .eq('name', participantName)
      .single();

    if (existingPart) {
      participantId = existingPart.id;
    } else {
      const { data: newPart, error } = await supabase
        .from('participants')
        .insert({ name: participantName })
        .select('id')
        .single();
      if (error) console.error("Error insertando participante:", error);
      participantId = newPart?.id;
    }

    if (!participantId) continue;

    // Insertar predicciones de fase de grupos (índices 2 a 73)
    const groupPredictions = [];
    for (let j = 0; j < 72; j++) {
      const scoreStr = row[j + 2];
      const matchName = groupMatchNames[j].trim();
      const matchId = matchIdMap.get(matchName);

      if (scoreStr && scoreStr.includes('-') && matchId) {
        const [homeS, awayS] = scoreStr.split('-');
        groupPredictions.push({
          participant_id: participantId,
          match_id: matchId,
          predicted_home_score: parseInt(homeS, 10),
          predicted_away_score: parseInt(awayS, 10)
        });
      }
    }

    if (groupPredictions.length > 0) {
      await supabase.from('predictions_groups').upsert(groupPredictions, { onConflict: 'participant_id, match_id' });
    }

    // Insertar brackets
    const bracketPredictions = [];
    
    // 16avos (32 equipos, índices 74 a 105)
    for (let j = 74; j <= 105; j++) {
      if (row[j]) bracketPredictions.push({ participant_id: participantId, stage: 'round_32', predicted_team: row[j].trim() });
    }
    // 8avos (16 equipos, índices 106 a 121)
    for (let j = 106; j <= 121; j++) {
      if (row[j]) bracketPredictions.push({ participant_id: participantId, stage: 'round_16', predicted_team: row[j].trim() });
    }
    // 4tos (8 equipos, índices 122 a 129)
    for (let j = 122; j <= 129; j++) {
      if (row[j]) bracketPredictions.push({ participant_id: participantId, stage: 'quarterfinal', predicted_team: row[j].trim() });
    }
    // Semis (4 equipos, índices 130 a 133)
    for (let j = 130; j <= 133; j++) {
      if (row[j]) bracketPredictions.push({ participant_id: participantId, stage: 'semifinal', predicted_team: row[j].trim() });
    }
    // Final (2 equipos, índices 134 a 135)
    for (let j = 134; j <= 135; j++) {
      if (row[j]) bracketPredictions.push({ participant_id: participantId, stage: 'final', predicted_team: row[j].trim() });
    }

    if (bracketPredictions.length > 0) {
      // Borrar antiguos por simplicidad
      await supabase.from('predictions_brackets').delete().eq('participant_id', participantId);
      await supabase.from('predictions_brackets').insert(bracketPredictions);
    }

    // Insertar premios y ganadores
    const awardPredictions = [
      { participant_id: participantId, category: 'winner', predicted_value: row[136]?.trim() },
      { participant_id: participantId, category: 'top_scorer_award', predicted_value: row[137]?.trim() },
      { participant_id: participantId, category: 'top_scorer_1', predicted_value: row[138]?.trim() },
      { participant_id: participantId, category: 'top_scorer_2', predicted_value: row[139]?.trim() },
      { participant_id: participantId, category: 'mvp', predicted_value: row[140]?.trim() },
      { participant_id: participantId, category: 'young_player', predicted_value: row[141]?.trim() },
    ].filter(a => a.predicted_value);

    if (awardPredictions.length > 0) {
      await supabase.from('predictions_awards').delete().eq('participant_id', participantId);
      await supabase.from('predictions_awards').insert(awardPredictions);
    }
  }

  console.log("¡Ingesta completada!");
}

run().catch(console.error);
