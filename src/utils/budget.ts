export type MonthlyBudgetStatus = {
  budgetAmount: number;
  isOverBudget: boolean;
  overAmount: number;
  remainingAmount: number;
  remainingDailyAmount: number;
  usedAmount: number;
  usedPercent: number;
};

function getRemainingDaysInMonth(date: Date) {
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  return Math.max(daysInMonth - date.getDate() + 1, 1);
}

export function calculateMonthlyBudgetStatus({
  budgetAmount,
  currentDate = new Date(),
  monthlyExpense
}: {
  budgetAmount: number;
  currentDate?: Date;
  monthlyExpense: number;
}): MonthlyBudgetStatus {
  const safeBudgetAmount = Number.isFinite(budgetAmount) ? Math.max(budgetAmount, 0) : 0;
  const usedAmount = Number.isFinite(monthlyExpense) ? Math.max(monthlyExpense, 0) : 0;
  const rawRemainingAmount = safeBudgetAmount - usedAmount;
  const isOverBudget = rawRemainingAmount < 0;
  const remainingAmount = Math.max(rawRemainingAmount, 0);
  const overAmount = Math.max(usedAmount - safeBudgetAmount, 0);
  const usedPercent = safeBudgetAmount > 0 ? (usedAmount / safeBudgetAmount) * 100 : 0;
  const remainingDailyAmount = isOverBudget
    ? 0
    : remainingAmount / getRemainingDaysInMonth(currentDate);

  return {
    budgetAmount: safeBudgetAmount,
    isOverBudget,
    overAmount,
    remainingAmount,
    remainingDailyAmount,
    usedAmount,
    usedPercent
  };
}
