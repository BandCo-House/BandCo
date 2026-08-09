import { useState, useEffect } from 'react';

const STORAGE_KEY = 'jamplay_recent_searches';
const MAX_SEARCHES = 10;

export const useRecentSearches = () => {
  const [searches, setSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
    } catch (e) {
      console.error(e);
    }
  }, [searches]);

  const addSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearches((prev) => {
      const filtered = prev.filter((item) => item !== trimmed);
      return [trimmed, ...filtered].slice(0, MAX_SEARCHES);
    });
  };

  const removeSearch = (query: string) => {
    setSearches((prev) => prev.filter((item) => item !== query));
  };

  const clearAll = () => {
    setSearches([]);
  };

  return { searches, addSearch, removeSearch, clearAll };
};
