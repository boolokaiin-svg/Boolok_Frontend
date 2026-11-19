import React, { createContext, useContext, useState } from 'react';
import { lightColors, darkColors, ColorTheme } from '../constants/theme';

type ThemeContextType = {
  theme: ColorTheme;
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: lightColors,
  isDark: false,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark(prev => !prev);
  const theme = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
