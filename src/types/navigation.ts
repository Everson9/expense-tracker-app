import { Expense } from './expense';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type AppStackParamList = {
  Home: undefined;
  Form: { expense?: Expense } | undefined;
};

export type RootStackParamList = AppStackParamList;
