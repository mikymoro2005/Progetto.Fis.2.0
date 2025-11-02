// src/pages/Rank.tsx
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import styles from "../Rank.module.css";
// Importiamo il tipo Athlete dal nostro componente
import { type Athlete } from './Atleti'; 

const RANK_PAGE_SIZE = 50;

type Gender = "Male" | "Female";

// --- Props aggiunte ---
interface RankProps {
    goToAthleteDetail: (fisCode: string) => void;
}
// --- Fine Props ---

// --- Logica Bandiere (invariata) ---
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

// Modificato per accettare RankProps
function Rank({ goToAthleteDetail }: RankProps) {
  // --- Stati per QUESTA pagina (Rank) ---
  const [genderFilter, setGenderFilter] = useState<Gender>("Male");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageNum, setPageNum] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // --- Funzioni di Fetch per QUESTA pagina (Rank) ---
  const fetchRankAthletes = useCallback(async (offset: number, isNewFilter: boolean) => {
    if (isNewFilter) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    const { data, error } = await supabase.rpc("get_ranked_athletes", {
      gender_filter: genderFilter,
      limit_count: RANK_PAGE_SIZE,
      offset_count: offset,
    });

    if (error) {
      console.error("Errore nel caricamento dati:", error);
      setError("Impossibile caricare i dati. Controlla la console.");
      if (isNewFilter) setAthletes([]);
    } else if (data) {
      if (data.length < RANK_PAGE_SIZE) {
        setHasMore(false);
      }
      setAthletes((prevAthletes) =>
        isNewFilter ? data : [...prevAthletes, ...data]
      );
    }
    setLoading(false);
    setLoadingMore(false);
  }, [genderFilter]); // Dipende solo dal filtro

  // useEffect per il caricamento (cambio filtro)
  useEffect(() => {
    setAthletes([]);
    setHasMore(true);
    setPageNum(0);
    fetchRankAthletes(0, true);
  }, [genderFilter, fetchRankAthletes]);

  // handleLoadMore per il bottone
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPageNum = pageNum + 1;
      const nextOffset = nextPageNum * RANK_PAGE_SIZE;
      setPageNum(nextPageNum);
      fetchRankAthletes(nextOffset, false);
    }
  };


  return (
    <main className={styles.rankContainer}>
      <h1 className={styles.title}>Classifica Atleti</h1>
      <div className={styles.filterButtons}>
        <button
          className={`${styles.filterButton} ${
            genderFilter === "Male" ? styles.activeButton : ""
          }`}
          onClick={() => setGenderFilter("Male")}
        >
          Uomini
        </button>
        <button
          className={`${styles.filterButton} ${
            genderFilter === "Female" ? styles.activeButton : ""
          }`}
          onClick={() => setGenderFilter("Female")}
        >
          Donne
        </button>
      </div>

      {loading && athletes.length === 0 && (
        <p className={styles.loading}>Caricamento...</p>
      )}
      {error && <p className={styles.error}>{error}</p>}

      {!error && (
        <div className={styles.athleteList}>
          {athletes.map((atleta, index) => (
            <div
                key={atleta.fis_code}
                className={`${styles.athleteCard} ${styles.clickableCard}`}
                onClick={() => goToAthleteDetail(atleta.fis_code)}
            >
              <div className={styles.athleteMainInfo}>
                <div className={styles.nameBlock}>
                  <div className={styles.athleteName}>
                    <span className={styles.position}>{index + 1}.</span>
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
                    {atleta.ac === 9999 ? "N/A" : (atleta.ac as number).toFixed(2)}
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

export default Rank;