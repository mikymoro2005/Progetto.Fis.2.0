-- =================================================================
-- POLICIES DI SICUREZZA PER IL PROGETTO SUPABASE
-- =================================================================
-- Istruzioni:
-- 1. Assicurati che RLS (Row Level Security) sia abilitata per tutte le tabelle.
-- 2. Esegui questo script nel SQL Editor del tuo progetto Supabase.
-- 3. Questo script presume che le vecchie policy siano state cancellate.
-- =================================================================


-- -----------------------------------------------------------------
-- 1. Policy per le tabelle a lettura pubblica
--    Chiunque (registrato o no) può leggere, nessuno può modificare.
-- -----------------------------------------------------------------

-- Policy per la tabella 'athletes'
CREATE POLICY "Accesso pubblico in lettura per gli atleti"
ON public.athletes FOR SELECT TO public USING (true);

-- Policy per la tabella 'events'
CREATE POLICY "Accesso pubblico in lettura per gli eventi"
ON public.events FOR SELECT TO public USING (true);

-- Policy per la tabella 'results'
CREATE POLICY "Accesso pubblico in lettura per i risultati"
ON public.results FOR SELECT TO public USING (true);


-- -----------------------------------------------------------------
-- 2. Policy di sicurezza per la tabella 'favorite_athletes'
--    Solo gli utenti autenticati possono gestire i propri preferiti.
--
-- NOTA: Queste policy presumono che esista una colonna 'user_id'
--       nella tabella 'favorite_athletes'.
-- -----------------------------------------------------------------

-- REGOLA 2.1: Gli utenti possono VEDERE solo i propri preferiti.
CREATE POLICY "Gli utenti vedono solo i propri preferiti"
ON public.favorite_athletes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- REGOLA 2.2: Gli utenti possono INSERIRE un preferito solo per sé stessi.
CREATE POLICY "Gli utenti inseriscono solo i propri preferiti"
ON public.favorite_athletes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- REGOLA 2.3: Gli utenti possono CANCELLARE solo i propri preferiti.
CREATE POLICY "Gli utenti cancellano solo i propri preferiti"
ON public.favorite_athletes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =================================================================
-- Fine dello script.
-- =================================================================
