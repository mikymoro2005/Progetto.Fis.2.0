import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import styles from './Confronto.module.css';

// Tipi di dati
interface AthleteDetails {
  name: string;
  country: string;
  gender: string;
  age: number;
  team?: string;
}

interface RaceResult {
  rank: number | null;
  status: string | null;
  total_time: string | null;
  diff_time: string | null;
  bib: string | null;
}

interface CommonRace {
  event_codex: string;
  event_date: string;
  location: string;
  discipline: string;
  category: string;
  athlete1_result: RaceResult;
  athlete2_result: RaceResult;
}

interface ComparisonResult {
  athlete1_details: AthleteDetails;
  athlete2_details: AthleteDetails;
  races: CommonRace[];
}

interface Statistics {
  totalRaces: number;
  athlete1Wins: number;
  athlete2Wins: number;
  ties: number;
  athlete1DNF: number;
  athlete2DNF: number;
  athlete1AvgRank: number;
  athlete2AvgRank: number;
  athlete1BestRank: number;
  athlete2BestRank: number;
  athlete1WorstRank: number;
  athlete2WorstRank: number;
  athlete1TopThree: number;
  athlete2TopThree: number;
  athlete1TopTen: number;
  athlete2TopTen: number;
  disciplineStats: { [key: string]: { athlete1Wins: number; athlete2Wins: number; total: number } };
  closestFinish: { race: CommonRace | null; difference: number };
  biggestMargin: { race: CommonRace | null; difference: number };
  recentForm: { athlete1: number; athlete2: number };
}

function Confronto() {
  const [fisCode1, setFisCode1] = useState('');
  const [fisCode2, setFisCode2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [stats, setStats] = useState<Statistics | null>(null);

  // Calcola tutte le statistiche
  const calculateStatistics = (data: ComparisonResult): Statistics => {
    const races = data.races.filter(race => 
      race.athlete1_result && race.athlete2_result
    );

    let athlete1Wins = 0;
    let athlete2Wins = 0;
    let ties = 0;
    let athlete1DNF = 0;
    let athlete2DNF = 0;
    let athlete1RankSum = 0;
    let athlete1RankCount = 0;
    let athlete2RankSum = 0;
    let athlete2RankCount = 0;
    let athlete1BestRank = Infinity;
    let athlete2BestRank = Infinity;
    let athlete1WorstRank = 0;
    let athlete2WorstRank = 0;
    let athlete1TopThree = 0;
    let athlete2TopThree = 0;
    let athlete1TopTen = 0;
    let athlete2TopTen = 0;
    const disciplineStats: { [key: string]: { athlete1Wins: number; athlete2Wins: number; total: number } } = {};
    let closestFinish = { race: null as CommonRace | null, difference: Infinity };
    let biggestMargin = { race: null as CommonRace | null, difference: 0 };

    races.forEach(race => {
      const r1 = race.athlete1_result;
      const r2 = race.athlete2_result;

      // Inizializza statistiche per disciplina
      if (!disciplineStats[race.discipline]) {
        disciplineStats[race.discipline] = { athlete1Wins: 0, athlete2Wins: 0, total: 0 };
      }
      disciplineStats[race.discipline].total++;

      // Controlla DNF/DSQ
      const status1 = r1.status?.toUpperCase();
      const status2 = r2.status?.toUpperCase();
      const isDNF1 = status1 && ['DNF', 'DSQ', 'DNS'].includes(status1);
      const isDNF2 = status2 && ['DNF', 'DSQ', 'DNS'].includes(status2);

      if (isDNF1) athlete1DNF++;
      if (isDNF2) athlete2DNF++;

      // Confronta solo se entrambi hanno finito
      if (r1.rank !== null && r2.rank !== null && !isDNF1 && !isDNF2) {
        // Calcola vincitore
        if (r1.rank < r2.rank) {
          athlete1Wins++;
          disciplineStats[race.discipline].athlete1Wins++;
        } else if (r2.rank < r1.rank) {
          athlete2Wins++;
          disciplineStats[race.discipline].athlete2Wins++;
        } else {
          ties++;
        }

        // Calcola margine di vittoria
        const margin = Math.abs(r1.rank - r2.rank);
        if (margin < closestFinish.difference) {
          closestFinish = { race, difference: margin };
        }
        if (margin > biggestMargin.difference) {
          biggestMargin = { race, difference: margin };
        }

        // Statistiche rank athlete1
        athlete1RankSum += r1.rank;
        athlete1RankCount++;
        if (r1.rank < athlete1BestRank) athlete1BestRank = r1.rank;
        if (r1.rank > athlete1WorstRank) athlete1WorstRank = r1.rank;
        if (r1.rank <= 3) athlete1TopThree++;
        if (r1.rank <= 10) athlete1TopTen++;

        // Statistiche rank athlete2
        athlete2RankSum += r2.rank;
        athlete2RankCount++;
        if (r2.rank < athlete2BestRank) athlete2BestRank = r2.rank;
        if (r2.rank > athlete2WorstRank) athlete2WorstRank = r2.rank;
        if (r2.rank <= 3) athlete2TopThree++;
        if (r2.rank <= 10) athlete2TopTen++;
      }
    });

    // Forma recente (ultimi 5 confronti diretti)
    const recentRaces = races.slice(-5);
    let recentAthlete1 = 0;
    let recentAthlete2 = 0;
    recentRaces.forEach(race => {
      const r1 = race.athlete1_result;
      const r2 = race.athlete2_result;
      if (r1.rank !== null && r2.rank !== null) {
        if (r1.rank < r2.rank) recentAthlete1++;
        else if (r2.rank < r1.rank) recentAthlete2++;
      }
    });

    return {
      totalRaces: races.length,
      athlete1Wins,
      athlete2Wins,
      ties,
      athlete1DNF,
      athlete2DNF,
      athlete1AvgRank: athlete1RankCount > 0 ? athlete1RankSum / athlete1RankCount : 0,
      athlete2AvgRank: athlete2RankCount > 0 ? athlete2RankSum / athlete2RankCount : 0,
      athlete1BestRank: athlete1BestRank === Infinity ? 0 : athlete1BestRank,
      athlete2BestRank: athlete2BestRank === Infinity ? 0 : athlete2BestRank,
      athlete1WorstRank,
      athlete2WorstRank,
      athlete1TopThree,
      athlete2TopThree,
      athlete1TopTen,
      athlete2TopTen,
      disciplineStats,
      closestFinish,
      biggestMargin,
      recentForm: { athlete1: recentAthlete1, athlete2: recentAthlete2 }
    };
  };

  const handleCompare = useCallback(async () => {
    if (!fisCode1 || !fisCode2) {
      setError('Per favore, inserisci due FIS code validi.');
      return;
    }
    if (fisCode1 === fisCode2) {
      setError('Inserisci due FIS code diversi.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setStats(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('compare_athletes_detailed', {
        fis_code_1: fisCode1,
        fis_code_2: fisCode2,
      });

      if (rpcError) throw rpcError;

      if (!data || !data.athlete1_details || !data.athlete2_details) {
        setError('Uno o entrambi gli atleti non sono stati trovati. Controlla i FIS code.');
        setLoading(false);
        return;
      }
      
      setResult(data);
      const statistics = calculateStatistics(data);
      setStats(statistics);

    } catch (err: any) {
      console.error("Errore durante il confronto:", err);
      setError(`Si è verificato un errore: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [fisCode1, fisCode2]);

  const getShortName = (fullName: string) => {
    return fullName.split(' ').pop() || fullName;
  };

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Confronto Atleti</h1>
      
      <div className={styles.formContainer}>
        <p className={styles.description}>
          Inserisci i FIS code di due atleti per un'analisi completa del loro confronto diretto
        </p>
        <div className={styles.inputs}>
          <input 
            type="text"
            placeholder="FIS Code Atleta 1"
            value={fisCode1}
            onChange={(e) => setFisCode1(e.target.value)}
            className={styles.input}
          />
          <span className={styles.vs}>VS</span>
          <input 
            type="text"
            placeholder="FIS Code Atleta 2"
            value={fisCode2}
            onChange={(e) => setFisCode2(e.target.value)}
            className={styles.input}
          />
        </div>
        <button onClick={handleCompare} disabled={loading} className={styles.button}>
          {loading ? 'Analisi in corso...' : 'Confronta'}
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {result && stats && (
        <div className={styles.resultsContainer}>
          
          {/* Header con nomi atleti */}
          <div className={styles.summaryHeader}>
            <div className={styles.athleteHeader}>
              <h2>{result.athlete1_details.name}</h2>
              <p>{result.athlete1_details.country}</p>
              {result.athlete1_details.team && <p className={styles.team}>{result.athlete1_details.team}</p>}
            </div>
            <div className={styles.vsLarge}>VS</div>
            <div className={styles.athleteHeader}>
              <h2>{result.athlete2_details.name}</h2>
              <p>{result.athlete2_details.country}</p>
              {result.athlete2_details.team && <p className={styles.team}>{result.athlete2_details.team}</p>}
            </div>
          </div>

          {/* Statistiche principali */}
          <div className={styles.summaryStats}>
            <h3>📊 Confronto Testa a Testa</h3>
            <div className={styles.statsGrid}>
              <div>
                <div className={styles.statValue}>{stats.totalRaces}</div>
                <div className={styles.statLabel}>Gare Totali</div>
              </div>
              <div>
                <div className={`${styles.statValue} ${styles.win}`}>{stats.athlete1Wins}</div>
                <div className={styles.statLabel}>Vittorie {getShortName(result.athlete1_details.name)}</div>
              </div>
              <div>
                <div className={`${styles.statValue} ${styles.win}`}>{stats.athlete2Wins}</div>
                <div className={styles.statLabel}>Vittorie {getShortName(result.athlete2_details.name)}</div>
              </div>
              <div>
                <div className={styles.statValue}>{stats.ties}</div>
                <div className={styles.statLabel}>Pareggi</div>
              </div>
            </div>
          </div>

          {/* Statistiche avanzate */}
          <div className={styles.advancedStats}>
            <h3>📈 Statistiche Dettagliate</h3>
            
            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <h4>Posizione Media</h4>
                <div className={styles.comparison}>
                  <div className={styles.compItem}>
                    <span className={styles.name}>{getShortName(result.athlete1_details.name)}</span>
                    <span className={styles.value}>{stats.athlete1AvgRank.toFixed(1)}°</span>
                  </div>
                  <div className={styles.compItem}>
                    <span className={styles.name}>{getShortName(result.athlete2_details.name)}</span>
                    <span className={styles.value}>{stats.athlete2AvgRank.toFixed(1)}°</span>
                  </div>
                </div>
              </div>

              <div className={styles.statCard}>
                <h4>Miglior Piazzamento</h4>
                <div className={styles.comparison}>
                  <div className={styles.compItem}>
                    <span className={styles.name}>{getShortName(result.athlete1_details.name)}</span>
                    <span className={`${styles.value} ${styles.highlight}`}>{stats.athlete1BestRank}°</span>
                  </div>
                  <div className={styles.compItem}>
                    <span className={styles.name}>{getShortName(result.athlete2_details.name)}</span>
                    <span className={`${styles.value} ${styles.highlight}`}>{stats.athlete2BestRank}°</span>
                  </div>
                </div>
              </div>

              <div className={styles.statCard}>
                <h4>Podi (Top 3)</h4>
                <div className={styles.comparison}>
                  <div className={styles.compItem}>
                    <span className={styles.name}>{getShortName(result.athlete1_details.name)}</span>
                    <span className={styles.value}>{stats.athlete1TopThree}</span>
                  </div>
                  <div className={styles.compItem}>
                    <span className={styles.name}>{getShortName(result.athlete2_details.name)}</span>
                    <span className={styles.value}>{stats.athlete2TopThree}</span>
                  </div>
                </div>
              </div>

              <div className={styles.statCard}>
                <h4>Top 10</h4>
                <div className={styles.comparison}>
                  <div className={styles.compItem}>
                    <span className={styles.name}>{getShortName(result.athlete1_details.name)}</span>
                    <span className={styles.value}>{stats.athlete1TopTen}</span>
                  </div>
                  <div className={styles.compItem}>
                    <span className={styles.name}>{getShortName(result.athlete2_details.name)}</span>
                    <span className={styles.value}>{stats.athlete2TopTen}</span>
                  </div>
                </div>
              </div>

              <div className={styles.statCard}>
                <h4>DNF/DSQ</h4>
                <div className={styles.comparison}>
                  <div className={styles.compItem}>
                    <span className={styles.name}>{getShortName(result.athlete1_details.name)}</span>
                    <span className={`${styles.value} ${styles.errorStat}`}>{stats.athlete1DNF}</span>
                  </div>
                  <div className={styles.compItem}>
                    <span className={styles.name}>{getShortName(result.athlete2_details.name)}</span>
                    <span className={`${styles.value} ${styles.errorStat}`}>{stats.athlete2DNF}</span>
                  </div>
                </div>
              </div>

              <div className={styles.statCard}>
                <h4>Forma Recente (Ult. 5)</h4>
                <div className={styles.comparison}>
                  <div className={styles.compItem}>
                    <span className={styles.name}>{getShortName(result.athlete1_details.name)}</span>
                    <span className={`${styles.value} ${styles.win}`}>{stats.recentForm.athlete1}</span>
                  </div>
                  <div className={styles.compItem}>
                    <span className={styles.name}>{getShortName(result.athlete2_details.name)}</span>
                    <span className={`${styles.value} ${styles.win}`}>{stats.recentForm.athlete2}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiche per disciplina */}
          {Object.keys(stats.disciplineStats).length > 0 && (
            <div className={styles.disciplineStats}>
              <h3>🎿 Performance per Disciplina</h3>
              <div className={styles.disciplineGrid}>
                {Object.entries(stats.disciplineStats).map(([discipline, data]) => (
                  <div key={discipline} className={styles.disciplineCard}>
                    <h4>{discipline}</h4>
                    <div className={styles.disciplineData}>
                      <div className={styles.discItem}>
                        <span>{getShortName(result.athlete1_details.name)}</span>
                        <span className={styles.discValue}>{data.athlete1Wins}/{data.total}</span>
                      </div>
                      <div className={styles.discItem}>
                        <span>{getShortName(result.athlete2_details.name)}</span>
                        <span className={styles.discValue}>{data.athlete2Wins}/{data.total}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Momenti memorabili */}
          {(stats.closestFinish.race || stats.biggestMargin.race) && (
            <div className={styles.memorableRaces}>
              <h3>🏆 Momenti Memorabili</h3>
              <div className={styles.memorable}>
                {stats.closestFinish.race && (
                  <div className={styles.memCard}>
                    <h4>🔥 Arrivo più Combattuto</h4>
                    <p className={styles.raceName}>{stats.closestFinish.race.location} - {stats.closestFinish.race.discipline}</p>
                    <p className={styles.raceDate}>{new Date(stats.closestFinish.race.event_date).toLocaleDateString()}</p>
                    <p className={styles.difference}>Differenza: {stats.closestFinish.difference} posizioni</p>
                  </div>
                )}
                {stats.biggestMargin.race && (
                  <div className={styles.memCard}>
                    <h4>💪 Vittoria più Dominante</h4>
                    <p className={styles.raceName}>{stats.biggestMargin.race.location} - {stats.biggestMargin.race.discipline}</p>
                    <p className={styles.raceDate}>{new Date(stats.biggestMargin.race.event_date).toLocaleDateString()}</p>
                    <p className={styles.difference}>Margine: {stats.biggestMargin.difference} posizioni</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dettaglio gare */}
          <div className={styles.racesDetail}>
            <h3>📋 Storico Gare ({result.races.length})</h3>
            {result.races && result.races.length > 0 ? (
              <div className={styles.raceList}>
                {result.races.map((race, index) => {
                  const r1 = race.athlete1_result;
                  const r2 = race.athlete2_result;
                  const winner1 = r1.rank !== null && r2.rank !== null && r1.rank < r2.rank;
                  const winner2 = r2.rank !== null && r1.rank !== null && r2.rank < r1.rank;
                  
                  return (
                    <div key={`${race.event_codex}-${index}`} className={styles.raceItem}>
                      <div className={styles.raceInfo}>
                        <span className={styles.raceDate}>{new Date(race.event_date).toLocaleDateString()}</span>
                        <span className={styles.raceLocation}>{race.location}</span>
                        <span className={styles.raceDiscipline}>{race.discipline}</span>
                        {race.category && <span className={styles.raceCategory}>{race.category}</span>}
                      </div>
                      <div className={styles.raceResults}>
                        <div className={winner1 ? styles.resultWinner : styles.result}>
                          <span className={styles.athleteName}>{getShortName(result.athlete1_details.name)}: </span>
                          <span className={styles.resultValue}>
                            {r1.rank || r1.status || 'N/A'}
                          </span>
                        </div>
                        <div className={winner2 ? styles.resultWinner : styles.result}>
                          <span className={styles.athleteName}>{getShortName(result.athlete2_details.name)}: </span>
                          <span className={styles.resultValue}>
                            {r2.rank || r2.status || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={styles.noData}>Nessuna gara in comune trovata.</p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default Confronto;