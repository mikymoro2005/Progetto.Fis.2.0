// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// AGGIUNGI QUESTO BLOCCO PER IL DEBUG
console.log("Supabase URL letto:", supabaseUrl);
console.log("Supabase Anon Key letta:", supabaseAnonKey ? "Trovata" : "NON TROVATA");
// FINE BLOCCO DEBUG

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Errore: variabili d'ambiente non trovate.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);