import { ExpenseRecord, ExpenseRecordType } from '@/types/expense';
import { formatRelativeDateLabel } from '@/utils/formatDate';

export type ExpenseRecordSummary = {
  expense: number;
  income: number;
};

export type ExpenseRecordDateGroup = {
  date: string;
  label: string;
  records: ExpenseRecord[];
  summary: ExpenseRecordSummary;
};

export function getDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getMonthString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${year}-${month}`;
}

export function getRecordType(record: ExpenseRecord): ExpenseRecordType {
  return record.type === 'income' ? 'income' : 'expense';
}

export function isRecordInDateRange(record: ExpenseRecord, startDate: string, endDate: string) {
  return record.date >= startDate && record.date <= endDate;
}

export function sortExpenseRecords(records: ExpenseRecord[]) {
  return [...records].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function getDailySummary(records: ExpenseRecord[]) {
  return records.reduce<ExpenseRecordSummary>(
    (summary, record) => {
      if (getRecordType(record) === 'income') {
        summary.income += record.amount;
      } else {
        summary.expense += record.amount;
      }

      return summary;
    },
    { expense: 0, income: 0 }
  );
}

export function getDateLabel(date: string, today = new Date()) {
  return formatRelativeDateLabel(date, today);
}

export function groupExpenseRecordsByDate(records: ExpenseRecord[], today = new Date()) {
  const groupedRecords = new Map<string, ExpenseRecord[]>();

  sortExpenseRecords(records).forEach((record) => {
    const groupRecords = groupedRecords.get(record.date) ?? [];

    groupRecords.push(record);
    groupedRecords.set(record.date, groupRecords);
  });

  return Array.from(groupedRecords.entries()).map<ExpenseRecordDateGroup>(([date, groupRecords]) => ({
    date,
    label: getDateLabel(date, today),
    records: groupRecords,
    summary: getDailySummary(groupRecords)
  }));
}
