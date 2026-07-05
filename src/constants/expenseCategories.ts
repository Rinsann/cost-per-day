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
  { label: '超市', icon: 'cart-outline' },
  { label: '交通', icon: 'subway-variant' },
  { label: '打车', icon: 'taxi' },
  { label: '购物', icon: 'shopping-outline' },
  { label: '居住', icon: 'home-city-outline' },
  { label: '水电燃气', icon: 'lightbulb-on-outline' },
  { label: '通讯网络', icon: 'cellphone' },
  { label: '娱乐', icon: 'gamepad-variant-outline' },
  { label: '会员订阅', icon: 'movie-open-outline' },
  { label: '医疗', icon: 'pill' },
  { label: '学习', icon: 'bookshelf' },
  { label: '数码', icon: 'laptop' },
  { label: '服饰', icon: 'tshirt-crew-outline' },
  { label: '美妆个护', icon: 'bottle-tonic-outline' },
  { label: '运动健身', icon: 'run' },
  { label: '旅行', icon: 'airplane' },
  { label: '人情社交', icon: 'gift-outline' },
  { label: '宠物', icon: 'cat' },
  { label: '家庭', icon: 'account-group-outline' },
  { label: '维修', icon: 'hammer-wrench' },
  { label: '手续费', icon: 'receipt-text-outline' },
  { label: '还款', icon: 'credit-card-outline' },
  { label: '其他', icon: 'package-variant-closed' }
];

export const incomeCategories: ExpenseCategoryItem[] = [
  { label: '工资', icon: 'briefcase-outline' },
  { label: '奖金', icon: 'trophy-outline' },
  { label: '副业', icon: 'toolbox-outline' },
  { label: '兼职', icon: 'clock-outline' },
  { label: '报销', icon: 'receipt-text-outline' },
  { label: '退款', icon: 'cash-refund' },
  { label: '理财收益', icon: 'chart-line' },
  { label: '红包', icon: 'gift-outline' },
  { label: '礼金', icon: 'gift' },
  { label: '其他', icon: 'cash' }
];

const fallbackIncomeCategories: ExpenseCategoryItem[] = incomeCategories;

export const categoryIconOptions: ExpenseCategoryIcon[] = [
  'food',
  'silverware-fork-knife',
  'coffee-outline',
  'cart-outline',
  'subway-variant',
  'bus',
  'taxi',
  'car-outline',
  'shopping-outline',
  'shopping',
  'home-city-outline',
  'home-outline',
  'lightbulb-on-outline',
  'cellphone',
  'gamepad-variant-outline',
  'movie-open-outline',
  'pill',
  'hospital-box-outline',
  'bookshelf',
  'school-outline',
  'laptop',
  'tshirt-crew-outline',
  'bottle-tonic-outline',
  'run',
  'airplane',
  'gift-outline',
  'gift',
  'cat',
  'account-group-outline',
  'hammer-wrench',
  'receipt-text-outline',
  'credit-card-outline',
  'package-variant-closed',
  'cash',
  'trophy-outline',
  'briefcase-outline',
  'toolbox-outline',
  'clock-outline',
  'cash-refund',
  'wallet-outline',
  'bank-outline',
  'chart-line',
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

export function mergeDefaultCategories(
  existingCategories: ManagedExpenseCategory[],
  defaultCategories: ManagedExpenseCategory[] = getDefaultManagedExpenseCategories()
) {
  const seenCategoryKeys = new Set(
    existingCategories.map((category) => `${category.type}:${category.label.trim()}`)
  );
  const missingDefaults = defaultCategories.filter((category) => {
    const categoryKey = `${category.type}:${category.label.trim()}`;

    if (seenCategoryKeys.has(categoryKey)) {
      return false;
    }

    seenCategoryKeys.add(categoryKey);
    return true;
  });

  return [...existingCategories, ...missingDefaults];
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
