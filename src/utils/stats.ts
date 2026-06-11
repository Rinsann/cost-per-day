import { getCategoryName } from '@/constants/categories';
import { Product } from '@/types/product';

import { getProductMetrics, roundMoney } from './cost';

export type ProductStatsItem = Product & {
  categoryName: string;
  usedDays: number;
  dailyCost: number;
};

export type CategoryStatsItem = {
  categoryId: Product['categoryId'];
  categoryName: string;
  productCount: number;
  totalAmount: number;
  currentDailyCost: number;
};

export type ProductStats = {
  overview: {
    productCount: number;
    totalAmount: number;
    currentDailyCost: number;
    averageDailyCost: number;
  };
  highestDailyCost: ProductStatsItem[];
  lowestDailyCost: ProductStatsItem[];
  longestUsed: ProductStatsItem[];
  categories: CategoryStatsItem[];
};

function toStatsItem(product: Product): ProductStatsItem {
  const metrics = getProductMetrics(product);

  return {
    ...product,
    categoryName: getCategoryName(product.categoryId),
    usedDays: metrics.usedDays,
    dailyCost: metrics.dailyCost
  };
}

export function getProductStats(products: Product[]): ProductStats {
  const productItems = products.map(toStatsItem);
  const totalAmount = roundMoney(products.reduce((sum, product) => sum + product.price, 0));
  const currentDailyCost = roundMoney(
    productItems.reduce((sum, product) => sum + product.dailyCost, 0)
  );
  const averageDailyCost =
    productItems.length > 0 ? roundMoney(currentDailyCost / productItems.length) : 0;

  const categoriesById = productItems.reduce<Record<string, CategoryStatsItem>>(
    (result, product) => {
      const current = result[product.categoryId] ?? {
        categoryId: product.categoryId,
        categoryName: product.categoryName,
        productCount: 0,
        totalAmount: 0,
        currentDailyCost: 0
      };

      result[product.categoryId] = {
        ...current,
        productCount: current.productCount + 1,
        totalAmount: roundMoney(current.totalAmount + product.price),
        currentDailyCost: roundMoney(current.currentDailyCost + product.dailyCost)
      };

      return result;
    },
    {}
  );

  return {
    overview: {
      productCount: productItems.length,
      totalAmount,
      currentDailyCost,
      averageDailyCost
    },
    highestDailyCost: productItems
      .slice()
      .sort((a, b) => b.dailyCost - a.dailyCost)
      .slice(0, 5),
    lowestDailyCost: productItems
      .slice()
      .sort((a, b) => a.dailyCost - b.dailyCost)
      .slice(0, 5),
    longestUsed: productItems
      .slice()
      .sort((a, b) => b.usedDays - a.usedDays)
      .slice(0, 5),
    categories: Object.values(categoriesById).sort((a, b) => b.totalAmount - a.totalAmount)
  };
}
