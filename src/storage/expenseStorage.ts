import AsyncStorage from '@react-native-async-storage/async-storage';

import { ExpenseRecord } from '@/types/expense';

const EXPENSE_STORAGE_KEY = 'cost_per_day_expense_records';

function isExpenseRecord(value: unknown): value is ExpenseRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Partial<ExpenseRecord>;
  const isValidType =
    record.type === undefined || record.type === 'expense' || record.type === 'income';

  return (
    isValidType &&
    typeof record.id === 'string' &&
    typeof record.amount === 'number' &&
    typeof record.category === 'string' &&
    typeof record.date === 'string' &&
    typeof record.createdAt === 'string'
  );
}

function sortExpenseRecords(records: ExpenseRecord[]) {
  return [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function parseExpenseRecords(rawValue: string | null): ExpenseRecord[] {
  if (!rawValue) {
    return [];
  }

  try {
    const value = JSON.parse(rawValue);

    return Array.isArray(value) ? sortExpenseRecords(value.filter(isExpenseRecord)) : [];
  } catch {
    return [];
  }
}

export async function getExpenseRecords() {
  const rawValue = await AsyncStorage.getItem(EXPENSE_STORAGE_KEY);

  return parseExpenseRecords(rawValue);
}

export async function saveExpenseRecords(records: ExpenseRecord[]) {
  await AsyncStorage.setItem(EXPENSE_STORAGE_KEY, JSON.stringify(sortExpenseRecords(records)));
}

export async function addExpenseRecord(input: Omit<ExpenseRecord, 'id' | 'createdAt'>) {
  const records = await getExpenseRecords();
  const now = new Date().toISOString();
  const record: ExpenseRecord = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now
  };

  await saveExpenseRecords([record, ...records]);

  return record;
}
