// src/pages/Atleti.tsx
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import styles from "../Rank.module.css";
import filterStyles from "./Atleti.module.css";

const ATLETI_PAGE_SIZE = 25;

export type Athlete = {
  fis_code: string;
  name: string;
  country: string;
  age: number | string;
  dh: number | string;
  sl: number | string;
  gs: number | string;
  sg: number | string;
  ac: number | string;
  gender?: string;
  total_points?: number;
  ranking?: number;
};

interface AtletiProps {
  goToAthleteDetail: (fisCode: string) => void;
}

type Filters = {
  name: string;
  fisCode: string;
  ageMin: string;
  ageMax: string;
  country: string;
  gender: string;
  disciplines: string[];
};

const countryToCode: Record<string, string> = {
  Austria: "AT", France: "FR", Switzerland: "CH", Canada: "CA",
  Argentina: "AR", "United States Of America": "US", Czechia: "CZ",
  Germany: "DE", Italy: "IT", Norway: "NO", Slovenia: "SI",
  Slovakia: "SK",
};

function getFlagEmoji(countryName: string): string {
  const code = countryToCode[countryName] || "";
  if (!code) {
    return "🏳️";
  }
  const codePoints = code
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Belarus", "Belgium", "Benin", "Bhutan", "Bosnia And Herzegovina", "Brazil",
  "Bulgaria", "Canada", "Cape Verde", "Chile", "Chinese Taipei", "Colombia", "Croatia", "Cyprus",
  "Czechia", "Denmark", "Dominican Republic", "Ecuador", "Eritrea", "Estonia", "Finland",
  "Fis Refugee Team", "France", "Georgia", "Germany", "Ghana", "Great Britain", "Greece",
  "Guinea-bissau", "Haiti", "Hong Kong, China", "Hungary", "Iceland", "India", "Iran", "Ireland",
  "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Korea", "Kosovo",
  "Kuwait", "Kyrgyzstan", "Latvia", "Lebanon", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malaysia", "Malta", "Marocco", "Mexico", "Monaco", "Mongolia", "Montenegro",
  "Nepal", "Netherlands", "New Zealand", "North Macedonia", "Norway", "P.r. China", "Pakistan",
  "Peru", "Philippines", "Poland", "Portugal", "Puerto Rico", "Republic Of San Marino", "Romania",
  "Russia", "Saudi Arabia", "Serbia", "Singapore", "Slovakia", "Slovenia", "South Africa", "Spain",
  "Sweden", "Switzerland", "Tajikistan", "Thailand", "Timor-leste", "Tonga", "Trinidad & Tobago",
  "Türkiye", "Ukraine", "United Arab Emirates", "United States Of America", "Uruguay", "Uzbekistan",
  "Venezuela"
];

function formatScore(score: number | string | null | undefined): string {
  // Se è null o undefined, mostra N/A
  if (score === null || score === undefined) {
    return "N/A";
  }
  
  // Se è la stringa "9999" o "null", mostra N/A
  if (score === "9999" || score === "null") {
    return "N/A";
  }
  
  const numScore = typeof score === "number" ? score : parseFloat(score);
  
  // Se non è un numero valido o è >= 9999, mostra N/A
  if (isNaN(numScore) || numScore >= 9999) {
    return "N/A";
  }
  
  // Altrimenti mostra il punteggio formattato (anche se è 0)
  return numScore.toFixed(2);
}

function Atleti({ goToAthleteDetail }: AtletiProps) {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoDetectedGender, setAutoDetectedGender] = useState<string | null>(null);
  const [pageNum, setPageNum] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [filters, setFilters] = useState<Filters>({
    name: "",
    fisCode: "",
    ageMin: "",
    ageMax: "",
    country: "",
    gender: "",
    disciplines: [],
  });

  const hasActiveFilters = () => {
    return (
      filters.name !== "" ||
      filters.fisCode !== "" ||
      filters.ageMin !== "" ||
      filters.ageMax !== "" ||
      filters.country !== "" ||
      filters.gender !== "" ||
      filters.disciplines.length > 0
    );
  };

  const fetchAthletes = useCallback(async (offset: number, isNewFilter: boolean) => {
    if (isNewFilter) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      if (!hasActiveFilters()) {
        const { data, error } = await supabase.rpc("get_athletes_alphabetical", {
          limit_count: ATLETI_PAGE_SIZE,
          offset_count: offset,
        });

        if (error) {
          console.error("Errore nel caricamento dati:", error);
          setError("Impossibile caricare i dati. Controlla la console.");
          if (isNewFilter) setAthletes([]);
        } else if (data) {
          if (data.length < ATLETI_PAGE_SIZE) {
            setHasMore(false);
          }
          setAthletes((prevAthletes) =>
            isNewFilter ? data : [...prevAthletes, ...data]
          );
        }
      } else {
        // Costruzione parametri per search_athletes_with_filters
        const params: any = {
          p_limit: ATLETI_PAGE_SIZE,
          p_offset: offset, // Aggiungi offset
        };

        // Aggiungi solo i parametri definiti
        if (filters.name) params.p_name = filters.name;
        if (filters.fisCode) params.p_fis_code = filters.fisCode;
        if (filters.ageMin) params.p_age_min = parseInt(filters.ageMin);
        if (filters.ageMax) params.p_age_max = parseInt(filters.ageMax);
        if (filters.country) params.p_country = filters.country;
        if (filters.gender) params.p_gender = filters.gender;
        if (filters.disciplines.length > 0) {
          params.p_disciplines = filters.disciplines;
        }

        console.log("Chiamata search_athletes_with_filters con params:", params);

        const { data, error } = await supabase.rpc("search_athletes_with_filters", params);

        if (error) {
          console.error("Errore nel caricamento dati:", error);
          setError(`Errore: ${error.message}`);
          if (isNewFilter) setAthletes([]);
        } else if (data) {
          console.log("Dati ricevuti:", data.length, "atleti");
          
          if (data.length < ATLETI_PAGE_SIZE) {
            setHasMore(false);
          }
          setAthletes((prevAthletes) =>
            isNewFilter ? data : [...prevAthletes, ...data]
          );
        }
      }
    } catch (err) {
      console.error("Errore imprevisto:", err);
      setError("Errore imprevisto durante il caricamento.");
      if (isNewFilter) setAthletes([]);
    }

    setLoading(false);
    setLoadingMore(false);
  }, [filters]);

  useEffect(() => {
    setAthletes([]);
    setHasMore(true);
    setPageNum(0);
    fetchAthletes(0, true);
  }, [fetchAthletes]);

  useEffect(() => {
    if (athletes.length > 0 && (filters.name || filters.fisCode)) {
      const genders = athletes.map(a => a.gender).filter(g => g);
      const uniqueGenders = [...new Set(genders)];

      if (uniqueGenders.length === 1 && uniqueGenders[0]) {
        const detectedGender = uniqueGenders[0];

        if (autoDetectedGender !== detectedGender) {
          setAutoDetectedGender(detectedGender);
        }

        if (filters.gender !== detectedGender) {
          setFilters(prev => ({ ...prev, gender: detectedGender }));
        }
      } else {
        if (autoDetectedGender !== null) {
          setAutoDetectedGender(null);
        }
      }
    } else {
      if (autoDetectedGender !== null) {
        setAutoDetectedGender(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athletes, filters.name, filters.fisCode]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    if ((key === "name" || key === "fisCode") && !value) {
      setAutoDetectedGender(null);
    }
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleGenderChange = (newGender: string) => {
    if (autoDetectedGender && newGender && newGender !== autoDetectedGender) {
      const genderLabel = autoDetectedGender === "Male" ? "uomo" : "donna";
      setError(`L'atleta cercato è ${genderLabel}. Non puoi filtrare per un genere diverso.`);
      return;
    }

    setError(null);
    handleFilterChange("gender", newGender);
  };

  const toggleDiscipline = (discipline: string) => {
    setFilters(prev => ({
      ...prev,
      disciplines: prev.disciplines.includes(discipline)
        ? prev.disciplines.filter(d => d !== discipline)
        : [...prev.disciplines, discipline]
    }));
  };

  const resetFilters = () => {
    setFilters({
      name: "",
      fisCode: "",
      ageMin: "",
      ageMax: "",
      country: "",
      gender: "",
      disciplines: [],
    });
    setAutoDetectedGender(null);
    setError(null);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPageNum = pageNum + 1;
      const nextOffset = nextPageNum * ATLETI_PAGE_SIZE;
      setPageNum(nextPageNum);
      fetchAthletes(nextOffset, false);
    }
  };

  const getRankingContext = () => {
    const parts: string[] = [];

    if (filters.country) {
      parts.push(filters.country);
    }

    if (filters.gender === "Male") {
      parts.push("Uomini");
    } else if (filters.gender === "Female") {
      parts.push("Donne");
    }

    if (filters.disciplines.length > 0) {
      parts.push(filters.disciplines.map(d => d.toUpperCase()).join(" + "));
    }

    if (parts.length === 0) {
      return "Ranking Mondiale";
    }

    return `Ranking ${parts.join(" - ")}`;
  };

  return (
    <main className={styles.rankContainer}>
      <div className={filterStyles.filtersContainer}>
        <h2 className={filterStyles.filtersTitle}>Filtri Atleti</h2>

        <div className={filterStyles.textFilters}>
          <input
            type="text"
            placeholder="Nome atleta"
            value={filters.name}
            onChange={(e) => handleFilterChange("name", e.target.value)}
            className={filterStyles.filterInput}
          />
          <input
            type="text"
            placeholder="FIS Code"
            value={filters.fisCode}
            onChange={(e) => handleFilterChange("fisCode", e.target.value)}
            className={filterStyles.filterInput}
          />
          <select
            value={filters.country}
            onChange={(e) => handleFilterChange("country", e.target.value)}
            className={filterStyles.filterSelect}
          >
            <option value="">Tutte le nazionalità</option>
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        <div className={filterStyles.ageFilters}>
          <input
            type="number"
            placeholder="Età min"
            value={filters.ageMin}
            onChange={(e) => handleFilterChange("ageMin", e.target.value)}
            className={filterStyles.filterInputSmall}
          />
          <span className={filterStyles.ageSeparator}>-</span>
          <input
            type="number"
            placeholder="Età max"
            value={filters.ageMax}
            onChange={(e) => handleFilterChange("ageMax", e.target.value)}
            className={filterStyles.filterInputSmall}
          />
        </div>

        <div className={filterStyles.genderFilters}>
          <button
            className={`${filterStyles.genderButton} ${filters.gender === "Male" ? filterStyles.activeGender : ""} ${autoDetectedGender === "Male" ? filterStyles.autoDetected : ""}`}
            onClick={() => handleGenderChange(filters.gender === "Male" ? "" : "Male")}
            disabled={autoDetectedGender !== null && autoDetectedGender !== "Male"}
          >
            Uomini {autoDetectedGender === "Male" && "✓"}
          </button>
          <button
            className={`${filterStyles.genderButton} ${filters.gender === "Female" ? filterStyles.activeGender : ""} ${autoDetectedGender === "Female" ? filterStyles.autoDetected : ""}`}
            onClick={() => handleGenderChange(filters.gender === "Female" ? "" : "Female")}
            disabled={autoDetectedGender !== null && autoDetectedGender !== "Female"}
          >
            Donne {autoDetectedGender === "Female" && "✓"}
          </button>
        </div>

        <div className={filterStyles.disciplineFilters}>
          {["sl", "gs", "sg", "dh", "ac"].map((disc) => (
            <button
              key={disc}
              className={`${filterStyles.disciplineButton} ${filterStyles[`${disc}Button`]} ${
                filters.disciplines.includes(disc) ? filterStyles.activeDiscipline : ""
              }`}
              onClick={() => toggleDiscipline(disc)}
            >
              {disc.toUpperCase()}
            </button>
          ))}
        </div>

        <button className={filterStyles.resetButton} onClick={resetFilters}>
          Reset Filtri
        </button>
      </div>

      {loading && (
        <p className={styles.loading}>Caricamento...</p>
      )}
      {error && <p className={styles.error}>{error}</p>}

      {!error && athletes.length === 0 && !loading && (
        <p className={styles.loading}>Nessun atleta trovato con i filtri selezionati.</p>
      )}

      {!error && athletes.length > 0 && (
        <>
          {hasActiveFilters() && (
            <div className={filterStyles.rankingContext}>
              {getRankingContext()}
            </div>
          )}
          <div className={styles.athleteList}>
            {athletes.map((atleta) => (
              <div
                key={atleta.fis_code}
                className={`${styles.athleteCard} ${styles.clickableCard}`}
                onClick={() => goToAthleteDetail(atleta.fis_code)}
              >
                <div className={styles.athleteMainInfo}>
                  <div className={styles.nameBlock}>
                    <div className={styles.athleteName}>
                      <span className={styles.position}>
                        {atleta.ranking || "N/A"}.
                      </span>
                      {atleta.name}
                    </div>
                    <div className={styles.fisCode}>FIS: {atleta.fis_code}</div>
                  </div>
                  <div className={styles.infoBlock}>
                    <span className={styles.flagEmoji}>
                      {getFlagEmoji(atleta.country)}
                    </span>
                    <span className={styles.ageInfo}>
                      {typeof atleta.age === 'number' ? atleta.age : parseInt(atleta.age) || atleta.age} anni
                    </span>
                  </div>
                </div>
                <div className={styles.cardScores}>
                  <div className={`${styles.scoreItem} ${styles.slBox}`}>
                    <span className={styles.scoreLabel}>SL</span>
                    <span className={styles.scoreValue}>
                      {formatScore(atleta.sl)}
                    </span>
                  </div>
                  <div className={`${styles.scoreItem} ${styles.gsBox}`}>
                    <span className={styles.scoreLabel}>GS</span>
                    <span className={styles.scoreValue}>
                      {formatScore(atleta.gs)}
                    </span>
                  </div>
                  <div className={`${styles.scoreItem} ${styles.sgBox}`}>
                    <span className={styles.scoreLabel}>SG</span>
                    <span className={styles.scoreValue}>
                      {formatScore(atleta.sg)}
                    </span>
                  </div>
                  <div className={`${styles.scoreItem} ${styles.dhBox}`}>
                    <span className={styles.scoreLabel}>DH</span>
                    <span className={styles.scoreValue}>
                      {formatScore(atleta.dh)}
                    </span>
                  </div>
                  <div className={`${styles.scoreItem} ${styles.acBox}`}>
                    <span className={styles.scoreLabel}>AC</span>
                    <span className={styles.scoreValue}>
                      {formatScore(atleta.ac)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && hasMore && !error && athletes.length > 0 && (
        <div className={styles.loadMoreContainer}>
          <button
            className={styles.loadMoreButton}
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Caricamento..." : "Carica altri"}
          </button>
        </div>
      )}
    </main>
  );
}

export default Atleti;