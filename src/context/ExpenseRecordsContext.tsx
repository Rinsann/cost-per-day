import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { addExpenseRecord, getExpenseRecords } from '@/storage/expenseStorage';
import { ExpenseRecord } from '@/types/expense';

type AddExpenseRecordInput = Omit<ExpenseRecord, 'id' | 'createdAt'>;

type ExpenseRecordsContextValue = {
  records: ExpenseRecord[];
  addRecord: (input: AddExpenseRecordInput) => Promise<ExpenseRecord>;
  refreshRecords: () => Promise<void>;
};

const ExpenseRecordsContext = createContext<ExpenseRecordsContextValue | null>(null);

function sortRecords(records: ExpenseRecord[]) {
  return [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function ExpenseRecordsProvider({ children }: PropsWithChildren) {
  const [records, setRecords] = useState<ExpenseRecord[]>([]);

  const refreshRecords = useCallback(async () => {
    const storedRecords = await getExpenseRecords();
    setRecords(storedRecords);
  }, []);

  const addRecord = useCallback(async (input: AddExpenseRecordInput) => {
    const record = await addExpenseRecord(input);

    setRecords((currentRecords) => sortRecords([record, ...currentRecords]));

    return record;
  }, []);

  useEffect(() => {
    refreshRecords().catch(() => {
      setRecords([]);
    });
  }, [refreshRecords]);

  const value = useMemo(
    () => ({
      records,
      addRecord,
      refreshRecords
    }),
    [addRecord, records, refreshRecords]
  );

  return (
    <ExpenseRecordsContext.Provider value={value}>{children}</ExpenseRecordsContext.Provider>
  );
}

export function useExpenseRecords() {
  const context = useContext(ExpenseRecordsContext);

  if (!context) {
    throw new Error('useExpenseRecords must be used inside ExpenseRecordsProvider.');
  }

  return context;
}
