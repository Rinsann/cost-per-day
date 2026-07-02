import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Menu, Searchbar, Text } from 'react-native-paper';

import { AppScreen } from '@/components/layout/AppScreen';
import { messages } from '@/constants/messages';
import { useAppTheme } from '@/context/AppThemeContext';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { getProducts } from '@/storage/productStorage';
import { Product, ProductCategoryId } from '@/types/product';
import { formatCompactCurrency, getProductMetrics } from '@/utils/cost';
import { getTargetProgress, TargetDailyCostMetrics } from '@/utils/targetCost';

type SortMode =
  | 'dailyCostDesc'
  | 'dailyCostAsc'
  | 'purchaseDateDesc'
  | 'purchaseDateAsc';

type ProductWithMetrics = Product & {
  usedDays: number;
  dailyCost: number;
};

const labels = {
  title: '\u6210\u672c',
  currentDailyCost: '\u5f53\u524d\u65e5\u5747\u6210\u672c',
  currentDailyCostHint:
    '\u6240\u6709\u6d88\u8d39\u54c1\u65e5\u5747\u6210\u672c\u4e4b\u548c',
  recentTargets: '\u6700\u8fd1\u76ee\u6807',
  searchPlaceholder: '\u641c\u7d22\u6d88\u8d39\u54c1',
  productSection: '\u6d88\u8d39\u54c1',
  price: '\u4ef7\u683c',
  used: '\u5df2\u4f7f\u7528',
  days: '\u5929',
  emptyTitle: '\u6ca1\u6709\u627e\u5230\u6d88\u8d39\u54c1',
  emptyHint: '\u6362\u4e2a\u5173\u952e\u8bcd\u8bd5\u8bd5\u3002',
  sortDailyCostDesc: '\u65e5\u5747\u6210\u672c\u9ad8\u5230\u4f4e',
  sortDailyCostAsc: '\u65e5\u5747\u6210\u672c\u4f4e\u5230\u9ad8',
  sortPurchaseDateDesc: '\u8d2d\u4e70\u65e5\u671f\u6700\u65b0',
  sortPurchaseDateAsc: '\u8d2d\u4e70\u65e5\u671f\u6700\u65e9',
  targetReached: '\u76ee\u6807\u5df2\u8fbe\u6210',
  targetPrefix: '\u76ee\u6807',
  remainingPrefix: '\u8fd8\u9700',
  perDay: '/\u5929'
};

const categoryLabels: Record<ProductCategoryId, string> = {
  digital: '\u6570\u7801\u8bbe\u5907',
  computer: '\u7535\u8111',
  phone: '\u624b\u673a',
  monitor: '\u663e\u793a\u5668',
  headphone: '\u8033\u673a',
  tablet: '\u5e73\u677f',
  appliance: '\u5bb6\u7535',
  furniture: '\u5bb6\u5177',
  transport: '\u4ea4\u901a\u5de5\u5177',
  office: '\u529e\u516c\u8bbe\u5907',
  other: '\u5176\u4ed6'
};

const sortLabels: Record<SortMode, string> = {
  dailyCostDesc: labels.sortDailyCostDesc,
  dailyCostAsc: labels.sortDailyCostAsc,
  purchaseDateDesc: labels.sortPurchaseDateDesc,
  purchaseDateAsc: labels.sortPurchaseDateAsc
};

type ProductCardProps = {
  product: ProductWithMetrics;
};

function ProductCard({ product }: ProductCardProps) {
  const { colors: themeColors } = useAppTheme();
  const targetMetrics = getTargetProgress(product);

  return (
    <Card
      mode="contained"
      style={[styles.productCard, { backgroundColor: themeColors.card }]}
      onPress={() => router.push(`/product/${product.id}`)}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.productTitleWrap}>
            <Text
              ellipsizeMode="tail"
              numberOfLines={1}
              variant="titleMedium"
              style={[styles.productName, { color: themeColors.text }]}
            >
              {product.name}
            </Text>
            <Text variant="bodySmall" style={[styles.productMeta, { color: themeColors.textSecondary }]}>
              {categoryLabels[product.categoryId]}
            </Text>
          </View>
          <Text
            adjustsFontSizeToFit
            ellipsizeMode="tail"
            minimumFontScale={0.72}
            numberOfLines={1}
            variant="titleMedium"
            style={[styles.dailyCost, { color: themeColors.primary }]}
          >
            {formatCompactCurrency(product.dailyCost)}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <Text
            ellipsizeMode="tail"
            numberOfLines={1}
            variant="bodyMedium"
            style={[styles.productInfo, { color: themeColors.textSecondary }]}
          >
            {labels.price} {formatCompactCurrency(product.price)}
          </Text>
          <Text
            ellipsizeMode="tail"
            numberOfLines={1}
            variant="bodyMedium"
            style={[styles.productInfo, { color: themeColors.textSecondary }]}
          >
            {labels.used} {product.usedDays} {labels.days}
          </Text>
        </View>

        {targetMetrics ? (
          <Text
            ellipsizeMode="tail"
            numberOfLines={2}
            variant="bodySmall"
            style={[styles.targetInfo, { color: themeColors.primary }]}
          >
            {targetMetrics.isReached
              ? labels.targetReached
              : `${labels.targetPrefix} ${formatCompactCurrency(targetMetrics.targetDailyCost)}${
                  labels.perDay
                } / ${labels.remainingPrefix} ${targetMetrics.remainingDays} ${labels.days}`}
          </Text>
        ) : null}
      </Card.Content>
    </Card>
  );
}

type RecentTargetItem = {
  product: ProductWithMetrics;
  targetProgress: TargetDailyCostMetrics;
};

type RecentTargetsCardProps = {
  items: RecentTargetItem[];
};

function RecentTargetsCard({ items }: RecentTargetsCardProps) {
  const { colors: themeColors } = useAppTheme();

  return (
    <Card mode="contained" style={[styles.recentTargetCard, { backgroundColor: themeColors.card }]}>
      <Card.Content>
        <Text variant="titleMedium" style={[styles.recentTargetTitle, { color: themeColors.text }]}>
          {labels.recentTargets}
        </Text>
        <View style={styles.recentTargetList}>
          {items.map(({ product, targetProgress }) => (
            <View
              key={product.id}
              style={[styles.recentTargetItem, { backgroundColor: themeColors.cardAlt }]}
            >
              <View style={styles.recentTargetTextWrap}>
                <Text variant="titleSmall" style={[styles.productName, { color: themeColors.text }]}>
                  {product.name}
                </Text>
                {targetProgress.isReached ? (
                  <Text variant="bodySmall" style={[styles.recentTargetReached, { color: themeColors.primary }]}>
                    {labels.targetReached}
                  </Text>
                ) : (
                  <>
                    <Text
                      ellipsizeMode="tail"
                      numberOfLines={1}
                      variant="bodySmall"
                      style={[styles.productMeta, { color: themeColors.textSecondary }]}
                    >
                      {formatCompactCurrency(targetProgress.currentDailyCost)}
                      {labels.perDay} {'->'} {labels.targetPrefix}{' '}
                      {formatCompactCurrency(targetProgress.targetDailyCost)}
                      {labels.perDay}
                    </Text>
                    <Text variant="bodySmall" style={[styles.productMeta, { color: themeColors.textSecondary }]}>
                      {labels.remainingPrefix} {targetProgress.remainingDays} {labels.days}
                    </Text>
                  </>
                )}
              </View>
              <IconButton
                icon="chevron-right"
                size={18}
                iconColor={themeColors.textSecondary}
                onPress={() => router.push(`/product/${product.id}`)}
                style={styles.recentTargetIcon}
              />
            </View>
          ))}
        </View>
      </Card.Content>
    </Card>
  );
}

export default function HomeScreen() {
  const { colors: themeColors } = useAppTheme();
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('dailyCostDesc');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
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

  const productsWithMetrics = useMemo<ProductWithMetrics[]>(() => {
    return products.map((product) => {
      const metrics = getProductMetrics(product);

      return {
        ...product,
        usedDays: metrics.usedDays,
        dailyCost: metrics.dailyCost
      };
    });
  }, [products]);

  const currentDailyCost = useMemo(() => {
    return productsWithMetrics.reduce((total, product) => total + product.dailyCost, 0);
  }, [productsWithMetrics]);

  const recentTargetItems = useMemo<RecentTargetItem[]>(() => {
    return productsWithMetrics
      .map((product) => {
        const targetProgress = getTargetProgress(product);

        return targetProgress ? { product, targetProgress } : null;
      })
      .filter((item): item is RecentTargetItem => item !== null)
      .sort((a, b) => {
        if (a.targetProgress.isReached !== b.targetProgress.isReached) {
          return a.targetProgress.isReached ? -1 : 1;
        }

        return a.targetProgress.remainingDays - b.targetProgress.remainingDays;
      })
      .slice(0, 3);
  }, [productsWithMetrics]);

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return productsWithMetrics
      .filter((product) => product.name.toLowerCase().includes(normalizedQuery))
      .sort((a, b) => {
        if (sortMode === 'dailyCostDesc') {
          return b.dailyCost - a.dailyCost;
        }

        if (sortMode === 'dailyCostAsc') {
          return a.dailyCost - b.dailyCost;
        }

        if (sortMode === 'purchaseDateDesc') {
          return b.purchaseDate.localeCompare(a.purchaseDate);
        }

        return a.purchaseDate.localeCompare(b.purchaseDate);
      });
  }, [productsWithMetrics, query, sortMode]);

  function selectSortMode(nextSortMode: SortMode) {
    setSortMode(nextSortMode);
    setSortMenuVisible(false);
  }

  return (
    <AppScreen>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={[styles.title, { color: themeColors.text }]}>
            {labels.title}
          </Text>
        </View>

        <Card mode="contained" style={[styles.totalCard, { backgroundColor: themeColors.cardAlt }]}>
          <Card.Content>
            <View style={styles.totalHeader}>
              <Text variant="labelLarge" style={[styles.totalLabel, { color: themeColors.textSecondary }]}>
                {labels.currentDailyCost}
              </Text>
              <View style={styles.headerActions}>
                <IconButton
                  icon="plus-circle-outline"
                  iconColor={themeColors.primary}
                  size={18}
                  onPress={() => router.push('/add')}
                  style={styles.headerActionButton}
                />
                <IconButton
                  icon="chart-box-outline"
                  iconColor={themeColors.textSecondary}
                  size={18}
                  onPress={() => router.push('/stats')}
                  style={styles.headerActionButton}
                />
              </View>
            </View>
            <Text
              adjustsFontSizeToFit
              ellipsizeMode="tail"
              minimumFontScale={0.58}
              numberOfLines={1}
              variant="displaySmall"
              style={[styles.totalValue, { color: themeColors.text }]}
            >
              {formatCompactCurrency(currentDailyCost)}
            </Text>
            <Text variant="bodySmall" style={[styles.totalHint, { color: themeColors.textSecondary }]}>
              {labels.currentDailyCostHint}
            </Text>
          </Card.Content>
        </Card>

        {recentTargetItems.length > 0 ? <RecentTargetsCard items={recentTargetItems} /> : null}

        <Searchbar
          value={query}
          onChangeText={setQuery}
          placeholder={labels.searchPlaceholder}
          style={[styles.searchbar, { backgroundColor: themeColors.card }]}
          inputStyle={[styles.searchInput, { color: themeColors.text }]}
          iconColor={themeColors.textSecondary}
          placeholderTextColor={themeColors.textSecondary}
        />

        <View style={styles.toolbar}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text }]}>
            {labels.productSection}
          </Text>

          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <Button
                compact
                icon="sort"
                mode="text"
                onPress={() => setSortMenuVisible(true)}
                textColor={themeColors.primary}
              >
                {sortLabels[sortMode]}
              </Button>
            }
          >
            <Menu.Item
              title={labels.sortDailyCostDesc}
              onPress={() => selectSortMode('dailyCostDesc')}
              leadingIcon={sortMode === 'dailyCostDesc' ? 'check' : undefined}
            />
            <Menu.Item
              title={labels.sortDailyCostAsc}
              onPress={() => selectSortMode('dailyCostAsc')}
              leadingIcon={sortMode === 'dailyCostAsc' ? 'check' : undefined}
            />
            <Menu.Item
              title={labels.sortPurchaseDateDesc}
              onPress={() => selectSortMode('purchaseDateDesc')}
              leadingIcon={sortMode === 'purchaseDateDesc' ? 'check' : undefined}
            />
            <Menu.Item
              title={labels.sortPurchaseDateAsc}
              onPress={() => selectSortMode('purchaseDateAsc')}
              leadingIcon={sortMode === 'purchaseDateAsc' ? 'check' : undefined}
            />
          </Menu>
        </View>

        <View style={styles.list}>
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}

          {visibleProducts.length === 0 ? (
            <Card mode="contained" style={[styles.emptyCard, { backgroundColor: themeColors.card }]}>
              <Card.Content>
                <Text variant="titleMedium" style={[styles.emptyTitle, { color: themeColors.text }]}>
                  {products.length === 0 ? messages.empty.productsTitle : labels.emptyTitle}
                </Text>
                <Text variant="bodyMedium" style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                  {products.length === 0 ? messages.empty.productsDescription : labels.emptyHint}
                </Text>
              </Card.Content>
            </Card>
          ) : null}
        </View>
    </AppScreen>
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
  totalCard: {
    backgroundColor: colors.cardAlt,
    borderRadius: 24
  },
  totalLabel: {
    color: colors.textSecondary
  },
  totalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  headerActions: {
    flexDirection: 'row'
  },
  headerActionButton: {
    margin: 0
  },
  totalValue: {
    color: colors.text,
    fontWeight: '800',
    marginTop: spacing.xs
  },
  totalHint: {
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  recentTargetCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginTop: spacing.md
  },
  recentTargetTitle: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: spacing.sm
  },
  recentTargetList: {
    gap: spacing.sm
  },
  recentTargetItem: {
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: spacing.md,
    paddingVertical: spacing.sm
  },
  recentTargetTextWrap: {
    flex: 1,
    minWidth: 0
  },
  recentTargetReached: {
    color: colors.primary,
    fontWeight: '700',
    marginTop: spacing.xs
  },
  recentTargetIcon: {
    margin: 0
  },
  searchbar: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    elevation: 0,
    marginTop: spacing.md
  },
  searchInput: {
    fontSize: 16
  },
  toolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '700'
  },
  list: {
    gap: spacing.md,
    marginTop: spacing.sm
  },
  productCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between'
  },
  productTitleWrap: {
    flex: 1,
    minWidth: 0
  },
  productName: {
    color: colors.text,
    fontWeight: '700'
  },
  productMeta: {
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  dailyCost: {
    color: colors.primary,
    flexShrink: 1,
    fontWeight: '800',
    maxWidth: 128,
    textAlign: 'right'
  },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md
  },
  productInfo: {
    color: colors.textSecondary,
    flexShrink: 1,
    maxWidth: '100%'
  },
  targetInfo: {
    color: colors.primary,
    fontWeight: '700',
    marginTop: spacing.sm
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: '700'
  },
  emptyText: {
    color: colors.textSecondary,
    lineHeight: 22,
    marginTop: spacing.xs,
    textAlign: 'center'
  },
});
