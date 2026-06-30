import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen } from '@/components/layout/Screen';
import { useAppTheme } from '@/context/AppThemeContext';
import { useExpenseCategories } from '@/context/ExpenseCategoriesContext';
import { useExpenseRecords } from '@/context/ExpenseRecordsContext';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import {
  getMonthString,
  getRecordType,
  groupExpenseRecordsByDate,
  isRecordInDateRange,
  getDateString,
  sortExpenseRecords
} from '@/utils/expenseRecords';
import { formatMoney } from '@/utils/formatMoney';

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
  viewAll: '\u67e5\u770b\u5168\u90e8',
  emptyTitle: '\u8fd8\u6ca1\u6709\u8bb0\u5f55',
  emptyDescription: '\u70b9\u51fb\u5e95\u90e8\u4e2d\u95f4\u7684 + \u5feb\u901f\u8bb0\u4e00\u7b14\u3002',
  loadFailedTitle: '\u8bfb\u53d6\u5931\u8d25',
  loadFailedDescription: '\u65e0\u6cd5\u8bfb\u53d6\u672c\u5730\u8bb0\u8d26\u8bb0\u5f55\u3002'
};

export default function LedgerTab() {
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useAppTheme();
  const { getCategoryIcon } = useExpenseCategories();
  const { records, refreshRecords } = useExpenseRecords();
  const now = new Date();
  const today = getDateString(now);
  const sevenDaysAgo = getDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
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
    return sortExpenseRecords(
      records.filter((record) => isRecordInDateRange(record, sevenDaysAgo, today))
    );
  }, [records, sevenDaysAgo, today]);

  const recordGroups = useMemo(() => {
    return groupExpenseRecordsByDate(recentRecords, now);
  }, [now, recentRecords]);

  const monthBalance = monthSummary.income - monthSummary.expense;
  const monthBalanceColor = monthBalance >= 0 ? themeColors.income : themeColors.expense;
  const bottomPadding = Math.max(insets.bottom, spacing.sm) + 56 + spacing.xxxl;

  const openAllRecords = useCallback(() => {
    router.push('/ledger/all');
  }, []);

  const openRecordDetail = useCallback((recordId: string) => {
    router.push({
      pathname: '/ledger/[id]',
      params: { id: recordId }
    });
  }, []);

  return (
    <Screen bottomPadding={bottomPadding}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={[styles.title, { color: themeColors.text }]}>
          {labels.title}
        </Text>
      </View>

      <Card mode="contained" style={[styles.heroCard, { backgroundColor: themeColors.cardAlt }]}>
        <Card.Content>
          <Text variant="labelLarge" style={styles.heroLabel}>
            {labels.monthExpense}
          </Text>
          <Text variant="displaySmall" style={[styles.monthExpenseValue, { color: themeColors.text }]}>
            {formatMoney(monthSummary.expense)}
          </Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIcon}>
                <MaterialCommunityIcons name="arrow-down-left" color={themeColors.primary} size={18} />
              </View>
              <View>
                <Text variant="bodySmall" style={[styles.mutedText, { color: themeColors.textSecondary }]}>
                  {labels.monthIncome}
                </Text>
                <Text variant="titleSmall" style={styles.incomeValue}>
                  {formatMoney(monthSummary.income)}
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
                <Text variant="bodySmall" style={[styles.mutedText, { color: themeColors.textSecondary }]}>
                  {labels.monthBalance}
                </Text>
                <Text variant="titleSmall" style={[styles.balanceSummaryValue, { color: monthBalanceColor }]}>
                  {formatMoney(monthBalance, { sign: monthBalance < 0 ? 'auto' : 'none' })}
                </Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.sectionHeader}>
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
          {labels.recentRecords}
        </Text>
        <Pressable
          onPress={openAllRecords}
          style={({ pressed }) => [
            styles.viewAllInlineButton,
            pressed && { backgroundColor: themeColors.surfacePressed }
          ]}
        >
          <Text variant="labelLarge" style={[styles.viewAllInlineText, { color: themeColors.primary }]}>
            {labels.viewAll}
          </Text>
          <MaterialCommunityIcons name="chevron-right" color={themeColors.primary} size={18} />
        </Pressable>
      </View>

      {recordGroups.length === 0 ? (
        <Card mode="contained" style={[styles.emptyCard, { backgroundColor: themeColors.card }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.emptyTitle, { color: themeColors.text }]}>
              {labels.emptyTitle}
            </Text>
            <Text variant="bodyMedium" style={[styles.emptyDescription, { color: themeColors.textSecondary }]}>
              {labels.emptyDescription}
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <View style={styles.recordGroups}>
          {recordGroups.map((group) => (
            <View key={group.date} style={styles.recordGroup}>
              <View style={styles.groupHeader}>
                <Text variant="labelLarge" style={[styles.groupDate, { color: themeColors.textSecondary }]}>
                  {group.label}
                </Text>
                <View style={styles.groupSummary}>
                  {group.summary.expense > 0 ? (
                    <Text variant="bodySmall" style={[styles.groupSummaryText, styles.groupExpense]}>
                      {labels.dailyExpense}:{formatMoney(group.summary.expense, { symbol: false })}
                    </Text>
                  ) : null}
                  {group.summary.income > 0 ? (
                    <Text variant="bodySmall" style={[styles.groupSummaryText, styles.groupIncome]}>
                      {labels.dailyIncome}:{formatMoney(group.summary.income, { symbol: false })}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={[styles.recordList, { backgroundColor: themeColors.card }]}>
                {group.records.map((record, index) => {
                  const isIncome = getRecordType(record) === 'income';
                  const amountColor = isIncome ? themeColors.income : themeColors.expense;

                  return (
                    <Pressable
                      key={record.id}
                      onPress={() => openRecordDetail(record.id)}
                      android_ripple={{ color: themeColors.ripple }}
                      style={({ pressed }) => [
                        styles.recordItem,
                        { borderBottomColor: themeColors.outline },
                        index === group.records.length - 1 && styles.recordItemLast,
                        pressed && { backgroundColor: themeColors.surfacePressed }
                      ]}
                    >
                      <View style={[styles.recordIcon, { backgroundColor: themeColors.cardAlt }]}>
                        <MaterialCommunityIcons
                          name={getCategoryIcon(record.category, getRecordType(record))}
                          color={amountColor}
                          size={22}
                        />
                      </View>
                      <View style={styles.recordMain}>
                        <Text
                          ellipsizeMode="tail"
                          numberOfLines={1}
                          variant="titleSmall"
                          style={[styles.recordTitle, { color: themeColors.text }]}
                        >
                          {record.category}
                        </Text>
                        <Text
                          ellipsizeMode="tail"
                          numberOfLines={1}
                          variant="bodySmall"
                          style={[styles.recordMeta, { color: themeColors.textSecondary }]}
                        >
                          {record.note?.trim() || record.category}
                        </Text>
                      </View>
                      <Text
                        ellipsizeMode="tail"
                        numberOfLines={1}
                        variant="titleSmall"
                        style={[styles.recordAmount, { color: amountColor }]}
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
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    marginBottom: spacing.sm
  },
  sectionTitle: {
    color: colors.textSecondary,
    flex: 1,
    fontWeight: '800'
  },
  viewAllInlineButton: {
    alignItems: 'center',
    borderRadius: radius.full,
    flexDirection: 'row',
    gap: 2,
    minHeight: 36,
    paddingHorizontal: spacing.sm
  },
  viewAllInlineText: {
    color: colors.primary,
    fontWeight: '900'
  },
  emptyCard: {
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
  recordIcon: {
    alignItems: 'center',
    borderRadius: radius.full,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  recordMain: {
    flex: 1,
    minWidth: 0
  },
  recordTitle: {
    color: colors.text,
    fontWeight: '800'
  },
  recordMeta: {
    color: colors.textSecondary,
    fontWeight: '700',
    marginTop: spacing.xs
  },
  recordAmount: {
    flexShrink: 0,
    fontWeight: '900',
    minWidth: 96,
    textAlign: 'right'
  },
});
