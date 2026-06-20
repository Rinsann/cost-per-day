import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { ComponentProps, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View
} from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Circle } from 'react-native-svg';

import { Screen } from '@/components/layout/Screen';
import { AppCard } from '@/components/ui/AppCard';
import {
  expenseCategories,
  getExpenseCategoryIcon,
  incomeCategories
} from '@/constants/expenseCategories';
import { useExpenseRecords } from '@/context/ExpenseRecordsContext';
import { clearLedgerMockData, seedLedgerMockData } from '@/dev/seedLedgerMockData';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { ExpenseRecord, ExpenseRecordType } from '@/types/expense';
import {
  ExpenseRecordSummary,
  getDateString,
  getMonthString,
  getRecordType,
  groupExpenseRecordsByDate,
  isRecordInDateRange
} from '@/utils/expenseRecords';
import {
  formatDayRangeLabel,
  formatMonthLabel,
  formatMonthOnlyLabel,
  formatQuarterLabel,
  formatYearLabel
} from '@/utils/formatDate';
import { formatMoney } from '@/utils/formatMoney';

type RangeMode = 'month' | 'quarter' | 'year';
type TypeFilter = 'all' | ExpenseRecordType;

type Filters = {
  category: string;
  keyword: string;
  type: TypeFilter;
};

type CategoryRankItem = {
  amount: number;
  category: string;
  color: string;
  key: string;
  percentage: number;
};

type BarStat = {
  expense: number;
  income: number;
  key: string;
  label: string;
};

type RangeInfo = {
  balanceLabel: string;
  endDate: string;
  expenseLabel: string;
  incomeLabel: string;
  title: string;
  startDate: string;
};

const labels = {
  title: '\u7edf\u8ba1\u56fe\u8868',
  month: '\u672c\u6708',
  quarter: '\u5b63\u5ea6',
  year: '全年',
  monthIncome: '\u672c\u6708\u6536\u5165',
  monthExpense: '\u672c\u6708\u652f\u51fa',
  monthBalance: '\u6708\u7ed3\u4f59',
  quarterIncome: '\u5b63\u5ea6\u6536\u5165',
  quarterExpense: '\u5b63\u5ea6\u652f\u51fa',
  quarterBalance: '\u5b63\u5ea6\u7ed3\u4f59',
  yearIncome: '全年收入',
  yearExpense: '全年支出',
  yearBalance: '全年结余',
  income: '\u6536\u5165',
  expense: '\u652f\u51fa',
  all: '\u5168\u90e8',
  allCategories: '\u5168\u90e8\u5206\u7c7b',
  billDetails: '\u6536\u652f\u660e\u7ec6',
  cancel: '\u53d6\u6d88',
  clearMock: '\u6e05\u9664 mock \u8d26\u5355',
  clearMockConfirmMessage: '\u5c06\u6e05\u9664 mock \u6d4b\u8bd5\u8d26\u5355\uff0c\u4e0d\u4f1a\u5220\u9664\u771f\u5b9e\u8bb0\u5f55\u3002',
  clearMockFailed: '\u6e05\u9664 mock \u8d26\u5355\u5931\u8d25\uff0c\u8bf7\u67e5\u770b Metro \u65e5\u5fd7\u3002',
  clearMockSuccess: '\u5df2\u6e05\u9664',
  confirm: '\u786e\u5b9a',
  devDataTitle: '\u5f00\u53d1\u6d4b\u8bd5\u6570\u636e',
  devDataDescription: '仅开发环境可见，用于测试统计页月 / 季度 / 全年和筛选效果。',
  expenseCategory: '\u652f\u51fa\u5206\u7c7b',
  filter: '\u7b5b\u9009',
  filtered: '\u5df2\u7b5b\u9009',
  keyword: '\u5173\u952e\u8bcd',
  keywordPlaceholder: '\u641c\u7d22\u5907\u6ce8 / \u5206\u7c7b',
  monthChart: '\u6536\u652f\u5bf9\u6bd4',
  noRecordsTitle: '\u8fd8\u6ca1\u6709\u8bb0\u8d26\u6570\u636e',
  noRecordsDescription: '\u5148\u70b9\u51fb\u5e95\u90e8 + \u8bb0\u4e00\u7b14\uff0c\u7edf\u8ba1\u4f1a\u81ea\u52a8\u66f4\u65b0\u3002',
  noFilteredRecords: '\u5f53\u524d\u6761\u4ef6\u4e0b\u6ca1\u6709\u8bb0\u5f55',
  noExpense: '\u5f53\u524d\u8303\u56f4\u6682\u65e0\u652f\u51fa',
  other: '\u5176\u4ed6',
  reset: '\u91cd\u7f6e',
  selectTime: '\u9009\u62e9\u65f6\u95f4',
  seedMock: '\u6ce8\u5165 mock \u8d26\u5355',
  seedMockConfirmMessage: '\u5c06\u6ce8\u5165\u6d4b\u8bd5\u8d26\u5355\u6570\u636e\uff0c\u4e0d\u4f1a\u5220\u9664\u771f\u5b9e\u8bb0\u5f55\uff0c\u53ea\u4f1a\u66ff\u6362\u65e7 mock \u6570\u636e\u3002',
  seedMockFailed: '\u6ce8\u5165 mock \u8d26\u5355\u5931\u8d25\uff0c\u8bf7\u67e5\u770b Metro \u65e5\u5fd7\u3002',
  seedMockSuccess: '\u5df2\u6ce8\u5165',
  type: '\u7c7b\u578b',
  loadFailedTitle: '\u8bfb\u53d6\u5931\u8d25',
  loadFailedDescription: '\u65e0\u6cd5\u8bfb\u53d6\u672c\u5730\u8bb0\u8d26\u7edf\u8ba1\u3002'
};

const isDevelopment = __DEV__;

const DEFAULT_FILTERS: Filters = {
  category: 'all',
  keyword: '',
  type: 'all'
};
const DONUT_RADIUS = 38;
const DONUT_STROKE = 13;
const DONUT_SIZE = 116;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
const DONUT_COLORS = ['#FFB020', '#FF6B6B', '#7C83FF', '#60A5FA', '#A78BFA', '#64748B'];

function getQuarterFromMonth(month: number) {
  return Math.floor((month - 1) / 3) + 1;
}

function getMinSelectableYear(records: ExpenseRecord[], currentYear: number) {
  const recordYears = records
    .map((record) => Number(record.date.slice(0, 4)))
    .filter((year) => Number.isFinite(year) && year <= currentYear);

  return recordYears.length > 0 ? Math.min(...recordYears) : currentYear;
}

function isMonthAfterCurrent(year: number, month: number, currentYear: number, currentMonth: number) {
  return year === currentYear && month > currentMonth;
}

function isQuarterAfterCurrent(year: number, quarter: number, currentYear: number, currentQuarter: number) {
  return year === currentYear && quarter > currentQuarter;
}

function clampTimeSelection({
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
  mode: RangeMode;
  month: number;
  quarter: number;
  year: number;
}) {
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

function getRangeInfo(mode: RangeMode, year: number, month: number, quarter: number): RangeInfo {
  if (mode === 'month') {
    return {
      balanceLabel: labels.monthBalance,
      endDate: getDateString(new Date(year, month, 0)),
      expenseLabel: labels.monthExpense,
      incomeLabel: labels.monthIncome,
      startDate: getDateString(new Date(year, month - 1, 1)),
      title: formatMonthLabel(year, month)
    };
  }

  if (mode === 'quarter') {
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = startMonth + 2;

    return {
      balanceLabel: labels.quarterBalance,
      endDate: getDateString(new Date(year, endMonth, 0)),
      expenseLabel: labels.quarterExpense,
      incomeLabel: labels.quarterIncome,
      startDate: getDateString(new Date(year, startMonth - 1, 1)),
      title: formatQuarterLabel(year, quarter)
    };
  }

  return {
    balanceLabel: labels.yearBalance,
    endDate: getDateString(new Date(year, 11, 31)),
    expenseLabel: labels.yearExpense,
    incomeLabel: labels.yearIncome,
    startDate: getDateString(new Date(year, 0, 1)),
    title: formatYearLabel(year)
  };
}

function getSummary(records: ExpenseRecord[]) {
  return records.reduce<ExpenseRecordSummary>(
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

function getCategoryOptions(type: TypeFilter) {
  const sourceCategories =
    type === 'expense'
      ? expenseCategories
      : type === 'income'
        ? incomeCategories
        : [...expenseCategories, ...incomeCategories];
  const categoryMap = new Map<string, (typeof sourceCategories)[number]>();

  sourceCategories.forEach((category) => {
    if (!categoryMap.has(category.label)) {
      categoryMap.set(category.label, category);
    }
  });

  return Array.from(categoryMap.values());
}

function applyFilters(records: ExpenseRecord[], filters: Filters) {
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

    const searchableText = `${record.note ?? ''} ${record.category}`.toLowerCase();

    return searchableText.includes(keyword);
  });
}

function getBarStats(records: ExpenseRecord[], mode: RangeMode, year: number, month: number, quarter: number) {
  if (mode === 'month') {
    const lastDay = new Date(year, month, 0).getDate();
    const weekCount = Math.ceil(lastDay / 7);

    return Array.from({ length: weekCount }, (_, index) => {
      const startDay = index * 7 + 1;
      const endDay = Math.min(lastDay, startDay + 6);
      const startDate = getDateString(new Date(year, month - 1, startDay));
      const endDate = getDateString(new Date(year, month - 1, endDay));

      return {
        ...getSummary(records.filter((record) => isRecordInDateRange(record, startDate, endDate))),
        key: `${startDate}-${endDate}`,
        label: formatDayRangeLabel(startDay, endDay)
      };
    });
  }

  const startMonth = mode === 'quarter' ? (quarter - 1) * 3 + 1 : 1;
  const monthCount = mode === 'quarter' ? 3 : 12;

  return Array.from({ length: monthCount }, (_, index) => {
    const targetMonth = startMonth + index;
    const monthKey = getMonthString(new Date(year, targetMonth - 1, 1));

    return {
      ...getSummary(records.filter((record) => record.date.startsWith(monthKey))),
      key: monthKey,
      label: formatMonthOnlyLabel(targetMonth)
    };
  });
}

function getCategoryRank(records: ExpenseRecord[], totalAmount: number): CategoryRankItem[] {
  if (totalAmount <= 0) {
    return [];
  }

  const validExpenseCategories = new Set(expenseCategories.map((category) => category.label));
  const normalizeCategory = (category: string) => {
    const normalizedCategory = category.trim();

    return normalizedCategory && validExpenseCategories.has(normalizedCategory)
      ? normalizedCategory
      : labels.other;
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
  const visibleItems = rankedItems.slice(0, 5);
  const otherAmount = rankedItems.slice(5).reduce((total, item) => total + item.amount, 0);
  const otherVisibleItem = visibleItems.find((item) => item.category === labels.other);
  const combinedItems = visibleItems.map((item) => {
    if (item.category === labels.other && otherAmount > 0) {
      return {
        ...item,
        amount: item.amount + otherAmount
      };
    }

    return item;
  });

  if (otherAmount > 0 && !otherVisibleItem) {
    combinedItems.push({ amount: otherAmount, category: labels.other });
  }

  return combinedItems.map((item, index) => ({
    ...item,
    color: DONUT_COLORS[index] ?? DONUT_COLORS[DONUT_COLORS.length - 1],
    key: `expense-category-${item.category}-${index}`,
    percentage: Math.round((item.amount / totalAmount) * 100)
  }));
}

function isFilterActive(filters: Filters) {
  return filters.type !== 'all' || filters.category !== 'all' || filters.keyword.trim().length > 0;
}

export default function InsightsTab() {
  const { records, refreshRecords } = useExpenseRecords();
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentQuarter = getQuarterFromMonth(currentMonth);
  const barAnimation = useRef(new Animated.Value(0)).current;
  const donutAnimation = useRef(new Animated.Value(0)).current;
  const [rangeMode, setRangeMode] = useState<RangeMode>('month');
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);
  const [timeSheetVisible, setTimeSheetVisible] = useState(false);
  const [draftYear, setDraftYear] = useState(selectedYear);
  const [draftMonth, setDraftMonth] = useState(selectedMonth);
  const [draftQuarter, setDraftQuarter] = useState(selectedQuarter);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [devToolBusy, setDevToolBusy] = useState(false);
  const minSelectableYear = useMemo(
    () => getMinSelectableYear(records, currentYear),
    [currentYear, records]
  );
  const maxSelectableYear = currentYear;

  const playChartAnimations = useCallback(() => {
    barAnimation.setValue(0);
    donutAnimation.setValue(0);

    Animated.stagger(90, [
      Animated.timing(barAnimation, {
        duration: 560,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: false
      }),
      Animated.timing(donutAnimation, {
        duration: 680,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true
      })
    ]).start();
  }, [barAnimation, donutAnimation]);

  useFocusEffect(
    useCallback(() => {
      refreshRecords().catch(() => {
        Alert.alert(labels.loadFailedTitle, labels.loadFailedDescription);
      });
      playChartAnimations();
    }, [playChartAnimations, refreshRecords])
  );

  useEffect(() => {
    const nextSelection = clampTimeSelection({
      currentMonth,
      currentQuarter,
      currentYear,
      maxYear: maxSelectableYear,
      minYear: minSelectableYear,
      mode: rangeMode,
      month: selectedMonth,
      quarter: selectedQuarter,
      year: selectedYear
    });

    if (nextSelection.year !== selectedYear) {
      setSelectedYear(nextSelection.year);
    }

    if (nextSelection.month !== selectedMonth) {
      setSelectedMonth(nextSelection.month);
    }

    if (nextSelection.quarter !== selectedQuarter) {
      setSelectedQuarter(nextSelection.quarter);
    }
  }, [
    currentMonth,
    currentQuarter,
    currentYear,
    maxSelectableYear,
    minSelectableYear,
    rangeMode,
    selectedMonth,
    selectedQuarter,
    selectedYear
  ]);

  const rangeInfo = useMemo(
    () => getRangeInfo(rangeMode, selectedYear, selectedMonth, selectedQuarter),
    [rangeMode, selectedMonth, selectedQuarter, selectedYear]
  );
  const rangeRecords = useMemo(
    () => records.filter((record) => isRecordInDateRange(record, rangeInfo.startDate, rangeInfo.endDate)),
    [rangeInfo.endDate, rangeInfo.startDate, records]
  );
  const filteredRecords = useMemo(
    () => applyFilters(rangeRecords, filters),
    [filters, rangeRecords]
  );
  const summary = useMemo(() => getSummary(filteredRecords), [filteredRecords]);
  const barStats = useMemo(
    () => getBarStats(filteredRecords, rangeMode, selectedYear, selectedMonth, selectedQuarter),
    [filteredRecords, rangeMode, selectedMonth, selectedQuarter, selectedYear]
  );
  const expenseRank = useMemo(
    () => getCategoryRank(filteredRecords, summary.expense),
    [filteredRecords, summary.expense]
  );
  const detailGroups = useMemo(
    () => groupExpenseRecordsByDate(filteredRecords, today),
    [filteredRecords, today]
  );
  const maxBarAmount = Math.max(
    ...barStats.map((item) => Math.max(item.income, item.expense)),
    0
  );
  const balance = summary.income - summary.expense;
  const balanceColor = balance >= 0 ? colors.income : colors.expense;
  const hasAnyRecords = records.length > 0;
  const hasActiveFilters = isFilterActive(filters);
  const donutScale = donutAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.86, 1]
  });
  const donutRotation = donutAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['-80deg', '0deg']
  });

  function changeRangeMode(mode: RangeMode) {
    const nextSelection = clampTimeSelection({
      currentMonth,
      currentQuarter,
      currentYear,
      maxYear: maxSelectableYear,
      minYear: minSelectableYear,
      mode,
      month: selectedMonth,
      quarter: selectedQuarter,
      year: selectedYear
    });

    setRangeMode(mode);
    setSelectedYear(nextSelection.year);
    setSelectedMonth(nextSelection.month);
    setSelectedQuarter(nextSelection.quarter);
    playChartAnimations();
  }

  function openTimeSheet() {
    const nextSelection = clampTimeSelection({
      currentMonth,
      currentQuarter,
      currentYear,
      maxYear: maxSelectableYear,
      minYear: minSelectableYear,
      mode: rangeMode,
      month: selectedMonth,
      quarter: selectedQuarter,
      year: selectedYear
    });

    setDraftYear(nextSelection.year);
    setDraftMonth(nextSelection.month);
    setDraftQuarter(nextSelection.quarter);
    setTimeSheetVisible(true);
  }

  function confirmTimeSelection() {
    const nextSelection = clampTimeSelection({
      currentMonth,
      currentQuarter,
      currentYear,
      maxYear: maxSelectableYear,
      minYear: minSelectableYear,
      mode: rangeMode,
      month: draftMonth,
      quarter: draftQuarter,
      year: draftYear
    });

    setSelectedYear(nextSelection.year);
    setSelectedMonth(nextSelection.month);
    setSelectedQuarter(nextSelection.quarter);
    setTimeSheetVisible(false);
    playChartAnimations();
  }

  function changeDraftYear(nextYear: number) {
    const nextSelection = clampTimeSelection({
      currentMonth,
      currentQuarter,
      currentYear,
      maxYear: maxSelectableYear,
      minYear: minSelectableYear,
      mode: rangeMode,
      month: draftMonth,
      quarter: draftQuarter,
      year: nextYear
    });

    setDraftYear(nextSelection.year);
    setDraftMonth(nextSelection.month);
    setDraftQuarter(nextSelection.quarter);
  }

  function changeDraftMonth(nextMonth: number) {
    if (isMonthAfterCurrent(draftYear, nextMonth, currentYear, currentMonth)) {
      return;
    }

    setDraftMonth(nextMonth);
  }

  function changeDraftQuarter(nextQuarter: number) {
    if (isQuarterAfterCurrent(draftYear, nextQuarter, currentYear, currentQuarter)) {
      return;
    }

    setDraftQuarter(nextQuarter);
  }

  function openFilterSheet() {
    setDraftFilters(filters);
    setFilterSheetVisible(true);
  }

  function confirmFilters() {
    setFilters({
      ...draftFilters,
      keyword: draftFilters.keyword.trim()
    });
    setFilterSheetVisible(false);
    playChartAnimations();
  }

  function resetFilters() {
    setDraftFilters(DEFAULT_FILTERS);
  }

  function confirmSeedMockData() {
    Alert.alert(labels.devDataTitle, labels.seedMockConfirmMessage, [
      { style: 'cancel', text: labels.cancel },
      {
        onPress: () => {
          setDevToolBusy(true);
          seedLedgerMockData()
            .then((count) => refreshRecords().then(() => count))
            .then((count) => {
              Alert.alert(labels.seedMockSuccess, `\u5df2\u6ce8\u5165 ${count} \u6761 mock \u8d26\u5355`);
            })
            .catch(() => {
              Alert.alert(labels.loadFailedTitle, labels.seedMockFailed);
            })
            .finally(() => setDevToolBusy(false));
        },
        text: labels.confirm
      }
    ]);
  }

  function confirmClearMockData() {
    Alert.alert(labels.devDataTitle, labels.clearMockConfirmMessage, [
      { style: 'cancel', text: labels.cancel },
      {
        onPress: () => {
          setDevToolBusy(true);
          clearLedgerMockData()
            .then((count) => refreshRecords().then(() => count))
            .then((count) => {
              Alert.alert(labels.clearMockSuccess, `\u5df2\u6e05\u9664 ${count} \u6761 mock \u8d26\u5355`);
            })
            .catch(() => {
              Alert.alert(labels.loadFailedTitle, labels.clearMockFailed);
            })
            .finally(() => setDevToolBusy(false));
        },
        text: labels.confirm
      }
    ]);
  }

  return (
    <Screen bottomPadding={24}>
      <Text variant="headlineSmall" style={styles.title}>
        {labels.title}
      </Text>

      <View style={styles.segment}>
        {(['month', 'quarter', 'year'] as RangeMode[]).map((mode) => {
          const isActive = rangeMode === mode;

          return (
            <Pressable
              key={mode}
              onPress={() => changeRangeMode(mode)}
              style={[styles.segmentItem, isActive && styles.activeSegment]}
            >
              <Text variant="titleSmall" style={isActive ? styles.activeSegmentText : styles.segmentText}>
                {labels[mode]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.toolbar}>
        <Pressable onPress={openTimeSheet} style={styles.rangeButton}>
          <MaterialCommunityIcons name="calendar-month-outline" color={colors.primary} size={18} />
          <Text variant="titleSmall" style={styles.rangeButtonText} numberOfLines={1}>
            {rangeInfo.title}
          </Text>
          <MaterialCommunityIcons name="chevron-down" color={colors.textSecondary} size={18} />
        </Pressable>
        <Pressable
          onPress={openFilterSheet}
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
        >
          <MaterialCommunityIcons
            name="filter-variant"
            color={hasActiveFilters ? colors.background : colors.primary}
            size={18}
          />
          <Text style={[styles.filterButtonText, hasActiveFilters && styles.filterButtonTextActive]}>
            {hasActiveFilters ? labels.filtered : labels.filter}
          </Text>
        </Pressable>
      </View>

      {!hasAnyRecords ? (
        <AppCard elevated style={styles.emptyCard}>
          <View style={styles.emptyContent}>
            <MaterialCommunityIcons name="chart-box-outline" color={colors.textSecondary} size={36} />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              {labels.noRecordsTitle}
            </Text>
            <Text variant="bodyMedium" style={styles.emptyDescription}>
              {labels.noRecordsDescription}
            </Text>
          </View>
        </AppCard>
      ) : null}

      <View style={styles.metricGrid}>
        <MetricCard
          icon="trending-up"
          label={rangeInfo.incomeLabel}
          value={formatMoney(summary.income)}
          valueColor={colors.income}
        />
        <MetricCard
          icon="trending-down"
          label={rangeInfo.expenseLabel}
          value={formatMoney(summary.expense)}
          valueColor={colors.expense}
        />
      </View>

      <View style={styles.balanceRow}>
        <Text variant="bodyMedium" style={styles.mutedText}>
          {rangeInfo.balanceLabel}
        </Text>
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          numberOfLines={1}
          variant="titleMedium"
          style={[styles.balanceValue, { color: balanceColor }]}
        >
          {formatMoney(balance, { sign: balance < 0 ? 'auto' : 'none' })}
        </Text>
      </View>

      <MonthlyBarChart
        animation={barAnimation}
        maxAmount={maxBarAmount}
        stats={barStats}
      />

      <ExpenseDonutChart
        donutOpacity={donutAnimation}
        donutRotation={donutRotation}
        donutScale={donutScale}
        items={expenseRank}
        totalExpense={summary.expense}
      />

      <BillDetails groups={detailGroups} />

      {isDevelopment ? (
        <DevMockDataCard
          busy={devToolBusy}
          onClear={confirmClearMockData}
          onSeed={confirmSeedMockData}
        />
      ) : null}

      <TimeRangeSheet
        currentMonth={currentMonth}
        currentQuarter={currentQuarter}
        currentYear={currentYear}
        draftMonth={draftMonth}
        draftQuarter={draftQuarter}
        draftYear={draftYear}
        maxYear={maxSelectableYear}
        minYear={minSelectableYear}
        mode={rangeMode}
        onCancel={() => setTimeSheetVisible(false)}
        onConfirm={confirmTimeSelection}
        onMonthChange={changeDraftMonth}
        onQuarterChange={changeDraftQuarter}
        onYearChange={changeDraftYear}
        visible={timeSheetVisible}
      />
      <FilterSheet
        draftFilters={draftFilters}
        onCancel={() => setFilterSheetVisible(false)}
        onConfirm={confirmFilters}
        onReset={resetFilters}
        onUpdate={setDraftFilters}
        visible={filterSheetVisible}
      />
    </Screen>
  );
}

function DevMockDataCard({
  busy,
  onClear,
  onSeed
}: {
  busy: boolean;
  onClear: () => void;
  onSeed: () => void;
}) {
  return (
    <AppCard style={styles.sectionCard}>
      <View style={styles.cardContent}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {labels.devDataTitle}
        </Text>
        <Text variant="bodyMedium" style={styles.devDescription}>
          {labels.devDataDescription}
        </Text>
        <View style={styles.devActions}>
          <Pressable
            disabled={busy}
            onPress={onSeed}
            style={[styles.primaryDevAction, busy && styles.disabledAction]}
          >
            <Text style={styles.primaryActionText}>{labels.seedMock}</Text>
          </Pressable>
          <Pressable
            disabled={busy}
            onPress={onClear}
            style={[styles.secondaryDevAction, busy && styles.disabledAction]}
          >
            <Text style={styles.secondaryActionText}>{labels.clearMock}</Text>
          </Pressable>
        </View>
      </View>
    </AppCard>
  );
}

function MetricCard({
  icon,
  label,
  value,
  valueColor
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  value: string;
  valueColor: string;
}) {
  return (
    <AppCard elevated style={styles.metricCard}>
      <View style={styles.metricContent}>
        <MaterialCommunityIcons name={icon} color={valueColor} size={18} />
        <Text variant="bodyMedium" style={styles.mutedText} numberOfLines={1}>
          {label}
        </Text>
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.58}
          numberOfLines={1}
          variant="titleLarge"
          style={[styles.metricValue, { color: valueColor }]}
        >
          {value}
        </Text>
      </View>
    </AppCard>
  );
}

function MonthlyBarChart({
  animation,
  maxAmount,
  stats
}: {
  animation: Animated.Value;
  maxAmount: number;
  stats: BarStat[];
}) {
  const barWidth = stats.length > 8 ? 6 : 10;
  const shouldScroll = stats.length > 8;

  const chartContent = (
    <View style={[styles.barChart, shouldScroll && styles.barChartScrollable]}>
      {stats.map((item) => {
        const incomeHeight = maxAmount > 0 ? Math.max(4, (item.income / maxAmount) * 118) : 4;
        const expenseHeight = maxAmount > 0 ? Math.max(4, (item.expense / maxAmount) * 118) : 4;
        const animatedIncomeHeight = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [4, incomeHeight]
        });
        const animatedExpenseHeight = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [4, expenseHeight]
        });

        return (
          <View
            key={item.key}
            style={[styles.barBucket, shouldScroll && styles.barBucketScrollable]}
          >
            <View style={styles.barPair}>
              <Animated.View
                style={[
                  styles.bar,
                  styles.incomeBar,
                  { height: animatedIncomeHeight, width: barWidth }
                ]}
              />
              <Animated.View
                style={[
                  styles.bar,
                  styles.expenseBar,
                  { height: animatedExpenseHeight, width: barWidth }
                ]}
              />
            </View>
            <Text style={[styles.axisLabel, shouldScroll && styles.axisLabelScrollable]}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <AppCard style={styles.sectionCard}>
      <View style={styles.cardContent}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {labels.monthChart}
        </Text>
        {shouldScroll ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {chartContent}
          </ScrollView>
        ) : (
          chartContent
        )}
        <View style={styles.legendRow}>
          <LegendDot color={colors.income} label={labels.income} />
          <LegendDot color={colors.expense} label={labels.expense} />
        </View>
      </View>
    </AppCard>
  );
}

function ExpenseDonutChart({
  donutOpacity,
  donutRotation,
  donutScale,
  items,
  totalExpense
}: {
  donutOpacity: Animated.Value;
  donutRotation: Animated.AnimatedInterpolation<string>;
  donutScale: Animated.AnimatedInterpolation<number>;
  items: CategoryRankItem[];
  totalExpense: number;
}) {
  let segmentOffset = 0;

  return (
    <AppCard style={styles.sectionCard}>
      <View style={styles.cardContent}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {labels.expenseCategory}
        </Text>
        {items.length === 0 ? (
          <Text variant="bodyMedium" style={styles.emptyInlineText}>
            {labels.noExpense}
          </Text>
        ) : (
          <View style={styles.donutRow}>
            <View style={styles.donutWrap}>
              <Animated.View
                style={[
                  styles.donutAnimated,
                  {
                    opacity: donutOpacity,
                    transform: [{ scale: donutScale }, { rotate: donutRotation }]
                  }
                ]}
              >
                <Svg height={DONUT_SIZE} width={DONUT_SIZE} viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}>
                  <Circle
                    cx={DONUT_SIZE / 2}
                    cy={DONUT_SIZE / 2}
                    fill="none"
                    r={DONUT_RADIUS}
                    stroke={colors.cardAlt}
                    strokeWidth={DONUT_STROKE}
                  />
                  {items.map((item, index) => {
                    const remainingLength = Math.max(DONUT_CIRCUMFERENCE - segmentOffset, 0);
                    const rawSegmentLength = (item.amount / totalExpense) * DONUT_CIRCUMFERENCE;
                    const segmentLength =
                      index === items.length - 1
                        ? remainingLength
                        : Math.min(Math.max(rawSegmentLength, 0), remainingLength);
                    const dashOffset = -segmentOffset;

                    segmentOffset += segmentLength;

                    return (
                      <Circle
                        key={`donut-segment-${item.key}-${index}`}
                        cx={DONUT_SIZE / 2}
                        cy={DONUT_SIZE / 2}
                        fill="none"
                        origin={`${DONUT_SIZE / 2}, ${DONUT_SIZE / 2}`}
                        r={DONUT_RADIUS}
                        rotation="-90"
                        stroke={item.color}
                        strokeDasharray={`${segmentLength} ${DONUT_CIRCUMFERENCE - segmentLength}`}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="butt"
                        strokeWidth={DONUT_STROKE}
                      />
                    );
                  })}
                </Svg>
              </Animated.View>
              <View style={styles.donutCenter}>
                <Text style={styles.donutCenterLabel}>{labels.expense}</Text>
                <Text
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                  numberOfLines={1}
                  style={styles.donutCenterValue}
                >
                  {formatMoney(totalExpense)}
                </Text>
              </View>
            </View>
            <View style={styles.categoryLegend}>
              {items.map((item, index) => (
                <View key={`donut-legend-${item.key}-${index}`} style={styles.categoryLegendItem}>
                  <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
                  <Text style={styles.categoryName} numberOfLines={1}>
                    {item.category}
                  </Text>
                  <Text style={styles.categoryPercent}>{item.percentage}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </AppCard>
  );
}

function BillDetails({ groups }: { groups: ReturnType<typeof groupExpenseRecordsByDate> }) {
  return (
    <AppCard style={styles.sectionCard}>
      <View style={styles.cardContent}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {labels.billDetails}
        </Text>
        {groups.length === 0 ? (
          <Text variant="bodyMedium" style={styles.emptyInlineText}>
            {labels.noFilteredRecords}
          </Text>
        ) : (
          <View style={styles.detailGroups}>
            {groups.map((group) => (
              <View key={group.date} style={styles.detailGroup}>
                <View style={styles.groupHeader}>
                  <Text variant="labelLarge" style={styles.groupDate}>
                    {group.label}
                  </Text>
                  <View style={styles.groupSummary}>
                    {group.summary.expense > 0 ? (
                      <Text style={[styles.groupSummaryText, styles.groupExpense]}>
                        {labels.expense}:{formatMoney(group.summary.expense, { symbol: false })}
                      </Text>
                    ) : null}
                    {group.summary.income > 0 ? (
                      <Text style={[styles.groupSummaryText, styles.groupIncome]}>
                        {labels.income}:{formatMoney(group.summary.income, { symbol: false })}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <View style={styles.detailList}>
                  {group.records.map((record, index) => {
                    const recordType = getRecordType(record);
                    const isIncome = recordType === 'income';
                    const amountColor = isIncome ? colors.income : colors.expense;

                    return (
                      <Pressable
                        key={record.id}
                        onPress={() => router.push(`/ledger/${record.id}`)}
                        android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
                        style={({ pressed }) => [
                          styles.detailItem,
                          index === group.records.length - 1 && styles.detailItemLast,
                          pressed && styles.detailItemPressed
                        ]}
                      >
                        <View style={styles.detailIcon}>
                          <MaterialCommunityIcons
                            name={getExpenseCategoryIcon(record.category, recordType)}
                            color={amountColor}
                            size={21}
                          />
                        </View>
                        <View style={styles.detailMain}>
                          <Text variant="titleSmall" style={styles.detailTitle} numberOfLines={1}>
                            {record.note || record.category}
                          </Text>
                          <Text variant="bodySmall" style={styles.detailMeta} numberOfLines={1}>
                            {record.category} · {record.date}
                          </Text>
                        </View>
                        <Text
                          adjustsFontSizeToFit
                          minimumFontScale={0.72}
                          numberOfLines={1}
                          variant="titleSmall"
                          style={[styles.detailAmount, { color: amountColor }]}
                        >
                          {formatMoney(record.amount, { sign: isIncome ? 'income' : 'expense' })}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </AppCard>
  );
}

function TimeRangeSheet({
  currentMonth,
  currentQuarter,
  currentYear,
  draftMonth,
  draftQuarter,
  draftYear,
  maxYear,
  minYear,
  mode,
  onCancel,
  onConfirm,
  onMonthChange,
  onQuarterChange,
  onYearChange,
  visible
}: {
  currentMonth: number;
  currentQuarter: number;
  currentYear: number;
  draftMonth: number;
  draftQuarter: number;
  draftYear: number;
  maxYear: number;
  minYear: number;
  mode: RangeMode;
  onCancel: () => void;
  onConfirm: () => void;
  onMonthChange: (month: number) => void;
  onQuarterChange: (quarter: number) => void;
  onYearChange: (year: number) => void;
  visible: boolean;
}) {
  const canGoPreviousYear = draftYear > minYear;
  const canGoNextYear = draftYear < maxYear;

  return (
    <Modal animationType="slide" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text variant="titleMedium" style={styles.sheetTitle}>
            {labels.selectTime}
          </Text>
          <View style={styles.yearControl}>
            <Pressable
              disabled={!canGoPreviousYear}
              onPress={() => onYearChange(draftYear - 1)}
              style={[styles.yearButton, !canGoPreviousYear && styles.disabledOption]}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                color={canGoPreviousYear ? colors.text : colors.textSecondary}
                size={22}
              />
            </Pressable>
            <Text variant="titleLarge" style={styles.yearText}>
              {formatYearLabel(draftYear)}
            </Text>
            <Pressable
              disabled={!canGoNextYear}
              onPress={() => onYearChange(draftYear + 1)}
              style={[styles.yearButton, !canGoNextYear && styles.disabledOption]}
            >
              <MaterialCommunityIcons
                name="chevron-right"
                color={canGoNextYear ? colors.text : colors.textSecondary}
                size={22}
              />
            </Pressable>
          </View>
          {mode === 'month' ? (
            <View style={styles.optionGrid}>
              {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => {
                const isDisabled = isMonthAfterCurrent(draftYear, month, currentYear, currentMonth);

                return (
                  <ChoiceButton
                    key={month}
                    active={draftMonth === month}
                    disabled={isDisabled}
                    label={formatMonthOnlyLabel(month)}
                    onPress={() => onMonthChange(month)}
                  />
                );
              })}
            </View>
          ) : null}
          {mode === 'quarter' ? (
            <View style={styles.optionGrid}>
              {[1, 2, 3, 4].map((quarter) => {
                const isDisabled = isQuarterAfterCurrent(draftYear, quarter, currentYear, currentQuarter);

                return (
                  <ChoiceButton
                    key={quarter}
                    active={draftQuarter === quarter}
                    disabled={isDisabled}
                    label={`Q${quarter}`}
                    onPress={() => onQuarterChange(quarter)}
                  />
                );
              })}
            </View>
          ) : null}
          <View style={styles.sheetActions}>
            <Pressable onPress={onCancel} style={styles.secondaryAction}>
              <Text style={styles.secondaryActionText}>{labels.cancel}</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={styles.primaryAction}>
              <Text style={styles.primaryActionText}>{labels.confirm}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FilterSheet({
  draftFilters,
  onCancel,
  onConfirm,
  onReset,
  onUpdate,
  visible
}: {
  draftFilters: Filters;
  onCancel: () => void;
  onConfirm: () => void;
  onReset: () => void;
  onUpdate: (filters: Filters) => void;
  visible: boolean;
}) {
  const categoryOptions = getCategoryOptions(draftFilters.type);

  function updateType(type: TypeFilter) {
    onUpdate({ ...draftFilters, category: 'all', type });
  }

  return (
    <Modal animationType="slide" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text variant="titleMedium" style={styles.sheetTitle}>
            {labels.filter}
          </Text>
          <Text style={styles.filterLabel}>{labels.type}</Text>
          <View style={styles.choiceRow}>
            {(['all', 'expense', 'income'] as TypeFilter[]).map((type) => (
              <ChoiceButton
                key={type}
                active={draftFilters.type === type}
                label={type === 'all' ? labels.all : type === 'expense' ? labels.expense : labels.income}
                onPress={() => updateType(type)}
              />
            ))}
          </View>
          <Text style={styles.filterLabel}>{labels.allCategories}</Text>
          <View style={styles.optionGrid}>
            <ChoiceButton
              active={draftFilters.category === 'all'}
              label={labels.allCategories}
              onPress={() => onUpdate({ ...draftFilters, category: 'all' })}
            />
            {categoryOptions.map((category) => (
              <ChoiceButton
                key={category.label}
                active={draftFilters.category === category.label}
                label={category.label}
                onPress={() => onUpdate({ ...draftFilters, category: category.label })}
              />
            ))}
          </View>
          <Text style={styles.filterLabel}>{labels.keyword}</Text>
          <TextInput
            onChangeText={(keyword) => onUpdate({ ...draftFilters, keyword })}
            placeholder={labels.keywordPlaceholder}
            placeholderTextColor={colors.textSecondary}
            style={styles.keywordInput}
            value={draftFilters.keyword}
          />
          <View style={styles.sheetActions}>
            <Pressable onPress={onReset} style={styles.secondaryAction}>
              <Text style={styles.secondaryActionText}>{labels.reset}</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={styles.primaryAction}>
              <Text style={styles.primaryActionText}>{labels.confirm}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ChoiceButton({
  active,
  disabled = false,
  label,
  onPress
}: {
  active: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.choiceButton,
        active && styles.choiceButtonActive,
        disabled && styles.disabledOption
      ]}
    >
      <Text
        style={[
          styles.choiceText,
          active && styles.choiceTextActive,
          disabled && styles.disabledChoiceText
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontWeight: '900',
    marginBottom: spacing.lg
  },
  segment: {
    backgroundColor: colors.card,
    borderRadius: radius.full,
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
    padding: spacing.xs
  },
  segmentItem: {
    alignItems: 'center',
    borderRadius: radius.full,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingVertical: spacing.xs
  },
  activeSegment: {
    backgroundColor: colors.primary
  },
  activeSegmentText: {
    color: colors.background,
    fontWeight: '900'
  },
  segmentText: {
    color: colors.textSecondary,
    fontWeight: '800'
  },
  toolbar: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  rangeButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 42,
    paddingHorizontal: spacing.md
  },
  rangeButtonText: {
    color: colors.text,
    flex: 1,
    fontWeight: '900'
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 42,
    paddingHorizontal: spacing.md
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  filterButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900'
  },
  filterButtonTextActive: {
    color: colors.background
  },
  emptyCard: {
    marginBottom: spacing.lg
  },
  emptyContent: {
    alignItems: 'center',
    padding: spacing.lg
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: '800',
    marginTop: spacing.md
  },
  emptyDescription: {
    color: colors.textSecondary,
    lineHeight: 22,
    marginTop: spacing.sm,
    textAlign: 'center'
  },
  metricGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md
  },
  metricCard: {
    flex: 1
  },
  metricContent: {
    padding: spacing.md
  },
  mutedText: {
    color: colors.textSecondary
  },
  metricValue: {
    fontWeight: '900',
    marginTop: spacing.sm
  },
  balanceRow: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    padding: spacing.md
  },
  balanceValue: {
    flexShrink: 1,
    fontWeight: '900',
    textAlign: 'right'
  },
  sectionCard: {
    marginBottom: spacing.lg
  },
  cardContent: {
    padding: spacing.lg
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontWeight: '900',
    marginBottom: spacing.md
  },
  emptyInlineText: {
    color: colors.textSecondary,
    lineHeight: 22
  },
  devDescription: {
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md
  },
  devActions: {
    gap: spacing.sm
  },
  primaryDevAction: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    minHeight: 44,
    justifyContent: 'center'
  },
  secondaryDevAction: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    minHeight: 44,
    justifyContent: 'center'
  },
  disabledAction: {
    opacity: 0.56
  },
  barChart: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'space-between',
    minHeight: 158
  },
  barChartScrollable: {
    gap: spacing.sm,
    minWidth: 520
  },
  barBucket: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm
  },
  barBucketScrollable: {
    flex: 0,
    width: 36
  },
  barPair: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 4,
    height: 128,
    justifyContent: 'center',
    width: '100%'
  },
  bar: {
    borderRadius: radius.sm,
    minHeight: 4
  },
  incomeBar: {
    backgroundColor: colors.income
  },
  expenseBar: {
    backgroundColor: colors.expense
  },
  axisLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center'
  },
  axisLabelScrollable: {
    fontSize: 10,
    width: 36
  },
  legendRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'center',
    marginTop: spacing.md
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs
  },
  legendDot: {
    borderRadius: radius.full,
    height: 10,
    width: 10
  },
  legendText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800'
  },
  donutRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md
  },
  donutWrap: {
    alignItems: 'center',
    height: DONUT_SIZE,
    justifyContent: 'center',
    width: DONUT_SIZE
  },
  donutAnimated: {
    height: DONUT_SIZE,
    width: DONUT_SIZE
  },
  donutCenter: {
    alignItems: 'center',
    maxWidth: 82,
    position: 'absolute'
  },
  donutCenterLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800'
  },
  donutCenterValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
    textAlign: 'center'
  },
  categoryLegend: {
    flex: 1,
    gap: spacing.sm
  },
  categoryLegendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  categoryDot: {
    borderRadius: radius.full,
    height: 9,
    width: 9
  },
  categoryName: {
    color: colors.textSecondary,
    flex: 1,
    fontSize: 13,
    fontWeight: '800'
  },
  categoryPercent: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
    minWidth: 34,
    textAlign: 'right'
  },
  detailGroups: {
    gap: spacing.md
  },
  detailGroup: {
    gap: spacing.sm
  },
  groupHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs
  },
  groupDate: {
    color: colors.textSecondary,
    flexShrink: 0,
    fontWeight: '800'
  },
  groupSummary: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'flex-end'
  },
  groupSummaryText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16
  },
  groupExpense: {
    color: colors.expense
  },
  groupIncome: {
    color: colors.income
  },
  detailList: {
    backgroundColor: colors.card,
    borderRadius: 20,
    overflow: 'hidden'
  },
  detailItem: {
    alignItems: 'center',
    borderBottomColor: colors.outline,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md
  },
  detailItemLast: {
    borderBottomWidth: 0
  },
  detailItemPressed: {
    backgroundColor: colors.cardAlt
  },
  detailIcon: {
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: radius.full,
    height: 42,
    justifyContent: 'center',
    width: 42
  },
  detailMain: {
    flex: 1
  },
  detailTitle: {
    color: colors.text,
    fontWeight: '800'
  },
  detailMeta: {
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  detailAmount: {
    fontWeight: '900',
    maxWidth: 116,
    minWidth: 88,
    textAlign: 'right'
  },
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.54)',
    flex: 1,
    justifyContent: 'flex-end'
  },
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: colors.textSecondary,
    borderRadius: radius.full,
    height: 4,
    marginBottom: spacing.lg,
    opacity: 0.45,
    width: 56
  },
  sheetTitle: {
    color: colors.text,
    fontWeight: '900',
    marginBottom: spacing.md
  },
  yearControl: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  yearButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.full,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  disabledOption: {
    opacity: 0.38
  },
  yearText: {
    color: colors.text,
    fontWeight: '900'
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  choiceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  choiceButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    flexBasis: '22%',
    flexGrow: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm
  },
  choiceButtonActive: {
    backgroundColor: colors.primary
  },
  choiceText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '800'
  },
  choiceTextActive: {
    color: colors.background
  },
  disabledChoiceText: {
    color: colors.textSecondary
  },
  filterLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: spacing.sm
  },
  keywordInput: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg
  },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48
  },
  primaryActionText: {
    color: colors.background,
    fontWeight: '900'
  },
  secondaryAction: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48
  },
  secondaryActionText: {
    color: colors.text,
    fontWeight: '900'
  }
});
