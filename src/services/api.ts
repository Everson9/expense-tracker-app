import axios from 'axios';
import { Expense, CreateExpenseDTO, UpdateExpenseDTO, Category } from '../types/expense';
import { supabase } from '../lib/supabase';

export interface Budget {
  id: string;
  category: Category;
  amount: number;
}

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await supabase.auth.signOut();
    }
    return Promise.reject(error);
  }
);

export const expenseService = {
  getAll: async (): Promise<Expense[]> => {
    const { data } = await api.get<Expense[]>('/expenses');
    return data;
  },

  getById: async (id: string): Promise<Expense> => {
    const { data } = await api.get<Expense>(`/expenses/${id}`);
    return data;
  },

  create: async (expense: CreateExpenseDTO): Promise<Expense> => {
    const { data } = await api.post<Expense>('/expenses', expense);
    return data;
  },

  update: async (id: string, expense: UpdateExpenseDTO): Promise<Expense> => {
    const { data } = await api.put<Expense>(`/expenses/${id}`, expense);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/expenses/${id}`);
  },
};

export interface AppCategory {
  id: string;
  name: string;
  icon: string;
}

export interface Goal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date?: string | null;
  completed: boolean;
  created_at?: string;
}

export const goalService = {
  getAll: async (): Promise<Goal[]> => {
    const { data } = await api.get<Goal[]>('/goals');
    return data;
  },
  create: async (payload: Omit<Goal, 'id' | 'completed' | 'created_at'>): Promise<Goal> => {
    const { data } = await api.post<Goal>('/goals', payload);
    return data;
  },
  update: async (id: string, payload: Partial<Goal>): Promise<Goal> => {
    const { data } = await api.put<Goal>(`/goals/${id}`, payload);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/goals/${id}`);
  },
};

export const categoryService = {
  getAll: async (): Promise<AppCategory[]> => {
    const { data } = await api.get<AppCategory[]>('/categories');
    return data;
  },

  create: async (name: string, icon: string): Promise<AppCategory> => {
    const { data } = await api.post<AppCategory>('/categories', { name, icon });
    return data;
  },

  update: async (id: string, name: string, icon: string): Promise<AppCategory> => {
    const { data } = await api.put<AppCategory>(`/categories/${id}`, { name, icon });
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};

export const budgetService = {
  getAll: async (): Promise<Budget[]> => {
    const { data } = await api.get<Budget[]>('/budgets');
    return data;
  },

  upsert: async (category: Category, amount: number): Promise<Budget> => {
    const { data } = await api.put<Budget>(`/budgets/${category}`, { amount });
    return data;
  },

  delete: async (category: Category): Promise<void> => {
    await api.delete(`/budgets/${category}`);
  },
};
