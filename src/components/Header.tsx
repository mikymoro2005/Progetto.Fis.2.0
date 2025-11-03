import { useState, type Dispatch, type SetStateAction, useEffect, useRef } from 'react';
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

  // Ref per il menu utente
  const userMenuRef = useRef<HTMLDivElement>(null);

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
  }, [theme]);

  // Controlla lo stato dell'autenticazione
  useEffect(() => {
    // Ottieni l'utente corrente
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Ascolta i cambiamenti dello stato auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Header - Auth event:', event);
      setUser(session?.user ?? null);
      
      // Chiudi il menu quando si fa logout
      if (event === 'SIGNED_OUT') {
        setUserMenuOpen(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Gestisci click fuori dal menu utente per chiuderlo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  // Funzioni
  const toggleMenu = () => {
    setMenuAperto(!menuAperto);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLinkClick = (page: Page) => {
    setPage(page);
    window.location.hash = `#${page}`;
    setMenuAperto(false);
  };

  const handleLogout = () => {
    console.log('Header - Inizio logout (con workaround)');
    setUserMenuOpen(false);
    
    // Chiamiamo signOut ma non attendiamo il completamento, per evitare blocchi
    supabase.auth.signOut();

    // Rimuoviamo manualmente il token di autenticazione da localStorage
    try {
      const supabaseAuthTokenKey = Object.keys(localStorage).find(key => key.startsWith('sb-') && key.endsWith('-auth-token'));
      if (supabaseAuthTokenKey) {
        console.log(`Header - Rimozione manuale del token: ${supabaseAuthTokenKey}`);
        localStorage.removeItem(supabaseAuthTokenKey);
      } else {
        console.warn('Header - Chiave del token di autenticazione Supabase non trovata in localStorage.');
      }
    } catch (error) {
      console.error('Header - Errore durante la rimozione manuale del token:', error);
    }
    
    console.log('Header - Redirect forzato alla home page...');
    window.location.href = '/';
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
            <div className={styles.userMenuContainer} ref={userMenuRef}>
              <button
                className={styles.userButton}
                onClick={toggleUserMenu}
                aria-label="Menu utente"
                type="button"
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
                    type="button"
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
              type="button"
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
            type="button"
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
          <button className={styles.hamburger} onClick={toggleMenu} aria-label="Apri menu" type="button">
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