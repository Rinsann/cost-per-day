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
import { getExpenseCategoryIcon } from '@/constants/expenseCategories';
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

function DetailRow({ label, value, valueColor = colors.text }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text variant="bodyMedium" style={styles.detailLabel}>
        {label}
      </Text>
      <Text variant="bodyLarge" style={[styles.detailValue, { color: valueColor }]}>
        {value}
      </Text>
    </View>
  );
}

export default function LedgerDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const recordId = getParamValue(params.id);
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
      router.replace('/ledger');
    } catch {
      setDeleteDialogVisible(false);
      Alert.alert(labels.deleteFailedTitle, labels.deleteFailedDescription);
    } finally {
      setDeleting(false);
    }
  }

  const recordType = record ? getRecordType(record) : 'expense';
  const amountColor = recordType === 'income' ? colors.income : colors.expense;

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
                    iconColor={colors.primary}
                    accessibilityLabel={labels.edit}
                    onPress={() => router.push(`/ledger/${record.id}/edit`)}
                  />
                  <IconButton
                    icon="delete-outline"
                    iconColor={colors.danger}
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
        <View style={styles.content}>
          <AppCard elevated style={styles.heroCard}>
            <Card.Content style={styles.heroContent}>
              <View style={styles.recordIcon}>
                <IconButton
                  icon={getExpenseCategoryIcon(record.category, recordType)}
                  iconColor={amountColor}
                  size={28}
                  style={styles.recordIconButton}
                />
              </View>
              <Text variant="labelLarge" style={styles.heroLabel}>
                {recordType === 'income' ? labels.income : labels.expense}
              </Text>
              <Text variant="displaySmall" style={[styles.amountText, { color: amountColor }]}>
                {recordType === 'income' ? '+' : '-'}
                {formatCurrency(record.amount)}
              </Text>
              <Text variant="titleMedium" style={styles.categoryText}>
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
              <Text variant="titleMedium" style={styles.cardTitle}>
                {labels.note}
              </Text>
              <Text variant="bodyMedium" style={styles.noteText}>
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
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>{labels.deleteTitle}</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogDescription}>{labels.deleteDescription}</Text>
          </Dialog.Content>
          <View style={styles.dialogActions}>
            <Button mode="text" disabled={deleting} onPress={() => setDeleteDialogVisible(false)}>
              {labels.cancel}
            </Button>
            <Button
              mode="text"
              loading={deleting}
              disabled={deleting}
              textColor={colors.danger}
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
