import { Expense } from './expense';

export type RootStackParamList = {
  Home: undefined;
  Form: { expense?: Expense } | undefined;
};
