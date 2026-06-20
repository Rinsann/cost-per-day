import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { Screen } from '@/components/layout/Screen';
import { AppCard } from '@/components/ui/AppCard';
import { useExpenseRecords } from '@/context/ExpenseRecordsContext';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { ExpenseRecord, ExpenseRecordType } from '@/types/expense';
import { formatCurrency, roundMoney } from '@/utils/cost';

type CategoryRankItem = {
  amount: number;
  category: string;
  percentage: number;
};

type TrendItem = {
  amount: number;
  date: string;
  label: string;
};

const labels = {
  title: '\u7edf\u8ba1',
  thisMonth: '\u672c\u6708',
  quarter: '\u5b63\u5ea6',
  year: '\u5168\u5e74',
  comingSoon: '\u5f00\u53d1\u4e2d',
  monthIncome: '\u672c\u6708\u6536\u5165',
  monthExpense: '\u672c\u6708\u652f\u51fa',
  monthBalance: '\u6708\u7ed3\u4f59',
  expenseRank: '\u652f\u51fa\u5206\u7c7b\u6392\u884c',
  incomeRank: '\u6536\u5165\u5206\u7c7b\u6392\u884c',
  sevenDayTrend: '\u6700\u8fd1 7 \u5929\u652f\u51fa',
  noRecordsTitle: '\u8fd8\u6ca1\u6709\u8bb0\u8d26\u6570\u636e',
  noRecordsDescription: '\u5148\u70b9\u51fb\u5e95\u90e8 + \u8bb0\u4e00\u7b14\uff0c\u7edf\u8ba1\u4f1a\u81ea\u52a8\u66f4\u65b0\u3002',
  noExpense: '\u672c\u6708\u6682\u65e0\u652f\u51fa',
  noIncome: '\u672c\u6708\u6682\u65e0\u6536\u5165',
  loadFailedTitle: '\u8bfb\u53d6\u5931\u8d25',
  loadFailedDescription: '\u65e0\u6cd5\u8bfb\u53d6\u672c\u5730\u8bb0\u8d26\u7edf\u8ba1\u3002'
};

function getDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getMonthString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${year}-${month}`;
}

function getShortDateLabel(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${month}/${day}`;
}

function getRecordType(record: ExpenseRecord): ExpenseRecordType {
  return record.type === 'income' ? 'income' : 'expense';
}

function getCategoryRank(
  records: ExpenseRecord[],
  type: ExpenseRecordType,
  totalAmount: number
): CategoryRankItem[] {
  const amountByCategory = records.reduce<Record<string, number>>((result, record) => {
    if (getRecordType(record) !== type) {
      return result;
    }

    result[record.category] = (result[record.category] ?? 0) + record.amount;
    return result;
  }, {});

  return Object.entries(amountByCategory)
    .map(([category, amount]) => ({
      amount,
      category,
      percentage: totalAmount > 0 ? roundMoney((amount / totalAmount) * 100) : 0
    }))
    .sort((a, b) => b.amount - a.amount);
}

function getLastSevenDaysExpense(records: ExpenseRecord[], today: Date): TrendItem[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - index));
    const dateString = getDateString(date);
    const amount = records
      .filter((record) => record.date === dateString && getRecordType(record) === 'expense')
      .reduce((total, record) => total + record.amount, 0);

    return {
      amount,
      date: dateString,
      label: getShortDateLabel(date)
    };
  });
}

function formatBalanceCurrency(value: number) {
  if (value < 0) {
    return `-${formatCurrency(Math.abs(value))}`;
  }

  return formatCurrency(value);
}

export default function InsightsTab() {
  const { records, refreshRecords } = useExpenseRecords();
  const today = new Date();
  const currentMonth = getMonthString(today);

  useFocusEffect(
    useCallback(() => {
      refreshRecords().catch(() => {
        Alert.alert(labels.loadFailedTitle, labels.loadFailedDescription);
      });
    }, [refreshRecords])
  );

  const monthRecords = useMemo(
    () => records.filter((record) => record.date.startsWith(currentMonth)),
    [currentMonth, records]
  );

  const monthSummary = useMemo(() => {
    return monthRecords.reduce(
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
  }, [monthRecords]);

  const expenseRank = useMemo(
    () => getCategoryRank(monthRecords, 'expense', monthSummary.expense),
    [monthRecords, monthSummary.expense]
  );

  const incomeRank = useMemo(
    () => getCategoryRank(monthRecords, 'income', monthSummary.income),
    [monthRecords, monthSummary.income]
  );

  const sevenDayTrend = useMemo(
    () => getLastSevenDaysExpense(records, today),
    [records, today]
  );

  const maxTrendAmount = Math.max(...sevenDayTrend.map((item) => item.amount), 0);
  const monthBalance = monthSummary.income - monthSummary.expense;
  const balanceColor = monthBalance >= 0 ? colors.income : colors.expense;
  const hasRecords = records.length > 0;

  return (
    <Screen>
      <Text variant="headlineSmall" style={styles.title}>
        {labels.title}
      </Text>

      <View style={styles.segment}>
        <Pressable style={[styles.segmentItem, styles.activeSegment]}>
          <Text variant="titleSmall" style={styles.activeSegmentText}>
            {labels.thisMonth}
          </Text>
        </Pressable>
        <Pressable disabled style={styles.segmentItem}>
          <Text variant="titleSmall" style={styles.segmentText}>
            {labels.quarter}
          </Text>
          <Text style={styles.segmentHint}>{labels.comingSoon}</Text>
        </Pressable>
        <Pressable disabled style={styles.segmentItem}>
          <Text variant="titleSmall" style={styles.segmentText}>
            {labels.year}
          </Text>
          <Text style={styles.segmentHint}>{labels.comingSoon}</Text>
        </Pressable>
      </View>

      {!hasRecords ? (
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

      <AppCard elevated style={styles.summaryCard}>
        <View style={styles.summaryContent}>
          <View style={styles.mainMetric}>
            <Text variant="bodyMedium" style={styles.mutedText}>
              {labels.monthExpense}
            </Text>
            <Text variant="displaySmall" style={styles.expenseValue}>
              {formatCurrency(monthSummary.expense)}
            </Text>
          </View>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text variant="bodySmall" style={styles.mutedText}>
                {labels.monthIncome}
              </Text>
              <Text variant="titleMedium" style={styles.incomeValue}>
                {formatCurrency(monthSummary.income)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="bodySmall" style={styles.mutedText}>
                {labels.monthBalance}
              </Text>
              <Text variant="titleMedium" style={[styles.balanceValue, { color: balanceColor }]}>
                {formatBalanceCurrency(monthBalance)}
              </Text>
            </View>
          </View>
        </View>
      </AppCard>

      <RankCard
        emptyText={labels.noExpense}
        items={expenseRank}
        title={labels.expenseRank}
        tone="expense"
      />

      <RankCard
        emptyText={labels.noIncome}
        items={incomeRank}
        title={labels.incomeRank}
        tone="income"
      />

      <AppCard style={styles.sectionCard}>
        <View style={styles.cardContent}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {labels.sevenDayTrend}
          </Text>
          <View style={styles.trendChart}>
            {sevenDayTrend.map((item) => {
              const barHeight = maxTrendAmount > 0 ? Math.max(6, (item.amount / maxTrendAmount) * 96) : 6;

              return (
                <View key={item.date} style={styles.trendItem}>
                  <View style={styles.trendBarTrack}>
                    <View style={[styles.trendBar, { height: barHeight }]} />
                  </View>
                  <Text style={styles.trendLabel}>{item.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </AppCard>
    </Screen>
  );
}

function RankCard({
  emptyText,
  items,
  title,
  tone
}: {
  emptyText: string;
  items: CategoryRankItem[];
  title: string;
  tone: ExpenseRecordType;
}) {
  const toneColor = tone === 'income' ? colors.income : colors.expense;

  return (
    <AppCard style={styles.sectionCard}>
      <View style={styles.cardContent}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {title}
        </Text>
        {items.length === 0 ? (
          <Text variant="bodyMedium" style={styles.emptyInlineText}>
            {emptyText}
          </Text>
        ) : (
          <View style={styles.rankList}>
            {items.map((item) => (
              <View key={item.category} style={styles.rankItem}>
                <View style={styles.rankHeader}>
                  <Text variant="titleSmall" style={styles.rankCategory}>
                    {item.category}
                  </Text>
                  <Text variant="titleSmall" style={[styles.rankAmount, { color: toneColor }]}>
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
                <View style={styles.rankMeta}>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressBar,
                        { backgroundColor: toneColor, width: `${item.percentage}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.percentageText}>{item.percentage.toFixed(0)}%</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </AppCard>
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
    marginBottom: spacing.lg,
    padding: spacing.xs
  },
  segmentItem: {
    alignItems: 'center',
    borderRadius: radius.full,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
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
  segmentHint: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
    opacity: 0.6
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
  summaryCard: {
    marginBottom: spacing.lg
  },
  summaryContent: {
    padding: spacing.lg
  },
  mainMetric: {
    marginBottom: spacing.lg
  },
  mutedText: {
    color: colors.textSecondary
  },
  expenseValue: {
    color: colors.expense,
    fontWeight: '900',
    marginTop: spacing.sm
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.md
  },
  summaryItem: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    flex: 1,
    padding: spacing.md
  },
  incomeValue: {
    color: colors.income,
    fontWeight: '900',
    marginTop: spacing.xs
  },
  balanceValue: {
    fontWeight: '900',
    marginTop: spacing.xs
  },
  sectionCard: {
    marginBottom: spacing.lg
  },
  cardContent: {
    padding: spacing.lg
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '900',
    marginBottom: spacing.md
  },
  emptyInlineText: {
    color: colors.textSecondary,
    lineHeight: 22
  },
  rankList: {
    gap: spacing.md
  },
  rankItem: {
    gap: spacing.sm
  },
  rankHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between'
  },
  rankCategory: {
    color: colors.text,
    flex: 1,
    fontWeight: '800'
  },
  rankAmount: {
    fontWeight: '900'
  },
  rankMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  progressTrack: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.full,
    flex: 1,
    height: 8,
    overflow: 'hidden'
  },
  progressBar: {
    borderRadius: radius.full,
    height: '100%'
  },
  percentageText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    minWidth: 36,
    textAlign: 'right'
  },
  trendChart: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    minHeight: 128
  },
  trendItem: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm
  },
  trendBarTrack: {
    alignItems: 'center',
    height: 104,
    justifyContent: 'flex-end',
    width: '100%'
  },
  trendBar: {
    backgroundColor: colors.expense,
    borderRadius: radius.full,
    minHeight: 6,
    width: '58%'
  },
  trendLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700'
  }
});
