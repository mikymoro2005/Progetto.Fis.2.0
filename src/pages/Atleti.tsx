// src/pages/Atleti.tsx
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import styles from "../Rank.module.css";
import filterStyles from "./Atleti.module.css";

const ATLETI_PAGE_SIZE = 25;

// === MODIFICA QUI: Aggiunto 'export' al tipo Athlete ===
export type Athlete = {
  fis_code: string;
  name: string;
  country: string;
  age: number | string;  // INTEGER o VARCHAR
  dh: number | string;   // FLOAT o VARCHAR
  sl: number | string;   // FLOAT o VARCHAR
  gs: number | string;   // FLOAT o VARCHAR
  sg: number | string;   // FLOAT o VARCHAR
  ac: number | string;   // FLOAT o VARCHAR
  gender?: string;
  total_points?: number;
  ranking?: number;
};

// --- Props aggiunte ---
interface AtletiProps {
    goToAthleteDetail: (fisCode: string) => void;
}
// --- Fine Props ---

// Tipo per i filtri
type Filters = {
  name: string;
  fisCode: string;
  ageMin: string;
  ageMax: string;
  country: string;
  gender: string;
  disciplines: string[];
};

// --- Logica Bandiere (Copiata) ---
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
// --- Fine Logica Bandiere ---

// Lista completa dei paesi
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

// --- Funzione Helper per formattare i punteggi ---
function formatScore(score: number | string | null | undefined): string {
  if (!score || score === "9999" || score === "null" || score === 9999) {
    return "N/A";
  }
  const numScore = typeof score === "number" ? score : parseFloat(score);
  if (isNaN(numScore) || numScore >= 9999) {
    return "N/A";
  }
  return numScore.toFixed(2);
}
// --- Fine Funzione Helper ---

// Modificato per accettare AtletiProps
function Atleti({ goToAthleteDetail }: AtletiProps) {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoDetectedGender, setAutoDetectedGender] = useState<string | null>(null);

  // Stati per i filtri
  const [filters, setFilters] = useState<Filters>({
    name: "",
    fisCode: "",
    ageMin: "",
    ageMax: "",
    country: "",
    gender: "",
    disciplines: [],
  });

  // Verifica se ci sono filtri attivi
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

  // Funzione di fetch con i filtri
  const fetchAthletes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Se non ci sono filtri attivi, usa get_athletes_alphabetical
      if (!hasActiveFilters()) {
        const { data, error } = await supabase.rpc("get_athletes_alphabetical", {
          limit_count: ATLETI_PAGE_SIZE,
          offset_count: 0,
        });

        if (error) {
          console.error("Errore nel caricamento dati:", error);
          setError("Impossibile caricare i dati. Controlla la console.");
          setAthletes([]);
        } else if (data) {
          setAthletes(data);
        }
      } else {
        // Altrimenti usa search_athletes_with_filters
        const params: any = {
          p_limit: ATLETI_PAGE_SIZE,
        };

        if (filters.name) params.p_name = filters.name;
        if (filters.fisCode) params.p_fis_code = filters.fisCode;
        if (filters.ageMin) params.p_age_min = parseInt(filters.ageMin);
        if (filters.ageMax) params.p_age_max = parseInt(filters.ageMax);
        if (filters.country) params.p_country = filters.country;
        if (filters.gender) params.p_gender = filters.gender;
        if (filters.disciplines.length > 0) params.p_disciplines = filters.disciplines;

        const { data, error } = await supabase.rpc("search_athletes_with_filters", params);

        if (error) {
          console.error("Errore nel caricamento dati:", error);
          setError("Impossibile caricare i dati. Controlla la console.");
          setAthletes([]);
        } else if (data) {
          setAthletes(data);
        }
      }
    } catch (err) {
      console.error("Errore imprevisto:", err);
      setError("Errore imprevisto durante il caricamento.");
      setAthletes([]);
    }

    setLoading(false);
  }, [filters]);

  // useEffect per il caricamento con filtri
  useEffect(() => {
    fetchAthletes();
  }, [fetchAthletes]);

  // useEffect per rilevare automaticamente il genere quando si cerca per nome
  useEffect(() => {
    if (athletes.length > 0 && (filters.name || filters.fisCode)) {
      // Verifica se tutti gli atleti hanno lo stesso genere
      const genders = athletes.map(a => a.gender).filter(g => g);
      const uniqueGenders = [...new Set(genders)];

      if (uniqueGenders.length === 1 && uniqueGenders[0]) {
        const detectedGender = uniqueGenders[0];

        // Imposta il genere auto-rilevato se non è già impostato
        if (autoDetectedGender !== detectedGender) {
          setAutoDetectedGender(detectedGender);
        }

        // Se il filtro genere non è già impostato a questo valore, impostalo
        if (filters.gender !== detectedGender) {
          setFilters(prev => ({ ...prev, gender: detectedGender }));
        }
      } else {
        if (autoDetectedGender !== null) {
          setAutoDetectedGender(null);
        }
      }
    } else {
      // Se non c'è ricerca per nome/fis, resetta il genere auto-rilevato
      if (autoDetectedGender !== null) {
        setAutoDetectedGender(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athletes, filters.name, filters.fisCode]);

  // Handler per i filtri
  const handleFilterChange = (key: keyof Filters, value: string) => {
    // Se si cancella il nome o fis_code, resetta il genere auto-rilevato
    if ((key === "name" || key === "fisCode") && !value) {
      setAutoDetectedGender(null);
    }
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handler speciale per il cambio di genere
  const handleGenderChange = (newGender: string) => {
    // Se c'è un genere auto-rilevato e l'utente prova a cambiare a un genere diverso
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

  // Funzione per generare la descrizione del ranking
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
      {/* Sezione Filtri */}
      <div className={filterStyles.filtersContainer}>
        <h2 className={filterStyles.filtersTitle}>Filtri Atleti</h2>

        {/* Filtri Testo */}
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

        {/* Filtri Età */}
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

        {/* Filtri Genere */}
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

        {/* Filtri Specialità */}
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

        {/* Bottone Reset */}
        <button className={filterStyles.resetButton} onClick={resetFilters}>
          Reset Filtri
        </button>
      </div>

      {/* Lista Atleti */}
      {loading && (
        <p className={styles.loading}>Caricamento...</p>
      )}
      {error && <p className={styles.error}>{error}</p>}

      {!error && athletes.length === 0 && !loading && (
        <p className={styles.loading}>Nessun atleta trovato con i filtri selezionati.</p>
      )}

      {!error && athletes.length > 0 && (
        <>
          {/* Indicatore Contesto Ranking */}
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
    </main>
  );
}

export default Atleti;