import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppTheme {
  id: string;
  name: string;
  emoji: string;
  bg: string;
  surface: string;
  card: string;
  border: string;
  accent: string;
  accentDim: string;
  danger: string;
  text: string;
  textSub: string;
  textMuted: string;
  tabBar: string;
}

export const THEMES: AppTheme[] = [
  {
    id: 'dark',
    name: 'Dark',
    emoji: '🌑',
    bg: '#080808',
    surface: '#101010',
    card: '#181818',
    border: '#242424',
    accent: '#00D4A1',
    accentDim: '#00D4A115',
    danger: '#FF5555',
    text: '#F0F0F0',
    textSub: '#8A8A8A',
    textMuted: '#4A4A4A',
    tabBar: '#0C0C0C',
  },
  {
    id: 'spongebob',
    name: 'Bob Esponja',
    emoji: '🧽',
    bg: '#1A1600',
    surface: '#211C00',
    card: '#2A2400',
    border: '#3A3200',
    accent: '#FFD700',
    accentDim: '#FFD70015',
    danger: '#FF6B35',
    text: '#FFF8DC',
    textSub: '#CCA800',
    textMuted: '#7A6400',
    tabBar: '#161200',
  },
  {
    id: 'naruto',
    name: 'Naruto',
    emoji: '🍥',
    bg: '#0D0800',
    surface: '#150E00',
    card: '#1A1200',
    border: '#2A1E00',
    accent: '#FF8C00',
    accentDim: '#FF8C0015',
    danger: '#FF3333',
    text: '#FFF0E0',
    textSub: '#CC7700',
    textMuted: '#664400',
    tabBar: '#0A0600',
  },
  {
    id: 'lofi',
    name: 'Lo-fi',
    emoji: '🎵',
    bg: '#0A071A',
    surface: '#110E22',
    card: '#16122A',
    border: '#2A2244',
    accent: '#A29BFE',
    accentDim: '#A29BFE15',
    danger: '#FD79A8',
    text: '#E8E0FF',
    textSub: '#9080D0',
    textMuted: '#4A4070',
    tabBar: '#080616',
  },
  {
    id: 'matrix',
    name: 'Matrix',
    emoji: '💊',
    bg: '#000A00',
    surface: '#001000',
    card: '#001800',
    border: '#003300',
    accent: '#00FF41',
    accentDim: '#00FF4115',
    danger: '#FF0000',
    text: '#00FF41',
    textSub: '#00BB2F',
    textMuted: '#006618',
    tabBar: '#000800',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    emoji: '🌊',
    bg: '#020B18',
    surface: '#051525',
    card: '#091E30',
    border: '#0E2A40',
    accent: '#00C8FF',
    accentDim: '#00C8FF15',
    danger: '#FF6B6B',
    text: '#E0F4FF',
    textSub: '#6AABCC',
    textMuted: '#2A5A72',
    tabBar: '#020D1C',
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
