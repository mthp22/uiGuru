import { useCallback, useState } from 'react';

export type Theme = 'light' | 'dark';

const storageKey = 'uiguru:theme';

function readTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try {
        window.localStorage.setItem(storageKey, next);
      } catch {
        // console.error("Failed to save to localStorage:", Error);
      }
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
