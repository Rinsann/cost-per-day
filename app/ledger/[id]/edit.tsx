import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Text, TextInput } from 'react-native-paper';

import { AppScreen } from '@/components/layout/AppScreen';
import { AppCard } from '@/components/ui/AppCard';
import { expenseCategories, incomeCategories } from '@/constants/expenseCategories';
import { ledgerRepository } from '@/repositories/ledgerRepository';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { ExpenseRecord, ExpenseRecordType } from '@/types/expense';

const labels = {
  title: '编辑记账',
  expense: '支出',
  income: '收入',
  amount: '金额',
  category: '分类',
  note: '备注（选填）',
  date: '日期',
  save: '保存修改',
  saving: '保存中...',
  notFound: '未找到这条记录',
  backToLedger: '返回记账',
  invalidTitle: '内容无效',
  invalidDescription: '请确认金额大于 0，日期格式为 YYYY-MM-DD。',
  saveFailedTitle: '保存失败',
  saveFailedDescription: '请稍后再试。'
};

function getParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getRecordType(record: ExpenseRecord) {
  return record.type === 'income' ? 'income' : 'expense';
}

function isValidDateString(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function normalizeAmountInput(value: string) {
  const sanitized = value.replace(/[^\d.]/g, '');
  const [integerPart, ...decimalParts] = sanitized.split('.');
  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, '') || '0';

  if (decimalParts.length === 0) {
    return normalizedInteger;
  }

  return `${normalizedInteger}.${decimalParts.join('').slice(0, 2)}`;
}

function isValidAmountText(value: string) {
  return /^\d+(\.\d{0,2})?$/.test(value) && Number(value) > 0;
}

export default function EditLedgerRecordScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const recordId = getParamValue(params.id);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [record, setRecord] = useState<ExpenseRecord | null>(null);
  const [recordType, setRecordType] = useState<ExpenseRecordType>('expense');
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState(expenseCategories[0].label);
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');

  const categories = recordType === 'expense' ? expenseCategories : incomeCategories;
  const isAmountValid = isValidAmountText(amountText);
  const isDateValid = isValidDateString(date);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function loadRecord() {
        setLoading(true);

        if (!recordId) {
          setRecord(null);
          setLoading(false);
          return;
        }

        const nextRecord = await ledgerRepository.getRecordById(recordId);

        if (mounted) {
          setRecord(nextRecord);

          if (nextRecord) {
            const nextType = getRecordType(nextRecord);
            setRecordType(nextType);
            setAmountText(String(nextRecord.amount));
            setCategory(nextRecord.category);
            setNote(nextRecord.note ?? '');
            setDate(nextRecord.date);
          }

          setLoading(false);
        }
      }

      loadRecord();

      return () => {
        mounted = false;
      };
    }, [recordId])
  );

  function selectRecordType(nextType: ExpenseRecordType) {
    const nextCategories = nextType === 'expense' ? expenseCategories : incomeCategories;

    setRecordType(nextType);
    setCategory((currentCategory) => {
      return nextCategories.some((item) => item.label === currentCategory)
        ? currentCategory
        : nextCategories[0].label;
    });
  }

  async function handleSave() {
    if (!recordId || !isAmountValid || !isDateValid) {
      Alert.alert(labels.invalidTitle, labels.invalidDescription);
      return;
    }

    setSaving(true);

    try {
      const updatedRecord = await ledgerRepository.updateRecord(recordId, {
        type: recordType,
        amount: Number(amountText),
        category,
        note: note.trim() || undefined,
        date
      });

      if (!updatedRecord) {
        setRecord(null);
        return;
      }

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(`/ledger/${recordId}`);
      }
    } catch {
      Alert.alert(labels.saveFailedTitle, labels.saveFailedDescription);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppScreen>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}

      {!loading && !record ? (
        <AppCard>
          <Card.Content style={styles.emptyContent}>
            <Text variant="titleLarge" style={styles.emptyTitle}>
              {labels.notFound}
            </Text>
            <Button mode="contained" onPress={() => router.replace('/ledger')}>
              {labels.backToLedger}
            </Button>
          </Card.Content>
        </AppCard>
      ) : null}

      {!loading && record ? (
        <AppCard>
          <Card.Content style={styles.formContent}>
            <Text variant="titleLarge" style={styles.title}>
              {labels.title}
            </Text>

            <View style={styles.segment}>
              <Pressable
                onPress={() => selectRecordType('expense')}
                style={[
                  styles.segmentButton,
                  recordType === 'expense' && styles.expenseSegmentButton
                ]}
              >
                <Text
                  variant="titleSmall"
                  style={[
                    styles.segmentText,
                    recordType === 'expense' && styles.activeSegmentText
                  ]}
                >
                  {labels.expense}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => selectRecordType('income')}
                style={[
                  styles.segmentButton,
                  recordType === 'income' && styles.incomeSegmentButton
                ]}
              >
                <Text
                  variant="titleSmall"
                  style={[
                    styles.segmentText,
                    recordType === 'income' && styles.activeSegmentText
                  ]}
                >
                  {labels.income}
                </Text>
              </Pressable>
            </View>

            <TextInput
              label={labels.amount}
              mode="outlined"
              value={amountText}
              onChangeText={(value) => setAmountText(normalizeAmountInput(value))}
              keyboardType="decimal-pad"
              error={amountText.length > 0 && !isAmountValid}
              left={<TextInput.Affix text="￥" />}
              style={styles.input}
            />

            <Text variant="titleSmall" style={styles.sectionTitle}>
              {labels.category}
            </Text>
            <View style={styles.categoryGrid}>
              {categories.map((item) => {
                const isSelected = category === item.label;

                return (
                  <Pressable
                    key={item.label}
                    onPress={() => setCategory(item.label)}
                    style={[styles.categoryItem, isSelected && styles.selectedCategoryItem]}
                  >
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={22}
                      color={isSelected ? colors.background : colors.textSecondary}
                    />
                    <Text
                      variant="labelMedium"
                      style={[styles.categoryText, isSelected && styles.selectedCategoryText]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              label={labels.date}
              mode="outlined"
              value={date}
              onChangeText={setDate}
              keyboardType="numbers-and-punctuation"
              placeholder="YYYY-MM-DD"
              error={date.length > 0 && !isDateValid}
              style={styles.input}
            />

            <TextInput
              label={labels.note}
              mode="outlined"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              style={styles.noteInput}
            />

            <Button
              mode="contained"
              loading={saving}
              disabled={saving || !isAmountValid || !isDateValid}
              onPress={handleSave}
              style={styles.saveButton}
              contentStyle={styles.saveButtonContent}
            >
              {saving ? labels.saving : labels.save}
            </Button>
          </Card.Content>
        </AppCard>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220
  },
  emptyContent: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: '800'
  },
  formContent: {
    gap: spacing.md
  },
  title: {
    color: colors.text,
    fontWeight: '900'
  },
  segment: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    flexDirection: 'row',
    padding: spacing.xs
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: radius.full,
    flex: 1,
    paddingVertical: spacing.sm
  },
  expenseSegmentButton: {
    backgroundColor: colors.expense
  },
  incomeSegmentButton: {
    backgroundColor: colors.primary
  },
  segmentText: {
    color: colors.textSecondary,
    fontWeight: '800'
  },
  activeSegmentText: {
    color: colors.text
  },
  input: {
    backgroundColor: colors.surfaceElevated
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '800'
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  categoryItem: {
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    flexBasis: '22%',
    minHeight: 58,
    paddingVertical: 6,
    width: '22%'
  },
  selectedCategoryItem: {
    backgroundColor: colors.primary
  },
  categoryText: {
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  selectedCategoryText: {
    color: colors.background,
    fontWeight: '800'
  },
  noteInput: {
    backgroundColor: colors.surfaceElevated,
    minHeight: 92
  },
  saveButton: {
    borderRadius: radius.lg
  },
  saveButtonContent: {
    minHeight: 48
  }
});
