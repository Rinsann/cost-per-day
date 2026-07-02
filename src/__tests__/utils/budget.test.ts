import { describe, expect, it } from '@jest/globals';

import { calculateMonthlyBudgetStatus } from '@/utils/budget';

const testDate = new Date(2026, 5, 21);

describe('budget utilities', () => {
  it('calculates a budget that is not exceeded', () => {
    const status = calculateMonthlyBudgetStatus({
      budgetAmount: 3000,
      currentDate: testDate,
      monthlyExpense: 1200
    });

    expect(status.remainingAmount).toBe(1800);
    expect(status.overAmount).toBe(0);
    expect(status.isOverBudget).toBe(false);
    expect(status.usedPercent).toBe(40);
  });

  it('handles exactly used up budget', () => {
    const status = calculateMonthlyBudgetStatus({
      budgetAmount: 3000,
      currentDate: testDate,
      monthlyExpense: 3000
    });

    expect(status.remainingAmount).toBe(0);
    expect(status.remainingDailyAmount).toBe(0);
    expect(status.isOverBudget).toBe(false);
    expect(status.usedPercent).toBe(100);
  });

  it('keeps true percent when over budget', () => {
    const status = calculateMonthlyBudgetStatus({
      budgetAmount: 3000,
      currentDate: testDate,
      monthlyExpense: 3900
    });

    expect(status.remainingAmount).toBe(0);
    expect(status.overAmount).toBe(900);
    expect(status.remainingDailyAmount).toBe(0);
    expect(status.isOverBudget).toBe(true);
    expect(status.usedPercent).toBe(130);
  });

  it('returns zero percent when budget is zero', () => {
    const status = calculateMonthlyBudgetStatus({
      budgetAmount: 0,
      currentDate: testDate,
      monthlyExpense: 1200
    });

    expect(status.budgetAmount).toBe(0);
    expect(status.usedPercent).toBe(0);
    expect(status.isOverBudget).toBe(true);
  });

  it('handles zero expense', () => {
    const status = calculateMonthlyBudgetStatus({
      budgetAmount: 3000,
      currentDate: testDate,
      monthlyExpense: 0
    });

    expect(status.remainingAmount).toBe(3000);
    expect(status.usedAmount).toBe(0);
    expect(status.usedPercent).toBe(0);
  });

  it('handles decimal money', () => {
    const status = calculateMonthlyBudgetStatus({
      budgetAmount: 1000.5,
      currentDate: testDate,
      monthlyExpense: 250.25
    });

    expect(status.remainingAmount).toBeCloseTo(750.25);
    expect(status.usedPercent).toBeCloseTo(25.0124937531);
  });

  it('handles very large values', () => {
    const status = calculateMonthlyBudgetStatus({
      budgetAmount: 100000000,
      currentDate: testDate,
      monthlyExpense: 12345678.9
    });

    expect(status.remainingAmount).toBeCloseTo(87654321.1);
    expect(status.usedPercent).toBeCloseTo(12.3456789);
  });

  it('calculates remaining daily amount using remaining days in the current month', () => {
    const status = calculateMonthlyBudgetStatus({
      budgetAmount: 3000,
      currentDate: testDate,
      monthlyExpense: 1200
    });

    expect(status.remainingDailyAmount).toBe(180);
  });
});
