import AsyncStorage from '@react-native-async-storage/async-storage';

import { ManagedExpenseCategory } from '@/constants/expenseCategories';
import { ExpenseRecordType } from '@/types/expense';

const RECENT_EXPENSE_CATEGORY_STORAGE_KEY = 'cost-per-day:recent-expense-categories';
const MAX_RECENT_CATEGORY_COUNT = 6;

export type RecentExpenseCategories = {
  expense: string[];
  income: string[];
  updatedAt: string;
};

export const DEFAULT_RECENT_EXPENSE_CATEGORIES: RecentExpenseCategories = {
  expense: [],
  income: [],
  updatedAt: ''
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function normalizeRecentList(value: unknown) {
  if (!isStringArray(value)) {
    return [];
  }

  return value
    .map((item) => item.trim())
    .filter((item, index, list) => item.length > 0 && list.indexOf(item) === index)
    .slice(0, MAX_RECENT_CATEGORY_COUNT);
}

function parseRecentCategories(rawValue: string | null): RecentExpenseCategories {
  if (!rawValue) {
    return DEFAULT_RECENT_EXPENSE_CATEGORIES;
  }

  try {
    const value = JSON.parse(rawValue) as Partial<RecentExpenseCategories>;

    if (!value || typeof value !== 'object') {
      return DEFAULT_RECENT_EXPENSE_CATEGORIES;
    }

    return {
      expense: normalizeRecentList(value.expense),
      income: normalizeRecentList(value.income),
      updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : ''
    };
  } catch {
    return DEFAULT_RECENT_EXPENSE_CATEGORIES;
  }
}

export function updateRecentCategoryList(
  list: string[],
  category: string,
  maxCount = MAX_RECENT_CATEGORY_COUNT
) {
  const normalizedCategory = category.trim();

  if (!normalizedCategory) {
    return list.slice(0, maxCount);
  }

  return [
    normalizedCategory,
    ...list.filter((item) => item.trim() !== normalizedCategory)
  ].slice(0, maxCount);
}

export function updateRecentCategories(
  recentCategories: RecentExpenseCategories,
  type: ExpenseRecordType,
  category: string
): RecentExpenseCategories {
  return {
    ...recentCategories,
    [type]: updateRecentCategoryList(recentCategories[type], category),
    updatedAt: new Date().toISOString()
  };
}

export function sortCategoriesByRecent(
  categories: ManagedExpenseCategory[],
  recentLabels: string[]
) {
  const categoryByLabel = new Map(categories.map((category) => [category.label, category]));
  const recentCategories = recentLabels
    .map((label) => categoryByLabel.get(label))
    .filter((category): category is ManagedExpenseCategory => Boolean(category));
  const recentCategoryLabels = new Set(recentCategories.map((category) => category.label));

  return [
    ...recentCategories,
    ...categories.filter((category) => !recentCategoryLabels.has(category.label))
  ];
}

export async function getRecentExpenseCategories() {
  try {
    const rawValue = await AsyncStorage.getItem(RECENT_EXPENSE_CATEGORY_STORAGE_KEY);

    return parseRecentCategories(rawValue);
  } catch {
    return DEFAULT_RECENT_EXPENSE_CATEGORIES;
  }
}

export async function saveRecentExpenseCategory(type: ExpenseRecordType, category: string) {
  try {
    const recentCategories = await getRecentExpenseCategories();
    const nextRecentCategories = updateRecentCategories(recentCategories, type, category);

    await AsyncStorage.setItem(
      RECENT_EXPENSE_CATEGORY_STORAGE_KEY,
      JSON.stringify(nextRecentCategories)
    );

    return nextRecentCategories;
  } catch {
    return null;
  }
}
