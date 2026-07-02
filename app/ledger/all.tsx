import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, SectionList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Card, Text, TextInput } from 'react-native-paper';

import { AppScreen } from '@/components/layout/AppScreen';
import { AppCard } from '@/components/ui/AppCard';
import { ManagedExpenseCategory } from '@/constants/expenseCategories';
import { useAppTheme } from '@/context/AppThemeContext';
import { useExpenseCategories } from '@/context/ExpenseCategoriesContext';
import { ledgerRepository } from '@/repositories/ledgerRepository';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { ExpenseRecord } from '@/types/expense';
import { getRecordType } from '@/utils/expenseRecords';
import { formatMonthLabel } from '@/utils/formatDate';
import { formatCompactMoney } from '@/utils/formatMoney';
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
  cancel: '取消',
  confirm: '确定',
  delete: '删除',
  deleteConfirmDescription: '删除后无法恢复。',
  deleteConfirmTitle: '删除这条账单？',
  deleteFailedDescription: '请稍后再试。',
  deleteFailedTitle: '删除失败',
  edit: '编辑',
  emptyTitle: '没有符合条件的账单',
  emptyDescription: '换个月份或筛选条件试试。',
  expense: '支出',
  filter: '筛选',
  filtered: '已筛选',
  income: '收入',
  loadFailedTitle: '读取失败',
  loadFailedDescription: '无法读取本地记账记录。',
  month: '月份',
  recordActions: '账单操作',
  reset: '重置',
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

function getCategoryOptions(
  typeFilter: LedgerTypeFilter,
  expenseCategories: ManagedExpenseCategory[],
  incomeCategories: ManagedExpenseCategory[]
) {
  const sourceCategories =
    typeFilter === 'expense'
      ? expenseCategories
      : typeFilter === 'income'
        ? incomeCategories
        : [...expenseCategories, ...incomeCategories];
  const categoryMap = new Map<string, ManagedExpenseCategory>();

  sourceCategories.forEach((category) => {
    if (!categoryMap.has(category.label)) {
      categoryMap.set(category.label, category);
    }
  });

  return Array.from(categoryMap.values());
}

function getRecordTitle(record: ExpenseRecord) {
  return record.note || record.category;
}

export default function AllLedgerRecordsScreen() {
  const { colors: themeColors } = useAppTheme();
  const { expenseCategories, getCategoryIcon, incomeCategories } = useExpenseCategories();
  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey);
  const [typeFilter, setTypeFilter] = useState<LedgerTypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [draftCategoryFilter, setDraftCategoryFilter] = useState('all');
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [monthSheetVisible, setMonthSheetVisible] = useState(false);
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
    return getCategoryOptions(typeFilter, expenseCategories, incomeCategories);
  }, [expenseCategories, incomeCategories, typeFilter]);

  useEffect(() => {
    if (
      categoryFilter !== 'all' &&
      !categoryOptions.some((category) => category.label === categoryFilter)
    ) {
      setCategoryFilter('all');
    }
  }, [categoryFilter, categoryOptions]);

  function openFilterSheet() {
    setDraftCategoryFilter(categoryFilter);
    setFilterSheetVisible(true);
  }

  function confirmCategoryFilter() {
    setCategoryFilter(draftCategoryFilter);
    setFilterSheetVisible(false);
  }

  function resetCategoryFilter() {
    setDraftCategoryFilter('all');
  }

  function confirmDeleteRecord(record: ExpenseRecord) {
    Alert.alert(labels.deleteConfirmTitle, labels.deleteConfirmDescription, [
      {
        text: labels.cancel,
        style: 'cancel'
      },
      {
        text: labels.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await ledgerRepository.deleteRecord(record.id);
            await loadRecords();
          } catch {
            Alert.alert(labels.deleteFailedTitle, labels.deleteFailedDescription);
          }
        }
      }
    ]);
  }

  function showRecordActions(record: ExpenseRecord) {
    Alert.alert(labels.recordActions, getRecordTitle(record), [
      {
        text: labels.edit,
        onPress: () => router.push(`/ledger/${record.id}/edit`)
      },
      {
        text: labels.delete,
        style: 'destructive',
        onPress: () => confirmDeleteRecord(record)
      },
      {
        text: labels.cancel,
        style: 'cancel'
      }
    ]);
  }

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
          onLongPress={() => showRecordActions(item)}
          delayLongPress={420}
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
            <MaterialCommunityIcons
              name={getCategoryIcon(item.category, getRecordType(item))}
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
              {item.category}
            </Text>
            <Text
              ellipsizeMode="tail"
              numberOfLines={1}
              variant="bodySmall"
              style={[styles.recordMeta, { color: themeColors.textSecondary }]}
            >
              {item.note?.trim() || item.category}
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
            {formatCompactMoney(item.amount, { sign: isIncome ? 'income' : 'expense' })}
          </Text>
        </Pressable>
      );
    },
    [getCategoryIcon, themeColors]
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
              <Text
                ellipsizeMode="tail"
                numberOfLines={1}
                variant="bodySmall"
                style={[styles.groupSummaryText, { color: themeColors.textSecondary }]}
              >
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

      <View style={styles.toolbar}>
        <Pressable
          onPress={() => setMonthSheetVisible(true)}
          style={[styles.monthButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
        >
          <MaterialCommunityIcons name="calendar-month-outline" color={themeColors.primary} size={18} />
          <Text variant="labelLarge" style={[styles.monthButtonText, { color: themeColors.text }]} numberOfLines={1}>
            {formatMonthLabel(getMonthParts(selectedMonth).year, getMonthParts(selectedMonth).month)}
          </Text>
          <MaterialCommunityIcons name="chevron-down" color={themeColors.textSecondary} size={18} />
        </Pressable>
        <Pressable
          onPress={openFilterSheet}
          style={[styles.filterButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
        >
          <MaterialCommunityIcons name="filter-variant" color={themeColors.primary} size={18} />
          <Text variant="labelLarge" style={[styles.filterButtonText, { color: themeColors.primary }]}>
            {categoryFilter === 'all' ? labels.filter : labels.filtered}
          </Text>
          {categoryFilter !== 'all' ? <View style={[styles.filterDot, { backgroundColor: themeColors.expense }]} /> : null}
        </Pressable>
      </View>

      <View style={styles.choiceRow}>
        {(['all', 'expense', 'income'] as LedgerTypeFilter[]).map((type) => {
          const active = typeFilter === type;
          const text = type === 'all' ? labels.all : type === 'expense' ? labels.expense : labels.income;

          return (
            <Pressable
              key={type}
              onPress={() => {
                setTypeFilter(type);
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

      <MonthSheet
        months={availableMonths}
        onCancel={() => setMonthSheetVisible(false)}
        onSelect={(month) => {
          setSelectedMonth(month);
          setMonthSheetVisible(false);
        }}
        selectedMonth={selectedMonth}
        visible={monthSheetVisible}
      />
      <CategoryFilterSheet
        categoryOptions={categoryOptions}
        draftCategory={draftCategoryFilter}
        onCancel={() => setFilterSheetVisible(false)}
        onConfirm={confirmCategoryFilter}
        onReset={resetCategoryFilter}
        onSelect={setDraftCategoryFilter}
        visible={filterSheetVisible}
      />
    </AppScreen>
  );
}

function MonthSheet({
  months,
  onCancel,
  onSelect,
  selectedMonth,
  visible
}: {
  months: string[];
  onCancel: () => void;
  onSelect: (month: string) => void;
  selectedMonth: string;
  visible: boolean;
}) {
  const { colors: themeColors } = useAppTheme();

  return (
    <Modal animationType="slide" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <Pressable
          accessibilityRole="button"
          onPress={onCancel}
          style={[StyleSheet.absoluteFill, { backgroundColor: themeColors.overlay }]}
        />
        <View style={[styles.sheet, { backgroundColor: themeColors.surfaceElevated }]}>
          <View style={[styles.sheetHandle, { backgroundColor: themeColors.textSecondary }]} />
          <Text variant="titleMedium" style={[styles.sheetTitle, { color: themeColors.text }]}>
            {labels.month}
          </Text>
          <ScrollView contentContainerStyle={styles.sheetOptions} showsVerticalScrollIndicator={false}>
            {months.map((monthKey) => {
              const active = selectedMonth === monthKey;
              const { month, year } = getMonthParts(monthKey);

              return (
                <Pressable
                  key={monthKey}
                  onPress={() => onSelect(monthKey)}
                  style={[
                    styles.sheetOption,
                    { backgroundColor: active ? themeColors.primary : themeColors.card }
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
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function CategoryFilterSheet({
  categoryOptions,
  draftCategory,
  onCancel,
  onConfirm,
  onReset,
  onSelect,
  visible
}: {
  categoryOptions: ManagedExpenseCategory[];
  draftCategory: string;
  onCancel: () => void;
  onConfirm: () => void;
  onReset: () => void;
  onSelect: (category: string) => void;
  visible: boolean;
}) {
  const { colors: themeColors } = useAppTheme();

  return (
    <Modal animationType="slide" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <Pressable
          accessibilityRole="button"
          onPress={onCancel}
          style={[StyleSheet.absoluteFill, { backgroundColor: themeColors.overlay }]}
        />
        <View style={[styles.sheet, { backgroundColor: themeColors.surfaceElevated }]}>
          <View style={[styles.sheetHandle, { backgroundColor: themeColors.textSecondary }]} />
          <Text variant="titleMedium" style={[styles.sheetTitle, { color: themeColors.text }]}>
            {labels.filter}
          </Text>
          <ScrollView
            contentContainerStyle={styles.sheetOptions}
            nestedScrollEnabled
            showsVerticalScrollIndicator={categoryOptions.length > 12}
            style={styles.categoryFilterScroll}
          >
            <View style={styles.categoryChips}>
              <Pressable
                onPress={() => onSelect('all')}
                style={[
                  styles.choiceChip,
                  { backgroundColor: draftCategory === 'all' ? themeColors.primary : themeColors.card },
                  { borderColor: draftCategory === 'all' ? themeColors.primary : themeColors.border }
                ]}
              >
                <Text
                  variant="labelLarge"
                  style={[
                    styles.chipText,
                    { color: draftCategory === 'all' ? themeColors.background : themeColors.textSecondary }
                  ]}
                >
                  {labels.allCategories}
                </Text>
              </Pressable>
              {categoryOptions.map((category) => {
                const active = draftCategory === category.label;

                return (
                  <Pressable
                    key={category.label}
                    onPress={() => onSelect(category.label)}
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
          </ScrollView>
          <View style={styles.sheetActions}>
            <Pressable onPress={onReset} style={[styles.secondaryAction, { backgroundColor: themeColors.card }]}>
              <Text variant="labelLarge" style={[styles.actionText, { color: themeColors.text }]}>
                {labels.reset}
              </Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={[styles.primaryAction, { backgroundColor: themeColors.primary }]}>
              <Text variant="labelLarge" style={[styles.actionText, { color: themeColors.background }]}>
                {labels.confirm}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
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
  toolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  choiceRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  monthButton: {
    alignItems: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 42,
    paddingHorizontal: spacing.md
  },
  monthButtonText: {
    flex: 1,
    fontWeight: '900'
  },
  filterButton: {
    alignItems: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 42,
    paddingHorizontal: spacing.md
  },
  filterButtonText: {
    fontWeight: '900'
  },
  filterDot: {
    borderRadius: radius.full,
    height: 7,
    width: 7
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
    flex: 1,
    minWidth: 0
  },
  recordTitle: {
    color: colors.text,
    fontWeight: '900'
  },
  recordMeta: {
    color: colors.textSecondary,
    fontWeight: '700',
    marginTop: spacing.xs
  },
  recordAmount: {
    flexShrink: 1,
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
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '72%',
    padding: spacing.lg
  },
  sheetHandle: {
    alignSelf: 'center',
    borderRadius: radius.full,
    height: 4,
    marginBottom: spacing.lg,
    opacity: 0.5,
    width: 56
  },
  sheetTitle: {
    fontWeight: '900',
    marginBottom: spacing.md
  },
  sheetOptions: {
    gap: spacing.sm,
    paddingBottom: spacing.sm
  },
  categoryFilterScroll: {
    flexGrow: 0,
    height: 156
  },
  sheetOption: {
    borderRadius: radius.lg,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg
  },
  primaryAction: {
    alignItems: 'center',
    borderRadius: radius.lg,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48
  },
  secondaryAction: {
    alignItems: 'center',
    borderRadius: radius.lg,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48
  },
  actionText: {
    fontWeight: '900'
  }
});
