import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';

import { Screen } from '@/components/layout/Screen';
import { ProductForm, ProductFormValues } from '@/components/product/ProductForm';
import { AppCard } from '@/components/ui/AppCard';
import { useAppTheme } from '@/context/AppThemeContext';
import { getProductById, updateProduct } from '@/storage/productStorage';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { Product } from '@/types/product';

const labels = {
  title: '\u7f16\u8f91\u6d88\u8d39\u54c1',
  save: '\u4fdd\u5b58\u4fee\u6539',
  saving: '\u4fdd\u5b58\u4e2d...',
  notFound: '\u672a\u627e\u5230\u8be5\u6d88\u8d39\u54c1',
  backHome: '\u8fd4\u56de\u9996\u9875',
  saveFailed: '\u4fdd\u5b58\u5931\u8d25',
  saveFailedHint: '\u8bf7\u7a0d\u540e\u518d\u8bd5'
};

function getParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default function EditProductScreen() {
  const { colors: themeColors } = useAppTheme();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const productId = getParamValue(params.id);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

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

  async function handleSubmit(values: ProductFormValues) {
    if (!productId) {
      return;
    }

    try {
      const updatedProduct = await updateProduct(productId, values);

      if (!updatedProduct) {
        setProduct(null);
        return;
      }

      router.back();
    } catch {
      Alert.alert(labels.saveFailed, labels.saveFailedHint);
    }
  }

  return (
    <Screen>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={themeColors.primary} />
        </View>
      ) : null}

      {!loading && !product ? (
        <AppCard style={styles.card}>
          <Card.Content style={styles.emptyContent}>
            <Text variant="titleLarge" style={[styles.emptyTitle, { color: themeColors.text }]}>
              {labels.notFound}
            </Text>
            <Button mode="contained" onPress={() => router.replace('/cost')} style={styles.homeButton}>
              {labels.backHome}
            </Button>
          </Card.Content>
        </AppCard>
      ) : null}

      {!loading && product ? (
        <ProductForm
          initialProduct={product}
          title={labels.title}
          submitLabel={labels.save}
          submittingLabel={labels.saving}
          onSubmit={handleSubmit}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 220
  },
  card: {
    borderRadius: 24
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
