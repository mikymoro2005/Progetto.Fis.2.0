import { createClient } from '@supabase/supabase-js';
// 1. Leggiamo le variabili dall'ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 2. Controlliamo che esistano
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Errore: variabili d'ambiente VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY non trovate. Assicurati che il file .env.local esista e che il server sia stato riavviato.");
}

// 3. Creiamo il client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)