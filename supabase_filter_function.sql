-- Funzione Supabase per filtrare gli atleti con logica complessa
-- Questa funzione deve essere eseguita nel SQL Editor di Supabase

CREATE OR REPLACE FUNCTION search_athletes_with_filters(
    p_name TEXT DEFAULT NULL,
    p_fis_code TEXT DEFAULT NULL,
    p_age_min INTEGER DEFAULT NULL,
    p_age_max INTEGER DEFAULT NULL,
    p_country TEXT DEFAULT NULL,
    p_gender TEXT DEFAULT NULL,
    p_disciplines TEXT[] DEFAULT NULL,  -- Array di specialità selezionate: es. ['sl', 'gs']
    p_limit INTEGER DEFAULT 25
)
RETURNS TABLE (
    fis_code TEXT,
    name TEXT,
    country TEXT,
    age INTEGER,
    gender TEXT,
    dh FLOAT,
    sl FLOAT,
    gs FLOAT,
    sg FLOAT,
    ac FLOAT,
    total_points FLOAT,
    ranking BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_disciplines_count INTEGER;
BEGIN
    -- Contiamo quante discipline sono state selezionate
    v_disciplines_count := COALESCE(array_length(p_disciplines, 1), 0);

    -- Query con CTE per pulizia dati (come get_athletes_alphabetical)
    RETURN QUERY
    WITH cleaned AS (
        SELECT
            a.fis_code,
            TRIM(a.name) AS name_trim,
            TRIM(a.country) AS country_trim,
            a.age::integer AS age_int,
            a.gender AS gender_trim,
            COALESCE(NULLIF(TRIM(a.dh), '')::float, 9999) AS dh_clean,
            COALESCE(NULLIF(TRIM(a.sl), '')::float, 9999) AS sl_clean,
            COALESCE(NULLIF(TRIM(a.gs), '')::float, 9999) AS gs_clean,
            COALESCE(NULLIF(TRIM(a.sg), '')::float, 9999) AS sg_clean,
            COALESCE(NULLIF(TRIM(a.ac), '')::float, 9999) AS ac_clean
        FROM public.athletes a
        WHERE
            a.name IS NOT NULL
            AND TRIM(a.name) <> ''
            -- Filtro per escludere nomi che corrispondono al paese
            AND NOT (UPPER(TRIM(a.name)) = UPPER(COALESCE(TRIM(a.country), '')))
            AND NOT (TRIM(a.name) ~ '^[[:upper:][:space:]]+[0-9]+$')
            -- Solo filtri strutturali (paese, genere, età) - NON nome o fis_code
            AND (p_age_min IS NULL OR a.age::integer >= p_age_min)
            AND (p_age_max IS NULL OR a.age::integer <= p_age_max)
            AND (p_country IS NULL OR LOWER(TRIM(a.country)) = LOWER(p_country))
            AND (p_gender IS NULL OR LOWER(a.gender) = LOWER(p_gender))
    ),
    calculated AS (
        SELECT
            c.fis_code,
            c.name_trim,
            c.country_trim,
            c.age_int,
            c.gender_trim,
            c.dh_clean,
            c.sl_clean,
            c.gs_clean,
            c.sg_clean,
            c.ac_clean,
            -- Calcolo del total_points in base alle discipline selezionate
            CASE
                WHEN v_disciplines_count = 0 THEN NULL
                ELSE (
                    CASE WHEN 'dh' = ANY(p_disciplines) THEN c.dh_clean ELSE 0 END +
                    CASE WHEN 'sl' = ANY(p_disciplines) THEN c.sl_clean ELSE 0 END +
                    CASE WHEN 'gs' = ANY(p_disciplines) THEN c.gs_clean ELSE 0 END +
                    CASE WHEN 'sg' = ANY(p_disciplines) THEN c.sg_clean ELSE 0 END +
                    CASE WHEN 'ac' = ANY(p_disciplines) THEN c.ac_clean ELSE 0 END
                )
            END AS total_points_calc
        FROM cleaned c
        WHERE
            -- Se ci sono discipline, filtriamo solo gli atleti che hanno almeno una valida
            (v_disciplines_count = 0 OR (
                ('dh' = ANY(p_disciplines) AND c.dh_clean < 9999) OR
                ('sl' = ANY(p_disciplines) AND c.sl_clean < 9999) OR
                ('gs' = ANY(p_disciplines) AND c.gs_clean < 9999) OR
                ('sg' = ANY(p_disciplines) AND c.sg_clean < 9999) OR
                ('ac' = ANY(p_disciplines) AND c.ac_clean < 9999)
            ))
    ),
    ranked AS (
        SELECT
            ca.fis_code,
            ca.name_trim,
            ca.country_trim,
            ca.age_int,
            ca.gender_trim,
            ca.dh_clean,
            ca.sl_clean,
            ca.gs_clean,
            ca.sg_clean,
            ca.ac_clean,
            ca.total_points_calc,
            -- Il ranking è calcolato rispetto ai filtri STRUTTURALI (paese, genere, discipline)
            -- NON rispetto ai filtri di ricerca (nome, fis_code)
            CASE
                WHEN v_disciplines_count > 0 THEN
                    ROW_NUMBER() OVER (ORDER BY ca.total_points_calc ASC NULLS LAST)
                ELSE
                    -- Se non ci sono discipline selezionate, ranking basato sui punti totali
                    ROW_NUMBER() OVER (ORDER BY
                        (ca.dh_clean + ca.sl_clean + ca.gs_clean + ca.sg_clean) ASC NULLS LAST
                    )
            END AS ranking_calc
        FROM calculated ca
    ),
    -- Ora applichiamo i filtri di ricerca (nome, fis_code) DOPO aver calcolato il ranking
    filtered AS (
        SELECT
            r.*
        FROM ranked r
        WHERE
            (p_name IS NULL OR LOWER(r.name_trim) LIKE LOWER('%' || p_name || '%'))
            AND (p_fis_code IS NULL OR r.fis_code LIKE '%' || p_fis_code || '%')
    )
    SELECT
        f.fis_code::TEXT,
        f.name_trim::TEXT,
        f.country_trim::TEXT,
        f.age_int,
        f.gender_trim::TEXT,
        f.dh_clean,
        f.sl_clean,
        f.gs_clean,
        f.sg_clean,
        f.ac_clean,
        f.total_points_calc,
        f.ranking_calc
    FROM filtered f
    ORDER BY
        CASE
            -- Se ci sono discipline, ordina per total_points (ranking per quelle discipline)
            WHEN v_disciplines_count > 0 THEN f.total_points_calc
            -- Altrimenti ordina per ranking basato sui punti totali
            ELSE f.ranking_calc::float
        END ASC NULLS LAST,
        -- Ordinamento secondario per nome (in caso di parità)
        f.name_trim ASC
    LIMIT p_limit;
END;
$$;

-- Esempio di utilizzo:
--
-- 1. Filtrare per una sola specialità (SL):
-- SELECT * FROM search_athletes_with_filters(
--     p_disciplines := ARRAY['sl']
-- );
--
-- 2. Filtrare per più specialità (SL + GS):
-- SELECT * FROM search_athletes_with_filters(
--     p_disciplines := ARRAY['sl', 'gs']
-- );
--
-- 3. Filtrare per nome, genere e specialità:
-- SELECT * FROM search_athletes_with_filters(
--     p_name := 'Marco',
--     p_gender := 'M',
--     p_disciplines := ARRAY['sl', 'gs']
-- );
--
-- 4. Filtrare solo per genere (senza specialità):
-- SELECT * FROM search_athletes_with_filters(
--     p_gender := 'M'
-- );
