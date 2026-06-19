export type ExpenseRecordType = 'expense' | 'income';

export type ExpenseRecord = {
  id: string;
  type?: ExpenseRecordType;
  amount: number;
  category: string;
  note?: string;
  date: string;
  createdAt: string;
};
