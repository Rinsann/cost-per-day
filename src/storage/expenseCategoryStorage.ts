import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  ExpenseCategoryIcon,
  getDefaultManagedExpenseCategories,
  mergeDefaultCategories,
  ManagedExpenseCategory
} from '@/constants/expenseCategories';
import { measureAsyncTime } from '@/utils/perf';

const EXPENSE_CATEGORY_STORAGE_KEY = 'cost_per_day_expense_categories';

function isManagedExpenseCategory(value: unknown): value is ManagedExpenseCategory {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const category = value as Partial<ManagedExpenseCategory>;

  return (
    typeof category.id === 'string' &&
    (category.type === 'expense' || category.type === 'income') &&
    typeof category.label === 'string' &&
    category.label.trim().length > 0 &&
    typeof category.icon === 'string'
  );
}

function normalizeCategories(categories: ManagedExpenseCategory[]) {
  const nextCategories = categories.map((category) => ({
    ...category,
    icon: category.icon as ExpenseCategoryIcon,
    label: category.label.trim()
  }));

  return mergeDefaultCategories(nextCategories);
}

function parseExpenseCategories(rawValue: string | null): ManagedExpenseCategory[] {
  if (!rawValue) {
    return getDefaultManagedExpenseCategories();
  }

  try {
    const value = JSON.parse(rawValue);

    return Array.isArray(value)
      ? normalizeCategories(value.filter(isManagedExpenseCategory))
      : getDefaultManagedExpenseCategories();
  } catch {
    return getDefaultManagedExpenseCategories();
  }
}

export async function getExpenseCategories() {
  return await measureAsyncTime('categories.storage.getExpenseCategories', async () => {
    try {
      const rawValue = await AsyncStorage.getItem(EXPENSE_CATEGORY_STORAGE_KEY);
      const categories = parseExpenseCategories(rawValue);

      if (rawValue) {
        await AsyncStorage.setItem(EXPENSE_CATEGORY_STORAGE_KEY, JSON.stringify(categories));
      }

      return categories;
    } catch {
      return getDefaultManagedExpenseCategories();
    }
  });
}

export async function saveExpenseCategories(categories: ManagedExpenseCategory[]) {
  await measureAsyncTime(
    'categories.storage.saveExpenseCategories',
    () =>
      AsyncStorage.setItem(
        EXPENSE_CATEGORY_STORAGE_KEY,
        JSON.stringify(normalizeCategories(categories))
      ),
    { categoriesCount: categories.length }
  );
}
