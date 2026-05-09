import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();
const ACCENT_STORAGE_KEY = 'focuspoint_accent_color';

export const ACCENT_OPTIONS = [
  { id: 'indigo', label: 'Indigo', color: '#6366f1' },
  { id: 'cyan', label: 'Cyan', color: '#06b6d4' },
  { id: 'emerald', label: 'Emerald', color: '#10b981' },
  { id: 'amber', label: 'Amber', color: '#f59e0b' },
  { id: 'rose', label: 'Rose', color: '#f43f5e' },
  { id: 'violet', label: 'Violet', color: '#8b5cf6' },
];

function normalizeAccent(value) {
  const match = ACCENT_OPTIONS.find((option) => option.color.toLowerCase() === String(value || '').toLowerCase());
  return match?.color || ACCENT_OPTIONS[0].color;
}

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('focuspoint_theme');
    if (stored) return stored === 'dark';
    // Default to dark as per the spec
    return true;
  });
  const [accentColor, setAccentColorState] = useState(() => normalizeAccent(localStorage.getItem(ACCENT_STORAGE_KEY)));

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('focuspoint_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    document.documentElement.style.setProperty('--color-accent-indigo', accentColor);
    localStorage.setItem(ACCENT_STORAGE_KEY, accentColor);
  }, [accentColor]);

  const toggleTheme = () => setIsDark((prev) => !prev);
  const setAccentColor = (color) => setAccentColorState(normalizeAccent(color));

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, accentColor, setAccentColor, accentOptions: ACCENT_OPTIONS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
