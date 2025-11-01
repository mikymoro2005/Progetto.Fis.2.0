// src/App.tsx
import { useState, useCallback } from "react";
import "./App.css";
import Header from "./components/Header";
import AuthModal from "./components/AuthModal";
import Footer from "./components/Footer";
// Importiamo tutte le pagine e il dettaglio
import Rank from "./pages/Rank";
import Atleti from "./pages/Atleti";
import AthleteDetail from "./pages/AthleteDetail";
import EventDetail from "./pages/EventDetail";

// 1. Definiamo tutti i tipi di pagina
export type Page = "rank" | "atleti" | "confronto" | "chi-siamo" | "athlete-detail" | "event-detail";

function App() {
  // Stati globali dell'App
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    // Legge l'hash URL all'avvio per mantenere la persistenza
    const hash = window.location.hash.slice(1);
    const validPages: Page[] = ["rank", "atleti", "confronto", "chi-siamo"];

    // Se l'hash corrisponde a una pagina principale, la usa
    if (validPages.includes(hash as Page)) {
      return hash as Page;
    }
    // Logica per gestire i codici FIS nell'URL (es: #54320)
    if (hash && hash.length > 3 && !validPages.includes(hash as Page)) {
        setAthleteDetailFisCode(hash);
        return 'athlete-detail';
    }

    return "rank";
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  // STATI per la pagina di dettaglio
  const [athleteDetailFisCode, setAthleteDetailFisCode] = useState<string | null>(null);
  const [eventDetailCodex, setEventDetailCodex] = useState<string | null>(null);
  const [eventDetailDate, setEventDetailDate] = useState<string | null>(null);

  // --- Funzioni di Routing ---

  // 2. Funzione per navigare al dettaglio atleta
  const goToAthleteDetail = useCallback((fisCode: string) => {
    setAthleteDetailFisCode(fisCode);
    setCurrentPage("athlete-detail");
    window.location.hash = `athlete-${fisCode}`;
  }, []);

  // 3. Funzione per navigare al dettaglio evento
  const goToEventDetail = useCallback((codex: string, date: string) => {
    setEventDetailCodex(codex);
    setEventDetailDate(date);
    setCurrentPage("event-detail");
    window.location.hash = `event-${codex}-${date}`;
  }, []);

  // 4. Funzione per tornare indietro
  const goBack = useCallback(() => {
    setCurrentPage("rank");
    setAthleteDetailFisCode(null);
    setEventDetailCodex(null);
    setEventDetailDate(null);
    window.location.hash = 'rank';
  }, []);

  // Funzioni Modal
  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  // --- Funzione per scegliere cosa mostrare ---
  const renderPageContent = () => {
    switch (currentPage) {
      case "rank":
        // Passiamo la funzione di navigazione al componente Rank
        return <Rank goToAthleteDetail={goToAthleteDetail} />;
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
    <>
      <Header
        openModal={openModal}
        currentPage={currentPage}
        setPage={setCurrentPage}
      />

      {isModalOpen && <AuthModal onClose={closeModal} isOpen={isModalOpen} />}

      {renderPageContent()}

      <Footer />
    </>
  );
}

export default App;