import { describe, expect, it, jest } from '@jest/globals';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn()
}));

import { ManagedExpenseCategory } from '@/constants/expenseCategories';
import {
  DEFAULT_RECENT_EXPENSE_CATEGORIES,
  sortCategoriesByRecent,
  updateRecentCategories,
  updateRecentCategoryList
} from '@/storage/recentExpenseCategoryStorage';

const expenseCategories: ManagedExpenseCategory[] = [
  { id: 'expense-food', icon: 'food', label: '餐饮', type: 'expense' },
  { id: 'expense-traffic', icon: 'subway-variant', label: '交通', type: 'expense' },
  { id: 'expense-market', icon: 'cart-outline', label: '超市', type: 'expense' }
];

describe('recent expense category storage helpers', () => {
  it('inserts a new category at the front', () => {
    expect(updateRecentCategoryList(['餐饮', '交通'], '超市')).toEqual([
      '超市',
      '餐饮',
      '交通'
    ]);
  });

  it('moves duplicate category to the front', () => {
    expect(updateRecentCategoryList(['餐饮', '交通', '超市'], '交通')).toEqual([
      '交通',
      '餐饮',
      '超市'
    ]);
  });

  it('keeps at most six recent categories', () => {
    expect(updateRecentCategoryList(['1', '2', '3', '4', '5', '6'], '7')).toEqual([
      '7',
      '1',
      '2',
      '3',
      '4',
      '5'
    ]);
  });

  it('updates expense and income lists independently', () => {
    const recentCategories = updateRecentCategories(
      {
        expense: ['餐饮'],
        income: ['工资'],
        updatedAt: ''
      },
      'income',
      '退款'
    );

    expect(recentCategories.expense).toEqual(['餐饮']);
    expect(recentCategories.income).toEqual(['退款', '工资']);
    expect(recentCategories.updatedAt).not.toBe('');
  });

  it('filters missing recent categories when sorting visible categories', () => {
    expect(sortCategoriesByRecent(expenseCategories, ['不存在', '交通', '餐饮'])).toEqual([
      expenseCategories[1],
      expenseCategories[0],
      expenseCategories[2]
    ]);
  });

  it('handles empty data safely', () => {
    expect(updateRecentCategoryList([], '')).toEqual([]);
    expect(sortCategoriesByRecent([], DEFAULT_RECENT_EXPENSE_CATEGORIES.expense)).toEqual([]);
  });
});
