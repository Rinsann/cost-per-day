import { ExpenseRecord, ExpenseRecordType } from '@/types/expense';
import {
  ExpenseRecordDateGroup,
  getRecordType,
  groupExpenseRecordsByDate,
  isRecordInDateRange
} from '@/utils/expenseRecords';
import {
  formatDayRangeLabel,
  formatMonthOnlyLabel,
  getDateString,
  getLocalDateFromString,
  isValidDateString
} from '@/utils/formatDate';
import { formatCompactMoney } from '@/utils/formatMoney';

export { isValidDateString };

export type LedgerStandardRangeMode = 'month' | 'quarter' | 'year';
export type LedgerRangeMode = LedgerStandardRangeMode | 'custom';
export type LedgerTypeFilter = 'all' | ExpenseRecordType;
export type LedgerDateRangeShortcut = 'month' | 'sevenDays' | 'thirtyDays' | 'year';

export type LedgerFilters = {
  category: string;
  keyword: string;
  type: LedgerTypeFilter;
};

export type LedgerSummary = {
  expense: number;
  income: number;
};

export type LedgerDateRange = {
  endDate: string;
  startDate: string;
};

export type LedgerTimeSelection = {
  month: number;
  quarter: number;
  year: number;
};

export type LedgerBarBucket = LedgerSummary & {
  key: string;
  label: string;
};

export type LedgerCategoryStat = {
  amount: number;
  category: string;
  color: string;
  key: string;
  percentage: number;
  percentageLabel: string;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_CATEGORY_COLORS = ['#FFB020', '#FF6B6B', '#7C83FF', '#60A5FA', '#A78BFA', '#64748B'];

export function getQuarterFromMonth(month: number) {
  return Math.floor((month - 1) / 3) + 1;
}

export function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function getShortDateLabel(dateString: string) {
  const date = getLocalDateFromString(dateString);

  if (!date) {
    return dateString;
  }

  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
}

export function clampDateString(dateString: string, minDate: string, maxDate: string) {
  if (dateString < minDate) {
    return minDate;
  }

  if (dateString > maxDate) {
    return maxDate;
  }

  return dateString;
}

export function getDaysBetweenInclusive(startDate: string, endDate: string) {
  const start = getLocalDateFromString(startDate);
  const end = getLocalDateFromString(endDate);

  if (!start || !end) {
    return 0;
  }

  return Math.floor((end.getTime() - start.getTime()) / DAY_IN_MS) + 1;
}

export function getMonthRange(year: number, month: number): LedgerDateRange {
  return {
    endDate: getDateString(new Date(year, month, 0)),
    startDate: getDateString(new Date(year, month - 1, 1))
  };
}

export function getQuarterRange(year: number, quarter: number): LedgerDateRange {
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = startMonth + 2;

  return {
    endDate: getDateString(new Date(year, endMonth, 0)),
    startDate: getDateString(new Date(year, startMonth - 1, 1))
  };
}

export function getYearRange(year: number): LedgerDateRange {
  return {
    endDate: getDateString(new Date(year, 11, 31)),
    startDate: getDateString(new Date(year, 0, 1))
  };
}

export function getCustomRange(startDate: string, endDate: string): LedgerDateRange {
  return { endDate, startDate };
}

export function getMinSelectableDate(records: ExpenseRecord[], todayString: string) {
  const recordDates = records
    .map((record) => record.date)
    .filter((date) => isValidDateString(date) && date <= todayString)
    .sort((a, b) => a.localeCompare(b));

  return recordDates[0] ?? todayString;
}

export function getMinSelectableYear(records: ExpenseRecord[], currentYear: number) {
  const recordYears = records
    .map((record) => Number(record.date.slice(0, 4)))
    .filter((year) => Number.isFinite(year) && year <= currentYear);

  return recordYears.length > 0 ? Math.min(...recordYears) : currentYear;
}

export function isMonthAfterCurrent(year: number, month: number, currentYear: number, currentMonth: number) {
  return year === currentYear && month > currentMonth;
}

export function isQuarterAfterCurrent(year: number, quarter: number, currentYear: number, currentQuarter: number) {
  return year === currentYear && quarter > currentQuarter;
}

export function clampTimeSelection({
  currentMonth,
  currentQuarter,
  currentYear,
  maxYear,
  minYear,
  mode,
  month,
  quarter,
  year
}: {
  currentMonth: number;
  currentQuarter: number;
  currentYear: number;
  maxYear: number;
  minYear: number;
  mode: LedgerRangeMode;
  month: number;
  quarter: number;
  year: number;
}): LedgerTimeSelection {
  const nextYear = Math.min(Math.max(year, minYear), maxYear);
  const nextMonth =
    mode === 'month' && isMonthAfterCurrent(nextYear, month, currentYear, currentMonth)
      ? currentMonth
      : month;
  const nextQuarter =
    mode === 'quarter' && isQuarterAfterCurrent(nextYear, quarter, currentYear, currentQuarter)
      ? currentQuarter
      : quarter;

  return {
    month: nextMonth,
    quarter: nextQuarter,
    year: nextYear
  };
}

export function filterRecordsByDateRange(records: ExpenseRecord[], startDate: string, endDate: string) {
  return records.filter((record) => isRecordInDateRange(record, startDate, endDate));
}

export function filterRecordsByMonth(records: ExpenseRecord[], year: number, month: number) {
  const range = getMonthRange(year, month);

  return filterRecordsByDateRange(records, range.startDate, range.endDate);
}

export function getAvailableRecordMonths(records: ExpenseRecord[], today = new Date()) {
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const months = new Set<string>([currentMonth]);

  records.forEach((record) => {
    const monthKey = record.date.slice(0, 7);

    if (/^\d{4}-\d{2}$/.test(monthKey) && monthKey <= currentMonth) {
      months.add(monthKey);
    }
  });

  return Array.from(months).sort((a, b) => b.localeCompare(a));
}

export function filterRecordsByTypeCategoryKeyword(records: ExpenseRecord[], filters: LedgerFilters) {
  const keyword = filters.keyword.trim().toLowerCase();

  return records.filter((record) => {
    const recordType = getRecordType(record);

    if (filters.type !== 'all' && recordType !== filters.type) {
      return false;
    }

    if (filters.category !== 'all' && record.category !== filters.category) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    const typeLabel = recordType === 'income' ? '收入' : '支出';
    const searchableText = `${record.note ?? ''} ${record.category} ${typeLabel}`.toLowerCase();

    return searchableText.includes(keyword);
  });
}

export function calculateSummary(records: ExpenseRecord[]) {
  return records.reduce<LedgerSummary>(
    (summary, record) => {
      if (getRecordType(record) === 'income') {
        summary.income += record.amount;
      } else {
        summary.expense += record.amount;
      }

      return summary;
    },
    { expense: 0, income: 0 }
  );
}

export function groupRecordsByDate(records: ExpenseRecord[], today = new Date()): ExpenseRecordDateGroup[] {
  return groupExpenseRecordsByDate(records, today);
}

export function formatDailySummary(summary: LedgerSummary) {
  const parts: string[] = [];

  if (summary.expense > 0) {
    parts.push(`支:${formatCompactMoney(summary.expense, { symbol: false })}`);
  }

  if (summary.income > 0) {
    parts.push(`收:${formatCompactMoney(summary.income, { symbol: false })}`);
  }

  return parts.join('  ');
}

export function buildChartBuckets({
  endDate,
  mode,
  month,
  quarter,
  records,
  startDate,
  year
}: {
  endDate: string;
  mode: LedgerRangeMode;
  month: number;
  quarter: number;
  records: ExpenseRecord[];
  startDate: string;
  year: number;
}): LedgerBarBucket[] {
  if (mode === 'custom') {
    return buildCustomChartBuckets(records, startDate, endDate);
  }

  if (mode === 'month') {
    const lastDay = new Date(year, month, 0).getDate();
    const weekCount = Math.ceil(lastDay / 7);

    return Array.from({ length: weekCount }, (_, index) => {
      const startDay = index * 7 + 1;
      const endDay = Math.min(lastDay, startDay + 6);
      const bucketStartDate = getDateString(new Date(year, month - 1, startDay));
      const bucketEndDate = getDateString(new Date(year, month - 1, endDay));

      return {
        ...calculateSummary(filterRecordsByDateRange(records, bucketStartDate, bucketEndDate)),
        key: `${bucketStartDate}-${bucketEndDate}`,
        label: formatDayRangeLabel(startDay, endDay)
      };
    });
  }

  const startMonth = mode === 'quarter' ? (quarter - 1) * 3 + 1 : 1;
  const monthCount = mode === 'quarter' ? 3 : 12;

  return Array.from({ length: monthCount }, (_, index) => {
    const targetMonth = startMonth + index;
    const monthKey = `${year}-${String(targetMonth).padStart(2, '0')}`;

    return {
      ...calculateSummary(records.filter((record) => record.date.startsWith(monthKey))),
      key: monthKey,
      label: formatMonthOnlyLabel(targetMonth)
    };
  });
}

function buildCustomChartBuckets(records: ExpenseRecord[], startDate: string, endDate: string) {
  const totalDays = getDaysBetweenInclusive(startDate, endDate);
  const start = getLocalDateFromString(startDate);
  const end = getLocalDateFromString(endDate);

  if (!start || !end || totalDays <= 0) {
    return [];
  }

  if (totalDays <= 31) {
    return Array.from({ length: totalDays }, (_, index) => {
      const date = getDateString(addDays(start, index));

      return {
        ...calculateSummary(records.filter((record) => record.date === date)),
        key: date,
        label: getShortDateLabel(date)
      };
    });
  }

  if (totalDays <= 366) {
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    const monthCount =
      (end.getFullYear() - start.getFullYear()) * 12 +
      end.getMonth() -
      start.getMonth() +
      1;

    return Array.from({ length: monthCount }, (_, index) => {
      const bucketDate = new Date(start.getFullYear(), start.getMonth() + index, 1);
      const bucketYear = bucketDate.getFullYear();
      const bucketMonth = bucketDate.getMonth() + 1;
      const monthStartDate = getDateString(bucketDate);
      const monthEndDate = getDateString(new Date(bucketYear, bucketMonth, 0));
      const bucketStartDate = monthStartDate < startDate ? startDate : monthStartDate;
      const bucketEndDate = monthEndDate > endDate ? endDate : monthEndDate;

      return {
        ...calculateSummary(filterRecordsByDateRange(records, bucketStartDate, bucketEndDate)),
        key: `${bucketYear}-${String(bucketMonth).padStart(2, '0')}`,
        label:
          startYear === endYear
            ? formatMonthOnlyLabel(bucketMonth)
            : `${bucketYear}-${String(bucketMonth).padStart(2, '0')}`
      };
    });
  }

  const yearCount = end.getFullYear() - start.getFullYear() + 1;

  return Array.from({ length: yearCount }, (_, index) => {
    const bucketYear = start.getFullYear() + index;
    const yearStartDate = `${bucketYear}-01-01`;
    const yearEndDate = `${bucketYear}-12-31`;
    const bucketStartDate = yearStartDate < startDate ? startDate : yearStartDate;
    const bucketEndDate = yearEndDate > endDate ? endDate : yearEndDate;

    return {
      ...calculateSummary(filterRecordsByDateRange(records, bucketStartDate, bucketEndDate)),
      key: String(bucketYear),
      label: String(bucketYear)
    };
  });
}

export function calculateCategoryStats(
  records: ExpenseRecord[],
  totalAmount: number,
  options: {
    colors?: string[];
    limit?: number;
    otherLabel?: string;
    validCategories?: string[];
  } = {}
): LedgerCategoryStat[] {
  if (totalAmount <= 0) {
    return [];
  }

  const colors = options.colors ?? DEFAULT_CATEGORY_COLORS;
  const limit = options.limit ?? 5;
  const otherLabel = options.otherLabel ?? '其他';
  const validCategorySet = options.validCategories ? new Set(options.validCategories) : null;
  const normalizeCategory = (category: string) => {
    const normalizedCategory = category.trim();

    if (!normalizedCategory) {
      return otherLabel;
    }

    if (validCategorySet && !validCategorySet.has(normalizedCategory)) {
      return otherLabel;
    }

    return normalizedCategory;
  };
  const amountByCategory = records.reduce<Record<string, number>>((result, record) => {
    if (getRecordType(record) !== 'expense') {
      return result;
    }

    const category = normalizeCategory(record.category);

    result[category] = (result[category] ?? 0) + record.amount;
    return result;
  }, {});
  const rankedItems = Object.entries(amountByCategory)
    .map(([category, amount]) => ({ amount, category }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const visibleItems = rankedItems.slice(0, limit);
  const hiddenAmount = rankedItems.slice(limit).reduce((total, item) => total + item.amount, 0);
  const otherVisibleItem = visibleItems.find((item) => item.category === otherLabel);
  const combinedItems = visibleItems.map((item) => {
    if (item.category === otherLabel && hiddenAmount > 0) {
      return {
        ...item,
        amount: item.amount + hiddenAmount
      };
    }

    return item;
  });

  if (hiddenAmount > 0 && !otherVisibleItem) {
    combinedItems.push({ amount: hiddenAmount, category: otherLabel });
  }

  return combinedItems.map((item, index) => {
    const percentage = Math.round((item.amount / totalAmount) * 100);

    return {
      ...item,
      color: colors[index] ?? colors[colors.length - 1],
      key: `expense-category-${item.category}-${index}`,
      percentage,
      percentageLabel: percentage === 0 && item.amount > 0 ? '<1%' : `${percentage}%`
    };
  });
}

export function getDefaultCustomRange(startDate: string, endDate: string, minDate: string, maxDate: string) {
  const nextStartDate = clampDateString(startDate, minDate, maxDate);
  const nextEndDate = clampDateString(endDate, minDate, maxDate);

  if (nextStartDate > nextEndDate) {
    return {
      endDate: nextStartDate,
      startDate: nextStartDate
    };
  }

  return {
    endDate: nextEndDate,
    startDate: nextStartDate
  };
}

export function getShortcutDateRange(
  shortcut: LedgerDateRangeShortcut,
  minDate: string,
  maxDate: string,
  today: Date
) {
  const todayString = getDateString(today);
  let startDate = minDate;
  let endDate = maxDate;

  if (shortcut === 'sevenDays') {
    startDate = getDateString(addDays(today, -6));
    endDate = todayString;
  }

  if (shortcut === 'thirtyDays') {
    startDate = getDateString(addDays(today, -29));
    endDate = todayString;
  }

  if (shortcut === 'month') {
    startDate = getDateString(new Date(today.getFullYear(), today.getMonth(), 1));
    endDate = todayString;
  }

  if (shortcut === 'year') {
    startDate = getDateString(new Date(today.getFullYear(), 0, 1));
    endDate = todayString;
  }

  const clampedStartDate = clampDateString(startDate, minDate, maxDate);
  const clampedEndDate = clampDateString(endDate, minDate, maxDate);

  return {
    endDate: clampedEndDate,
    startDate: clampedStartDate > clampedEndDate ? clampedEndDate : clampedStartDate
  };
}
