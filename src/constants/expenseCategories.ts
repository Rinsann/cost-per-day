import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import type { ExpenseRecordType } from '@/types/expense';

export type ExpenseCategoryIcon = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type ExpenseCategoryItem = {
  label: string;
  icon: ExpenseCategoryIcon;
};

export type ManagedExpenseCategory = ExpenseCategoryItem & {
  id: string;
  type: ExpenseRecordType;
};

export const expenseCategories: ExpenseCategoryItem[] = [
  { label: '餐饮', icon: 'food' },
  { label: '交通', icon: 'subway-variant' },
  { label: '购物', icon: 'shopping-outline' },
  { label: '居住', icon: 'home-city-outline' },
  { label: '娱乐', icon: 'gamepad-variant-outline' },
  { label: '医疗', icon: 'pill' },
  { label: '学习', icon: 'bookshelf' },
  { label: '其他', icon: 'ticket-percent-outline' }
];

export const incomeCategories: ExpenseCategoryItem[] = [
  { label: '工资', icon: 'cash' },
  { label: '奖金', icon: 'gift-outline' },
  { label: '副业', icon: 'briefcase-outline' },
  { label: '退款', icon: 'cash-refund' }
];

const fallbackIncomeCategories: ExpenseCategoryItem[] = [
  ...incomeCategories,
  { label: '其他', icon: 'dots-horizontal-circle-outline' }
];

export const categoryIconOptions: ExpenseCategoryIcon[] = [
  'food',
  'silverware-fork-knife',
  'coffee-outline',
  'subway-variant',
  'bus',
  'car-outline',
  'shopping-outline',
  'shopping',
  'home-city-outline',
  'home-outline',
  'gamepad-variant-outline',
  'movie-open-outline',
  'pill',
  'hospital-box-outline',
  'bookshelf',
  'school-outline',
  'cash',
  'gift-outline',
  'briefcase-outline',
  'cash-refund',
  'wallet-outline',
  'bank-outline',
  'heart-outline',
  'ticket-percent-outline',
  'dots-horizontal-circle-outline'
];

export function getDefaultManagedExpenseCategories(): ManagedExpenseCategory[] {
  return [
    ...expenseCategories.map((category, index) => ({
      ...category,
      id: `default-expense-${index}`,
      type: 'expense' as const
    })),
    ...incomeCategories.map((category, index) => ({
      ...category,
      id: `default-income-${index}`,
      type: 'income' as const
    }))
  ];
}

export function getExpenseCategoryIcon(
  category: string,
  type: ExpenseRecordType = 'expense',
  managedCategories?: ManagedExpenseCategory[]
) {
  if (managedCategories) {
    const managedIcon = managedCategories.find(
      (item) => item.type === type && item.label === category
    )?.icon;

    if (managedIcon) {
      return managedIcon;
    }
  }

  const categories = type === 'income' ? fallbackIncomeCategories : expenseCategories;

  return categories.find((item) => item.label === category)?.icon ?? 'receipt-text-outline';
}
