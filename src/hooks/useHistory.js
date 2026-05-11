// 播放歷史 hook
import { useState, useEffect } from 'react';

export const useHistory = () => {
  const [playHistory, setPlayHistory] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('yt_play_history');
    if (stored) {
      try {
        setPlayHistory(JSON.parse(stored));
      } catch (e) {
        setPlayHistory([]);
      }
    }
  }, []);

  const addToHistory = (item) => {
    setPlayHistory((prev) => {
      const filtered = prev.filter((h) => h.id !== item.id);
      const newHistory = [item, ...filtered].slice(0, 20);
      localStorage.setItem('yt_play_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    setPlayHistory([]);
    localStorage.removeItem('yt_play_history');
  };

  return { playHistory, addToHistory, clearHistory };
};
