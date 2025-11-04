// src/pages/Gare.tsx
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import styles from "./Gare.module.css";

// --- TIPI ---
type Event = {
  codex: string;
  location: string;
  gender: string;
  discipline: string;
  category: string;
  date: string; // Mantiene 'string' (YYYY-MM-DD)
  fis_points_valid: string;
  olympic_points_valid: string;
  run1_time: string | null;
  run2_time: string | null;
  run3_time: string | null;
  run4_time: string | null;
  event_url: string | null;
  cancelled: boolean | null;
};

type ParsedLocation = {
  place: string;
  country: string;
};

// =======================================================
// === MODIFICA: ESPORTA I TIPI PER APP.TSX ===
// =======================================================
export type Filters = {
  gender: string;
  disciplines: string[];
  country: string;
};

export type ViewMode = "daily" | "weekly" | "monthly";
// =======================================================


// --- COSTANTI ---
const countryToCode: Record<string, string> = {
  AUT: "AT", FRA: "FR", SUI: "CH", CAN: "CA", ARG: "AR", USA: "US",
  CZE: "CZ", GER: "DE", ITA: "IT", NOR: "NO", SLO: "SI", SVK: "SK",
  SWE: "SE", FIN: "FI", POL: "PL", ESP: "ES", GBR: "GB", JPN: "JP",
  KOR: "KR", CHN: "CN", RUS: "RU", BUL: "BG", CRO: "HR", SRB: "RS",
  AND: "AD", NZL: "NZ", AUS: "AU", CHI: "CL", BRA: "BR", LIE: "LI",
};

const DISCIPLINE_MAP: Record<string, string> = {
  SL: "Slalom",
  GS: "Giant Slalom",
  SG: "Super G",
  DH: "Downhill",
  DHTR: "Downhill Training",
  AC: "Alpine Combined",
};

const DISCIPLINES = ["SL", "GS", "SG", "DH", "DHTR", "AC"];
const COUNTRIES = Object.keys(countryToCode).sort();

// =======================================================
// --- FUNZIONI HELPER PER LE DATE ---
// =======================================================
// ... (tutte le tue funzioni helper restano invariate) ...
const formatDateForQuery = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatSimpleDate = (date: Date): string => {
  return date.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatDateItalian = (dateString: string): string => {
  const date = new Date(dateString + "T00:00:00");
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  return date.toLocaleDateString("it-IT", options);
};

const getWeekRange = (date: Date): { start: Date; end: Date } => {
  const d = new Date(date);
  const dayOfWeek = d.getDay(); // 0 (Dom) - 6 (Sab)
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const start = new Date(d.setDate(d.getDate() + diffToMonday));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
};

const getMonthRange = (date: Date): { start: Date; end: Date } => {
  const d = new Date(date);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { start, end };
};


// --- FUNZIONI HELPER ---
function getFlagEmoji(countryCode: string): string {
  const code = countryToCode[countryCode] || "";
  if (!code) return "🏳️";
  const codePoints = code.toUpperCase().split("").map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function parseLocation(location: string): ParsedLocation {
  const match = location.match(/^(.+?)\s*\(([A-Z]{3})\)$/);
  if (match) {
    return { place: match[1].trim(), country: match[2].trim() };
  }
  return { place: location, country: "" };
}

// =======================================================
// === MODIFICA: Aggiorna le props ===
// =======================================================
interface GareProps {
  onEventClick: (codex: string, date: string) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  filters: Filters;
  setFilters: (filters: Filters | ((prev: Filters) => Filters)) => void;
}
// =======================================================


type GroupedEvents = Record<string, Event[]>;

// =======================================================
// === MODIFICA: Accetta le nuove props ===
// =======================================================
function Gare({ 
  onEventClick, 
  selectedDate, 
  setSelectedDate, 
  viewMode, 
  setViewMode, 
  filters, 
  setFilters 
}: GareProps) {
  
  // --- STATI LOCALI (solo per UI di questa pagina) ---
  const [events, setEvents] = useState<Event[]>([]);
  const [groupedEvents, setGroupedEvents] = useState<GroupedEvents>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // --- STATI RIMOSSI ---
  // const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  // const [viewMode, setViewMode] = useState<ViewMode>("daily");
  // const [filters, setFilters] = useState<Filters>({...});


  // --- FETCH EVENTI ---
  // Ora usa 'filters', 'selectedDate', 'viewMode' dalle props
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    setEvents([]);
    setGroupedEvents({});

    try {
      let query = supabase.from("events").select("*");

      // Applica filtri di base
      if (filters.gender) {
        query = query.eq("gender", filters.gender);
      }
      if (filters.disciplines.length > 0) {
        const fullDisciplineNames = filters.disciplines.map(
          (abbr) => DISCIPLINE_MAP[abbr] || abbr
        );
        query = query.in("discipline", fullDisciplineNames);
      }

      // Applica filtro DATA in base alla VISTA
      let startDateStr = "";
      let endDateStr = "";

      switch (viewMode) {
        case "weekly":
          const { start: weekStart, end: weekEnd } = getWeekRange(selectedDate);
          startDateStr = formatDateForQuery(weekStart);
          endDateStr = formatDateForQuery(weekEnd);
          query = query.gte("date", startDateStr).lte("date", endDateStr);
          break;
        case "monthly":
          const { start: monthStart, end: monthEnd } = getMonthRange(selectedDate);
          startDateStr = formatDateForQuery(monthStart);
          endDateStr = formatDateForQuery(monthEnd);
          query = query.gte("date", startDateStr).lte("date", endDateStr);
          break;
        case "daily":
        default:
          startDateStr = formatDateForQuery(selectedDate);
          query = query.eq("date", startDateStr);
          break;
      }

      console.log(`🔍 Query per ${viewMode} tra ${startDateStr} e ${endDateStr || startDateStr}`);

      const { data, error: queryError } = await query
        .order("date", { ascending: true })
        .order("discipline", { ascending: true });

      if (queryError) {
        console.error("❌ Errore nel caricamento eventi:", queryError);
        setError(`Errore: ${queryError.message}`);
      } else if (data) {
        let filteredData = data;
        if (filters.country) {
          filteredData = data.filter((event) => {
            const parsed = parseLocation(event.location);
            return parsed.country === filters.country;
          });
        }

        console.log(`✅ Trovati ${filteredData.length} eventi`);

        if (viewMode === "daily") {
          setEvents(filteredData as Event[]);
        } else {
          const groups: GroupedEvents = (filteredData as Event[]).reduce((acc, event) => {
            const dateKey = event.date;
            if (!acc[dateKey]) {
              acc[dateKey] = [];
            }
            acc[dateKey].push(event);
            return acc;
          }, {} as GroupedEvents);
          setGroupedEvents(groups);
        }
      }
    } catch (err: any) { // Aggiunto 'any' per gestire 'err.message'
      console.error("❌ Errore imprevisto:", err);
      setError(`Errore imprevisto: ${err.message}`);
    }

    setLoading(false);
  }, [selectedDate, filters, viewMode]); // Le dipendenze ora sono props

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // --- NAVIGAZIONE DATE ---
  // Ora usano 'setSelectedDate' e 'setViewMode' dalle props
  const goToPrevious = () => {
    const newDate = new Date(selectedDate);
    switch (viewMode) {
      case "weekly":
        newDate.setDate(newDate.getDate() - 7);
        break;
      case "monthly":
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      default:
        newDate.setDate(newDate.getDate() - 1);
        break;
    }
    setSelectedDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(selectedDate);
    switch (viewMode) {
      case "weekly":
        newDate.setDate(newDate.getDate() + 7);
        break;
      case "monthly":
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      default:
        newDate.setDate(newDate.getDate() + 1);
        break;
    }
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setViewMode("daily");
    setSelectedDate(new Date());
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value + "T00:00:00");
    setSelectedDate(newDate);
    setShowDatePicker(false);
  };

  // --- HANDLER FILTRI ---
  // Ora usa 'setFilters' dalle props
  const handleGenderChange = (gender: string) => {
    setFilters((prev) => ({
      ...prev,
      gender: prev.gender === gender ? "" : gender,
    }));
  };

  const toggleDiscipline = (discipline: string) => {
    setFilters((prev) => ({
      ...prev,
      disciplines: prev.disciplines.includes(discipline)
        ? prev.disciplines.filter((d) => d !== discipline)
        : [...prev.disciplines, discipline],
    }));
  };

  const handleCountryChange = (country: string) => {
    setFilters((prev) => ({ ...prev, country }));
  };

  const resetFilters = () => {
    setFilters({ gender: "", disciplines: [], country: "" });
  };

  // 'filters' ora viene dalle props
  const hasActiveFilters = () => {
    return (
      filters.gender !== "" ||
      filters.disciplines.length > 0 ||
      filters.country !== ""
    );
  };

  // --- FUNZIONI DI RENDER ---
  // 'viewMode' e 'selectedDate' ora vengono dalle props
  const renderDateDisplay = () => {
    switch (viewMode) {
      case "weekly":
        const { start, end } = getWeekRange(selectedDate);
        return (
          <>
            {formatSimpleDate(start)}
            <span style={{ margin: "0 0.5rem" }}>-</span>
            {formatSimpleDate(end)}
          </>
        );
      case "monthly":
        return selectedDate.toLocaleDateString("it-IT", {
          month: "long",
          year: "numeric",
        });
      case "daily":
      default:
        return formatDateItalian(formatDateForQuery(selectedDate));
    }
  };

  // 'onEventClick' ora viene dalle props
  const renderEventCard = (event: Event) => {
    const { place, country } = parseLocation(event.location);

    const disciplineAbbr = Object.keys(DISCIPLINE_MAP).find(
      key => DISCIPLINE_MAP[key] === event.discipline
    ) || event.discipline.toLowerCase();
    const disciplineClass = styles[`${disciplineAbbr.toLowerCase()}Badge`];

    const isCancelled = event.cancelled === true;

    const cardClassName = `${styles.eventCard} ${
      isCancelled ? styles.cancelledCard : ''
    }`;
    
    const handleClick = () => {
      if (!isCancelled) {
        onEventClick(event.codex, event.date);
      }
    };

    return (
      <div 
        key={`${event.codex}-${event.date}`} 
        className={cardClassName}
        onClick={handleClick}
      >
        <div className={styles.eventHeader}>
          <div className={styles.locationInfo}>
            <span className={styles.flagEmoji}>{getFlagEmoji(country)}</span>
            <div className={styles.locationText}>
              <h3 className={styles.placeName}>{place}</h3>
              <span className={styles.countryCode}>{country}</span>
            </div>
          </div>
          <div className={styles.eventMeta}>
            
            {isCancelled ? (
              <span className={styles.cancelledBadge}>CANCELLATA</span>
            ) : (
              <>
                <span
                  className={`${styles.genderBadge} ${
                    event.gender === "Men's"
                      ? styles.maleBadge
                      : styles.femaleBadge
                  }`}
                >
                  {event.gender === "Men's" ? "👨 Uomini" : "👩 Donne"}
                </span>
                <span
                  className={`${styles.disciplineBadge} ${disciplineClass}`}
                >
                  {event.discipline}
                </span>
              </>
            )}
          </div>
        </div>
        <div className={styles.eventDetails}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Categoria:</span>
            <span className={styles.detailValue}>{event.category}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Codex:</span>
            <span className={styles.detailValue}>{event.codex}</span>
          </div>
          {event.run1_time && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Run 1:</span>
              <span className={styles.detailValue}>{event.run1_time}</span>
            </div>
          )}
          {event.run2_time && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Run 2:</span>
              <span className={styles.detailValue}>{event.run2_time}</span>
            </div>
          )}
          
          {event.event_url && !isCancelled && (
            <a
              href={event.event_url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.eventLink}
              onClick={(e) => e.stopPropagation()} 
            >
              Vedi Risultati →
            </a>
          )}
        </div>
      </div>
    );
  };

  // 'viewMode' ora viene dalle props
  const renderEventsList = () => {
    if (viewMode === "daily") {
      if (events.length === 0) return null;
      return (
        <div className={styles.eventsList}>
          {events.map(renderEventCard)}
        </div>
      );
    }

    const groupedDates = Object.keys(groupedEvents);
    if (groupedDates.length === 0) return null;

    return (
      <div className={styles.groupedEventsContainer}>
        {groupedDates.map((dateKey) => (
          <section key={dateKey} className={styles.dateGroup}>
            <h2 className={styles.dateGroupHeader}>
              {formatDateItalian(dateKey)}
            </h2>
            <div className={styles.eventsList}>
              {groupedEvents[dateKey].map(renderEventCard)}
            </div>
          </section>
        ))}
      </div>
    );
  };
  
  // 'viewMode' ora viene dalle props
  const noEventsFound = !loading && !error && 
    (viewMode === 'daily' ? events.length === 0 : Object.keys(groupedEvents).length === 0);

  // --- RETURN JSX ---
  // Il JSX ora usa 'viewMode', 'setViewMode', 'selectedDate', 'filters' dalle props
  return (
    <main className={styles.gareContainer}>
      
      {/* SELETTORE VISTA (NON-STICKY) */}
      <div className={styles.viewSwitcher}>
        <button
          className={`${styles.viewButton} ${viewMode === 'daily' ? styles.activeView : ''}`}
          onClick={() => setViewMode('daily')}
        >
          Giorno
        </button>
        <button
          className={`${styles.viewButton} ${viewMode === 'weekly' ? styles.activeView : ''}`}
          onClick={() => setViewMode('weekly')}
        >
          Settimana
        </button>
        <button
          className={`${styles.viewButton} ${viewMode === 'monthly' ? styles.activeView : ''}`}
          onClick={() => setViewMode('monthly')}
        >
          Mese
        </button>
      </div>

      {/* CONTROLLI DATA (STICKY SU DESKTOP) */}
      <div className={styles.stickyControls}>
        <div className={styles.dateNavigation}>
          <button className={styles.navButton} onClick={goToPrevious}>
            ← Precedente
          </button>

          <div className={styles.dateDisplay}>
            <button
              className={styles.dateButton}
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              {renderDateDisplay()}
            </button>
            {showDatePicker && (
              <input
                type="date"
                className={styles.datePicker}
                value={formatDateForQuery(selectedDate)}
                onChange={handleDateChange}
                autoFocus
              />
            )}
          </div>

          <button className={styles.navButton} onClick={goToNext}>
            Successivo →
          </button>

          <button className={styles.todayButton} onClick={goToToday}>
            Oggi
          </button>
        </div>
      </div> 
      {/* Fine del contenitore sticky */}

      {/* BOTTONE E WRAPPER FILTRI */}
      <button 
        className={styles.filtersToggleButton}
        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
      >
        {isFiltersOpen ? "Chiudi Filtri 🔼" : "Apri Filtri 🔽"}
      </button>

      <div className={`${styles.filtersContainer} ${isFiltersOpen ? styles.filtersOpenMobile : ''}`}>
        <h2 className={styles.filtersTitle}>Filtri</h2>
        <div className={styles.genderFilters}>
          <button
            className={`${styles.genderButton} ${
              filters.gender === "Men's" ? styles.activeGender : ""
            }`}
            onClick={() => handleGenderChange("Men's")}
          >
            Uomini
          </button>
          <button
            className={`${styles.genderButton} ${
              filters.gender === "Women's" ? styles.activeGender : ""
            }`}
            onClick={() => handleGenderChange("Women's")}
          >
            Donne
          </button>
        </div>
        <div className={styles.disciplineFilters}>
          {DISCIPLINES.map((discAbbr) => (
            <button
              key={discAbbr}
              className={`${styles.disciplineButton} ${
                styles[`${discAbbr.toLowerCase()}Button`]
              } ${
                filters.disciplines.includes(discAbbr)
                  ? styles.activeDiscipline
                  : ""
              }`}
              onClick={() => toggleDiscipline(discAbbr)}
            >
              {discAbbr}
            </button>
          ))}
        </div>
        <div className={styles.countryFilter}>
          <select
            value={filters.country}
            onChange={(e) => handleCountryChange(e.target.value)}
            className={styles.countrySelect}
          >
            <option value="">Tutte le nazioni</option>
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {getFlagEmoji(country)} {country}
              </option>
            ))}
          </select>
        </div>
        {hasActiveFilters() && (
          <button className={styles.resetButton} onClick={resetFilters}>
            Reset Filtri
          </button>
        )}
      </div>

      {/* Lista Eventi */}
      {loading && <p className={styles.loading}>Caricamento eventi...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {noEventsFound && (
        <p className={styles.noEvents}>
          Nessuna gara trovata per quest{viewMode === 'weekly' ? 'a settimana' : 'e date'}
          {hasActiveFilters() && " con i filtri selezionati"}.
        </p>
      )}
      
      {!loading && !error && renderEventsList()}

    </main>
  );
}

export default Gare;