// src/supabaseClient.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Evita istanze multiple in sviluppo (a causa dell'hot-reloading)
const globalForSupabase = globalThis as unknown as {
  supabase: SupabaseClient | undefined;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Errore: variabili d'ambiente Supabase non trovate.");
}

// Crea il client solo se non esiste già
export const supabase = globalForSupabase.supabase ?? createClient(supabaseUrl, supabaseAnonKey);

// In sviluppo, salva l'istanza nel contesto globale
if (import.meta.env.DEV) {
  globalForSupabase.supabase = supabase;
}

