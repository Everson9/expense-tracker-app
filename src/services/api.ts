import axios from 'axios';
import { Expense, CreateExpenseDTO, UpdateExpenseDTO } from '../types/expense';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

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
