// src/pages/Atleti.tsx
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import styles from "../Rank.module.css"; 

const ATLETI_PAGE_SIZE = 25;

// === MODIFICA QUI: Aggiunto 'export' al tipo Athlete ===
export type Athlete = {
  fis_code: string;
  name: string;
  country: string;
  age: number;
  dh: number;
  sl: number;
  gs: number;
  sg: number;
  ac: number;
  gender?: string;
  total_points?: number;
  ranking?: number;
};

// --- Props aggiunte ---
interface AtletiProps {
    goToAthleteDetail: (fisCode: string) => void;
}
// --- Fine Props ---

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

// Modificato per accettare AtletiProps
function Atleti({ goToAthleteDetail }: AtletiProps) { 
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pageNum, setPageNum] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Funzione di fetch (invariata)
  const fetchAthletes = useCallback(async (offset: number, isNewFilter: boolean) => {
    if (isNewFilter) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    // Chiamiamo la NUOVA funzione Supabase
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

    setLoading(false);
    setLoadingMore(false);
  }, []); // Dipendenza vuota, non abbiamo filtri qui

  // useEffect per il caricamento iniziale (invariato)
  useEffect(() => {
    setAthletes([]);
    setHasMore(true);
    setPageNum(0);
    fetchAthletes(0, true);
  }, [fetchAthletes]);

  // handleLoadMore per il bottone (invariato)
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPageNum = pageNum + 1;
      const nextOffset = nextPageNum * ATLETI_PAGE_SIZE;
      
      setPageNum(nextPageNum);
      fetchAthletes(nextOffset, false);
    }
  };

  // Il JSX è quasi identico a quello che avevamo in App.tsx
  return (
    <main className={styles.rankContainer}>
      <h1 className={styles.title}>Tutti gli Atleti</h1>

      {/* Non ci sono filtri qui */}

      {loading && athletes.length === 0 && (
        <p className={styles.loading}>Caricamento...</p>
      )}
      {error && <p className={styles.error}>{error}</p>}

      {!error && (
        <div className={styles.athleteList}>
          {athletes.map((atleta) => (
            // Aggiungiamo onClick e il puntatore per renderlo cliccabile
            <div 
                key={atleta.fis_code} 
                className={`${styles.athleteCard} ${styles.clickableCard}`}
                onClick={() => goToAthleteDetail(atleta.fis_code)}
            >
              <div className={styles.athleteMainInfo}>
                <div className={styles.nameBlock}>
                  <div className={styles.athleteName}>
                    {/* Mostriamo il ranking VERO dalla query */}
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
                  <span className={styles.ageInfo}>{atleta.age} anni</span>
                </div>
              </div>
              <div className={styles.cardScores}>
                <div className={`${styles.scoreItem} ${styles.slBox}`}>
                  <span className={styles.scoreLabel}>SL</span>
                  <span className={styles.scoreValue}>
                    {atleta.sl === 9999 ? "N/A" : atleta.sl.toFixed(2)}
                  </span>
                </div>
                <div className={`${styles.scoreItem} ${styles.gsBox}`}>
                  <span className={styles.scoreLabel}>GS</span>
                  <span className={styles.scoreValue}>
                    {atleta.gs === 9999 ? "N/A" : atleta.gs.toFixed(2)}
                  </span>
                </div>
                <div className={`${styles.scoreItem} ${styles.sgBox}`}>
                  <span className={styles.scoreLabel}>SG</span>
                  <span className={styles.scoreValue}>
                    {atleta.sg === 9999 ? "N/A" : atleta.sg.toFixed(2)}
                  </span>
                </div>
                <div className={`${styles.scoreItem} ${styles.dhBox}`}>
                  <span className={styles.scoreLabel}>DH</span>
                  <span className={styles.scoreValue}>
                    {atleta.dh === 9999 ? "N/A" : atleta.dh.toFixed(2)}
                  </span>
                </div>
                <div className={`${styles.scoreItem} ${styles.acBox}`}>
                  <span className={styles.scoreLabel}>AC</span>
                  <span className={styles.scoreValue}>
                    {atleta.ac === 9999 ? "N/A" : atleta.ac.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && hasMore && !error && (
        <div className={styles.loadMoreContainer}>
          <button
            className={styles.loadMoreButton}
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Caricamento..." : "Show More"}
          </button>
        </div>
      )}
    </main>
  );
}

export default Atleti;