import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  ExpenseCategoryIcon,
  getDefaultManagedExpenseCategories,
  ManagedExpenseCategory
} from '@/constants/expenseCategories';

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
  const hasExpenseCategory = nextCategories.some((category) => category.type === 'expense');
  const hasIncomeCategory = nextCategories.some((category) => category.type === 'income');

  if (hasExpenseCategory && hasIncomeCategory) {
    return nextCategories;
  }

  const defaultCategories = getDefaultManagedExpenseCategories();

  return [
    ...(hasExpenseCategory
      ? nextCategories.filter((category) => category.type === 'expense')
      : defaultCategories.filter((category) => category.type === 'expense')),
    ...(hasIncomeCategory
      ? nextCategories.filter((category) => category.type === 'income')
      : defaultCategories.filter((category) => category.type === 'income'))
  ];
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
  const rawValue = await AsyncStorage.getItem(EXPENSE_CATEGORY_STORAGE_KEY);

  return parseExpenseCategories(rawValue);
}

export async function saveExpenseCategories(categories: ManagedExpenseCategory[]) {
  await AsyncStorage.setItem(
    EXPENSE_CATEGORY_STORAGE_KEY,
    JSON.stringify(normalizeCategories(categories))
  );
}
