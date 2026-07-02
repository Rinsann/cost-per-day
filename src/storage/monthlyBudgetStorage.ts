import AsyncStorage from '@react-native-async-storage/async-storage';

export type MonthlyBudget = {
  amount: number;
  enabled: boolean;
  updatedAt: string;
};

const MONTHLY_BUDGET_STORAGE_KEY = 'cost-per-day:monthly-budget';

export const DEFAULT_MONTHLY_BUDGET: MonthlyBudget = {
  amount: 0,
  enabled: false,
  updatedAt: ''
};

function isMonthlyBudget(value: unknown): value is MonthlyBudget {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const budget = value as Partial<MonthlyBudget>;

  return (
    typeof budget.amount === 'number' &&
    Number.isFinite(budget.amount) &&
    budget.amount >= 0 &&
    typeof budget.enabled === 'boolean' &&
    typeof budget.updatedAt === 'string'
  );
}

function parseMonthlyBudget(rawValue: string | null): MonthlyBudget {
  if (!rawValue) {
    return DEFAULT_MONTHLY_BUDGET;
  }

  try {
    const value = JSON.parse(rawValue);

    return isMonthlyBudget(value) ? value : DEFAULT_MONTHLY_BUDGET;
  } catch {
    return DEFAULT_MONTHLY_BUDGET;
  }
}

export async function getMonthlyBudget() {
  try {
    const rawValue = await AsyncStorage.getItem(MONTHLY_BUDGET_STORAGE_KEY);

    return parseMonthlyBudget(rawValue);
  } catch {
    return DEFAULT_MONTHLY_BUDGET;
  }
}

export async function saveMonthlyBudget(input: Pick<MonthlyBudget, 'amount' | 'enabled'>) {
  const amount = Number.isFinite(input.amount) ? Math.max(input.amount, 0) : 0;
  const budget: MonthlyBudget = {
    amount,
    enabled: input.enabled && amount > 0,
    updatedAt: new Date().toISOString()
  };

  await AsyncStorage.setItem(MONTHLY_BUDGET_STORAGE_KEY, JSON.stringify(budget));

  return budget;
}

export async function restoreMonthlyBudget(input: MonthlyBudget) {
  const amount = Number.isFinite(input.amount) ? Math.max(input.amount, 0) : 0;
  const budget: MonthlyBudget = {
    amount,
    enabled: input.enabled && amount > 0,
    updatedAt: typeof input.updatedAt === 'string' ? input.updatedAt : ''
  };

  await AsyncStorage.setItem(MONTHLY_BUDGET_STORAGE_KEY, JSON.stringify(budget));

  return budget;
}
