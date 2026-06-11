import React, { createContext, useContext, useState } from 'react';

interface MonthContextValue {
  selectedMonth: number;
  selectedYear: number;
  goToPrev: () => void;
  goToNext: () => void;
}

const MonthContext = createContext<MonthContextValue | undefined>(undefined);

export function MonthProvider({ children }: { children: React.ReactNode }) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const goToPrev = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const goToNext = () => {
    const isNow = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
    if (isNow) return;
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  return (
    <MonthContext.Provider value={{ selectedMonth, selectedYear, goToPrev, goToNext }}>
      {children}
    </MonthContext.Provider>
  );
}

export function useMonth(): MonthContextValue {
  const ctx = useContext(MonthContext);
  if (!ctx) throw new Error('useMonth must be used inside MonthProvider');
  return ctx;
}
