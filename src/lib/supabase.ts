import { createClient } from '@supabase/supabase-js'

// Para el frontend usaremos la ANON KEY, pero para funciones de administración (como el Cron Job o el ingest script) usaremos la SERVICE ROLE KEY.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)
