import { Expense } from './expense';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type AppStackParamList = {
  Home: undefined;
  Form: { expense?: Expense; defaultType?: 'despesa' | 'receita' } | undefined;
};

export type TabParamList = {
  Início:    undefined;
  Gastos:    undefined;
  Receitas:  undefined;
  Gráficos:  undefined;
  Metas:     undefined;
  Perfil:    undefined;
};

export type RootStackParamList = AppStackParamList;
