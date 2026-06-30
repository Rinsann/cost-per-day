import {
  addExpenseRecord,
  getExpenseRecords,
  saveExpenseRecords
} from '@/storage/expenseStorage';
import { ExpenseRecord, ExpenseRecordType } from '@/types/expense';

export type LedgerRecordInput = Omit<ExpenseRecord, 'id' | 'createdAt'>;
export type LedgerRecordPatch = Partial<Omit<ExpenseRecord, 'id' | 'createdAt'>>;

function sortRecords(records: ExpenseRecord[]) {
  return [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const ledgerRepository = {
  async getAllRecords() {
    return getExpenseRecords();
  },

  async getRecordById(id: string) {
    const records = await getExpenseRecords();

    return records.find((record) => record.id === id) ?? null;
  },

  async createRecord(recordInput: LedgerRecordInput) {
    return addExpenseRecord(recordInput);
  },

  async saveAllRecords(records: ExpenseRecord[]) {
    await saveExpenseRecords(sortRecords(records));
  },

  async updateRecord(id: string, patch: LedgerRecordPatch) {
    const records = await getExpenseRecords();
    let updatedRecord: ExpenseRecord | null = null;

    const nextRecords = records.map((record) => {
      if (record.id !== id) {
        return record;
      }

      updatedRecord = {
        ...record,
        ...patch,
        id: record.id,
        createdAt: record.createdAt
      };

      return updatedRecord;
    });

    if (!updatedRecord) {
      return null;
    }

    await saveExpenseRecords(sortRecords(nextRecords));

    return updatedRecord;
  },

  async renameCategory(type: ExpenseRecordType, oldCategory: string, newCategory: string) {
    if (oldCategory === newCategory) {
      return 0;
    }

    const records = await getExpenseRecords();
    let updatedCount = 0;

    const nextRecords = records.map((record) => {
      const recordType = record.type === 'income' ? 'income' : 'expense';

      if (recordType !== type || record.category !== oldCategory) {
        return record;
      }

      updatedCount += 1;

      return {
        ...record,
        category: newCategory
      };
    });

    if (updatedCount > 0) {
      await saveExpenseRecords(sortRecords(nextRecords));
    }

    return updatedCount;
  },

  async deleteRecord(id: string) {
    const records = await getExpenseRecords();
    const nextRecords = records.filter((record) => record.id !== id);

    if (nextRecords.length === records.length) {
      return false;
    }

    await saveExpenseRecords(nextRecords);

    return true;
  }
};
