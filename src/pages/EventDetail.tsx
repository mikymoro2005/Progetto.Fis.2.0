// src/pages/EventDetail.tsx
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import styles from "./EventDetail.module.css";

// Tipo per i dettagli dell'evento
type EventDetail = {
  codex: string;
  location: string;
  gender: string;
  discipline: string;
  category: string;
  date: string;
  fis_points_valid: string;
  olympic_points_valid: string;
  run1_time: string | null;
  run2_time: string | null;
  run3_time: string | null;
  run4_time: string | null;
  event_url: string | null;
};

// Tipo per i risultati
type EventResult = {
  fis_code: string;
  athlete_name: string;
  country: string;
  rank: string;
  bib: string;
  run1: string | null;
  run2: string | null;
  run3: string | null;
  run4: string | null;
  total_time: string | null;
  diff_time: string | null;
  fis_points: string | null;
  points_2027: string | null;
  cup_points: string | null;
  status: string | null;
  athlete_url: string | null;
};

// Props per il componente
interface EventDetailProps {
  codex: string;
  date: string;
  goBack: () => void;
  goToAthleteDetail: (fisCode: string) => void;
}

// Logica Bandiere
const countryToCode: Record<string, string> = {
  Afghanistan: "AF", Albania: "AL", Algeria: "DZ", Andorra: "AD", Argentina: "AR", Armenia: "AM",
  Australia: "AU", Austria: "AT", Azerbaijan: "AZ", Belarus: "BY", Belgium: "BE", Benin: "BJ",
  Bhutan: "BT", "Bosnia And Herzegovina": "BA", Brazil: "BR", Bulgaria: "BG", Canada: "CA",
  "Cape Verde": "CV", Chile: "CL", "Chinese Taipei": "TW", Colombia: "CO", Croatia: "HR",
  Cyprus: "CY", Czechia: "CZ", Denmark: "DK", "Dominican Republic": "DO", Ecuador: "EC",
  Eritrea: "ER", Estonia: "EE", Finland: "FI", France: "FR", Georgia: "GE", Germany: "DE",
  Ghana: "GH", "Great Britain": "GB", Greece: "GR", "Guinea-bissau": "GW", Haiti: "HT",
  "Hong Kong, China": "HK", Hungary: "HU", Iceland: "IS", India: "IN", Iran: "IR", Ireland: "IE",
  Israel: "IL", Italy: "IT", Jamaica: "JM", Japan: "JP", Jordan: "JO", Kazakhstan: "KZ",
  Kenya: "KE", Korea: "KR", Kosovo: "XK", Kuwait: "KW", Kyrgyzstan: "KG", Latvia: "LV",
  Lebanon: "LB", Liechtenstein: "LI", Lithuania: "LT", Luxembourg: "LU", Madagascar: "MG",
  Malaysia: "MY", Malta: "MT", Marocco: "MA", Mexico: "MX", Monaco: "MC", Mongolia: "MN",
  Montenegro: "ME", Nepal: "NP", Netherlands: "NL", "New Zealand": "NZ", "North Macedonia": "MK",
  Norway: "NO", "P.r. China": "CN", Pakistan: "PK", Peru: "PE", Philippines: "PH", Poland: "PL",
  Portugal: "PT", "Puerto Rico": "PR", "Republic Of San Marino": "SM", Romania: "RO", Russia: "RU",
  "Saudi Arabia": "SA", Serbia: "RS", Singapore: "SG", Slovakia: "SK", Slovenia: "SI",
  "South Africa": "ZA", Spain: "ES", Sweden: "SE", Switzerland: "CH", Tajikistan: "TJ",
  Thailand: "TH", "Timor-leste": "TL", Tonga: "TO", "Trinidad & Tobago": "TT", Türkiye: "TR",
  Ukraine: "UA", "United Arab Emirates": "AE", "United States Of America": "US", Uruguay: "UY",
  Uzbekistan: "UZ", Venezuela: "VE",
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

function EventDetail({ codex, date, goBack, goToAthleteDetail }: EventDetailProps) {
  const [eventDetails, setEventDetails] = useState<EventDetail | null>(null);
  const [results, setResults] = useState<EventResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Chiamata 1: Dettagli dell'evento
      const { data: eventData, error: eventError } = await supabase.rpc('get_event_details', {
        p_codex: codex,
        p_date: date,
      });

      if (eventError) throw eventError;
      if (eventData && eventData.length > 0) {
        setEventDetails(eventData[0]);
      } else {
        setError("Evento non trovato.");
      }

      // Chiamata 2: Risultati dell'evento
      const { data: resultsData, error: resultsError } = await supabase.rpc('get_event_results', {
        p_codex: codex,
        p_date: date,
      });

      if (resultsError) throw resultsError;
      setResults(resultsData || []);

    } catch (err) {
      console.error("Errore nel caricamento dati evento:", err);
      setError("Errore di caricamento. Verifica la console.");
    } finally {
      setLoading(false);
    }
  }, [codex, date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <main className={styles.mainContainer}>
        <button onClick={goBack} className={styles.backButton}>&larr; Torna indietro</button>
        <p className={styles.loading}>Caricamento dettagli gara...</p>
      </main>
    );
  }

  if (error || !eventDetails) {
    return (
      <main className={styles.mainContainer}>
        <button onClick={goBack} className={styles.backButton}>&larr; Torna indietro</button>
        <p className={styles.error}>{error || "Errore nel caricamento"}</p>
      </main>
    );
  }

  // Separa finiti e non finiti
  const finishedResults = results.filter(r => r.status === null || r.status === "Finished");
  const dnfResults = results.filter(r => r.status && r.status !== "Finished");

  // Trova il tempo del primo classificato per calcolare i tempi mancanti
  const firstPlaceResult = finishedResults.find(r => r.rank === "1");
  // Il tempo del primo può essere in total_time OPPURE in diff_time
  const firstPlaceTime = firstPlaceResult?.total_time || firstPlaceResult?.diff_time;

  // Funzione per calcolare il tempo se manca ma c'è il distacco
  const calculateTime = (totalTime: string | null, diffTime: string | null, rank: string): string => {
    if (totalTime) return totalTime;

    // Se non c'è total_time ma c'è diff_time
    if (!totalTime && diffTime) {
      // Se è il primo classificato, il tempo reale è in diff_time
      if (rank === "1") {
        return diffTime;
      }

      // Se NON è il primo, calcola tempo dal distacco
      if (diffTime.startsWith('+') && firstPlaceTime) {
        // Rimuove il "+" dal distacco e converte in numero
        const diffSeconds = parseFloat(diffTime.replace('+', ''));

        // Converte il tempo del primo (formato "1:23.45" o "23.45") in secondi
        const timeMatch = firstPlaceTime.match(/(?:(\d+):)?(\d+)\.(\d+)/);
        if (timeMatch) {
          const minutes = timeMatch[1] ? parseInt(timeMatch[1]) : 0;
          const seconds = parseInt(timeMatch[2]);
          const hundredths = parseInt(timeMatch[3]);
          const firstPlaceSeconds = minutes * 60 + seconds + hundredths / 100;

          // Somma il distacco
          const totalSeconds = firstPlaceSeconds + diffSeconds;

          // Riconverte in formato mm:ss.hh o ss.hh
          const mins = Math.floor(totalSeconds / 60);
          const secs = totalSeconds % 60;

          if (mins > 0) {
            return `${mins}:${secs.toFixed(2).padStart(5, '0')}`;
          } else {
            return secs.toFixed(2);
          }
        }
      }
    }

    return "-";
  };

  // Determina quali colonne Run mostrare (solo se hanno dati)
  const hasRun1 = finishedResults.some(r => r.run1 && r.run1 !== null);
  const hasRun2 = finishedResults.some(r => r.run2 && r.run2 !== null);
  const hasRun3 = finishedResults.some(r => r.run3 && r.run3 !== null);
  const hasRun4 = finishedResults.some(r => r.run4 && r.run4 !== null);

  // Calcola numero di colonne Run visibili
  const runColumnsCount = [hasRun1, hasRun2, hasRun3, hasRun4].filter(Boolean).length;

  // Crea grid-template-columns dinamico
  // Base: 60px 60px 2fr 1fr [runs...] 110px 90px 90px 80px
  const baseColumns = "60px 60px 2fr 1fr";
  const runColumns = Array(runColumnsCount).fill("90px").join(" ");
  const endColumns = "110px 90px 90px 80px";
  const gridTemplateColumns = `${baseColumns} ${runColumns} ${endColumns}`.trim();

  return (
    <main className={styles.mainContainer}>
      <button onClick={goBack} className={styles.backButton}>&larr; Torna indietro</button>

      {/* Header Gara */}
      <header className={styles.eventHeader}>
        <div className={styles.eventMainInfo}>
          <h1 className={styles.eventTitle}>
            {getFlagEmoji(eventDetails.location)} {eventDetails.location}
          </h1>
          <p className={styles.eventDate}>
            {new Date(eventDetails.date).toLocaleDateString('it-IT', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        <div className={styles.eventDetails}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Disciplina:</span>
            <span className={styles.detailValue}>{eventDetails.discipline}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Categoria:</span>
            <span className={styles.detailValue}>{eventDetails.category}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Genere:</span>
            <span className={styles.detailValue}>{eventDetails.gender === "Men's" ? "Uomini" : "Donne"}</span>
          </div>
        </div>
      </header>

      {/* ======================================================= */}
      {/* === MODIFICA: Classifica Finiti / Gara Cancellata === */}
      {/* ======================================================= */}
      <section className={styles.resultsSection}>
        
        {finishedResults.length === 0 ? (
          <>
            {/* Se non ci sono risultati, mostra "Gara Cancellata" */}
            <h2>Gara Cancellata</h2>
            <p className={styles.noResults}></p>
          </>
        ) : (
          <>
            {/* Altrimenti, mostra la classifica normale */}
            <h2>Classifica ({finishedResults.length} atleti)</h2>
            <div className={styles.resultsTable} style={{ ['--desktop-grid' as any]: gridTemplateColumns }}>
              {/* Header (Desktop) */}
              <div className={styles.resultHeader}>
                <div>Pos.</div>
                <div>Pett.</div>
                <div>Nome</div>
                <div>Paese</div>
                {hasRun1 && <div>Run 1</div>}
                {hasRun2 && <div>Run 2</div>}
                {hasRun3 && <div>Run 3</div>}
                {hasRun4 && <div>Run 4</div>}
                <div>Tempo</div>
                <div>Distacco</div>
                <div>Punti FIS</div>
                <div>Punti WC</div>
              </div>

              {finishedResults.map((result, index) => (
                <div
                  key={index}
                  className={styles.resultRow}
                  onClick={() => goToAthleteDetail(result.fis_code)}
                >
                  <div className={styles.resultRank}>{result.rank}</div>
                  <div className={styles.resultBib}>{result.bib}</div>
                  <div className={styles.resultName}>
                    {result.athlete_name}
                    <span className={styles.resultFisCode}>FIS: {result.fis_code}</span>
                  </div>
                  <div className={styles.resultCountry}>
                    {getFlagEmoji(result.country)} {result.country}
                  </div>
                  {hasRun1 && <div className={styles.resultRun1}>{result.run1 || "-"}</div>}
                  {hasRun2 && <div className={styles.resultRun2}>{result.run2 || "-"}</div>}
                  {hasRun3 && <div className={styles.resultRun3}>{result.run3 || "-"}</div>}
                  {hasRun4 && <div className={styles.resultRun4}>{result.run4 || "-"}</div>}
                  <div className={styles.resultTime}>{calculateTime(result.total_time, result.diff_time, result.rank)}</div>
                  <div className={styles.resultDiff}>{result.rank === "1" ? "0.00" : (result.diff_time || "-")}</div>
                  <div className={styles.resultFisPoints}>
                    {result.fis_points ? parseFloat(result.fis_points).toFixed(2) : "-"}
                  </div>
                  <div className={styles.resultCupPoints}>
                    {result.cup_points ? parseInt(result.cup_points) : "-"}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Non Arrivati / Squalificati */}
      {/* Questa sezione viene mostrata anche se la gara è cancellata, 
          perché potrebbero esserci DNF/DSQ anche se nessuno ha finito. */}
      {dnfResults.length > 0 && (
        <section className={styles.dnfSection}>
          <h2>Non Arrivati / Squalificati ({dnfResults.length})</h2>

          <div className={styles.dnfTable}>
            {dnfResults.map((result, index) => (
              <div
                key={index}
                className={styles.dnfRow}
                onClick={() => goToAthleteDetail(result.fis_code)}
              >
                <div className={styles.dnfBib}>{result.bib}</div>
                <div className={styles.dnfName}>
                  {result.athlete_name}
                  <span className={styles.dnfFisCode}>FIS: {result.fis_code}</span>
                </div>
                <div className={styles.dnfCountry}>
                  {getFlagEmoji(result.country)} {result.country}
                </div>
                <div className={styles.dnfStatus}>{result.status}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default EventDetail;