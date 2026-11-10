import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { lightColors, darkColors, ColorTheme } from '../constants/theme';

type ThemeContextType = {
  theme: ColorTheme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
};

const THEME_STORAGE_KEY = 'boolok_theme_mode';

const ThemeContext = createContext<ThemeContextType>({
  theme: darkColors,
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light') return false;
        if (stored === 'dark') return true;
      } catch (_) {}
    }
    return true; // default dark mode
  });

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
        } catch (_) {}
      }
      return next;
    });
  };

  const setTheme = (dark: boolean) => {
    setIsDark(dark);
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light');
      } catch (_) {}
    }
  };

  const theme = isDark ? darkColors : lightColors;

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      document.body.style.backgroundColor = isDark ? '#080D17' : '#FFFFFF';
    }
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
