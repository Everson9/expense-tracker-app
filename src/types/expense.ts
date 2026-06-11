export type Category =
  | 'alimentação'
  | 'transporte'
  | 'lazer'
  | 'saúde'
  | 'moradia'
  | 'outros';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: Category;
  date: string;
  description?: string;
  created_at?: string;
}

export type CreateExpenseDTO = Omit<Expense, 'id' | 'created_at'>;
export type UpdateExpenseDTO = Partial<CreateExpenseDTO>;
