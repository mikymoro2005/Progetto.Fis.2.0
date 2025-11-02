// src/App.tsx
import { useState, useCallback, useEffect } from "react";
import "./App.css";
import Header from "./components/Header";
import AuthModal from "./components/AuthModal";
import Footer from "./components/Footer";
import { FavoritesProvider } from "./context/FavoritesContext";
// Importiamo tutte le pagine e il dettaglio
import Rank from "./pages/Rank";
import Atleti from "./pages/Atleti";
import Preferiti from "./pages/Preferiti";
import AthleteDetail from "./pages/AthleteDetail";
import EventDetail from "./pages/EventDetail";

// 1. Definiamo tutti i tipi di pagina
export type Page = "rank" | "atleti" | "preferiti" | "confronto" | "chi-siamo" | "athlete-detail" | "event-detail";

function App() {
  // Parsing iniziale dell'hash per determinare la pagina e i parametri
  const parseInitialHash = () => {
    const hash = window.location.hash.slice(1);
    const validPages: Page[] = ["rank", "atleti", "preferiti", "confronto", "chi-siamo"];

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
  const [isModalOpen, setIsModalOpen] = useState(false);

  // STATI per la pagina di dettaglio
  const [athleteDetailFisCode, setAthleteDetailFisCode] = useState<string | null>(initialState.athleteFisCode);
  const [eventDetailCodex, setEventDetailCodex] = useState<string | null>(initialState.eventCodex);
  const [eventDetailDate, setEventDetailDate] = useState<string | null>(initialState.eventDate);

  // STATO per la pagina precedente (history)
  const [previousPage, setPreviousPage] = useState<{
    page: Page;
    athleteFisCode: string | null;
    eventCodex: string | null;
    eventDate: string | null;
  } | null>(null);

  // --- Funzioni di Routing ---

  // 2. Funzione per navigare al dettaglio atleta
  const goToAthleteDetail = useCallback((fisCode: string) => {
    // Salva lo stato corrente prima di navigare
    setPreviousPage({
      page: currentPage,
      athleteFisCode: athleteDetailFisCode,
      eventCodex: eventDetailCodex,
      eventDate: eventDetailDate,
    });

    setAthleteDetailFisCode(fisCode);
    setCurrentPage("athlete-detail");
    window.location.hash = `athlete-${fisCode}`;
  }, [currentPage, athleteDetailFisCode, eventDetailCodex, eventDetailDate]);

  // 3. Funzione per navigare al dettaglio evento
  const goToEventDetail = useCallback((codex: string, date: string) => {
    // Salva lo stato corrente prima di navigare
    setPreviousPage({
      page: currentPage,
      athleteFisCode: athleteDetailFisCode,
      eventCodex: eventDetailCodex,
      eventDate: eventDetailDate,
    });

    setEventDetailCodex(codex);
    setEventDetailDate(date);
    setCurrentPage("event-detail");
    window.location.hash = `event-${codex}-${date}`;
  }, [currentPage, athleteDetailFisCode, eventDetailCodex, eventDetailDate]);

  // 4. Funzione per tornare indietro
  const goBack = useCallback(() => {
    if (previousPage) {
      // Torna alla pagina precedente salvata
      setCurrentPage(previousPage.page);
      setAthleteDetailFisCode(previousPage.athleteFisCode);
      setEventDetailCodex(previousPage.eventCodex);
      setEventDetailDate(previousPage.eventDate);

      // Aggiorna l'hash
      if (previousPage.page === "athlete-detail" && previousPage.athleteFisCode) {
        window.location.hash = `athlete-${previousPage.athleteFisCode}`;
      } else if (previousPage.page === "event-detail" && previousPage.eventCodex && previousPage.eventDate) {
        window.location.hash = `event-${previousPage.eventCodex}-${previousPage.eventDate}`;
      } else {
        window.location.hash = previousPage.page;
      }

      // Resetta previousPage
      setPreviousPage(null);
    } else {
      // Fallback: torna a rank
      setCurrentPage("rank");
      setAthleteDetailFisCode(null);
      setEventDetailCodex(null);
      setEventDetailDate(null);
      window.location.hash = 'rank';
    }
  }, [previousPage]);

  // Funzioni Modal
  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  // Listener per gestire la navigazione del browser (swipe iOS, pulsanti browser)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const validPages: Page[] = ["rank", "atleti", "preferiti", "confronto", "chi-siamo"];

      // Se l'hash corrisponde a una pagina principale
      if (validPages.includes(hash as Page)) {
        setCurrentPage(hash as Page);
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
      setCurrentPage("rank");
      setAthleteDetailFisCode(null);
      setEventDetailCodex(null);
      setEventDetailDate(null);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // --- Funzione per scegliere cosa mostrare ---
  const renderPageContent = () => {
    switch (currentPage) {
      case "rank":
        // Passiamo la funzione di navigazione al componente Rank
        return <Rank goToAthleteDetail={goToAthleteDetail} />;
      case "atleti":
        // Passiamo la funzione di navigazione al componente Atleti
        return <Atleti goToAthleteDetail={goToAthleteDetail} />;
      case "preferiti":
        // Pagina Preferiti
        return <Preferiti goToAthleteDetail={goToAthleteDetail} />;
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
        return (
          <main style={{ padding: '2rem', textAlign: 'center', minHeight: '60vh' }}>
            <h1 style={{color: 'var(--page-text)'}}>Confronto</h1>
            <p>Pagina in costruzione...</p>
          </main>
        );
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
    <FavoritesProvider>
      <Header
        openModal={openModal}
        currentPage={currentPage}
        setPage={setCurrentPage}
      />

      {isModalOpen && <AuthModal onClose={closeModal} isOpen={isModalOpen} />}

      {renderPageContent()}

      <Footer />
    </FavoritesProvider>
  );
}

export default App;