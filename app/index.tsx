import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, FAB, IconButton, Menu, Searchbar, Text } from 'react-native-paper';

import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { getProducts } from '@/storage/productStorage';
import { Product, ProductCategoryId } from '@/types/product';
import { formatCurrency, getProductMetrics } from '@/utils/cost';

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
  currentDailyCost: '\u5f53\u524d\u65e5\u5747\u6210\u672c',
  currentDailyCostHint:
    '\u6240\u6709\u6d88\u8d39\u54c1\u65e5\u5747\u6210\u672c\u4e4b\u548c',
  searchPlaceholder: '\u641c\u7d22\u6d88\u8d39\u54c1',
  productSection: '\u6d88\u8d39\u54c1',
  price: '\u4ef7\u683c',
  used: '\u5df2\u4f7f\u7528',
  days: '\u5929',
  emptyTitle: '\u6ca1\u6709\u627e\u5230\u6d88\u8d39\u54c1',
  emptyHint: '\u6362\u4e2a\u5173\u952e\u8bcd\u8bd5\u8bd5\u3002',
  firstItemTitle: '\ud83d\udce6 \u8fd8\u6ca1\u6709\u6d88\u8d39\u54c1',
  firstItemHint: '\u70b9\u51fb\u53f3\u4e0b\u89d2 +\n\u6dfb\u52a0\u7b2c\u4e00\u4ef6\u6d88\u8d39\u54c1',
  sortDailyCostDesc: '\u65e5\u5747\u6210\u672c\u9ad8\u5230\u4f4e',
  sortDailyCostAsc: '\u65e5\u5747\u6210\u672c\u4f4e\u5230\u9ad8',
  sortPurchaseDateDesc: '\u8d2d\u4e70\u65e5\u671f\u6700\u65b0',
  sortPurchaseDateAsc: '\u8d2d\u4e70\u65e5\u671f\u6700\u65e9'
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

export default function HomeScreen() {
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
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card mode="contained" style={styles.totalCard}>
          <Card.Content>
            <View style={styles.totalHeader}>
              <Text variant="labelLarge" style={styles.totalLabel}>
                {labels.currentDailyCost}
              </Text>
              <View style={styles.headerActions}>
                <IconButton
                  icon="chart-box-outline"
                  iconColor="#FFFFFF"
                  size={22}
                  onPress={() => router.push('/stats')}
                  style={styles.headerActionButton}
                />
                <IconButton
                  icon="cog-outline"
                  iconColor="#FFFFFF"
                  size={22}
                  onPress={() => router.push('/settings')}
                  style={styles.headerActionButton}
                />
              </View>
            </View>
            <Text variant="displaySmall" style={styles.totalValue}>
              {formatCurrency(currentDailyCost)}
            </Text>
            <Text variant="bodySmall" style={styles.totalHint}>
              {labels.currentDailyCostHint}
            </Text>
          </Card.Content>
        </Card>

        <Searchbar
          value={query}
          onChangeText={setQuery}
          placeholder={labels.searchPlaceholder}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
        />

        <View style={styles.toolbar}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
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
                textColor={colors.primary}
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
            <Card
              key={product.id}
              mode="contained"
              style={styles.productCard}
              onPress={() => router.push(`/product/${product.id}`)}
            >
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.productTitleWrap}>
                    <Text variant="titleMedium" style={styles.productName}>
                      {product.name}
                    </Text>
                    <Text variant="bodySmall" style={styles.productMeta}>
                      {categoryLabels[product.categoryId]}
                    </Text>
                  </View>
                  <Text variant="titleMedium" style={styles.dailyCost}>
                    {formatCurrency(product.dailyCost)}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text variant="bodyMedium" style={styles.productInfo}>
                    {labels.price} {formatCurrency(product.price)}
                  </Text>
                  <Text variant="bodyMedium" style={styles.productInfo}>
                    {labels.used} {product.usedDays} {labels.days}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))}

          {visibleProducts.length === 0 ? (
            <Card mode="contained" style={styles.emptyCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  {products.length === 0 ? labels.firstItemTitle : labels.emptyTitle}
                </Text>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  {products.length === 0 ? labels.firstItemHint : labels.emptyHint}
                </Text>
              </Card.Content>
            </Card>
          ) : null}
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        color="#FFFFFF"
        onPress={() => router.push('/add')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl
  },
  totalCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg
  },
  totalLabel: {
    color: '#E0E7FF'
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
    color: '#FFFFFF',
    fontWeight: '800',
    marginTop: spacing.xs
  },
  totalHint: {
    color: '#EEF2FF',
    marginTop: spacing.xs
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
    flex: 1
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
    fontWeight: '800'
  },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md
  },
  productInfo: {
    color: colors.textSecondary
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
  fab: {
    backgroundColor: colors.primary,
    bottom: spacing.lg,
    position: 'absolute',
    right: spacing.lg
  }
});
