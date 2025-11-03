-- =================================================================
-- FUNZIONE RPC PER IL CONFRONTO TRA DUE ATLETI (SINTASSI CORRETTA)
-- =================================================================
-- Istruzioni:
-- Esegui questo script nel SQL Editor del tuo progetto Supabase.
-- =================================================================

CREATE OR REPLACE FUNCTION compare_athletes(fis_code_1 TEXT, fis_code_2 TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSONB;
BEGIN

  WITH 
  -- 1. Dettagli dei due atleti
  athlete_details AS (
    SELECT fis_code, name, country, gender, age FROM athletes WHERE fis_code IN (fis_code_1, fis_code_2)
  ),

  -- 2. Trova le gare (event_codex, event_date) in comune
  common_races_cte AS (
    SELECT event_codex, event_date
    FROM results
    WHERE fis_code = fis_code_1
    INTERSECT
    SELECT event_codex, event_date
    FROM results
    WHERE fis_code = fis_code_2
  ),

  -- 3. Ottieni i risultati completi per entrambi gli atleti in quelle gare
  race_results AS (
    SELECT
      r.event_codex,
      r.event_date,
      e.location,
      e.discipline,
      r.fis_code,
      -- Converte il rank in un numero, gestendo i non numerici come DNF, DSQ etc.
      CASE 
        WHEN r.rank ~ E'^\\d+$' THEN CAST(r.rank AS INT)
        ELSE NULL
      END as numeric_rank,
      r.status
    FROM results r
    JOIN common_races_cte cr ON r.event_codex = cr.event_codex AND r.event_date = cr.event_date
    JOIN events e ON r.event_codex = e.codex AND r.event_date = e.date
    WHERE r.fis_code IN (fis_code_1, fis_code_2)
  ),

  -- 4. Aggrega i risultati per ogni gara per avere i dati di entrambi gli atleti su una riga
  paired_results AS (
    SELECT
      rr1.event_codex,
      rr1.event_date,
      rr1.location,
      rr1.discipline,
      jsonb_build_object('rank', rr1.numeric_rank, 'status', rr1.status) as athlete1_result,
      jsonb_build_object('rank', rr2.numeric_rank, 'status', rr2.status) as athlete2_result
    FROM race_results rr1
    JOIN race_results rr2 ON rr1.event_codex = rr2.event_codex AND rr1.event_date = rr2.event_date
    WHERE rr1.fis_code = fis_code_1 AND rr2.fis_code = fis_code_2
    ORDER BY rr1.event_date DESC
  ),

  -- 5. Calcola le statistiche riassuntive
  summary AS (
    SELECT
      COUNT(*) AS common_races_count,
      SUM(CASE WHEN (pr.athlete1_result->>'rank')::INT < (pr.athlete2_result->>'rank')::INT AND pr.athlete1_result->>'rank' IS NOT NULL AND pr.athlete2_result->>'rank' IS NOT NULL THEN 1 ELSE 0 END) AS athlete1_wins,
      SUM(CASE WHEN (pr.athlete2_result->>'rank')::INT < (pr.athlete1_result->>'rank')::INT AND pr.athlete1_result->>'rank' IS NOT NULL AND pr.athlete2_result->>'rank' IS NOT NULL THEN 1 ELSE 0 END) AS athlete2_wins,
      SUM(CASE WHEN (pr.athlete1_result->>'rank')::INT = (pr.athlete2_result->>'rank')::INT AND pr.athlete1_result->>'rank' IS NOT NULL AND pr.athlete2_result->>'rank' IS NOT NULL THEN 1 ELSE 0 END) AS ties,
      SUM(CASE WHEN pr.athlete1_result->>'rank' IS NULL THEN 1 ELSE 0 END) AS athlete1_dnf_dsq,
      SUM(CASE WHEN pr.athlete2_result->>'rank' IS NULL THEN 1 ELSE 0 END) AS athlete2_dnf_dsq
    FROM paired_results pr
  )

  -- 6. Costruisci il JSON finale
  SELECT jsonb_build_object(
    'athlete1_details', (SELECT to_jsonb(ad) FROM athlete_details ad WHERE ad.fis_code = fis_code_1),
    'athlete2_details', (SELECT to_jsonb(ad) FROM athlete_details ad WHERE ad.fis_code = fis_code_2),
    'summary', (SELECT to_jsonb(s) FROM summary s),
    'races', (SELECT jsonb_agg(pr) FROM paired_results pr)
  ) INTO result;

  RETURN result;
END;
$$;

-- =================================================================
-- Esempio di utilizzo:
-- SELECT compare_athletes('512138', '512239');
-- =================================================================