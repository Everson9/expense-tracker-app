import React, { createContext, useContext, useState, useEffect } from 'react';
import { categoryService, AppCategory } from '../services/api';

interface CategoryContextValue {
  categories: AppCategory[];
  loading: boolean;
  reload: () => Promise<void>;
}

const CategoryContext = createContext<CategoryContextValue | undefined>(undefined);

const FALLBACK: AppCategory[] = [
  { id: 'alimentação', name: 'alimentação', icon: '🍔' },
  { id: 'transporte',  name: 'transporte',  icon: '🚗' },
  { id: 'lazer',       name: 'lazer',       icon: '🎮' },
  { id: 'saúde',       name: 'saúde',       icon: '💊' },
  { id: 'moradia',     name: 'moradia',     icon: '🏠' },
  { id: 'outros',      name: 'outros',      icon: '📦' },
];

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<AppCategory[]>(FALLBACK);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch {
      // keep fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  return (
    <CategoryContext.Provider value={{ categories, loading, reload }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories(): CategoryContextValue {
  const ctx = useContext(CategoryContext);
  if (!ctx) throw new Error('useCategories must be used inside CategoryProvider');
  return ctx;
}
