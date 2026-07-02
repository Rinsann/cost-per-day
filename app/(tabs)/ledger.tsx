import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View
} from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen } from '@/components/layout/Screen';
import { useAppTheme } from '@/context/AppThemeContext';
import { useExpenseCategories } from '@/context/ExpenseCategoriesContext';
import { useExpenseRecords } from '@/context/ExpenseRecordsContext';
import {
  DEFAULT_MONTHLY_BUDGET,
  getMonthlyBudget,
  MonthlyBudget
} from '@/storage/monthlyBudgetStorage';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { calculateMonthlyBudgetStatus } from '@/utils/budget';
import {
  getMonthString,
  getRecordType,
  groupExpenseRecordsByDate,
  isRecordInDateRange,
  getDateString,
  sortExpenseRecords
} from '@/utils/expenseRecords';
import { formatCompactMoney } from '@/utils/formatMoney';

const labels = {
  title: '\u8bb0\u8d26\u672c',
  monthExpense: '\u672c\u6708\u652f\u51fa',
  monthIncome: '\u672c\u6708\u6536\u5165',
  monthBalance: '\u6708\u7ed3\u4f59',
  monthlyBill: '本月账单',
  monthlyBudget: '月度预算',
  budgetRemaining: '预算剩余',
  budgetOver: '已超出预算',
  budgetSetup: '设置本月预算',
  budgetSetupDescription: '预算只用于本月支出参考',
  budgetTotal: '总预算',
  budgetDaily: '剩余日均',
  budgetUsed: '已用',
  budgetSettings: '预算设置',
  dailyExpense: '\u652f',
  dailyIncome: '\u6536',
  today: '\u4eca\u5929',
  yesterday: '\u6628\u5929',
  recentRecords: '\u6700\u8fd1\u8d26\u5355',
  viewAll: '\u67e5\u770b\u5168\u90e8',
  emptyTitle: '\u8fd8\u6ca1\u6709\u8bb0\u5f55',
  emptyDescription: '\u70b9\u51fb\u5e95\u90e8\u4e2d\u95f4\u7684 + \u5feb\u901f\u8bb0\u4e00\u7b14\u3002',
  spendingReminder: '买之前想一想，用多久才算值。',
  loadFailedTitle: '\u8bfb\u53d6\u5931\u8d25',
  loadFailedDescription: '\u65e0\u6cd5\u8bfb\u53d6\u672c\u5730\u8bb0\u8d26\u8bb0\u5f55\u3002'
};

export default function LedgerTab() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { colors: themeColors } = useAppTheme();
  const { getCategoryIcon } = useExpenseCategories();
  const { records, refreshRecords } = useExpenseRecords();
  const [budget, setBudget] = useState<MonthlyBudget>(DEFAULT_MONTHLY_BUDGET);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const now = new Date();
  const today = getDateString(now);
  const sevenDaysAgo = getDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
  const currentMonth = getMonthString(now);

  useFocusEffect(
    useCallback(() => {
      refreshRecords().catch(() => {
        Alert.alert(labels.loadFailedTitle, labels.loadFailedDescription);
      });
      getMonthlyBudget()
        .then(setBudget)
        .catch(() => {
          setBudget(DEFAULT_MONTHLY_BUDGET);
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
  const bottomPadding = Math.max(insets.bottom, spacing.sm) + 44;
  const heroCardWidth = Math.max(screenWidth - spacing.md * 2, 280);
  const heroSnapInterval = heroCardWidth + spacing.md;
  const budgetEnabled = budget.enabled && budget.amount > 0;
  const budgetStatus = useMemo(
    () =>
      calculateMonthlyBudgetStatus({
        budgetAmount: budget.amount,
        currentDate: now,
        monthlyExpense: monthSummary.expense
      }),
    [budget.amount, monthSummary.expense, now]
  );
  const budgetAmountColor = budgetStatus.isOverBudget ? themeColors.expense : themeColors.text;

  const handleHeroScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / heroSnapInterval);

      setActiveHeroIndex(Math.max(0, Math.min(nextIndex, 1)));
    },
    [heroSnapInterval]
  );

  const openAllRecords = useCallback(() => {
    router.push('/ledger/all');
  }, []);

  const openRecordDetail = useCallback((recordId: string) => {
    router.push({
      pathname: '/ledger/[id]',
      params: { id: recordId }
    });
  }, []);

  const openBudgetSettings = useCallback(() => {
    router.push('/settings/budget');
  }, []);

  return (
    <Screen bottomPadding={bottomPadding}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={[styles.title, { color: themeColors.text }]}>
          {labels.title}
        </Text>
      </View>

      <View style={styles.heroCarousel}>
        <ScrollView
          horizontal
          decelerationRate="fast"
          disableIntervalMomentum
          onMomentumScrollEnd={handleHeroScrollEnd}
          showsHorizontalScrollIndicator={false}
          snapToInterval={heroSnapInterval}
          contentContainerStyle={styles.heroScrollContent}
        >
          <Card
            mode="contained"
            style={[
              styles.heroCard,
              { backgroundColor: themeColors.cardAlt, width: heroCardWidth }
            ]}
          >
            <Card.Content>
              <View style={styles.heroCardHeader}>
                <Text variant="labelLarge" style={styles.heroLabel}>
                  {labels.monthlyBill}
                </Text>
                <MaterialCommunityIcons name="receipt-text-outline" color={themeColors.primary} size={20} />
              </View>
              <Text
                adjustsFontSizeToFit
                ellipsizeMode="tail"
                minimumFontScale={0.58}
                numberOfLines={1}
                variant="displaySmall"
                style={[styles.monthExpenseValue, { color: themeColors.text }]}
              >
                {formatCompactMoney(monthSummary.expense)}
              </Text>
              <Text style={[styles.heroSubLabel, { color: themeColors.textSecondary }]}>
                {labels.monthExpense}
              </Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <View style={styles.summaryIcon}>
                    <MaterialCommunityIcons name="arrow-down-left" color={themeColors.primary} size={18} />
                  </View>
                  <View style={styles.summaryTextWrap}>
                    <Text variant="bodySmall" style={[styles.mutedText, { color: themeColors.textSecondary }]}>
                      {labels.monthIncome}
                    </Text>
                    <Text
                      adjustsFontSizeToFit
                      ellipsizeMode="tail"
                      minimumFontScale={0.72}
                      numberOfLines={1}
                      variant="titleSmall"
                      style={styles.incomeValue}
                    >
                      {formatCompactMoney(monthSummary.income)}
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
                  <View style={styles.summaryTextWrap}>
                    <Text variant="bodySmall" style={[styles.mutedText, { color: themeColors.textSecondary }]}>
                      {labels.monthBalance}
                    </Text>
                    <Text
                      adjustsFontSizeToFit
                      ellipsizeMode="tail"
                      minimumFontScale={0.72}
                      numberOfLines={1}
                      variant="titleSmall"
                      style={[styles.balanceSummaryValue, { color: monthBalanceColor }]}
                    >
                      {formatCompactMoney(monthBalance, { sign: monthBalance < 0 ? 'auto' : 'none' })}
                    </Text>
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card
            mode="contained"
            style={[
              styles.heroCard,
              { backgroundColor: themeColors.cardAlt, width: heroCardWidth }
            ]}
          >
            <Card.Content>
              <View style={styles.heroCardHeader}>
                <Text variant="labelLarge" style={[styles.heroLabel, { color: themeColors.primary }]}>
                  {budgetEnabled
                    ? budgetStatus.isOverBudget
                      ? labels.budgetOver
                      : labels.budgetRemaining
                    : labels.monthlyBudget}
                </Text>
                <MaterialCommunityIcons name="wallet-outline" color={themeColors.primary} size={20} />
              </View>
              <Text
                adjustsFontSizeToFit
                ellipsizeMode="tail"
                minimumFontScale={0.58}
                numberOfLines={1}
                variant="displaySmall"
                style={[styles.monthExpenseValue, { color: budgetAmountColor }]}
              >
                {budgetEnabled
                  ? formatCompactMoney(
                      budgetStatus.isOverBudget
                        ? budgetStatus.overAmount
                        : budgetStatus.remainingAmount
                    )
                  : labels.budgetSetup}
              </Text>
              <Text style={[styles.heroSubLabel, { color: themeColors.textSecondary }]}>
                {budgetEnabled
                  ? `${labels.budgetUsed} ${Math.round(budgetStatus.usedPercent)}%`
                  : labels.budgetSetupDescription}
              </Text>

              {budgetEnabled ? (
                <>
                  <View style={[styles.budgetTrack, { backgroundColor: themeColors.outline }]}>
                    <View
                      style={[
                        styles.budgetFill,
                        {
                          backgroundColor: budgetStatus.isOverBudget
                            ? themeColors.expense
                            : themeColors.primary,
                          width: `${Math.min(budgetStatus.usedPercent, 100)}%`
                        }
                      ]}
                    />
                  </View>
                  <View style={styles.budgetMetaRow}>
                    <BudgetMeta
                      label={labels.budgetTotal}
                      value={formatCompactMoney(budgetStatus.budgetAmount)}
                    />
                    <BudgetMeta
                      label={labels.budgetDaily}
                      value={formatCompactMoney(budgetStatus.remainingDailyAmount)}
                    />
                  </View>
                </>
              ) : null}

              <Pressable
                onPress={openBudgetSettings}
                style={({ pressed }) => [
                  styles.budgetButton,
                  { backgroundColor: themeColors.primary },
                  pressed && { opacity: 0.78 }
                ]}
              >
                <Text style={[styles.budgetButtonText, { color: themeColors.background }]}>
                  {labels.budgetSettings}
                </Text>
              </Pressable>
            </Card.Content>
          </Card>
        </ScrollView>
        <View style={styles.heroDots}>
          {[0, 1].map((index) => (
            <View
              key={index}
              style={[
                styles.heroDot,
                {
                  backgroundColor:
                    activeHeroIndex === index ? themeColors.primary : themeColors.outline
                }
              ]}
            />
          ))}
        </View>
      </View>

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
                    <Text
                      ellipsizeMode="tail"
                      numberOfLines={1}
                      variant="bodySmall"
                      style={[styles.groupSummaryText, styles.groupExpense]}
                    >
                      {labels.dailyExpense}:{formatCompactMoney(group.summary.expense, { symbol: false })}
                    </Text>
                  ) : null}
                  {group.summary.income > 0 ? (
                    <Text
                      ellipsizeMode="tail"
                      numberOfLines={1}
                      variant="bodySmall"
                      style={[styles.groupSummaryText, styles.groupIncome]}
                    >
                      {labels.dailyIncome}:{formatCompactMoney(group.summary.income, { symbol: false })}
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
                        adjustsFontSizeToFit
                        ellipsizeMode="tail"
                        minimumFontScale={0.72}
                        numberOfLines={1}
                        variant="titleSmall"
                        style={[styles.recordAmount, { color: amountColor }]}
                      >
                        {formatCompactMoney(record.amount, { sign: isIncome ? 'income' : 'expense' })}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.spendingReminderWrap}>
        <Text
          ellipsizeMode="tail"
          numberOfLines={1}
          variant="bodySmall"
          style={[styles.spendingReminder, { color: themeColors.textSecondary }]}
        >
          {labels.spendingReminder}
        </Text>
      </View>
    </Screen>
  );
}

function BudgetMeta({ label, value }: { label: string; value: string }) {
  const { colors: themeColors } = useAppTheme();

  return (
    <View style={styles.budgetMetaItem}>
      <Text style={[styles.budgetMetaLabel, { color: themeColors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
      <Text
        adjustsFontSizeToFit
        ellipsizeMode="tail"
        minimumFontScale={0.72}
        numberOfLines={1}
        style={[styles.budgetMetaValue, { color: themeColors.text }]}
      >
        {value}
      </Text>
    </View>
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
    minHeight: 218
  },
  heroCarousel: {
    marginBottom: spacing.lg
  },
  heroScrollContent: {
    gap: spacing.md
  },
  heroCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  heroLabel: {
    color: colors.expense,
    fontWeight: '800'
  },
  heroSubLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: spacing.xs
  },
  heroDots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    marginTop: spacing.sm
  },
  heroDot: {
    borderRadius: radius.full,
    height: 6,
    width: 6
  },
  monthExpenseValue: {
    color: colors.text,
    fontWeight: '900',
    marginTop: spacing.sm,
    maxWidth: '100%'
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
    gap: spacing.sm,
    minWidth: 0
  },
  summaryTextWrap: {
    flex: 1,
    minWidth: 0
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
    fontWeight: '800',
    maxWidth: '100%'
  },
  balanceSummaryValue: {
    fontWeight: '800',
    maxWidth: '100%'
  },
  budgetTrack: {
    borderRadius: radius.full,
    height: 8,
    marginTop: spacing.md,
    overflow: 'hidden'
  },
  budgetFill: {
    borderRadius: radius.full,
    height: '100%'
  },
  budgetMetaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md
  },
  budgetMetaItem: {
    flex: 1,
    minWidth: 0
  },
  budgetMetaLabel: {
    fontSize: 11,
    fontWeight: '800'
  },
  budgetMetaValue: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2
  },
  budgetButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 34,
    paddingHorizontal: spacing.md
  },
  budgetButtonText: {
    fontSize: 13,
    fontWeight: '900'
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
  spendingReminderWrap: {
    alignSelf: 'stretch',
    height: 44,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  spendingReminder: {
    lineHeight: 18,
    opacity: 0.72,
    textAlign: 'center',
    textAlignVertical: 'center'
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
    flexShrink: 1,
    fontWeight: '900',
    maxWidth: 116,
    minWidth: 82,
    textAlign: 'right'
  },
});
