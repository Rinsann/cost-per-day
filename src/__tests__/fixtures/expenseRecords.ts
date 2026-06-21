import { ExpenseRecord } from '@/types/expense';

export const expenseRecordFixtures: ExpenseRecord[] = [
  {
    id: 'fixture-2025-income',
    type: 'income',
    amount: 8000,
    category: '工资',
    note: '年末工资',
    date: '2025-12-31',
    createdAt: '2025-12-31T09:00:00.000Z'
  },
  {
    id: 'fixture-jan-expense',
    type: 'expense',
    amount: 20,
    category: '餐饮',
    note: '午餐',
    date: '2026-01-15',
    createdAt: '2026-01-15T04:00:00.000Z'
  },
  {
    id: 'fixture-q1-income',
    type: 'income',
    amount: 9000,
    category: '工资',
    note: '三月工资',
    date: '2026-03-20',
    createdAt: '2026-03-20T09:00:00.000Z'
  },
  {
    id: 'fixture-q2-shopping',
    type: 'expense',
    amount: 100,
    category: '购物',
    note: '电子配件',
    date: '2026-04-01',
    createdAt: '2026-04-01T10:00:00.000Z'
  },
  {
    id: 'fixture-june-meal',
    type: 'expense',
    amount: 46.4,
    category: '餐饮',
    note: '三餐',
    date: '2026-06-18',
    createdAt: '2026-06-18T12:00:00.000Z'
  },
  {
    id: 'fixture-june-salary',
    type: 'income',
    amount: 9000,
    category: '工资',
    note: '工资',
    date: '2026-06-19',
    createdAt: '2026-06-19T09:00:00.000Z'
  },
  {
    id: 'fixture-june-tea',
    type: 'expense',
    amount: 9,
    category: '餐饮',
    note: '奶茶',
    date: '2026-06-19',
    createdAt: '2026-06-19T12:00:00.000Z'
  },
  {
    id: 'fixture-june-shopping',
    type: 'expense',
    amount: 33.25,
    category: '购物',
    note: '食材 test',
    date: '2026-06-20',
    createdAt: '2026-06-20T10:00:00.000Z'
  },
  {
    id: 'fixture-june-side-income',
    type: 'income',
    amount: 1200,
    category: '副业',
    note: 'freelance',
    date: '2026-06-20',
    createdAt: '2026-06-20T11:00:00.000Z'
  }
];
