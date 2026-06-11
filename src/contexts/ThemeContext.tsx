import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppTheme {
  id: string;
  name: string;
  emoji: string;
  bg: string;
  card: string;
  border: string;
  accent: string;
  danger: string;
  text: string;
  textMuted: string;
  tabBar: string;
}

export const THEMES: AppTheme[] = [
  {
    id: 'dark',
    name: 'Dark',
    emoji: '🌑',
    bg: '#0D0D0D',
    card: '#1A1A1A',
    border: '#2A2A2A',
    accent: '#00D4A1',
    danger: '#FF6B6B',
    text: '#F5F5F5',
    textMuted: '#666',
    tabBar: '#111111',
  },
  {
    id: 'spongebob',
    name: 'Bob Esponja',
    emoji: '🧽',
    bg: '#1A1600',
    card: '#2A2400',
    border: '#FFD700',
    accent: '#FFD700',
    danger: '#FF6B35',
    text: '#FFF8DC',
    textMuted: '#B8A000',
    tabBar: '#1A1600',
  },
  {
    id: 'naruto',
    name: 'Naruto',
    emoji: '🍥',
    bg: '#0D0800',
    card: '#1A1200',
    border: '#FF6600',
    accent: '#FF8C00',
    danger: '#FF3333',
    text: '#FFF0E0',
    textMuted: '#996600',
    tabBar: '#0D0800',
  },
  {
    id: 'lofi',
    name: 'Lo-fi',
    emoji: '🎵',
    bg: '#0F0A1E',
    card: '#1A1430',
    border: '#6C5CE7',
    accent: '#A29BFE',
    danger: '#FD79A8',
    text: '#E8E0FF',
    textMuted: '#6C5CE7',
    tabBar: '#0F0A1E',
  },
  {
    id: 'matrix',
    name: 'Matrix',
    emoji: '💊',
    bg: '#000A00',
    card: '#001400',
    border: '#00FF41',
    accent: '#00FF41',
    danger: '#FF0000',
    text: '#00FF41',
    textMuted: '#007A1F',
    tabBar: '#000A00',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    emoji: '🌊',
    bg: '#020B18',
    card: '#0A1F30',
    border: '#0099CC',
    accent: '#00C8FF',
    danger: '#FF6B6B',
    text: '#E0F4FF',
    textMuted: '#4A8FA8',
    tabBar: '#020B18',
  },
];

const STORAGE_KEY = '@app_theme';

interface ThemeContextValue {
  theme: AppTheme;
  setThemeById: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>(THEMES[0]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(id => {
      if (id) {
        const found = THEMES.find(t => t.id === id);
        if (found) setTheme(found);
      }
    });
  }, []);

  const setThemeById = (id: string) => {
    const found = THEMES.find(t => t.id === id);
    if (!found) return;
    setTheme(found);
    AsyncStorage.setItem(STORAGE_KEY, id);
  };

  return (
    <ThemeContext.Provider value={{ theme, setThemeById }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
