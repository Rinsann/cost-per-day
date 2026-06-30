import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Dialog,
  IconButton,
  Portal,
  Text
} from 'react-native-paper';

import { AppScreen } from '@/components/layout/AppScreen';
import { AppCard } from '@/components/ui/AppCard';
import { useAppTheme } from '@/context/AppThemeContext';
import { useExpenseCategories } from '@/context/ExpenseCategoriesContext';
import { ledgerRepository } from '@/repositories/ledgerRepository';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { ExpenseRecord } from '@/types/expense';
import { formatCurrency } from '@/utils/cost';

const labels = {
  title: '记账详情',
  type: '类型',
  income: '收入',
  expense: '支出',
  amount: '金额',
  category: '分类',
  note: '备注',
  noNote: '暂无备注',
  date: '日期',
  createdAt: '创建时间',
  notFound: '未找到这条记录',
  backToLedger: '返回记账',
  edit: '编辑',
  delete: '删除',
  cancel: '取消',
  deleteTitle: '删除这条记录？',
  deleteDescription: '删除后无法恢复。',
  deleteFailedTitle: '删除失败',
  deleteFailedDescription: '请稍后再试。'
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

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('zh-CN', { hour12: false });
}

type DetailRowProps = {
  label: string;
  value: string;
  valueColor?: string;
};

function DetailRow({ label, value, valueColor }: DetailRowProps) {
  const { colors: themeColors } = useAppTheme();

  return (
    <View style={[styles.detailRow, { borderBottomColor: themeColors.border }]}>
      <Text variant="bodyMedium" style={[styles.detailLabel, { color: themeColors.textSecondary }]}>
        {label}
      </Text>
      <Text variant="bodyLarge" style={[styles.detailValue, { color: valueColor ?? themeColors.text }]}>
        {value}
      </Text>
    </View>
  );
}

export default function LedgerDetailScreen() {
  const { colors: themeColors } = useAppTheme();
  const { getCategoryIcon } = useExpenseCategories();
  const params = useLocalSearchParams<{ from?: string | string[]; id?: string | string[] }>();
  const recordId = getParamValue(params.id);
  const source = getParamValue(params.from);
  const backRoute = source === 'all' ? '/ledger/all' : '/ledger';
  const [record, setRecord] = useState<ExpenseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
          setLoading(false);
        }
      }

      loadRecord();

      return () => {
        mounted = false;
      };
    }, [recordId])
  );

  async function handleDelete() {
    if (!recordId) {
      return;
    }

    setDeleting(true);

    try {
      await ledgerRepository.deleteRecord(recordId);
      setDeleteDialogVisible(false);
      router.replace(backRoute);
    } catch {
      setDeleteDialogVisible(false);
      Alert.alert(labels.deleteFailedTitle, labels.deleteFailedDescription);
    } finally {
      setDeleting(false);
    }
  }

  const recordType = record ? getRecordType(record) : 'expense';
  const amountColor = recordType === 'income' ? themeColors.income : themeColors.expense;

  return (
    <AppScreen>
      <Stack.Screen
        options={{
          title: record?.category ?? labels.title,
          headerRight: record
            ? () => (
                <View style={styles.headerActions}>
                  <IconButton
                    icon="pencil-outline"
                    iconColor={themeColors.primary}
                    accessibilityLabel={labels.edit}
                    onPress={() => router.push(`/ledger/${record.id}/edit`)}
                  />
                  <IconButton
                    icon="delete-outline"
                    iconColor={themeColors.danger}
                    accessibilityLabel={labels.delete}
                    onPress={() => setDeleteDialogVisible(true)}
                  />
                </View>
              )
            : undefined
        }}
      />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={themeColors.primary} />
        </View>
      ) : null}

      {!loading && !record ? (
        <AppCard>
          <Card.Content style={styles.emptyContent}>
            <Text variant="titleLarge" style={[styles.emptyTitle, { color: themeColors.text }]}>
              {labels.notFound}
            </Text>
            <Button mode="contained" onPress={() => router.replace(backRoute)}>
              {labels.backToLedger}
            </Button>
          </Card.Content>
        </AppCard>
      ) : null}

      {!loading && record ? (
        <View style={styles.content}>
          <AppCard elevated style={styles.heroCard}>
            <Card.Content style={styles.heroContent}>
              <View style={[styles.recordIcon, { backgroundColor: themeColors.surface }]}>
                <IconButton
                  icon={getCategoryIcon(record.category, recordType)}
                  iconColor={amountColor}
                  size={28}
                  style={styles.recordIconButton}
                />
              </View>
              <Text variant="labelLarge" style={[styles.heroLabel, { color: themeColors.textSecondary }]}>
                {recordType === 'income' ? labels.income : labels.expense}
              </Text>
              <Text variant="displaySmall" style={[styles.amountText, { color: amountColor }]}>
                {recordType === 'income' ? '+' : '-'}
                {formatCurrency(record.amount)}
              </Text>
              <Text variant="titleMedium" style={[styles.categoryText, { color: themeColors.text }]}>
                {record.category}
              </Text>
            </Card.Content>
          </AppCard>

          <AppCard>
            <Card.Content>
              <DetailRow
                label={labels.type}
                value={recordType === 'income' ? labels.income : labels.expense}
                valueColor={amountColor}
              />
              <DetailRow label={labels.amount} value={formatCurrency(record.amount)} />
              <DetailRow label={labels.category} value={record.category} />
              <DetailRow label={labels.date} value={record.date} />
              <DetailRow label={labels.createdAt} value={formatDateTime(record.createdAt)} />
            </Card.Content>
          </AppCard>

          <AppCard>
            <Card.Content>
              <Text variant="titleMedium" style={[styles.cardTitle, { color: themeColors.text }]}>
                {labels.note}
              </Text>
              <Text variant="bodyMedium" style={[styles.noteText, { color: themeColors.textSecondary }]}>
                {record.note ?? labels.noNote}
              </Text>
            </Card.Content>
          </AppCard>
        </View>
      ) : null}

      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
          style={[styles.dialog, { backgroundColor: themeColors.surfaceElevated }]}
        >
          <Dialog.Title style={[styles.dialogTitle, { color: themeColors.text }]}>
            {labels.deleteTitle}
          </Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.dialogDescription, { color: themeColors.textSecondary }]}>
              {labels.deleteDescription}
            </Text>
          </Dialog.Content>
          <View style={styles.dialogActions}>
            <Button mode="text" disabled={deleting} onPress={() => setDeleteDialogVisible(false)}>
              {labels.cancel}
            </Button>
            <Button
              mode="text"
              loading={deleting}
              disabled={deleting}
              textColor={themeColors.danger}
              onPress={handleDelete}
            >
              {labels.delete}
            </Button>
          </View>
        </Dialog>
      </Portal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row'
  },
  loadingWrap: {
    alignItems: 'center',
    minHeight: 220,
    justifyContent: 'center'
  },
  content: {
    gap: spacing.md
  },
  heroCard: {
    borderRadius: 24
  },
  heroContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg
  },
  recordIcon: {
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    marginBottom: spacing.sm
  },
  recordIconButton: {
    margin: 0
  },
  heroLabel: {
    color: colors.textSecondary,
    fontWeight: '800'
  },
  amountText: {
    fontWeight: '900',
    marginTop: spacing.xs
  },
  categoryText: {
    color: colors.text,
    fontWeight: '800',
    marginTop: spacing.xs
  },
  detailRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm
  },
  detailLabel: {
    color: colors.textSecondary
  },
  detailValue: {
    flex: 1,
    fontWeight: '800',
    marginLeft: spacing.md,
    textAlign: 'right'
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: spacing.sm
  },
  noteText: {
    color: colors.textSecondary,
    lineHeight: 22
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
  dialog: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: 24,
    width: '86%'
  },
  dialogTitle: {
    color: colors.text,
    fontWeight: '800'
  },
  dialogDescription: {
    color: colors.textSecondary
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md
  }
});
