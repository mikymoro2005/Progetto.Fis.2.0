// src/pages/AthleteDetail.tsx
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import styles from "./AthleteDetail.module.css"; 

// --- 1. Tipi per i Dati (Invariati) ---

type AthleteDetail = {
  fis_code: string;
  name: string;
  team: string | null;
  country: string;
  birthdate: string;
  age: number;
  status: string | null;
  gender: string;
  marital_status: string | null;
  children: number | null;
  occupation: string | null;
  nickname: string | null;
  residence: string | null;
  languages: string | null;
  hobbies: string | null;
  skis: string | null;
  boots: string | null;
  poles: string | null;
  dh: number;
  sl: number;
  gs: number;
  sg: number;
  ac: number;
};

// Tipo per i Risultati delle Gare
type RaceResult = {
  codex: string;
  location: string;
  gender: string;
  discipline: string;
  category: string;
  event_date: string;
  fis_points_valid: boolean;
  olympic_points_valid: boolean;
  event_url: string;
  rank: string;
  bib: string;
  total_time: string;
  diff_time: string;
  fis_points: number;
  points_2027: number;
  cup_points: number;
  status: string;
};

// --- Logica Bandiere (Copiata da App.tsx) ---
const countryToCode: Record<string, string> = {
  Afghanistan: "AF",
  Albania: "AL",
  Algeria: "DZ",
  Andorra: "AD",
  Argentina: "AR",
  Armenia: "AM",
  Australia: "AU",
  Austria: "AT",
  Azerbaijan: "AZ",
  Belarus: "BY",
  Belgium: "BE",
  Benin: "BJ",
  Bhutan: "BT",
  "Bosnia And Herzegovina": "BA",
  Brazil: "BR",
  Bulgaria: "BG",
  Canada: "CA",
  "Cape Verde": "CV",
  Chile: "CL",
  "Chinese Taipei": "TW",
  Colombia: "CO",
  Croatia: "HR",
  Cyprus: "CY",
  Czechia: "CZ",
  Denmark: "DK",
  "Dominican Republic": "DO",
  Ecuador: "EC",
  Eritrea: "ER",
  Estonia: "EE",
  Finland: "FI",
  "Fis Refugee Team": "🏳️",
  France: "FR",
  Georgia: "GE",
  Germany: "DE",
  Ghana: "GH",
  "Great Britain": "GB",
  Greece: "GR",
  "Guinea-bissau": "GW",
  Haiti: "HT",
  "Hong Kong, China": "HK",
  Hungary: "HU",
  Iceland: "IS",
  India: "IN",
  Iran: "IR",
  Ireland: "IE",
  Israel: "IL",
  Italy: "IT",
  Jamaica: "JM",
  Japan: "JP",
  Jordan: "JO",
  Kazakhstan: "KZ",
  Kenya: "KE",
  Korea: "KR",
  Kosovo: "XK",
  Kuwait: "KW",
  Kyrgyzstan: "KG",
  Latvia: "LV",
  Lebanon: "LB",
  Liechtenstein: "LI",
  Lithuania: "LT",
  Luxembourg: "LU",
  Madagascar: "MG",
  Malaysia: "MY",
  Malta: "MT",
  Marocco: "MA",
  Mexico: "MX",
  Monaco: "MC",
  Mongolia: "MN",
  Montenegro: "ME",
  Nepal: "NP",
  Netherlands: "NL",
  "New Zealand": "NZ",
  "North Macedonia": "MK",
  Norway: "NO",
  "P.r. China": "CN",
  Pakistan: "PK",
  Peru: "PE",
  Philippines: "PH",
  Poland: "PL",
  Portugal: "PT",
  "Puerto Rico": "PR",
  "Republic Of San Marino": "SM",
  Romania: "RO",
  Russia: "RU",
  "Saudi Arabia": "SA",
  Serbia: "RS",
  Singapore: "SG",
  Slovakia: "SK",
  Slovenia: "SI",
  "South Africa": "ZA",
  Spain: "ES",
  Sweden: "SE",
  Switzerland: "CH",
  Tajikistan: "TJ",
  Thailand: "TH",
  "Timor-leste": "TL",
  Tonga: "TO",
  "Trinidad & Tobago": "TT",
  Türkiye: "TR",
  Ukraine: "UA",
  "United States Of America": "US",
};
function getFlagEmoji(countryName: string): string {
  const code = countryToCode[countryName] || "";
  if (!code) {
    return "🏳️";
  }
  // Gestione speciale per Fis Refugee Team
  if (code === "🏳️") {
    return "🏳️";
  }
  const codePoints = code
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
// --- Fine Logica Bandiere ---

// --- 2. Props per il Componente ---
interface AthleteDetailProps {
    fisCode: string;
    goBack: () => void;
    goToEventDetail: (codex: string, date: string) => void;
}


// --- 3. Componente Principale ---
function AthleteDetail({ fisCode, goBack, goToEventDetail }: AthleteDetailProps) {
  const [details, setDetails] = useState<AthleteDetail | null>(null);
  const [results, setResults] = useState<RaceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
        // Chiamata 1: Dettagli dell'Atleta
        const { data: detailsData, error: detailsError } = await supabase.rpc('get_athlete_details', {
            fis_code_filter: fisCode,
        });

        if (detailsError) throw detailsError;
        if (detailsData && detailsData.length > 0) {
            setDetails(detailsData[0]);
        } else {
            setError("Atleta non trovato.");
        }

        // Chiamata 2: Ultimi 10 Risultati
        const { data: resultsData, error: resultsError } = await supabase.rpc('get_last_ten_results', {
            fis_code_filter: fisCode,
        });
        
        if (resultsError) throw resultsError;
        setResults(resultsData || []);

    } catch (err) {
        console.error("Errore nel caricamento dei dati dell'atleta:", err);
        setError("Errore di caricamento dati. Verifica la console e le funzioni Supabase.");
    } finally {
        setLoading(false);
    }
  }, [fisCode]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || error || !details) {
      return (
        <main className={styles.mainContainer}>
            <button onClick={goBack} className={styles.backButton}>&larr; Torna alla lista</button>
            <p className={styles.loading}>Caricamento dettagli atleta...</p>
        </main>
    );
  }


  // Funzione helper per controllare se il valore è da mostrare
  const isDisplayable = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    if (typeof value === 'number' && value === 9999) return false;
    return true;
  }
  
  // Funzione helper per rendere i punti FIS (CENTRATI)
  const renderFisPoints = () => (
    <div className={styles.fisPointsContainer}>
      <div className={`${styles.pointItem} ${styles.slBox}`}><span>SL:</span> <span>{details.sl === 9999 ? 'N/A' : details.sl.toFixed(2)}</span></div>
      <div className={`${styles.pointItem} ${styles.gsBox}`}><span>GS:</span> <span>{details.gs === 9999 ? 'N/A' : details.gs.toFixed(2)}</span></div>
      <div className={`${styles.pointItem} ${styles.sgBox}`}><span>SG:</span> <span>{details.sg === 9999 ? 'N/A' : details.sg.toFixed(2)}</span></div>
      <div className={`${styles.pointItem} ${styles.dhBox}`}><span>DH:</span> <span>{details.dh === 9999 ? 'N/A' : details.dh.toFixed(2)}</span></div>
      <div className={`${styles.pointItem} ${styles.acBox}`}><span>AC:</span> <span>{details.ac === 9999 ? 'N/A' : details.ac.toFixed(2)}</span></div>
    </div>
  );

  return (
    <main className={styles.mainContainer}>
        <button onClick={goBack} className={styles.backButton}>&larr; Torna alla lista</button>

        {/* --- 4. HEADER DELL'ATLETA --- */}
        <header className={styles.athleteHeader}>
            <div className={styles.mainInfoRow}>
                <div className={styles.flagContainer}>
                    <span className={styles.flagEmoji}>{getFlagEmoji(details.country)}</span>
                    <span className={styles.countryName}>{details.country}</span>
                </div>
                {isDisplayable(details.status) && <span className={styles.athleteStatus}>{details.status}</span>}
            </div>
            
            <h1 className={styles.athleteName}>{details.name}</h1>
            <div className={styles.subInfoRow}>
                <p className={styles.fisCode}>FIS Code: {details.fis_code} | Età: {details.age}</p>
                {isDisplayable(details.team) && <p className={styles.teamName}>Team: {details.team}</p>}
            </div>
        </header>

        {/* --- 5. PUNTI FIS (CENTRATI) --- */}
        <div className={styles.fisPointsBlock}>
            <h2>Punti FIS</h2>
            {renderFisPoints()}
        </div>

        {/* --- 6. RISULTATI RECENTI (STILE RIGA) --- */}
        <div className={styles.resultsSection}>
            <h2>Ultimi 10 Risultati</h2>
            
            {results.length === 0 ? (
                <p>Nessun risultato recente trovato.</p>
            ) : (
                <div className={styles.resultsTable}>
                    {/* Header della tabella (solo desktop) */}
                    <div className={styles.resultHeader}>
                        <div>Data</div>
                        <div>Località</div>
                        <div></div>
                        <div>Categoria</div>
                        <div>Disciplina</div>
                        <div>Pos.</div>
                        <div>Punti FIS</div>
                        <div>Punti WC</div>
                    </div>
                    
                    {results.map((result, index) => (
                        <div
                            key={index}
                            className={`${styles.resultRow} ${styles.clickableRow}`}
                            onClick={() => goToEventDetail(result.codex, result.event_date)}
                        >
                            <div className={styles.resultDate}>
                                {new Date(result.event_date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </div>
                            <div className={styles.resultLocation} data-flag={getFlagEmoji(result.location)}>
                                {getFlagEmoji(result.location)} {result.location}
                            </div>
                            <div className={styles.resultCountry}>
                                {getFlagEmoji(result.location)}
                            </div>
                            <div className={styles.resultCategoryDiscipline}>
                                <span className={styles.resultCategory}>{result.category}</span>
                                <span className={styles.resultDiscipline}>{result.discipline}</span>
                            </div>
                            
                            {/* Se status è diverso da "Finished", mostra solo lo status */}
                            {result.status && result.status !== 'Finished' ? (
                                <div className={styles.resultStatusOnly}>
                                    <span className={styles.statusBadge}>{result.status}</span>
                                </div>
                            ) : (
                                <div className={styles.resultStats}>
                                    <div className={styles.resultRank}>
                                        {result.rank}
                                    </div>
                                    <div className={styles.resultFisPoints}>
                                        {isDisplayable(result.fis_points) ? result.fis_points.toFixed(2) : '-'}
                                    </div>
                                    <div className={styles.resultCupPoints}>
                                        {isDisplayable(result.cup_points) ? result.cup_points.toFixed(0) : '-'}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>

    </main>
  );
}

export default AthleteDetail;