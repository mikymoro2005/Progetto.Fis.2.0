import { useState } from 'react';
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

  // Se non è "aperto", non renderizzare nulla
  if (!isOpen) {
    return null;
  }

  // Funzione per cambiare vista
  const toggleView = () => {
    setIsLoginView(!isLoginView);
  };

  // Funzione per evitare che il modal si chiuda se clicchi *dentro* il contenuto
  const onModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    // 1. L'Overlay (lo sfondo scuro). Cliccandolo si chiude il modal.
    <div className={styles.modalOverlay} onClick={onClose}>
      
      {/* 2. Il contenuto del modal (il quadrato/rettangolo) */}
      <div className={styles.modalContent} onClick={onModalContentClick}>
        
        {/* Bottone per chiudere */}
        <button className={styles.closeButton} onClick={onClose}>&times;</button>
        
        {isLoginView ? (
          // --- VISTA LOGIN ---
          <div className={styles.formContainer}>
            <h2>Accedi</h2>
            <form>
              <label htmlFor="email-login">Email</label>
              <input id="email-login" type="email" placeholder="tua@email.com" />
              
              <label htmlFor="password-login">Password</label>
              <input id="password-login" type="password" placeholder="••••••••" />
              
              <button type="submit" className={styles.submitButton}>Accedi</button>
            </form>
            <p className={styles.toggleLink}>
              Non hai un account?{' '}
              <button onClick={toggleView}>Registrati</button>
            </p>
          </div>
        ) : (
          // --- VISTA REGISTRAZIONE ---
          <div className={styles.formContainer}>
            <h2>Registrati</h2>
            <form>
              <label htmlFor="email-register">Email</label>
              <input id="email-register" type="email" placeholder="tua@email.com" />
              
              <label htmlFor="password-register">Password</label>
              <input id="password-register" type="password" placeholder="Crea una password" />
              
              <label htmlFor="password-confirm">Conferma Password</label>
              <input id="password-confirm" type="password" placeholder="Conferma la password" />
              
              <button type="submit" className={styles.submitButton}>Registrati</button>
            </form>
            <p className={styles.toggleLink}>
              Sei già registrato?{' '}
              <button onClick={toggleView}>Accedi</button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
