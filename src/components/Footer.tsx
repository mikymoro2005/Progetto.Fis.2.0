import styles from './Footer.module.css';

function Footer() {
  return (
    <footer className={styles.footerContainer}>
      <div className={styles.socialIcons}>
        {/* Instagram */}
        <a 
          href="https://instagram.com" 
          target="_blank" 
          rel="noopener noreferrer"
          aria-label="Instagram"
        >
          <i className="fa-brands fa-instagram"></i>
        </a>
        
        {/* X (Twitter) */}
        <a 
          href="https://x.com" 
          target="_blank" 
          rel="noopener noreferrer"
          aria-label="X"
        >
          <i className="fa-brands fa-x-twitter"></i>
        </a>
        
        {/* Facebook */}
        <a 
          href="https://facebook.com" 
          target="_blank" 
          rel="noopener noreferrer"
          aria-label="Facebook"
        >
          <i className="fa-brands fa-facebook"></i>
        </a>

        {/* Threads */}
        <a 
          href="https://threads.net" 
          target="_blank" 
          rel="noopener noreferrer"
          aria-label="Threads"
        >
          <i className="fa-brands fa-threads"></i>
        </a>
      </div>
      <div className={styles.copyright}>
        © {new Date().getFullYear()} SkiRank. Tutti i diritti riservati.
      </div>
    </footer>
  );
}

export default Footer;

