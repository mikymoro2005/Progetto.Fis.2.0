-- =================================================================
-- SCRIPT COMPLETO PER RESETTARE LE POLICY DI SICUREZZA
-- =================================================================
-- Istruzioni:
-- Esegui TUTTO questo script nel SQL Editor del tuo progetto Supabase.
-- Ignora eventuali messaggi di "does not exist" durante la cancellazione,
-- è normale se una policy è già stata rimossa.
-- =================================================================

-- -----------------------------------------------------------------
-- FASE 1: CANCELLAZIONE DELLE VECCHIE POLICY
-- -----------------------------------------------------------------

-- Cancellazione su 'athletes'
DROP POLICY IF EXISTS "gli utenti possono vedere gli atleti" ON public.athletes;
DROP POLICY IF EXISTS "Gli utenti possono vedere gli atleti" ON public.athletes;

-- Cancellazione su 'events'
DROP POLICY IF EXISTS "Gli utenti possono vedere gli eventi" ON public.events;

-- Cancellazione su 'results'
DROP POLICY IF EXISTS "Gli utenti possono vedere i risultati" ON public.results;

-- Cancellazione su 'favorite_athletes' (tutte le versioni duplicate)
DROP POLICY IF EXISTS "Gli utenti possono cancellare i propri preferiti" ON public.favorite_athletes;
DROP POLICY IF EXISTS "Gli utenti possono inserire i propri preferiti" ON public.favorite_athletes;
DROP POLICY IF EXISTS "Gli utenti possono vedere i propri preferiti" ON public.favorite_athletes;
DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorite_athletes;
DROP POLICY IF EXISTS "Users can insert own favorites" ON public.favorite_athletes;
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorite_athletes;


-- -----------------------------------------------------------------
-- FASE 2: CREAZIONE DELLE NUOVE POLICY CORRETTE
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

-- Policy per la tabella 'favorite_athletes'
CREATE POLICY "Gli utenti vedono solo i propri preferiti"
ON public.favorite_athletes FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Gli utenti inseriscono solo i propri preferiti"
ON public.favorite_athletes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Gli utenti cancellano solo i propri preferiti"
ON public.favorite_athletes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =================================================================
-- Fine dello script.
-- =================================================================
