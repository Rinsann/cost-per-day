import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, SectionList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Card, Text, TextInput } from 'react-native-paper';

import { AppScreen } from '@/components/layout/AppScreen';
import { AppCard } from '@/components/ui/AppCard';
import {
  ExpenseCategoryItem,
  expenseCategories,
  getExpenseCategoryIcon,
  incomeCategories
} from '@/constants/expenseCategories';
import { useAppTheme } from '@/context/AppThemeContext';
import { ledgerRepository } from '@/repositories/ledgerRepository';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { ExpenseRecord } from '@/types/expense';
import { getRecordType } from '@/utils/expenseRecords';
import { formatMonthLabel } from '@/utils/formatDate';
import { formatMoney } from '@/utils/formatMoney';
import {
  filterRecordsByMonth,
  filterRecordsByTypeCategoryKeyword,
  formatDailySummary,
  getAvailableRecordMonths,
  groupRecordsByDate,
  LedgerTypeFilter
} from '@/utils/ledgerStats';

type RecordSection = {
  data: ExpenseRecord[];
  date: string;
  label: string;
  summary: {
    expense: number;
    income: number;
  };
};

const labels = {
  title: '全部账单',
  all: '全部',
  allCategories: '全部分类',
  emptyTitle: '没有符合条件的账单',
  emptyDescription: '换个月份或筛选条件试试。',
  expense: '支出',
  income: '收入',
  loadFailedTitle: '读取失败',
  loadFailedDescription: '无法读取本地记账记录。',
  searchPlaceholder: '搜索备注或分类',
  type: '类型',
  category: '分类'
};

function getCurrentMonthKey() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthParts(monthKey: string) {
  const [yearText, monthText] = monthKey.split('-');
  const year = Number(yearText);
  const month = Number(monthText);

  return {
    month: Number.isFinite(month) ? month : new Date().getMonth() + 1,
    year: Number.isFinite(year) ? year : new Date().getFullYear()
  };
}

function formatSectionDate(date: string, label: string) {
  return label === date ? date : `${date} ${label}`;
}

function getCategoryOptions(typeFilter: LedgerTypeFilter) {
  const sourceCategories =
    typeFilter === 'expense'
      ? expenseCategories
      : typeFilter === 'income'
        ? incomeCategories
        : [...expenseCategories, ...incomeCategories];
  const categoryMap = new Map<string, ExpenseCategoryItem>();

  sourceCategories.forEach((category) => {
    if (!categoryMap.has(category.label)) {
      categoryMap.set(category.label, category);
    }
  });

  return Array.from(categoryMap.values());
}

function getRecordIcon(record: ExpenseRecord) {
  return getExpenseCategoryIcon(record.category, getRecordType(record));
}

export default function AllLedgerRecordsScreen() {
  const { colors: themeColors } = useAppTheme();
  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey);
  const [typeFilter, setTypeFilter] = useState<LedgerTypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const today = useMemo(() => new Date(), []);

  const loadRecords = useCallback(async () => {
    setLoading(true);

    try {
      const nextRecords = await ledgerRepository.getAllRecords();
      setRecords(nextRecords);
    } catch {
      Alert.alert(labels.loadFailedTitle, labels.loadFailedDescription);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [loadRecords])
  );

  const availableMonths = useMemo(() => {
    return getAvailableRecordMonths(records, today);
  }, [records, today]);

  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  const categoryOptions = useMemo(() => {
    return getCategoryOptions(typeFilter);
  }, [typeFilter]);

  useEffect(() => {
    if (
      categoryFilter !== 'all' &&
      !categoryOptions.some((category) => category.label === categoryFilter)
    ) {
      setCategoryFilter('all');
    }
  }, [categoryFilter, categoryOptions]);

  const monthRecords = useMemo(() => {
    const { month, year } = getMonthParts(selectedMonth);

    return filterRecordsByMonth(records, year, month);
  }, [records, selectedMonth]);

  const filteredRecords = useMemo(() => {
    return filterRecordsByTypeCategoryKeyword(monthRecords, {
      category: categoryFilter,
      keyword,
      type: typeFilter
    });
  }, [categoryFilter, keyword, monthRecords, typeFilter]);

  const sections = useMemo<RecordSection[]>(() => {
    return groupRecordsByDate(filteredRecords, today).map((group) => ({
      data: group.records,
      date: group.date,
      label: group.label,
      summary: group.summary
    }));
  }, [filteredRecords, today]);

  const renderRecord = useCallback(
    ({ index, item, section }: { index: number; item: ExpenseRecord; section: RecordSection }) => {
      const isIncome = getRecordType(item) === 'income';
      const amountColor = isIncome ? themeColors.income : themeColors.expense;
      const isLastItem = section.data[section.data.length - 1]?.id === item.id;
      const isFirstItem = index === 0;

      return (
        <Pressable
          onPress={() => router.push(`/ledger/${item.id}?from=all`)}
          android_ripple={{ color: themeColors.ripple }}
          style={({ pressed }) => [
            styles.recordItem,
            { backgroundColor: themeColors.card, borderBottomColor: themeColors.outline },
            isFirstItem && styles.recordItemFirst,
            isLastItem && styles.recordItemLast,
            pressed && { backgroundColor: themeColors.surfacePressed }
          ]}
        >
          <View style={[styles.recordIcon, { backgroundColor: themeColors.cardAlt }]}>
            <MaterialCommunityIcons name={getRecordIcon(item)} color={amountColor} size={22} />
          </View>
          <View style={styles.recordMain}>
            <Text variant="titleSmall" style={[styles.recordTitle, { color: themeColors.text }]} numberOfLines={1}>
              {item.note || item.category}
            </Text>
            <Text variant="bodySmall" style={[styles.recordMeta, { color: themeColors.textSecondary }]}>
              {item.category} · {item.date}
            </Text>
          </View>
          <Text variant="titleSmall" style={[styles.recordAmount, { color: amountColor }]} numberOfLines={1}>
            {formatMoney(item.amount, { sign: isIncome ? 'income' : 'expense' })}
          </Text>
        </Pressable>
      );
    },
    [themeColors]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: RecordSection }) => {
      const summaryText = formatDailySummary(section.summary);

      return (
        <View style={styles.sectionWrap}>
          <View style={styles.groupHeader}>
            <Text variant="labelLarge" style={[styles.groupDate, { color: themeColors.textSecondary }]}>
              {formatSectionDate(section.date, section.label)}
            </Text>
            {summaryText ? (
              <Text variant="bodySmall" style={[styles.groupSummaryText, { color: themeColors.textSecondary }]}>
                {summaryText}
              </Text>
            ) : null}
          </View>
        </View>
      );
    },
    [themeColors.textSecondary]
  );

  const listHeader = (
    <View style={styles.listHeader}>
      <TextInput
        mode="outlined"
        value={keyword}
        onChangeText={setKeyword}
        placeholder={labels.searchPlaceholder}
        placeholderTextColor={themeColors.textSecondary}
        left={<TextInput.Icon icon="magnify" color={themeColors.iconMuted} />}
        style={[styles.searchInput, { backgroundColor: themeColors.inputBackground }]}
        textColor={themeColors.text}
        outlineColor={themeColors.inputBorder}
        activeOutlineColor={themeColors.primary}
      />

      <FlatList
        horizontal
        data={availableMonths}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const { month, year } = getMonthParts(item);
          const active = selectedMonth === item;

          return (
            <Pressable
              onPress={() => setSelectedMonth(item)}
              style={[
                styles.monthChip,
                { backgroundColor: active ? themeColors.primary : themeColors.card },
                { borderColor: active ? themeColors.primary : themeColors.border }
              ]}
            >
              <Text
                variant="labelLarge"
                style={[
                  styles.chipText,
                  { color: active ? themeColors.background : themeColors.textSecondary }
                ]}
              >
                {formatMonthLabel(year, month)}
              </Text>
            </Pressable>
          );
        }}
        contentContainerStyle={styles.monthList}
        showsHorizontalScrollIndicator={false}
      />

      <Text variant="labelLarge" style={[styles.filterLabel, { color: themeColors.textSecondary }]}>
        {labels.type}
      </Text>
      <View style={styles.choiceRow}>
        {(['all', 'expense', 'income'] as LedgerTypeFilter[]).map((type) => {
          const active = typeFilter === type;
          const text = type === 'all' ? labels.all : type === 'expense' ? labels.expense : labels.income;

          return (
            <Pressable
              key={type}
              onPress={() => {
                setTypeFilter(type);
                setCategoryFilter('all');
              }}
              style={[
                styles.choiceChip,
                { backgroundColor: active ? themeColors.primary : themeColors.card },
                { borderColor: active ? themeColors.primary : themeColors.border }
              ]}
            >
              <Text
                variant="labelLarge"
                style={[
                  styles.chipText,
                  { color: active ? themeColors.background : themeColors.textSecondary }
                ]}
              >
                {text}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text variant="labelLarge" style={[styles.filterLabel, { color: themeColors.textSecondary }]}>
        {labels.category}
      </Text>
      <View style={styles.categoryChips}>
        <Pressable
          onPress={() => setCategoryFilter('all')}
          style={[
            styles.choiceChip,
            { backgroundColor: categoryFilter === 'all' ? themeColors.primary : themeColors.card },
            { borderColor: categoryFilter === 'all' ? themeColors.primary : themeColors.border }
          ]}
        >
          <Text
            variant="labelLarge"
            style={[
              styles.chipText,
              { color: categoryFilter === 'all' ? themeColors.background : themeColors.textSecondary }
            ]}
          >
            {labels.allCategories}
          </Text>
        </Pressable>
        {categoryOptions.map((category) => {
          const active = categoryFilter === category.label;

          return (
            <Pressable
              key={category.label}
              onPress={() => setCategoryFilter(category.label)}
              style={[
                styles.choiceChip,
                { backgroundColor: active ? themeColors.primary : themeColors.card },
                { borderColor: active ? themeColors.primary : themeColors.border }
              ]}
            >
              <Text
                variant="labelLarge"
                style={[
                  styles.chipText,
                  { color: active ? themeColors.background : themeColors.textSecondary }
                ]}
              >
                {category.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <AppScreen scroll={false} contentStyle={styles.screenContent}>
      <Stack.Screen options={{ title: labels.title }} />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={themeColors.primary} />
        </View>
      ) : null}

      {!loading ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderRecord}
          renderSectionHeader={renderSectionHeader}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <AppCard style={styles.emptyCard}>
              <Card.Content>
                <Text variant="titleMedium" style={[styles.emptyTitle, { color: themeColors.text }]}>
                  {labels.emptyTitle}
                </Text>
                <Text variant="bodyMedium" style={[styles.emptyDescription, { color: themeColors.textSecondary }]}>
                  {labels.emptyDescription}
                </Text>
              </Card.Content>
            </AppCard>
          }
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1
  },
  loadingWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
  },
  listContent: {
    paddingBottom: spacing.xl
  },
  listHeader: {
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  searchInput: {
    backgroundColor: colors.inputBackground
  },
  monthList: {
    gap: spacing.sm,
    paddingVertical: spacing.xs
  },
  monthChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    marginRight: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  filterLabel: {
    color: colors.textSecondary,
    fontWeight: '900',
    marginTop: spacing.xs
  },
  choiceRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  choiceChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  chipText: {
    fontWeight: '900'
  },
  sectionWrap: {
    paddingTop: spacing.md
  },
  groupHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm
  },
  groupDate: {
    color: colors.textSecondary,
    flexShrink: 0,
    fontWeight: '900'
  },
  groupSummaryText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right'
  },
  recordItem: {
    alignItems: 'center',
    borderBottomColor: colors.outline,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md
  },
  recordItemFirst: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  },
  recordItemLast: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
    flex: 1
  },
  recordTitle: {
    color: colors.text,
    fontWeight: '900'
  },
  recordMeta: {
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  recordAmount: {
    fontWeight: '900',
    maxWidth: 120,
    minWidth: 90,
    textAlign: 'right'
  },
  emptyCard: {
    marginTop: spacing.md
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: '900'
  },
  emptyDescription: {
    color: colors.textSecondary,
    lineHeight: 22,
    marginTop: spacing.sm
  }
});
