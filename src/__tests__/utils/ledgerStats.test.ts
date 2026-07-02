import { describe, expect, it } from '@jest/globals';

import { expenseRecordFixtures } from '@/__tests__/fixtures/expenseRecords';
import {
  buildChartBuckets,
  calculateCategoryStats,
  calculateSummary,
  filterRecordsByDateRange,
  filterRecordsByMonth,
  filterRecordsByTypeCategoryKeyword,
  formatDailySummary,
  getAvailableRecordMonths,
  getMonthRange,
  getQuarterRange,
  getYearRange,
  groupRecordsByDate
} from '@/utils/ledgerStats';
import { formatCompactMoney } from '@/utils/formatMoney';

describe('ledgerStats utilities', () => {
  it('builds month, quarter, and year ranges', () => {
    expect(getMonthRange(2026, 6)).toEqual({
      endDate: '2026-06-30',
      startDate: '2026-06-01'
    });
    expect(getQuarterRange(2026, 2)).toEqual({
      endDate: '2026-06-30',
      startDate: '2026-04-01'
    });
    expect(getYearRange(2026)).toEqual({
      endDate: '2026-12-31',
      startDate: '2026-01-01'
    });
  });

  it('filters by date range, type, category, and keyword', () => {
    const juneRecords = filterRecordsByDateRange(expenseRecordFixtures, '2026-06-01', '2026-06-30');
    const teaRecords = filterRecordsByTypeCategoryKeyword(juneRecords, {
      category: '餐饮',
      keyword: '奶茶',
      type: 'expense'
    });

    expect(juneRecords).toHaveLength(5);
    expect(teaRecords).toHaveLength(1);
    expect(teaRecords[0].id).toBe('fixture-june-tea');
  });

  it('filters by month and exposes non-future selectable months', () => {
    const juneRecords = filterRecordsByMonth(expenseRecordFixtures, 2026, 6);
    const months = getAvailableRecordMonths(expenseRecordFixtures, new Date(2026, 5, 20));

    expect(juneRecords).toHaveLength(5);
    expect(months).toEqual(['2026-06', '2026-04', '2026-03', '2026-01', '2025-12']);
  });

  it('filters records by type label keyword', () => {
    const juneRecords = filterRecordsByMonth(expenseRecordFixtures, 2026, 6);
    const incomeRecords = filterRecordsByTypeCategoryKeyword(juneRecords, {
      category: 'all',
      keyword: '收入',
      type: 'all'
    });

    expect(incomeRecords.map((record) => record.id)).toEqual([
      'fixture-june-salary',
      'fixture-june-side-income'
    ]);
  });

  it('calculates income, expense, and balance inputs without changing real amounts', () => {
    const juneRecords = filterRecordsByDateRange(expenseRecordFixtures, '2026-06-01', '2026-06-30');
    const summary = calculateSummary(juneRecords);

    expect(summary.income).toBe(10200);
    expect(summary.expense).toBeCloseTo(88.65);
    expect(summary.income - summary.expense).toBeCloseTo(10111.35);
    expect(formatCompactMoney(228501.12)).toBe('¥22.85万');
  });

  it('groups records by date with daily summaries', () => {
    const juneRecords = filterRecordsByDateRange(expenseRecordFixtures, '2026-06-18', '2026-06-20');
    const groups = groupRecordsByDate(juneRecords, new Date(2026, 5, 20));

    expect(groups.map((group) => group.label)).toEqual(['今天', '昨天', '2026-06-18']);
    expect(groups[0].summary).toEqual({ expense: 33.25, income: 1200 });
    expect(groups[1].summary).toEqual({ expense: 9, income: 9000 });
    expect(formatDailySummary(groups[0].summary)).toBe('支:33.25  收:1,200.00');
    expect(formatDailySummary({ expense: 9, income: 0 })).toBe('支:9.00');
    expect(formatDailySummary({ expense: 0, income: 9000 })).toBe('收:9,000.00');
    expect(groupRecordsByDate([], new Date(2026, 5, 20))).toEqual([]);
  });

  it('calculates expense category stats and merges unknown categories into other', () => {
    const juneRecords = filterRecordsByDateRange(expenseRecordFixtures, '2026-06-01', '2026-06-30');
    const totalExpense = calculateSummary(juneRecords).expense;
    const categoryStats = calculateCategoryStats(juneRecords, totalExpense, {
      validCategories: ['餐饮', '购物', '交通', '其他']
    });

    expect(categoryStats.map((item) => item.category)).toEqual(['餐饮', '购物']);
    expect(categoryStats[0].amount).toBeCloseTo(55.4);
    expect(categoryStats[0].percentage).toBe(62);
    expect(categoryStats[1].amount).toBe(33.25);
    expect(categoryStats[1].percentage).toBe(38);
  });

  it('builds monthly weekly buckets and custom monthly buckets', () => {
    const juneRecords = filterRecordsByDateRange(expenseRecordFixtures, '2026-06-01', '2026-06-30');
    const monthBuckets = buildChartBuckets({
      endDate: '2026-06-30',
      mode: 'month',
      month: 6,
      quarter: 2,
      records: juneRecords,
      startDate: '2026-06-01',
      year: 2026
    });
    const activeWeek = monthBuckets.find((bucket) => bucket.label === '15-21日');

    expect(activeWeek?.income).toBe(10200);
    expect(activeWeek?.expense).toBeCloseTo(88.65);

    const customBuckets = buildChartBuckets({
      endDate: '2026-06-30',
      mode: 'custom',
      month: 6,
      quarter: 2,
      records: expenseRecordFixtures,
      startDate: '2026-01-01',
      year: 2026
    });

    expect(customBuckets.map((bucket) => bucket.label)).toEqual(['1月', '2月', '3月', '4月', '5月', '6月']);
    expect(customBuckets.find((bucket) => bucket.label === '6月')?.income).toBe(10200);
  });
});
