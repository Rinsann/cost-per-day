import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, List, Text } from 'react-native-paper';

import { Screen } from '@/components/layout/Screen';
import { AppCard } from '@/components/ui/AppCard';
import { messages } from '@/constants/messages';
import { getProducts } from '@/storage/productStorage';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { Product } from '@/types/product';
import { formatCurrency } from '@/utils/cost';
import { CategoryStatsItem, getProductStats, ProductStatsItem } from '@/utils/stats';

const labels = {
  add: '\u53bb\u6dfb\u52a0',
  overview: '\u603b\u89c8',
  productCount: '\u6d88\u8d39\u54c1\u603b\u6570',
  totalAmount: '\u603b\u8d2d\u4e70\u91d1\u989d',
  currentDailyCost: '\u5f53\u524d\u65e5\u5747\u6210\u672c',
  averageDailyCost: '\u5e73\u5747\u65e5\u5747\u6210\u672c',
  highestDailyCost: '\u6700\u9ad8\u65e5\u5747\u6210\u672c',
  lowestDailyCost: '\u6700\u4f4e\u65e5\u5747\u6210\u672c',
  longestUsed: '\u4f7f\u7528\u6700\u4e45',
  categoryStats: '\u5206\u7c7b\u7edf\u8ba1',
  used: '\u5df2\u4f7f\u7528',
  days: '\u5929',
  countUnit: '\u4ef6',
  categoryAmount: '\u603b\u91d1\u989d',
  categoryDailyCost: '\u65e5\u5747\u5408\u8ba1'
};

type OverviewItemProps = {
  label: string;
  value: string;
};

function OverviewItem({ label, value }: OverviewItemProps) {
  return (
    <View style={styles.overviewItem}>
      <Text variant="bodySmall" style={styles.mutedText}>
        {label}
      </Text>
      <Text variant="titleLarge" style={styles.overviewValue}>
        {value}
      </Text>
    </View>
  );
}

type ProductRankCardProps = {
  title: string;
  products: ProductStatsItem[];
  mode: 'cost' | 'days';
};

function ProductRankCard({ title, products, mode }: ProductRankCardProps) {
  return (
    <AppCard style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {title}
        </Text>
        {products.map((product) => (
          <List.Item
            key={product.id}
            title={product.name}
            titleStyle={styles.listTitle}
            description={`${product.categoryName} / ${labels.used} ${product.usedDays} ${labels.days}`}
            descriptionStyle={styles.listDescription}
            right={() => (
              <Text style={mode === 'cost' ? styles.costValue : styles.daysValue}>
                {mode === 'cost'
                  ? formatCurrency(product.dailyCost)
                  : `${product.usedDays} ${labels.days}`}
              </Text>
            )}
          />
        ))}
      </Card.Content>
    </AppCard>
  );
}

type CategoryStatsCardProps = {
  categories: CategoryStatsItem[];
};

function CategoryStatsCard({ categories }: CategoryStatsCardProps) {
  return (
    <AppCard style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {labels.categoryStats}
        </Text>
        {categories.map((category) => (
          <List.Item
            key={category.categoryId}
            title={category.categoryName}
            titleStyle={styles.listTitle}
            description={`${category.productCount} ${labels.countUnit} / ${labels.categoryAmount} ${formatCurrency(
              category.totalAmount
            )}`}
            descriptionStyle={styles.listDescription}
            right={() => (
              <Text style={styles.costValue}>{formatCurrency(category.currentDailyCost)}</Text>
            )}
          />
        ))}
      </Card.Content>
    </AppCard>
  );
}

export default function StatsScreen() {
  const [products, setProducts] = useState<Product[]>([]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      getProducts().then((storedProducts) => {
        if (mounted) {
          setProducts(storedProducts);
        }
      });

      return () => {
        mounted = false;
      };
    }, [])
  );

  const stats = useMemo(() => getProductStats(products), [products]);

  if (products.length === 0) {
    return (
      <Screen>
        <AppCard style={styles.card}>
          <Card.Content style={styles.emptyContent}>
            <Text variant="titleLarge" style={styles.emptyTitle}>
              {messages.empty.statsTitle}
            </Text>
            <Text variant="bodyMedium" style={styles.emptyHint}>
              {messages.empty.statsDescription}
            </Text>
            <Button mode="contained" onPress={() => router.push('/add')} style={styles.addButton}>
              {labels.add}
            </Button>
          </Card.Content>
        </AppCard>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppCard style={styles.heroCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.heroTitle}>
            {labels.overview}
          </Text>
          <View style={styles.overviewGrid}>
            <OverviewItem
              label={labels.productCount}
              value={`${stats.overview.productCount} ${labels.countUnit}`}
            />
            <OverviewItem
              label={labels.totalAmount}
              value={formatCurrency(stats.overview.totalAmount)}
            />
            <OverviewItem
              label={labels.currentDailyCost}
              value={formatCurrency(stats.overview.currentDailyCost)}
            />
            <OverviewItem
              label={labels.averageDailyCost}
              value={formatCurrency(stats.overview.averageDailyCost)}
            />
          </View>
        </Card.Content>
      </AppCard>

      <ProductRankCard
        title={labels.highestDailyCost}
        products={stats.highestDailyCost}
        mode="cost"
      />
      <ProductRankCard
        title={labels.lowestDailyCost}
        products={stats.lowestDailyCost}
        mode="cost"
      />
      <ProductRankCard title={labels.longestUsed} products={stats.longestUsed} mode="days" />
      <CategoryStatsCard categories={stats.categories} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    marginBottom: spacing.md
  },
  heroCard: {
    backgroundColor: colors.cardAlt,
    borderRadius: 24,
    marginBottom: spacing.md
  },
  heroTitle: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: spacing.md
  },
  overviewGrid: {
    gap: spacing.sm
  },
  overviewItem: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md
  },
  overviewValue: {
    color: colors.primary,
    fontWeight: '800',
    marginTop: spacing.xs
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: spacing.xs
  },
  mutedText: {
    color: colors.textSecondary
  },
  listTitle: {
    color: colors.text,
    fontWeight: '800'
  },
  listDescription: {
    color: colors.textSecondary
  },
  costValue: {
    alignSelf: 'center',
    color: colors.primary,
    fontWeight: '800'
  },
  daysValue: {
    alignSelf: 'center',
    color: colors.text,
    fontWeight: '800'
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
  emptyHint: {
    color: colors.textSecondary,
    textAlign: 'center'
  },
  addButton: {
    borderRadius: radius.lg
  }
});
