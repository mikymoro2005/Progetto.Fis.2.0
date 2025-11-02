// src/pages/Preferiti.tsx

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import styles from "../Rank.module.css";
import filterStyles from "./Atleti.module.css";

// Definizione del tipo Athlete
type Athlete = {
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

// Props per il componente
interface PreferitiProps {
  goToAthleteDetail: (fisCode: string) => void;
}

// Logica Bandiere
const countryToCode: Record<string, string> = {
  Austria: "AT", France: "FR", Switzerland: "CH", Canada: "CA",
  Argentina: "AR", "United States Of America": "US", Czechia: "CZ",
  Germany: "DE", Italy: "IT", Norway: "NO", Slovenia: "SI",
  Slovakia: "SK",
};

function getFlagEmoji(countryName: string): string {
  const code = countryToCode[countryName] || "";
  if (!code) return "🏳️";
  const codePoints = code
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Funzione per formattare i punteggi
function formatScore(score: number | string | null | undefined): string {
  if (!score || score === "9999" || score === "null" || score === 9999) {
    return "N/A";
  }
  const numScore = typeof score === "number" ? score : parseFloat(score as string);
  if (isNaN(numScore) || numScore >= 9999) {
    return "N/A";
  }
  return numScore.toFixed(2);
}

function Preferiti({ goToAthleteDetail }: PreferitiProps) {
  const [favorites, setFavorites] = useState<Athlete[]>([]);
  const [searchResults, setSearchResults] = useState<Athlete[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const fetchFavorites = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: favData, error: favError } = await supabase
        .from("favorite_athletes")
        .select("fis_code")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (favError) throw favError;
      if (!favData || favData.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }
      const fisCodes = favData.map(f => f.fis_code);
      const { data: athletesData, error: athletesError } = await supabase
        .from("athletes")
        .select("*")
        .in("fis_code", fisCodes);
      if (athletesError) throw athletesError;
      const orderedAthletes = fisCodes
        .map(code => athletesData?.find(a => a.fis_code === code))
        .filter((a): a is Athlete => a !== undefined);
      setFavorites(orderedAthletes);
    } catch (err: any) {
      console.error("Errore nel caricamento dei preferiti:", err);
      setError(`Errore nel caricamento. Controlla le policy RLS. Messaggio: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        setError("Errore durante l'autenticazione.");
        setLoading(false);
        return;
      }
      setUser(user);
      if (user) {
        await fetchFavorites(user.id);
      } else {
        setLoading(false);
        setError("Devi effettuare il login per gestire i tuoi preferiti.");
      }
    };
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchFavorites(session.user.id);
      } else {
        setFavorites([]);
        setError("Devi effettuare il login per gestire i tuoi preferiti.");
      }
    });
    return () => subscription.unsubscribe();
  }, [fetchFavorites]);

  const searchAthletes = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("athletes")
        .select("*")
        .or(`name.ilike.%${searchQuery}%,fis_code.ilike.%${searchQuery}%`)
        .limit(20);
      if (error) throw error;
      setSearchResults(data || []);
    } catch (err: any) {
      console.error("Errore nella ricerca:", err);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchAthletes();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const addToFavorites = async (fisCode: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("favorite_athletes")
        .insert({ fis_code: fisCode, user_id: user.id });
      if (error) throw error;
      await fetchFavorites(user.id);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err: any) {
      console.error("Errore nell'aggiunta del preferito:", err);
      if (err.code === '23505') {
        alert("Questo atleta è già nei tuoi preferiti!");
      }
    }
  };
  
  if (!user && !loading) {
    return (
      <main className={styles.rankContainer}>
        <h1 className={styles.title}>I Miei Preferiti</h1>
        <p className={styles.error}>{error || "Devi effettuare il login per gestire i tuoi preferiti."}</p>
      </main>
    );
  }

  return (
    <main className={styles.rankContainer}>
      <h1 className={styles.title}>I Miei Preferiti</h1>
      <div className={filterStyles.filtersContainer}>
        <h2 className={filterStyles.filtersTitle}>Aggiungi Atleta</h2>
        <div className={filterStyles.textFilters}>
          <input
            type="text"
            placeholder="Cerca per nome o FIS Code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={filterStyles.filterInput}
            style={{ width: '100%' }}
          />
        </div>
        {searching && <p style={{ textAlign: 'center', color: 'var(--text-hover)' }}>Ricerca...</p>}
        {searchResults.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <p style={{ color: 'var(--text-hover)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              Clicca su un atleta per aggiungerlo ai preferiti:
            </p>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {searchResults.map((atleta) => (
                <div
                  key={atleta.fis_code}
                  onClick={() => addToFavorites(atleta.fis_code)}
                  style={{
                    padding: '0.75rem', marginBottom: '0.5rem', backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-color)';
                    e.currentTarget.style.backgroundColor = 'var(--toggle-bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--page-text)' }}>{atleta.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-hover)' }}>
                        FIS: {atleta.fis_code} • {getFlagEmoji(atleta.country)} {atleta.country}
                      </div>
                    </div>
                    <div style={{ fontSize: '1.2rem' }}>+</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {loading && <p className={styles.loading}>Caricamento...</p>}
      {error && <p className={styles.error}>{error}</p>}
      {!loading && !error && favorites.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-hover)' }}>
          <p>Non hai ancora aggiunto atleti ai preferiti.</p>
          <p style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
            Usa la barra di ricerca qui sopra per cercare e aggiungere atleti!
          </p>
        </div>
      )}
      {!error && favorites.length > 0 && (
        <>
          <h2 style={{ marginTop: '2rem', marginBottom: '1rem', color: 'var(--page-text)' }}>
            I Tuoi Preferiti ({favorites.length})
          </h2>
          <div className={styles.athleteList}>
            {favorites.map((atleta) => (
              <div
                key={atleta.fis_code}
                className={`${styles.athleteCard} ${styles.clickableCard}`} 
                onClick={() => goToAthleteDetail(atleta.fis_code)}
                style={{ position: 'relative', cursor: 'pointer' }}
              >
                <div className={styles.athleteMainInfo}>
                  <div className={styles.nameBlock}>
                    <div className={styles.athleteName}>
                      <span className={styles.position}>{atleta.ranking || "N/A"}.</span>
                      {atleta.name}
                    </div>
                    <div className={styles.fisCode}>FIS: {atleta.fis_code}</div>
                  </div>
                  <div className={styles.infoBlock}>
                    <span className={styles.flagEmoji}>{getFlagEmoji(atleta.country)}</span>
                    <span className={styles.ageInfo}>
                      {typeof atleta.age === 'number' ? atleta.age : parseInt(atleta.age as string) || atleta.age} anni
                    </span>
                  </div>
                </div>
                <div className={styles.cardScores}>
                  <div className={`${styles.scoreItem} ${styles.slBox}`}>
                    <span className={styles.scoreLabel}>SL</span>
                    <span className={styles.scoreValue}>{formatScore(atleta.sl)}</span>
                  </div>
                  <div className={`${styles.scoreItem} ${styles.gsBox}`}>
                    <span className={styles.scoreLabel}>GS</span>
                    <span className={styles.scoreValue}>{formatScore(atleta.gs)}</span>
                  </div>
                  <div className={`${styles.scoreItem} ${styles.sgBox}`}>
                    <span className={styles.scoreLabel}>SG</span>
                    <span className={styles.scoreValue}>{formatScore(atleta.sg)}</span>
                  </div>
                  <div className={`${styles.scoreItem} ${styles.dhBox}`}>
                    <span className={styles.scoreLabel}>DH</span>
                    <span className={styles.scoreValue}>{formatScore(atleta.dh)}</span>
                  </div>
                  <div className={`${styles.scoreItem} ${styles.acBox}`}>
                    <span className={styles.scoreLabel}>AC</span>
                    <span className={styles.scoreValue}>{formatScore(atleta.ac)}</span>
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

export default Preferiti;