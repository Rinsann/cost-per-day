import { Product } from '@/types/product';

type BackupParseResult =
  | {
      ok: true;
      products: Product[];
    }
  | {
      ok: false;
      reason: 'invalid-json' | 'invalid-format';
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidDateString(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
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
    typeof name !== 'string' ||
    typeof categoryId !== 'string' ||
    typeof price !== 'number' ||
    price <= 0 ||
    typeof purchaseDate !== 'string' ||
    !isValidDateString(purchaseDate) ||
    typeof createdAt !== 'string' ||
    typeof updatedAt !== 'string'
  ) {
    return null;
  }

  if (note !== undefined && typeof note !== 'string') {
    return null;
  }

  if (
    targetDailyCost !== undefined &&
    (typeof targetDailyCost !== 'number' || targetDailyCost <= 0)
  ) {
    return null;
  }

  return {
    id,
    name,
    categoryId: categoryId as Product['categoryId'],
    price,
    purchaseDate,
    targetDailyCost,
    note,
    createdAt,
    updatedAt
  };
}

export function parseCostPerDayBackup(rawJson: string): BackupParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return {
      ok: false,
      reason: 'invalid-json'
    };
  }

  if (!isRecord(parsed) || parsed.app !== 'Cost Per Day' || !Array.isArray(parsed.products)) {
    return {
      ok: false,
      reason: 'invalid-format'
    };
  }

  const products = parsed.products.map(parseProduct);

  if (products.some((product) => product === null)) {
    return {
      ok: false,
      reason: 'invalid-format'
    };
  }

  return {
    ok: true,
    products: products as Product[]
  };
}
