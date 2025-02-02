import { useState, useEffect } from 'react';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <button onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? 'Light Mode' : 'Dark Mode'}
      </button>
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;