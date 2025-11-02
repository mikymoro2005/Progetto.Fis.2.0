import { useState, type Dispatch, type SetStateAction, useEffect } from 'react'; // Aggiunto useEffect
// Importiamo il tipo Page dall'App principale
import { type Page } from '../App';
import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';
import styles from './Header.module.css';

// Definiamo i tipi di tutte le props che questo componente riceve
interface HeaderProps {
  openModal: () => void;
  currentPage: Page;
  setPage: Dispatch<SetStateAction<Page>>;
}

function Header({ openModal, currentPage, setPage }: HeaderProps) {
  // Logica per il menu hamburger
  const [menuAperto, setMenuAperto] = useState(false);

  // Stato per l'utente loggato
  const [user, setUser] = useState<User | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Logica per il tema (luce/buio)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Inizializzazione: usa localStorage o la preferenza del sistema
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });
  
  // Applica la classe 'light-mode' a #root ogni volta che il tema cambia
  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      if (theme === 'light') {
        root.classList.add('light-mode');
      } else {
        root.classList.remove('light-mode');
      }
    }
    localStorage.setItem('theme', theme);
  }, [theme]); // Si esegue ogni volta che 'theme' cambia

  // Controlla lo stato dell'autenticazione
  useEffect(() => {
    // Ottieni l'utente corrente
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Ascolta i cambiamenti dello stato auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Funzioni
  const toggleMenu = () => {
    setMenuAperto(!menuAperto);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLinkClick = (page: Page) => {
    // 1. Aggiorna lo stato di React
    setPage(page);
    // 2. AGGIUNTO: Aggiorna l'hash dell'URL per la persistenza
    window.location.hash = `#${page}`;
    setMenuAperto(false); // Chiude il menu mobile dopo il click
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  // Definiamo i link di navigazione
  const navLinks = [
    { name: 'Rank', page: 'rank' as Page },
    { name: 'Atleti', page: 'atleti' as Page },
    ...(user ? [{ name: 'Preferiti', page: 'preferiti' as Page }] : []),
    { name: 'Confronto', page: 'confronto' as Page },
    { name: 'Chi siamo', page: 'chi-siamo' as Page },
  ];

  return (
    <header className={styles.headerContainer}>
      <nav className={styles.navContainer}>
        
        {/* Sezione Sinistra: Logo (che porta alla home/rank) */}
        <div className={styles.logo}>
          <a onClick={() => handleLinkClick('rank')} style={{ cursor: 'pointer' }}>SkiRank</a>
        </div>

        {/* Nuova 'rightSection' per raggruppare link e icone */}
        <div className={styles.rightSection}>
          
          {/* Link di navigazione (Desktop/Mobile) */}
          <ul className={`${styles.navLinks} ${menuAperto ? styles.attivo : ''}`}>
            {navLinks.map((link) => (
              <li key={link.page}>
                <a 
                  onClick={() => handleLinkClick(link.page)}
                  className={currentPage === link.page ? styles.activeLink : ''}
                  style={{ cursor: 'pointer' }}
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
          
          {/* Icone a destra */}

          {/* Icona Account/Login o User Menu */}
          {user ? (
            <div className={styles.userMenuContainer}>
              <button
                className={styles.userButton}
                onClick={toggleUserMenu}
                aria-label="Menu utente"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <span className={styles.userEmail}>
                  {user.email?.split('@')[0]}
                </span>
              </button>
              {userMenuOpen && (
                <div className={styles.userDropdown}>
                  <div className={styles.userInfo}>
                    <p className={styles.userEmailFull}>{user.email}</p>
                  </div>
                  <button
                    className={styles.logoutButton}
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className={styles.accountLink}
              onClick={openModal}
              aria-label="Accedi o Registrati"
            >
              {/* Omino SVG */}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </button>
          )}

          {/* Bottone per cambiare tema */}
          <button 
            className={styles.themeToggle} 
            onClick={toggleTheme} 
            aria-label={`Attiva tema ${theme === 'dark' ? 'chiaro' : 'scuro'}`}
          >
            {/* Sole/Luna SVG */}
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sun">
                <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-moon">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
            )}
          </button>
        
          {/* Bottone Hamburger (visibile solo su mobile) */}
          <button className={styles.hamburger} onClick={toggleMenu} aria-label="Apri menu">
            <span className={styles.hamburgerLinea}></span>
            <span className={styles.hamburgerLinea}></span>
            <span className={styles.hamburgerLinea}></span>
          </button>
        </div>

      </nav>
    </header>
  );
}

export default Header;
