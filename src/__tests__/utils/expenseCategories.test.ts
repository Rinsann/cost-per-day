import { describe, expect, it } from '@jest/globals';

import {
  expenseCategories,
  getDefaultManagedExpenseCategories,
  incomeCategories,
  ManagedExpenseCategory,
  mergeDefaultCategories
} from '@/constants/expenseCategories';

describe('expense category defaults', () => {
  it('provides expanded expense and income defaults', () => {
    expect(expenseCategories).toHaveLength(24);
    expect(incomeCategories).toHaveLength(10);
    expect(expenseCategories.map((category) => category.label)).toEqual([
      '餐饮',
      '超市',
      '交通',
      '打车',
      '购物',
      '居住',
      '水电燃气',
      '通讯网络',
      '娱乐',
      '会员订阅',
      '医疗',
      '学习',
      '数码',
      '服饰',
      '美妆个护',
      '运动健身',
      '旅行',
      '人情社交',
      '宠物',
      '家庭',
      '维修',
      '手续费',
      '还款',
      '其他'
    ]);
    expect(incomeCategories.map((category) => category.label)).toEqual([
      '工资',
      '奖金',
      '副业',
      '兼职',
      '报销',
      '退款',
      '理财收益',
      '红包',
      '礼金',
      '其他'
    ]);
  });

  it('returns full defaults when existing categories are empty', () => {
    const mergedCategories = mergeDefaultCategories([]);

    expect(mergedCategories).toEqual(getDefaultManagedExpenseCategories());
  });

  it('appends missing defaults for partial existing categories', () => {
    const existingCategories: ManagedExpenseCategory[] = [
      {
        id: 'old-expense-food',
        icon: 'silverware-fork-knife',
        label: '餐饮',
        type: 'expense'
      },
      {
        id: 'old-income-salary',
        icon: 'cash',
        label: '工资',
        type: 'income'
      }
    ];
    const mergedCategories = mergeDefaultCategories(existingCategories);

    expect(mergedCategories.slice(0, existingCategories.length)).toEqual(existingCategories);
    expect(mergedCategories.filter((category) => category.type === 'expense')).toHaveLength(24);
    expect(mergedCategories.filter((category) => category.type === 'income')).toHaveLength(10);
    expect(
      mergedCategories.filter((category) => category.type === 'expense' && category.label === '超市')
    ).toHaveLength(1);
  });

  it('does not duplicate existing labels and preserves existing icons', () => {
    const existingCategory: ManagedExpenseCategory = {
      id: 'custom-food',
      icon: 'coffee-outline',
      label: '餐饮',
      type: 'expense'
    };
    const mergedCategories = mergeDefaultCategories([existingCategory]);
    const foodCategories = mergedCategories.filter(
      (category) => category.type === 'expense' && category.label === '餐饮'
    );

    expect(foodCategories).toEqual([existingCategory]);
  });

  it('keeps user custom categories', () => {
    const customCategory: ManagedExpenseCategory = {
      id: 'custom-expense-snack',
      icon: 'coffee-outline',
      label: '夜宵',
      type: 'expense'
    };
    const mergedCategories = mergeDefaultCategories([customCategory]);

    expect(mergedCategories[0]).toEqual(customCategory);
    expect(mergedCategories).toContainEqual(customCategory);
  });

  it('handles expense and income labels separately', () => {
    const existingOtherExpense: ManagedExpenseCategory = {
      id: 'custom-expense-other',
      icon: 'dots-horizontal-circle-outline',
      label: '其他',
      type: 'expense'
    };
    const mergedCategories = mergeDefaultCategories([existingOtherExpense]);

    expect(
      mergedCategories.filter((category) => category.type === 'expense' && category.label === '其他')
    ).toEqual([existingOtherExpense]);
    expect(
      mergedCategories.filter((category) => category.type === 'income' && category.label === '其他')
    ).toHaveLength(1);
  });
});
