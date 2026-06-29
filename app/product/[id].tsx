import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Dialog,
  IconButton,
  Portal,
  Text
} from 'react-native-paper';

import { Screen } from '@/components/layout/Screen';
import { AppCard } from '@/components/ui/AppCard';
import { getCategoryName } from '@/constants/categories';
import { messages } from '@/constants/messages';
import { useAppTheme } from '@/context/AppThemeContext';
import { deleteProductById, getProductById } from '@/storage/productStorage';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { Product } from '@/types/product';
import { formatCurrency, getDailyCost, getProductMetrics } from '@/utils/cost';
import { getTargetProgress } from '@/utils/targetCost';

const labels = {
  detailTitle: '\u6d88\u8d39\u54c1\u8be6\u60c5',
  category: '\u5206\u7c7b',
  price: '\u8d2d\u4e70\u4ef7\u683c',
  purchaseDate: '购买日期',
  usedDays: '\u5df2\u4f7f\u7528\u5929\u6570',
  dailyCost: '\u5f53\u524d\u65e5\u5747\u6210\u672c',
  monthlyCost: '\u5f53\u524d\u6708\u5747\u6210\u672c',
  note: '\u5907\u6ce8',
  noNote: '\u6682\u65e0\u5907\u6ce8',
  days: '\u5929',
  valueAnalysis: '\u4ef7\u503c\u5206\u6790',
  current: '\u5f53\u524d',
  after30Days: '30\u5929\u540e',
  after365Days: '365\u5929\u540e',
  perDay: '/\u5929',
  valueHint: '\u7ee7\u7eed\u4f7f\u7528\u4f1a\u8fdb\u4e00\u6b65\u644a\u8584\u8d2d\u4e70\u6210\u672c\uff0c\u5e2e\u52a9\u4f60\u5224\u65ad\u8fd9\u7b14\u6d88\u8d39\u662f\u5426\u503c\u5f97\u3002',
  targetTitle: '\u76ee\u6807\u65e5\u5747\u6210\u672c',
  targetPrefix: '\u76ee\u6807',
  targetTotalDays: '\u9700\u8981\u603b\u4f7f\u7528\u5929\u6570',
  remainingDays: '\u8fd8\u9700\u4f7f\u7528',
  targetDate: '预计达成日期',
  targetReached: '\u5df2\u8fbe\u6210\u76ee\u6807',
  targetReachedHint: '\u5f53\u524d\u65e5\u5747\u6210\u672c\u5df2\u4f4e\u4e8e\u76ee\u6807\u3002',
  targetNotSet: '\u672a\u8bbe\u7f6e\u76ee\u6807\u65e5\u5747\u6210\u672c',
  targetNotSetHint: '\u7f16\u8f91\u6d88\u8d39\u54c1\u540e\u53ef\u8bbe\u7f6e\u76ee\u6807\u6210\u672c\u3002',
  targetProgress: '\u76ee\u6807\u8fdb\u5ea6',
  progressDone: '\u5df2\u5b8c\u6210',
  renewalAdvice: '\u6362\u65b0\u5efa\u8bae',
  continueUsing: '\u5efa\u8bae\u7ee7\u7eed\u4f7f\u7528',
  continueUsingHint:
    '\u8be5\u6d88\u8d39\u54c1\u8fd8\u672a\u8fbe\u5230\u4f60\u7684\u76ee\u6807\u65e5\u5747\u6210\u672c\u3002\u5982\u679c\u6ca1\u6709\u635f\u574f\u6216\u660e\u663e\u5f71\u54cd\u4f7f\u7528\uff0c\u5efa\u8bae\u7ee7\u7eed\u4f7f\u7528\u3002',
  renewalReady: '\u5df2\u8fbe\u5230\u6362\u65b0\u95e8\u69db',
  renewalReadyHint:
    '\u8be5\u6d88\u8d39\u54c1\u5df2\u7ecf\u8fbe\u5230\u4f60\u7684\u76ee\u6807\u65e5\u5747\u6210\u672c\u3002\u5982\u679c\u6709\u660e\u786e\u9700\u6c42\uff0c\u53ef\u4ee5\u8003\u8651\u6362\u65b0\u3002',
  renewalNotSet: '\u672a\u8bbe\u7f6e\u6362\u65b0\u76ee\u6807',
  renewalNotSetHint:
    '\u8bbe\u7f6e\u76ee\u6807\u65e5\u5747\u6210\u672c\u540e\uff0c\u53ef\u4ee5\u5224\u65ad\u4ec0\u4e48\u65f6\u5019\u66f4\u9002\u5408\u6362\u65b0\u3002',
  backHome: '\u8fd4\u56de\u9996\u9875',
  edit: '\u7f16\u8f91',
  cancel: '\u53d6\u6d88',
  delete: '\u5220\u9664'
};

function getParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

type MetricRowProps = {
  label: string;
  value: string;
};

function MetricRow({ label, value }: MetricRowProps) {
  const { colors: themeColors } = useAppTheme();

  return (
    <View style={[styles.metricRow, { borderBottomColor: themeColors.outline }]}>
      <Text variant="bodyMedium" style={[styles.metricLabel, { color: themeColors.textSecondary }]}>
        {label}
      </Text>
      <Text variant="bodyLarge" style={[styles.metricValue, { color: themeColors.text }]}>
        {value}
      </Text>
    </View>
  );
}

export default function ProductDetailScreen() {
  const { colors: themeColors } = useAppTheme();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const productId = getParamValue(params.id);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function loadProduct() {
        setLoading(true);

        if (!productId) {
          setProduct(null);
          setLoading(false);
          return;
        }

        const nextProduct = await getProductById(productId);

        if (mounted) {
          setProduct(nextProduct ?? null);
          setLoading(false);
        }
      }

      loadProduct();

      return () => {
        mounted = false;
      };
    }, [productId])
  );

  const metrics = useMemo(() => {
    return product ? getProductMetrics(product) : null;
  }, [product]);

  const valueMetrics = useMemo(() => {
    if (!product || !metrics) {
      return null;
    }

    return {
      current: metrics.dailyCost,
      after30Days: getDailyCost(product.price, metrics.usedDays + 30),
      after365Days: getDailyCost(product.price, metrics.usedDays + 365)
    };
  }, [metrics, product]);

  const targetMetrics = useMemo(() => {
    return product ? getTargetProgress(product) : null;
  }, [product]);

  async function handleDelete() {
    if (!productId) {
      return;
    }

    setDeleting(true);
    await deleteProductById(productId);
    setDeleting(false);
    setDeleteDialogVisible(false);
    router.dismissTo('/cost');
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: product?.name ?? labels.detailTitle,
          headerRight: product
            ? () => (
                <View style={styles.headerActions}>
                  <IconButton
                    icon="pencil-outline"
                    iconColor={themeColors.primary}
                    accessibilityLabel={labels.edit}
                    onPress={() => router.push(`/product/${productId}/edit`)}
                  />
                  <IconButton
                    icon="delete-outline"
                    iconColor={themeColors.danger}
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

      {!loading && !product ? (
        <AppCard style={styles.card}>
          <Card.Content style={styles.emptyContent}>
            <Text variant="titleLarge" style={[styles.emptyTitle, { color: themeColors.text }]}>
              {messages.empty.productNotFound}
            </Text>
            <Button mode="contained" onPress={() => router.replace('/cost')} style={styles.homeButton}>
              {labels.backHome}
            </Button>
          </Card.Content>
        </AppCard>
      ) : null}

      {!loading && product && metrics && valueMetrics ? (
        <View style={styles.content}>
          <AppCard style={[styles.heroCard, { backgroundColor: themeColors.primary }]}>
            <Card.Content>
              <Text variant="headlineSmall" style={[styles.productName, { color: themeColors.text }]}>
                {product.name}
              </Text>
              <Text variant="bodyMedium" style={[styles.categoryText, { color: themeColors.textSecondary }]}>
                {getCategoryName(product.categoryId)}
              </Text>
            </Card.Content>
          </AppCard>

          <AppCard style={styles.card}>
            <Card.Content>
              <MetricRow label={labels.price} value={formatCurrency(product.price)} />
              <MetricRow label={labels.purchaseDate} value={product.purchaseDate} />
              <MetricRow label={labels.usedDays} value={`${metrics.usedDays} ${labels.days}`} />
              <MetricRow label={labels.dailyCost} value={formatCurrency(metrics.dailyCost)} />
              <MetricRow label={labels.monthlyCost} value={formatCurrency(metrics.monthlyCost)} />
            </Card.Content>
          </AppCard>

          <AppCard style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={[styles.cardTitle, { color: themeColors.text }]}>
                {labels.valueAnalysis}
              </Text>
              <View style={styles.valueGrid}>
                <View style={[styles.valueItem, { backgroundColor: themeColors.cardAlt }]}>
                  <Text variant="bodySmall" style={[styles.metricLabel, { color: themeColors.textSecondary }]}>
                    {labels.current}
                  </Text>
                  <Text variant="titleMedium" style={[styles.valueNumber, { color: themeColors.primary }]}>
                    {formatCurrency(valueMetrics.current)}
                    {labels.perDay}
                  </Text>
                </View>
                <View style={[styles.valueItem, { backgroundColor: themeColors.cardAlt }]}>
                  <Text variant="bodySmall" style={[styles.metricLabel, { color: themeColors.textSecondary }]}>
                    {labels.after30Days}
                  </Text>
                  <Text variant="titleMedium" style={[styles.valueNumber, { color: themeColors.primary }]}>
                    {formatCurrency(valueMetrics.after30Days)}
                    {labels.perDay}
                  </Text>
                </View>
                <View style={[styles.valueItem, { backgroundColor: themeColors.cardAlt }]}>
                  <Text variant="bodySmall" style={[styles.metricLabel, { color: themeColors.textSecondary }]}>
                    {labels.after365Days}
                  </Text>
                  <Text variant="titleMedium" style={[styles.valueNumber, { color: themeColors.primary }]}>
                    {formatCurrency(valueMetrics.after365Days)}
                    {labels.perDay}
                  </Text>
                </View>
              </View>
              <Text variant="bodyMedium" style={[styles.valueHint, { color: themeColors.textSecondary }]}>
                {labels.valueHint}
              </Text>
            </Card.Content>
          </AppCard>

          {targetMetrics ? (
            <AppCard style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={[styles.cardTitle, { color: themeColors.text }]}>
                  {labels.targetProgress}
                </Text>

                {targetMetrics.isReached ? (
                  <View style={[styles.targetReachedBox, { backgroundColor: themeColors.cardAlt }]}>
                    <Text variant="titleMedium" style={[styles.targetReachedText, { color: themeColors.primary }]}>
                      {labels.targetReached}
                    </Text>
                    <Text variant="bodyMedium" style={[styles.valueHint, { color: themeColors.textSecondary }]}>
                      {labels.targetReachedHint}
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.targetSummary}>
                      <View style={[styles.targetSummaryItem, { backgroundColor: themeColors.cardAlt }]}>
                        <Text variant="bodySmall" style={[styles.metricLabel, { color: themeColors.textSecondary }]}>
                          {labels.current}
                        </Text>
                        <Text variant="titleMedium" style={[styles.valueNumber, { color: themeColors.primary }]}>
                          {formatCurrency(targetMetrics.currentDailyCost)}
                          {labels.perDay}
                        </Text>
                      </View>
                      <View style={[styles.targetSummaryItem, { backgroundColor: themeColors.cardAlt }]}>
                        <Text variant="bodySmall" style={[styles.metricLabel, { color: themeColors.textSecondary }]}>
                          {labels.targetPrefix}
                        </Text>
                        <Text variant="titleMedium" style={[styles.valueNumber, { color: themeColors.primary }]}>
                          {formatCurrency(targetMetrics.targetDailyCost)}
                          {labels.perDay}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.progressBlock}>
                      <View style={styles.progressHeader}>
                        <Text variant="bodyMedium" style={[styles.metricLabel, { color: themeColors.textSecondary }]}>
                          {labels.progressDone}
                        </Text>
                        <Text variant="bodyMedium" style={[styles.progressPercent, { color: themeColors.primary }]}>
                          {targetMetrics.progressPercent}%
                        </Text>
                      </View>
                      <View style={[styles.progressTrack, { backgroundColor: themeColors.outline }]}>
                        <View
                          style={[
                            styles.progressFill,
                            { backgroundColor: themeColors.primary },
                            { width: `${targetMetrics.progressPercent}%` }
                          ]}
                        />
                      </View>
                    </View>
                    <MetricRow
                      label={labels.usedDays}
                      value={`${targetMetrics.usedDays} ${labels.days}`}
                    />
                    <MetricRow
                      label={labels.remainingDays}
                      value={`${targetMetrics.remainingDays} ${labels.days}`}
                    />
                    <MetricRow label={labels.targetDate} value={targetMetrics.targetDate} />
                  </>
                )}
              </Card.Content>
            </AppCard>
          ) : null}

          <AppCard style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={[styles.cardTitle, { color: themeColors.text }]}>
                {labels.renewalAdvice}
              </Text>
              <View style={[styles.adviceBox, { backgroundColor: themeColors.cardAlt }]}>
                <Text variant="titleMedium" style={[styles.adviceTitle, { color: themeColors.text }]}>
                  {targetMetrics
                    ? targetMetrics.isReached
                      ? labels.renewalReady
                      : labels.continueUsing
                    : labels.renewalNotSet}
                </Text>
                <Text variant="bodyMedium" style={[styles.valueHint, { color: themeColors.textSecondary }]}>
                  {targetMetrics
                    ? targetMetrics.isReached
                      ? labels.renewalReadyHint
                      : labels.continueUsingHint
                    : labels.renewalNotSetHint}
                </Text>
              </View>
            </Card.Content>
          </AppCard>

          <AppCard style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={[styles.cardTitle, { color: themeColors.text }]}>
                {labels.note}
              </Text>
              <Text variant="bodyMedium" style={[styles.noteText, { color: themeColors.textSecondary }]}>
                {product.note ?? labels.noNote}
              </Text>
            </Card.Content>
          </AppCard>
        </View>
      ) : null}

      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
          style={[styles.deleteDialog, { backgroundColor: themeColors.surfaceElevated }]}
        >
          <Dialog.Title style={[styles.deleteDialogTitle, { color: themeColors.text }]}>
            {messages.confirm.deleteTitle}
          </Dialog.Title>
          <Dialog.Content style={styles.deleteContent}>
            <Text variant="titleMedium" style={[styles.deleteProductName, { color: themeColors.text }]}>
              {product?.name}
            </Text>
            <Text variant="bodyMedium" style={[styles.deleteHint, { color: themeColors.textSecondary }]}>
              {messages.confirm.deleteDescription}
            </Text>
          </Dialog.Content>
          <View style={styles.deleteActions}>
            <Button
              mode="text"
              onPress={() => setDeleteDialogVisible(false)}
              disabled={deleting}
              style={styles.deleteActionButton}
              contentStyle={styles.deleteActionContent}
            >
              {labels.cancel}
            </Button>
            <Button
              mode="text"
              onPress={handleDelete}
              loading={deleting}
              disabled={deleting}
              textColor={themeColors.danger}
              style={styles.deleteActionButton}
              contentStyle={styles.deleteActionContent}
            >
              {labels.delete}
            </Button>
          </View>
        </Dialog>
      </Portal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row'
  },
  content: {
    gap: spacing.md
  },
  loadingWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 220
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 24
  },
  productName: {
    color: colors.background,
    fontWeight: '800'
  },
  categoryText: {
    color: 'rgba(8, 8, 15, 0.72)',
    marginTop: spacing.xs
  },
  card: {
    borderRadius: 24
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: spacing.sm
  },
  metricRow: {
    alignItems: 'center',
    borderBottomColor: colors.outline,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm
  },
  metricLabel: {
    color: colors.textSecondary
  },
  metricValue: {
    color: colors.text,
    fontWeight: '700',
    marginLeft: spacing.md,
    textAlign: 'right'
  },
  valueGrid: {
    gap: spacing.sm
  },
  valueItem: {
    borderRadius: radius.lg,
    padding: spacing.md
  },
  valueNumber: {
    color: colors.primary,
    fontWeight: '800',
    marginTop: spacing.xs
  },
  valueHint: {
    color: colors.textSecondary,
    marginTop: spacing.md
  },
  targetSummary: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  targetSummaryItem: {
    borderRadius: radius.lg,
    flex: 1,
    padding: spacing.md
  },
  progressBlock: {
    marginTop: spacing.md
  },
  progressHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm
  },
  progressPercent: {
    color: colors.primary,
    fontWeight: '800'
  },
  progressTrack: {
    backgroundColor: colors.outline,
    borderRadius: 999,
    height: 8,
    overflow: 'hidden'
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 8
  },
  targetReachedBox: {
    borderRadius: radius.lg,
    padding: spacing.md
  },
  targetReachedText: {
    color: colors.primary,
    fontWeight: '800'
  },
  targetEmptyBox: {
    borderRadius: radius.lg,
    padding: spacing.md
  },
  targetEmptyTitle: {
    color: colors.text,
    fontWeight: '800'
  },
  adviceBox: {
    borderRadius: radius.lg,
    padding: spacing.md
  },
  adviceTitle: {
    color: colors.text,
    fontWeight: '800'
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
  homeButton: {
    borderRadius: radius.lg
  },
  deleteDialog: {
    alignSelf: 'center',
    borderRadius: 24,
    maxWidth: 360,
    width: '86%'
  },
  deleteDialogTitle: {
    color: colors.text,
    fontWeight: '800',
    lineHeight: 28,
    paddingBottom: 0
  },
  deleteProductName: {
    color: colors.text,
    flexShrink: 1,
    fontWeight: '800',
    lineHeight: 24
  },
  deleteContent: {
    gap: spacing.xs,
    paddingBottom: spacing.sm
  },
  deleteHint: {
    color: colors.textSecondary,
    lineHeight: 22
  },
  deleteActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs
  },
  deleteActionButton: {
    borderRadius: radius.md,
    minWidth: 80
  },
  deleteActionContent: {
    minHeight: 44,
    paddingHorizontal: spacing.sm
  }
});
