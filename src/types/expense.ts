export type Category =
  | 'alimentação'
  | 'transporte'
  | 'lazer'
  | 'saúde'
  | 'moradia'
  | 'outros';

export type TransactionType = 'despesa' | 'receita';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: Category;
  type: TransactionType;
  recorrente: boolean;
  recorrente_id?: string | null;
  date: string;
  description?: string;
  created_at?: string;
}

export type CreateExpenseDTO = Omit<Expense, 'id' | 'created_at'>;
export type UpdateExpenseDTO = Partial<CreateExpenseDTO>;
