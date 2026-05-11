// 深色模式 Context
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [autoDarkMode, setAutoDarkMode] = useState(() => {
    return localStorage.getItem('yt_auto_dark_mode') !== 'false';
  });

  useEffect(() => {
    if (!autoDarkMode) return;
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 6) {
      setIsDarkMode(true);
    }
  }, [autoDarkMode]);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('yt_auto_dark_mode', autoDarkMode.toString());
  }, [autoDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, autoDarkMode, setAutoDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
