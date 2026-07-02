import { describe, expect, it } from '@jest/globals';

import {
  DATA_BACKUP_APP_NAME,
  createDataBackup,
  mergeById,
  parseDataBackup,
  serializeDataBackup
} from '@/utils/dataBackup';
import { ExpenseRecord } from '@/types/expense';
import { Product } from '@/types/product';

const expenseRecords: ExpenseRecord[] = [
  {
    id: 'ledger-1',
    type: 'expense',
    amount: 33.25,
    category: '餐饮',
    note: '午餐',
    date: '2026-06-20',
    createdAt: '2026-06-20T12:00:00.000Z'
  },
  {
    id: 'mock-ledger-202606-0001',
    type: 'income',
    amount: 9000,
    category: '工资',
    note: 'mock 工资',
    date: '2026-06-01',
    createdAt: '2026-06-01T09:00:00.000Z'
  }
];

const products: Product[] = [
  {
    id: 'product-1',
    name: '键盘',
    categoryId: 'digital',
    price: 399,
    purchaseDate: '2026-01-01',
    targetDailyCost: 1,
    note: '办公',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z'
  }
];

const monthlyBudget = {
  amount: 2600,
  enabled: true,
  updatedAt: '2026-07-02T08:00:00.000Z'
};

const defaultMonthlyBudget = {
  amount: 0,
  enabled: false,
  updatedAt: ''
};

describe('dataBackup utilities', () => {
  it('creates a ledger backup and excludes mock records by default', () => {
    const backup = createDataBackup({
      type: 'ledger',
      expenseRecords,
      products,
      exportedAt: '2026-06-20T12:00:00.000Z'
    });

    expect(backup).toEqual({
      schemaVersion: 1,
      appName: DATA_BACKUP_APP_NAME,
      exportedAt: '2026-06-20T12:00:00.000Z',
      type: 'ledger',
      data: {
        expenseRecords: [expenseRecords[0]],
        products: []
      }
    });
  });

  it('creates products and full backups with the same schema shape', () => {
    const productsBackup = createDataBackup({
      type: 'products',
      expenseRecords,
      products,
      exportedAt: '2026-06-20T12:00:00.000Z'
    });
    const fullBackup = createDataBackup({
      type: 'full',
      expenseRecords,
      products,
      monthlyBudget,
      exportedAt: '2026-06-20T12:00:00.000Z'
    });

    expect(productsBackup.data.expenseRecords).toEqual([]);
    expect(productsBackup.data.products).toEqual(products);
    expect(fullBackup.data.expenseRecords).toEqual([expenseRecords[0]]);
    expect(fullBackup.data.products).toEqual(products);
    expect(fullBackup.data.monthlyBudget).toEqual(monthlyBudget);
  });

  it('parses a valid backup after serialization', () => {
    const backup = createDataBackup({
      type: 'full',
      expenseRecords,
      products,
      monthlyBudget,
      exportedAt: '2026-06-20T12:00:00.000Z'
    });
    const parsed = parseDataBackup(serializeDataBackup(backup));

    expect(parsed).toEqual({
      ok: true,
      backup
    });
  });

  it('includes monthly budget in full backups', () => {
    const backup = createDataBackup({
      type: 'full',
      expenseRecords,
      products,
      monthlyBudget,
      exportedAt: '2026-06-20T12:00:00.000Z'
    });

    expect(backup.data.monthlyBudget).toEqual(monthlyBudget);
  });

  it('parses old full backups without monthly budget as default budget', () => {
    const parsed = parseDataBackup(
      JSON.stringify({
        schemaVersion: 1,
        appName: DATA_BACKUP_APP_NAME,
        exportedAt: '2026-06-20T12:00:00.000Z',
        type: 'full',
        data: {
          expenseRecords: [expenseRecords[0]],
          products
        }
      })
    );

    expect(parsed).toEqual({
      ok: true,
      backup: {
        schemaVersion: 1,
        appName: DATA_BACKUP_APP_NAME,
        exportedAt: '2026-06-20T12:00:00.000Z',
        type: 'full',
        data: {
          expenseRecords: [expenseRecords[0]],
          products,
          monthlyBudget: defaultMonthlyBudget
        }
      }
    });
  });

  it('falls back to default budget when monthly budget field is invalid', () => {
    const parsed = parseDataBackup(
      JSON.stringify({
        schemaVersion: 1,
        appName: DATA_BACKUP_APP_NAME,
        exportedAt: '2026-06-20T12:00:00.000Z',
        type: 'full',
        data: {
          expenseRecords: [],
          products: [],
          monthlyBudget: {
            amount: 'bad',
            enabled: true,
            updatedAt: 123
          }
        }
      })
    );

    expect(parsed).toEqual({
      ok: true,
      backup: {
        schemaVersion: 1,
        appName: DATA_BACKUP_APP_NAME,
        exportedAt: '2026-06-20T12:00:00.000Z',
        type: 'full',
        data: {
          expenseRecords: [],
          products: [],
          monthlyBudget: defaultMonthlyBudget
        }
      }
    });
  });

  it('backs up and parses disabled zero monthly budget', () => {
    const disabledBudget = {
      amount: 0,
      enabled: false,
      updatedAt: '2026-07-02T08:00:00.000Z'
    };
    const backup = createDataBackup({
      type: 'full',
      expenseRecords: [],
      products: [],
      monthlyBudget: disabledBudget,
      exportedAt: '2026-06-20T12:00:00.000Z'
    });

    expect(parseDataBackup(serializeDataBackup(backup))).toEqual({
      ok: true,
      backup
    });
  });

  it('rejects invalid JSON, unsupported schema, and invalid records', () => {
    expect(parseDataBackup('{')).toEqual({
      ok: false,
      reason: 'invalid-json'
    });
    expect(
      parseDataBackup(
        JSON.stringify({
          schemaVersion: 999,
          appName: DATA_BACKUP_APP_NAME,
          exportedAt: '2026-06-20T12:00:00.000Z',
          type: 'ledger',
          data: { expenseRecords: [], products: [] }
        })
      )
    ).toEqual({
      ok: false,
      reason: 'invalid-schema'
    });
    expect(
      parseDataBackup(
        JSON.stringify({
          schemaVersion: 1,
          appName: DATA_BACKUP_APP_NAME,
          exportedAt: '2026-06-20T12:00:00.000Z',
          type: 'ledger',
          data: { expenseRecords: [{ id: 'bad' }], products: [] }
        })
      )
    ).toEqual({
      ok: false,
      reason: 'invalid-format'
    });
  });

  it('merges imported items by id without overwriting local data', () => {
    const local = [{ id: 'same', value: 'local' }];
    const imported = [
      { id: 'same', value: 'imported' },
      { id: 'new', value: 'new item' }
    ];

    expect(mergeById(local, imported)).toEqual({
      merged: [
        { id: 'same', value: 'local' },
        { id: 'new', value: 'new item' }
      ],
      addedCount: 1,
      skippedCount: 1
    });
  });
});
