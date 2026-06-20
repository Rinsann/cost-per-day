import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { Screen } from '@/components/layout/Screen';
import { getExpenseCategoryIcon } from '@/constants/expenseCategories';
import { useExpenseRecords } from '@/context/ExpenseRecordsContext';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { ExpenseRecord } from '@/types/expense';
import { formatCurrency } from '@/utils/cost';

const labels = {
  title: '\u8bb0\u8d26\u672c',
  monthExpense: '\u672c\u6708\u652f\u51fa',
  monthIncome: '\u672c\u6708\u6536\u5165',
  monthBalance: '\u6708\u7ed3\u4f59',
  dailyExpense: '\u652f',
  dailyIncome: '\u6536',
  today: '\u4eca\u5929',
  yesterday: '\u6628\u5929',
  recentRecords: '\u6700\u8fd1\u8d26\u5355',
  emptyTitle: '\u8fd8\u6ca1\u6709\u8bb0\u5f55',
  emptyDescription: '\u70b9\u51fb\u5e95\u90e8\u4e2d\u95f4\u7684 + \u5feb\u901f\u8bb0\u4e00\u7b14\u3002',
  loadFailedTitle: '\u8bfb\u53d6\u5931\u8d25',
  loadFailedDescription: '\u65e0\u6cd5\u8bfb\u53d6\u672c\u5730\u8bb0\u8d26\u8bb0\u5f55\u3002'
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

function getRecordType(record: ExpenseRecord) {
  return record.type === 'income' ? 'income' : 'expense';
}

function getRecordIcon(record: ExpenseRecord) {
  if (getRecordType(record) === 'income') {
    return getExpenseCategoryIcon(record.category, 'income');
  }

  return getExpenseCategoryIcon(record.category, 'expense');
}

function getDateLabel(date: string, today: string, yesterday: string) {
  if (date === today) {
    return labels.today;
  }

  if (date === yesterday) {
    return labels.yesterday;
  }

  return date;
}

function getDailySummary(records: ExpenseRecord[]) {
  return records.reduce(
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

function formatCompactAmount(value: number) {
  return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatBalanceCurrency(value: number) {
  if (value < 0) {
    return `-${formatCurrency(Math.abs(value))}`;
  }

  return formatCurrency(value);
}

export default function LedgerTab() {
  const { records, refreshRecords } = useExpenseRecords();
  const now = new Date();
  const today = getDateString(now);
  const yesterday = getDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const currentMonth = getMonthString(now);

  useFocusEffect(
    useCallback(() => {
      refreshRecords().catch(() => {
        Alert.alert(labels.loadFailedTitle, labels.loadFailedDescription);
      });
    }, [refreshRecords])
  );

  const monthSummary = useMemo(() => {
    return records
      .filter((record) => record.date.startsWith(currentMonth))
      .reduce(
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
  }, [currentMonth, records]);

  const recentRecords = useMemo(() => {
    return [...records]
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
      .slice(0, 12);
  }, [records]);

  const recordGroups = useMemo(() => {
    const groupedRecords = new Map<string, ExpenseRecord[]>();

    recentRecords.forEach((record) => {
      const groupRecords = groupedRecords.get(record.date) ?? [];

      groupRecords.push(record);
      groupedRecords.set(record.date, groupRecords);
    });

    return Array.from(groupedRecords.entries()).map(([date, groupRecords]) => ({
      date,
      label: getDateLabel(date, today, yesterday),
      records: groupRecords,
      summary: getDailySummary(groupRecords)
    }));
  }, [recentRecords, today, yesterday]);

  const monthBalance = monthSummary.income - monthSummary.expense;
  const monthBalanceColor = monthBalance >= 0 ? colors.income : colors.expense;

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          {labels.title}
        </Text>
      </View>

      <Card mode="contained" style={styles.heroCard}>
        <Card.Content>
          <Text variant="labelLarge" style={styles.heroLabel}>
            {labels.monthExpense}
          </Text>
          <Text variant="displaySmall" style={styles.monthExpenseValue}>
            {formatCurrency(monthSummary.expense)}
          </Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIcon}>
                <MaterialCommunityIcons name="arrow-down-left" color={colors.primary} size={18} />
              </View>
              <View>
                <Text variant="bodySmall" style={styles.mutedText}>
                  {labels.monthIncome}
                </Text>
                <Text variant="titleSmall" style={styles.incomeValue}>
                  {formatCurrency(monthSummary.income)}
                </Text>
              </View>
            </View>
            <View style={styles.summaryItem}>
              <View
                style={[
                  styles.summaryIcon,
                  monthBalance < 0 && styles.negativeBalanceIcon
                ]}
              >
                <MaterialCommunityIcons name="wallet-outline" color={monthBalanceColor} size={18} />
              </View>
              <View>
                <Text variant="bodySmall" style={styles.mutedText}>
                  {labels.monthBalance}
                </Text>
                <Text variant="titleSmall" style={[styles.balanceSummaryValue, { color: monthBalanceColor }]}>
                  {formatBalanceCurrency(monthBalance)}
                </Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.sectionHeader}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {labels.recentRecords}
        </Text>
      </View>

      {recordGroups.length === 0 ? (
        <Card mode="contained" style={styles.emptyCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              {labels.emptyTitle}
            </Text>
            <Text variant="bodyMedium" style={styles.emptyDescription}>
              {labels.emptyDescription}
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <View style={styles.recordGroups}>
          {recordGroups.map((group) => (
            <View key={group.date} style={styles.recordGroup}>
              <View style={styles.groupHeader}>
                <Text variant="labelLarge" style={styles.groupDate}>
                  {group.label}
                </Text>
                <View style={styles.groupSummary}>
                  {group.summary.expense > 0 ? (
                    <Text variant="bodySmall" style={[styles.groupSummaryText, styles.groupExpense]}>
                      {labels.dailyExpense}:{formatCompactAmount(group.summary.expense)}
                    </Text>
                  ) : null}
                  {group.summary.income > 0 ? (
                    <Text variant="bodySmall" style={[styles.groupSummaryText, styles.groupIncome]}>
                      {labels.dailyIncome}:{formatCompactAmount(group.summary.income)}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.recordList}>
                {group.records.map((record, index) => {
                  const isIncome = getRecordType(record) === 'income';
                  const amountColor = isIncome ? colors.income : colors.expense;

                  return (
                    <Pressable
                      key={record.id}
                      onPress={() => router.push(`/ledger/${record.id}`)}
                      android_ripple={{ color: 'rgba(255, 255, 255, 0.06)' }}
                      style={({ pressed }) => [
                        styles.recordItem,
                        index === group.records.length - 1 && styles.recordItemLast,
                        pressed && styles.recordItemPressed
                      ]}
                    >
                      <View style={styles.recordIcon}>
                        <MaterialCommunityIcons
                          name={getRecordIcon(record)}
                          color={amountColor}
                          size={22}
                        />
                      </View>
                      <View style={styles.recordMain}>
                        <Text variant="titleSmall" style={styles.recordTitle}>
                          {record.note || record.category}
                        </Text>
                        <Text variant="bodySmall" style={styles.recordMeta}>
                          {record.category}
                        </Text>
                      </View>
                      <Text variant="titleSmall" style={[styles.recordAmount, { color: amountColor }]}>
                        {isIncome ? '+' : '-'}
                        {formatCurrency(record.amount)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg
  },
  title: {
    color: colors.text,
    fontWeight: '900'
  },
  heroCard: {
    backgroundColor: colors.cardAlt,
    borderRadius: 24,
    marginBottom: spacing.lg
  },
  heroLabel: {
    color: colors.expense,
    fontWeight: '800'
  },
  monthExpenseValue: {
    color: colors.text,
    fontWeight: '900',
    marginTop: spacing.sm
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginTop: spacing.lg
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm
  },
  summaryIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(61, 217, 172, 0.14)',
    borderRadius: radius.full,
    height: 32,
    justifyContent: 'center',
    width: 32
  },
  negativeBalanceIcon: {
    backgroundColor: 'rgba(255, 107, 107, 0.14)'
  },
  mutedText: {
    color: colors.textSecondary
  },
  incomeValue: {
    color: colors.income,
    fontWeight: '800'
  },
  balanceSummaryValue: {
    fontWeight: '800'
  },
  sectionHeader: {
    marginBottom: spacing.sm
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontWeight: '800'
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 24
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: '800'
  },
  emptyDescription: {
    color: colors.textSecondary,
    lineHeight: 22,
    marginTop: spacing.sm
  },
  recordGroups: {
    gap: spacing.md
  },
  recordGroup: {
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
  recordList: {
    backgroundColor: colors.card,
    borderRadius: 24,
    overflow: 'hidden'
  },
  recordItem: {
    alignItems: 'center',
    borderBottomColor: colors.outline,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md
  },
  recordItemLast: {
    borderBottomWidth: 0
  },
  recordItemPressed: {
    backgroundColor: colors.cardAlt
  },
  recordIcon: {
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: radius.full,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  recordMain: {
    flex: 1
  },
  recordTitle: {
    color: colors.text,
    fontWeight: '800'
  },
  recordMeta: {
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  recordAmount: {
    fontWeight: '900',
    minWidth: 96,
    textAlign: 'right'
  }
});
