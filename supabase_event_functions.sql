-- Funzioni SQL per i dettagli della gara
-- Esegui questo script nel SQL Editor di Supabase

-- 1. Funzione per ottenere i dettagli di un evento
CREATE OR REPLACE FUNCTION get_event_details(
    p_codex TEXT,
    p_date DATE
)
RETURNS TABLE (
    codex TEXT,
    location TEXT,
    gender TEXT,
    discipline TEXT,
    category TEXT,
    date DATE,
    fis_points_valid TEXT,
    olympic_points_valid TEXT,
    run1_time TEXT,
    run2_time TEXT,
    run3_time TEXT,
    run4_time TEXT,
    event_url TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.codex::TEXT,
        e.location::TEXT,
        e.gender::TEXT,
        e.discipline::TEXT,
        e.category::TEXT,
        e.date,
        e.fis_points_valid::TEXT,
        e.olympic_points_valid::TEXT,
        e.run1_time::TEXT,
        e.run2_time::TEXT,
        e.run3_time::TEXT,
        e.run4_time::TEXT,
        e.event_url::TEXT
    FROM public.events e
    WHERE e.codex = p_codex
      AND e.date = p_date;
END;
$$;

-- 2. Funzione per ottenere tutti i risultati di un evento con i nomi degli atleti
CREATE OR REPLACE FUNCTION get_event_results(
    p_codex TEXT,
    p_date DATE
)
RETURNS TABLE (
    fis_code TEXT,
    athlete_name TEXT,
    country TEXT,
    rank TEXT,
    bib TEXT,
    run1 TEXT,
    run2 TEXT,
    run3 TEXT,
    run4 TEXT,
    total_time TEXT,
    diff_time TEXT,
    fis_points TEXT,
    points_2027 TEXT,
    cup_points TEXT,
    status TEXT,
    athlete_url TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.fis_code::TEXT,
        COALESCE(a.name, r.athlete_name)::TEXT AS athlete_name,
        COALESCE(a.country, r.nation)::TEXT AS country,
        r.rank::TEXT,
        r.bib::TEXT,
        r.run1::TEXT,
        r.run2::TEXT,
        r.run3::TEXT,
        r.run4::TEXT,
        r.total_time::TEXT,
        r.diff_time::TEXT,
        r.fis_points::TEXT,
        r.points_2027::TEXT,
        r.cup_points::TEXT,
        r.status::TEXT,
        r.athlete_url::TEXT
    FROM public.results r
    LEFT JOIN public.athletes a ON r.fis_code = a.fis_code
    WHERE r.event_codex = p_codex
      AND r.event_date = p_date
    ORDER BY
        -- Prima gli atleti che hanno finito (rank numerico)
        CASE
            WHEN r.rank ~ '^[0-9]+$' THEN r.rank::INTEGER
            ELSE 999999
        END ASC,
        -- Poi gli altri ordinati per status
        r.status ASC NULLS LAST;
END;
$$;

-- Esempio di utilizzo:
--
-- 1. Ottenere dettagli di una gara:
-- SELECT * FROM get_event_details('CODEX_ESEMPIO', '2024-01-15');
--
-- 2. Ottenere tutti i risultati di una gara:
-- SELECT * FROM get_event_results('CODEX_ESEMPIO', '2024-01-15');
