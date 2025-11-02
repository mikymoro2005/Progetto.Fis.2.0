import { useState } from 'react';
import { supabase } from '../supabaseClient';
// Importiamo gli stili che creeremo nel PROSSIMO passaggio
import styles from './AuthModal.module.css';

// Definiamo le "props" che questo componente riceverà
interface AuthModalProps {
  isOpen: boolean; // Per sapere se deve essere visibile
  onClose: () => void; // La funzione da chiamare per chiuderlo
}

function AuthModal({ isOpen, onClose }: AuthModalProps) {
  // Stato interno per sapere se mostrare 'login' o 'registrazione'
  const [isLoginView, setIsLoginView] = useState(true);

  // Stati per i form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Se non è "aperto", non renderizzare nulla
  if (!isOpen) {
    return null;
  }

  // Funzione per cambiare vista
  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError(null);
    setSuccessMessage(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  // Funzione per evitare che il modal si chiuda se clicchi *dentro* il contenuto
  const onModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Login con email e password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setSuccessMessage('Login effettuato con successo!');
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error: any) {
      setError(error.message || 'Errore durante il login');
    } finally {
      setLoading(false);
    }
  };

  // Registrazione con email e password
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Validazione password
    if (password !== confirmPassword) {
      setError('Le password non coincidono');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setSuccessMessage('Registrazione completata! Controlla la tua email per confermare l\'account.');
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (error: any) {
      setError(error.message || 'Errore durante la registrazione');
    } finally {
      setLoading(false);
    }
  };

  // Login con Google
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message || 'Errore durante il login con Google');
      setLoading(false);
    }
  };

  return (
    // 1. L'Overlay (lo sfondo scuro). Cliccandolo si chiude il modal.
    <div className={styles.modalOverlay} onClick={onClose}>
      
      {/* 2. Il contenuto del modal (il quadrato/rettangolo) */}
      <div className={styles.modalContent} onClick={onModalContentClick}>
        
        {/* Bottone per chiudere */}
        <button className={styles.closeButton} onClick={onClose}>&times;</button>
        
        {/* Messaggi di errore e successo */}
        {error && <div className={styles.errorMessage}>{error}</div>}
        {successMessage && <div className={styles.successMessage}>{successMessage}</div>}

        {isLoginView ? (
          // --- VISTA LOGIN ---
          <div className={styles.formContainer}>
            <h2>Accedi</h2>
            <form onSubmit={handleLogin}>
              <label htmlFor="email-login">Email</label>
              <input
                id="email-login"
                type="email"
                placeholder="tua@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />

              <label htmlFor="password-login">Password</label>
              <input
                id="password-login"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />

              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? 'Accesso in corso...' : 'Accedi'}
              </button>
            </form>

            {/* Divisore */}
            <div className={styles.divider}>
              <span>oppure</span>
            </div>

            {/* Pulsante Google */}
            <button
              type="button"
              className={styles.googleButton}
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
                <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.333z" fill="#FBBC05"/>
                <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.002 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
              </svg>
              Continua con Google
            </button>

            <p className={styles.toggleLink}>
              Non hai un account?{' '}
              <button onClick={toggleView} disabled={loading}>Registrati</button>
            </p>
          </div>
        ) : (
          // --- VISTA REGISTRAZIONE ---
          <div className={styles.formContainer}>
            <h2>Registrati</h2>
            <form onSubmit={handleSignUp}>
              <label htmlFor="email-register">Email</label>
              <input
                id="email-register"
                type="email"
                placeholder="tua@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />

              <label htmlFor="password-register">Password</label>
              <input
                id="password-register"
                type="password"
                placeholder="Crea una password (min. 6 caratteri)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />

              <label htmlFor="password-confirm">Conferma Password</label>
              <input
                id="password-confirm"
                type="password"
                placeholder="Conferma la password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />

              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? 'Registrazione in corso...' : 'Registrati'}
              </button>
            </form>

            {/* Divisore */}
            <div className={styles.divider}>
              <span>oppure</span>
            </div>

            {/* Pulsante Google */}
            <button
              type="button"
              className={styles.googleButton}
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
                <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.333z" fill="#FBBC05"/>
                <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.002 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
              </svg>
              Continua con Google
            </button>

            <p className={styles.toggleLink}>
              Sei già registrato?{' '}
              <button onClick={toggleView} disabled={loading}>Accedi</button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
