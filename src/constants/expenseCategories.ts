import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type ExpenseCategoryItem = {
  label: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
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
  { label: '退款', icon: 'cash-refund' },
  { label: '其他', icon: 'dots-horizontal-circle-outline' }
];

export function getExpenseCategoryIcon(category: string, type: 'expense' | 'income' = 'expense') {
  const categories = type === 'income' ? incomeCategories : expenseCategories;

  return categories.find((item) => item.label === category)?.icon ?? 'receipt-text-outline';
}
