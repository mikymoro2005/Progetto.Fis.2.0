// src/App.tsx
import { useState, useCallback, useEffect } from "react";
import "./App.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
// Importiamo tutte le pagine e il dettaglio
import Rank from "./pages/Rank";
import Gare from "./pages/Gare";
import type { Filters, ViewMode } from "./pages/Gare"; // <-- CORRETTO
import Atleti from "./pages/Atleti";
import AthleteDetail from "./pages/AthleteDetail";
import EventDetail from "./pages/EventDetail";
import Confronto from "./pages/Confronto";

// 1. Definiamo tutti i tipi di pagina
export type Page = "rank" | "gare" | "atleti" | "confronto" | "chi-siamo" | "athlete-detail" | "event-detail";

function App() {
  // Parsing iniziale dell'hash per determinare la pagina e i parametri
  const parseInitialHash = () => {
    const hash = window.location.hash.slice(1);
    const validPages: Page[] = ["rank", "gare", "atleti", "confronto", "chi-siamo"];

    // Se l'hash corrisponde a una pagina principale
    if (validPages.includes(hash as Page)) {
      return { page: hash as Page, athleteFisCode: null, eventCodex: null, eventDate: null };
    }

    // Gestione dettaglio atleta (es: #athlete-54320)
    if (hash.startsWith("athlete-")) {
      const fisCode = hash.replace("athlete-", "");
      return { page: "athlete-detail" as Page, athleteFisCode: fisCode, eventCodex: null, eventDate: null };
    }

    // Gestione dettaglio evento (es: #event-0001-2025-10-26)
    if (hash.startsWith("event-")) {
      const parts = hash.replace("event-", "").split("-");
      if (parts.length >= 4) {
        const codex = parts[0];
        const date = parts.slice(1).join("-"); // Ricompone la data
        return { page: "event-detail" as Page, athleteFisCode: null, eventCodex: codex, eventDate: date };
      }
    }

    // Default
    return { page: "rank" as Page, athleteFisCode: null, eventCodex: null, eventDate: null };
  };

  const initialState = parseInitialHash();

  // Stati globali dell'App
  const [currentPage, setCurrentPage] = useState<Page>(initialState.page);

  // STATI per la pagina di dettaglio
  const [athleteDetailFisCode, setAthleteDetailFisCode] = useState<string | null>(initialState.athleteFisCode);
  const [eventDetailCodex, setEventDetailCodex] = useState<string | null>(initialState.eventCodex);
  const [eventDetailDate, setEventDetailDate] = useState<string | null>(initialState.eventDate);
  const [previousPage, setPreviousPage] = useState<Page | null>(null); // Semplificato


  // =======================================================
  // === MODIFICA: STATO SPOSTATO DA GARE.TSX ===
  // =======================================================
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [filters, setFilters] = useState<Filters>({
    gender: "",
    disciplines: [],
    country: "",
  });
  // =======================================================


  // --- Funzioni di Routing ---

  // 2. Funzione per navigare al dettaglio atleta
  const goToAthleteDetail = useCallback((fisCode: string) => {
    setPreviousPage(currentPage); // Salva la pagina corrente (es. "gare")
    setAthleteDetailFisCode(fisCode);
    setCurrentPage("athlete-detail");
    window.location.hash = `athlete-${fisCode}`;
    window.scrollTo(0, 0); // <-- MODIFICA: Risolto problema scroll
  }, [currentPage]); // Rimosse dipendenze inutili

  // 3. Funzione per navigare al dettaglio evento
  const goToEventDetail = useCallback((codex: string, date: string) => {
    setPreviousPage(currentPage); // Salva la pagina corrente (es. "gare")
    setEventDetailCodex(codex);
    setEventDetailDate(date);
    setCurrentPage("event-detail");
    window.location.hash = `event-${codex}-${date}`;
    window.scrollTo(0, 0); // <-- MODIFICA: Risolto problema scroll
  }, [currentPage]); // Rimosse dipendenze inutili

  // 4. Funzione per tornare indietro
  const goBack = useCallback(() => {
    // Se ero su un dettaglio, torna alla pagina precedente salvata (es. 'gare')
    if (previousPage) {
      setCurrentPage(previousPage);
      window.location.hash = previousPage; // Aggiorna l'hash
      setPreviousPage(null); // Pulisci la cronologia
      // NON resettare lo stato di Gare (selectedDate, etc.)
    } else {
      // Fallback: torna a rank
      setCurrentPage("rank");
      window.location.hash = 'rank';
    }
    // Resetta solo lo stato dei dettagli
    setAthleteDetailFisCode(null);
    setEventDetailCodex(null);
    setEventDetailDate(null);
  }, [previousPage]);

  // Listener per gestire la navigazione del browser (swipe iOS, pulsanti browser)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const validPages: Page[] = ["rank", "gare", "atleti", "confronto", "chi-siamo"];

      // Se l'hash corrisponde a una pagina principale
      if (validPages.includes(hash as Page)) {
        setCurrentPage(hash as Page);
        // MODIFICA: Non resettare lo stato di Gare, solo quello dei dettagli
        setAthleteDetailFisCode(null);
        setEventDetailCodex(null);
        setEventDetailDate(null);
        return;
      }

      // Gestione dettaglio atleta (es: #athlete-54320)
      if (hash.startsWith("athlete-")) {
        const fisCode = hash.replace("athlete-", "");
        setAthleteDetailFisCode(fisCode);
        setCurrentPage("athlete-detail");
        return;
      }

      // Gestione dettaglio evento (es: #event-0001-2025-10-26)
      if (hash.startsWith("event-")) {
        const parts = hash.replace("event-", "").split("-");
        if (parts.length >= 4) {
          const codex = parts[0];
          const date = parts.slice(1).join("-");
          setEventDetailCodex(codex);
          setEventDetailDate(date);
          setCurrentPage("event-detail");
          return;
        }
      }

      // Default
      if (!hash) { // Se l'hash è vuoto
        setCurrentPage("rank");
        setAthleteDetailFisCode(null);
        setEventDetailCodex(null);
        setEventDetailDate(null);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []); // Dipendenza vuota corretta

  // --- Funzione per scegliere cosa mostrare ---
  const renderPageContent = () => {
    switch (currentPage) {
      case "rank":
        // Passiamo la funzione di navigazione al componente Rank
        return <Rank goToAthleteDetail={goToAthleteDetail} />;
        
      case "gare":
        // =======================================================
        // === MODIFICA: Passa lo stato e i setter a Gare ===
        // =======================================================
        return (
          <Gare 
            onEventClick={goToEventDetail}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            viewMode={viewMode}
            setViewMode={setViewMode}
            filters={filters}
            setFilters={setFilters}
          />
        );
        
      case "atleti":
        // Passiamo la funzione di navigazione al componente Atleti
        return <Atleti goToAthleteDetail={goToAthleteDetail} />;
      case "athlete-detail":
        // Mostra la pagina di dettaglio solo se abbiamo il codice FIS
        if (athleteDetailFisCode) {
            return (
              <AthleteDetail
                fisCode={athleteDetailFisCode}
                goBack={goBack}
                goToEventDetail={goToEventDetail}
              />
            );
        }
        // Fallback se perdi il codice FIS
        return <main style={{ padding: '2rem', textAlign: 'center', minHeight: '60vh' }}>
                    <h1 style={{color: 'var(--page-text)'}}>Errore</h1>
                    <p>Codice FIS non trovato. <a onClick={goBack} style={{cursor: 'pointer'}}>Torna indietro</a></p>
                </main>;
      case "event-detail":
        // Mostra la pagina di dettaglio evento
        if (eventDetailCodex && eventDetailDate) {
            return (
              <EventDetail
                codex={eventDetailCodex}
                date={eventDetailDate}
                goBack={goBack}
                goToAthleteDetail={goToAthleteDetail}
              />
            );
        }
        // Fallback se perdi i dati
        return <main style={{ padding: '2rem', textAlign: 'center', minHeight: '60vh' }}>
                    <h1 style={{color: 'var(--page-text)'}}>Errore</h1>
                    <p>Dati evento non trovati. <a onClick={goBack} style={{cursor: 'pointer'}}>Torna indietro</a></p>
                </main>;
      case "confronto":
        return <Confronto />;
      case "chi-siamo":
        return (
          <main style={{ padding: '2rem', textAlign: 'center', minHeight: '60vh' }}>
            <h1 style={{color: 'var(--page-text)'}}>Chi Siamo</h1>
            <p>Pagina in costruzione...</p>
          </main>
        );
      default:
        return <Rank goToAthleteDetail={goToAthleteDetail} />;
    }
  };

  return (
    <>
      <Header
        currentPage={currentPage}
        setPage={setCurrentPage}
      />

      {renderPageContent()}

      <Footer />
    </>
  );
}

export default App;