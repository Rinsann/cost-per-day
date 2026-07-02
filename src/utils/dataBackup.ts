import { ExpenseRecord } from '@/types/expense';
import { Product, ProductCategoryId } from '@/types/product';
import { isValidDateString } from '@/utils/formatDate';
import type { MonthlyBudget } from '@/storage/monthlyBudgetStorage';

export const DATA_BACKUP_SCHEMA_VERSION = 1;
export const DATA_BACKUP_APP_NAME = '算得值';
export const MOCK_LEDGER_PREFIX = 'mock-ledger-';

export type DataBackupType = 'ledger' | 'products' | 'full';

export type DataBackup = {
  schemaVersion: typeof DATA_BACKUP_SCHEMA_VERSION;
  appName: typeof DATA_BACKUP_APP_NAME;
  exportedAt: string;
  type: DataBackupType;
  data: {
    expenseRecords: ExpenseRecord[];
    products: Product[];
    monthlyBudget?: MonthlyBudget;
  };
};

export type DataBackupParseResult =
  | {
      ok: true;
      backup: DataBackup;
    }
  | {
      ok: false;
      reason:
        | 'invalid-json'
        | 'invalid-format'
        | 'invalid-schema'
        | 'unsupported-type';
    };

export type MergeByIdResult<T> = {
  merged: T[];
  addedCount: number;
  skippedCount: number;
};

const PRODUCT_CATEGORY_IDS: ProductCategoryId[] = [
  'digital',
  'computer',
  'phone',
  'monitor',
  'headphone',
  'tablet',
  'appliance',
  'furniture',
  'transport',
  'office',
  'other'
];

const DEFAULT_BACKUP_MONTHLY_BUDGET: MonthlyBudget = {
  amount: 0,
  enabled: false,
  updatedAt: ''
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidTimestamp(value: string) {
  return value.trim().length > 0 && !Number.isNaN(Date.parse(value));
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function parseExpenseRecord(value: unknown): ExpenseRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  const { id, type, amount, category, note, date, createdAt } = value;

  if (
    typeof id !== 'string' ||
    id.trim().length === 0 ||
    (type !== undefined && type !== 'expense' && type !== 'income') ||
    !isPositiveNumber(amount) ||
    typeof category !== 'string' ||
    category.trim().length === 0 ||
    typeof date !== 'string' ||
    !isValidDateString(date) ||
    typeof createdAt !== 'string' ||
    !isValidTimestamp(createdAt)
  ) {
    return null;
  }

  if (note !== undefined && typeof note !== 'string') {
    return null;
  }

  return {
    id,
    type: type as ExpenseRecord['type'],
    amount,
    category,
    note,
    date,
    createdAt
  };
}

function parseProduct(value: unknown): Product | null {
  if (!isRecord(value)) {
    return null;
  }

  const {
    id,
    name,
    categoryId,
    price,
    purchaseDate,
    targetDailyCost,
    note,
    createdAt,
    updatedAt
  } = value;

  if (
    typeof id !== 'string' ||
    id.trim().length === 0 ||
    typeof name !== 'string' ||
    name.trim().length === 0 ||
    typeof categoryId !== 'string' ||
    !PRODUCT_CATEGORY_IDS.includes(categoryId as ProductCategoryId) ||
    !isPositiveNumber(price) ||
    typeof purchaseDate !== 'string' ||
    !isValidDateString(purchaseDate) ||
    typeof createdAt !== 'string' ||
    !isValidTimestamp(createdAt) ||
    typeof updatedAt !== 'string' ||
    !isValidTimestamp(updatedAt)
  ) {
    return null;
  }

  if (note !== undefined && typeof note !== 'string') {
    return null;
  }

  if (targetDailyCost !== undefined && !isPositiveNumber(targetDailyCost)) {
    return null;
  }

  return {
    id,
    name,
    categoryId: categoryId as ProductCategoryId,
    price,
    purchaseDate,
    targetDailyCost,
    note,
    createdAt,
    updatedAt
  };
}

function normalizeMonthlyBudget(value: unknown): MonthlyBudget {
  if (!isRecord(value)) {
    return DEFAULT_BACKUP_MONTHLY_BUDGET;
  }

  const { amount, enabled, updatedAt } = value;

  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
    return DEFAULT_BACKUP_MONTHLY_BUDGET;
  }

  if (typeof enabled !== 'boolean') {
    return DEFAULT_BACKUP_MONTHLY_BUDGET;
  }

  return {
    amount,
    enabled: enabled && amount > 0,
    updatedAt: typeof updatedAt === 'string' ? updatedAt : ''
  };
}

function parseArray<T>(value: unknown, parser: (item: unknown) => T | null) {
  if (!Array.isArray(value)) {
    return null;
  }

  const parsedItems = value.map(parser);

  if (parsedItems.some((item) => item === null)) {
    return null;
  }

  return parsedItems as T[];
}

export function isMockLedgerRecord(record: Pick<ExpenseRecord, 'id'>) {
  return record.id.startsWith(MOCK_LEDGER_PREFIX);
}

export function createDataBackup({
  type,
  expenseRecords,
  products,
  monthlyBudget,
  exportedAt = new Date().toISOString()
}: {
  type: DataBackupType;
  expenseRecords?: ExpenseRecord[];
  products?: Product[];
  monthlyBudget?: MonthlyBudget;
  exportedAt?: string;
}): DataBackup {
  const realExpenseRecords = (expenseRecords ?? []).filter(
    (record) => !isMockLedgerRecord(record)
  );

  const data: DataBackup['data'] = {
    expenseRecords: type === 'products' ? [] : realExpenseRecords,
    products: type === 'ledger' ? [] : products ?? []
  };

  if (type === 'full') {
    data.monthlyBudget = normalizeMonthlyBudget(monthlyBudget);
  }

  return {
    schemaVersion: DATA_BACKUP_SCHEMA_VERSION,
    appName: DATA_BACKUP_APP_NAME,
    exportedAt,
    type,
    data
  };
}

export function serializeDataBackup(backup: DataBackup) {
  return JSON.stringify(backup, null, 2);
}

export function parseDataBackup(rawJson: string): DataBackupParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return {
      ok: false,
      reason: 'invalid-json'
    };
  }

  if (!isRecord(parsed)) {
    return {
      ok: false,
      reason: 'invalid-format'
    };
  }

  if (parsed.schemaVersion !== DATA_BACKUP_SCHEMA_VERSION) {
    return {
      ok: false,
      reason: 'invalid-schema'
    };
  }

  if (parsed.type !== 'ledger' && parsed.type !== 'products' && parsed.type !== 'full') {
    return {
      ok: false,
      reason: 'unsupported-type'
    };
  }

  if (
    parsed.appName !== DATA_BACKUP_APP_NAME ||
    typeof parsed.exportedAt !== 'string' ||
    !isValidTimestamp(parsed.exportedAt) ||
    !isRecord(parsed.data)
  ) {
    return {
      ok: false,
      reason: 'invalid-format'
    };
  }

  const expenseRecords = parseArray(parsed.data.expenseRecords, parseExpenseRecord);
  const products = parseArray(parsed.data.products, parseProduct);

  if (!expenseRecords || !products) {
    return {
      ok: false,
      reason: 'invalid-format'
    };
  }

  return {
    ok: true,
    backup: {
      schemaVersion: DATA_BACKUP_SCHEMA_VERSION,
      appName: DATA_BACKUP_APP_NAME,
      exportedAt: parsed.exportedAt,
      type: parsed.type,
      data: {
        expenseRecords,
        products,
        ...(parsed.type === 'full'
          ? { monthlyBudget: normalizeMonthlyBudget(parsed.data.monthlyBudget) }
          : {})
      }
    }
  };
}

export function mergeById<T extends { id: string }>(
  localItems: T[],
  importedItems: T[]
): MergeByIdResult<T> {
  const localIds = new Set(localItems.map((item) => item.id));
  const addedItems: T[] = [];
  let skippedCount = 0;

  importedItems.forEach((item) => {
    if (localIds.has(item.id)) {
      skippedCount += 1;
      return;
    }

    localIds.add(item.id);
    addedItems.push(item);
  });

  return {
    merged: [...localItems, ...addedItems],
    addedCount: addedItems.length,
    skippedCount
  };
}

export function getBackupFileName(type: DataBackupType) {
  const suffix: Record<DataBackupType, string> = {
    ledger: 'ledger',
    products: 'products',
    full: 'full'
  };

  return `suandezhi-${suffix[type]}-backup.json`;
}
