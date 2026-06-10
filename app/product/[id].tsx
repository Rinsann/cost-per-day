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
import { getCategoryName } from '@/constants/categories';
import { deleteProductById, getProductById } from '@/storage/productStorage';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { Product } from '@/types/product';
import { formatCurrency, getDailyCost, getProductMetrics } from '@/utils/cost';

const labels = {
  detailTitle: '\u6d88\u8d39\u54c1\u8be6\u60c5',
  category: '\u5206\u7c7b',
  price: '\u8d2d\u4e70\u4ef7\u683c',
  purchaseDate: '\u8d2d\u4e70\u65e5\u671f',
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
  notFound: '\u672a\u627e\u5230\u8be5\u6d88\u8d39\u54c1',
  backHome: '\u8fd4\u56de\u9996\u9875',
  deleteTitle: '\u786e\u5b9a\u5220\u9664\u8be5\u6d88\u8d39\u54c1\uff1f',
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
  return (
    <View style={styles.metricRow}>
      <Text variant="bodyMedium" style={styles.metricLabel}>
        {label}
      </Text>
      <Text variant="bodyLarge" style={styles.metricValue}>
        {value}
      </Text>
    </View>
  );
}

export default function ProductDetailScreen() {
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

  async function handleDelete() {
    if (!productId) {
      return;
    }

    setDeleting(true);
    await deleteProductById(productId);
    setDeleting(false);
    setDeleteDialogVisible(false);
    router.replace('/');
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: product?.name ?? labels.detailTitle,
          headerRight: product
            ? () => (
                <IconButton
                  icon="delete-outline"
                  iconColor={colors.danger}
                  onPress={() => setDeleteDialogVisible(true)}
                />
              )
            : undefined
        }}
      />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}

      {!loading && !product ? (
        <Card mode="contained" style={styles.card}>
          <Card.Content style={styles.emptyContent}>
            <Text variant="titleLarge" style={styles.emptyTitle}>
              {labels.notFound}
            </Text>
            <Button mode="contained" onPress={() => router.replace('/')} style={styles.homeButton}>
              {labels.backHome}
            </Button>
          </Card.Content>
        </Card>
      ) : null}

      {!loading && product && metrics && valueMetrics ? (
        <View style={styles.content}>
          <Card mode="contained" style={styles.heroCard}>
            <Card.Content>
              <Text variant="headlineSmall" style={styles.productName}>
                {product.name}
              </Text>
              <Text variant="bodyMedium" style={styles.categoryText}>
                {getCategoryName(product.categoryId)}
              </Text>
            </Card.Content>
          </Card>

          <Card mode="contained" style={styles.card}>
            <Card.Content>
              <MetricRow label={labels.price} value={formatCurrency(product.price)} />
              <MetricRow label={labels.purchaseDate} value={product.purchaseDate} />
              <MetricRow label={labels.usedDays} value={`${metrics.usedDays} ${labels.days}`} />
              <MetricRow label={labels.dailyCost} value={formatCurrency(metrics.dailyCost)} />
              <MetricRow label={labels.monthlyCost} value={formatCurrency(metrics.monthlyCost)} />
            </Card.Content>
          </Card>

          <Card mode="contained" style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {labels.valueAnalysis}
              </Text>
              <View style={styles.valueGrid}>
                <View style={styles.valueItem}>
                  <Text variant="bodySmall" style={styles.metricLabel}>
                    {labels.current}
                  </Text>
                  <Text variant="titleMedium" style={styles.valueNumber}>
                    {formatCurrency(valueMetrics.current)}
                    {labels.perDay}
                  </Text>
                </View>
                <View style={styles.valueItem}>
                  <Text variant="bodySmall" style={styles.metricLabel}>
                    {labels.after30Days}
                  </Text>
                  <Text variant="titleMedium" style={styles.valueNumber}>
                    {formatCurrency(valueMetrics.after30Days)}
                    {labels.perDay}
                  </Text>
                </View>
                <View style={styles.valueItem}>
                  <Text variant="bodySmall" style={styles.metricLabel}>
                    {labels.after365Days}
                  </Text>
                  <Text variant="titleMedium" style={styles.valueNumber}>
                    {formatCurrency(valueMetrics.after365Days)}
                    {labels.perDay}
                  </Text>
                </View>
              </View>
              <Text variant="bodyMedium" style={styles.valueHint}>
                {labels.valueHint}
              </Text>
            </Card.Content>
          </Card>

          <Card mode="contained" style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {labels.note}
              </Text>
              <Text variant="bodyMedium" style={styles.noteText}>
                {product.note ?? labels.noNote}
              </Text>
            </Card.Content>
          </Card>
        </View>
      ) : null}

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>{labels.deleteTitle}</Dialog.Title>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)} disabled={deleting}>
              {labels.cancel}
            </Button>
            <Button
              onPress={handleDelete}
              loading={deleting}
              disabled={deleting}
              textColor={colors.danger}
            >
              {labels.delete}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    borderRadius: radius.lg
  },
  productName: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  categoryText: {
    color: '#E0E7FF',
    marginTop: spacing.xs
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg
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
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
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
  }
});
