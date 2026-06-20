import { Product, ProductMetrics, StatsSummary } from '@/types/product';

import { getUsedDays } from './date';
import { formatMoney } from './formatMoney';
import { getValueSummary } from './valueAnalysis';

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function formatCurrency(value: number) {
  return formatMoney(roundMoney(value));
}

export function getDailyCost(price: number, usedDays: number) {
  return roundMoney(price / Math.max(1, usedDays));
}

export function getMonthlyCost(dailyCost: number) {
  return roundMoney(dailyCost * 30);
}

export function getProductMetrics(product: Product): ProductMetrics {
  const usedDays = getUsedDays(product.purchaseDate);
  const dailyCost = getDailyCost(product.price, usedDays);
  const monthlyCost = getMonthlyCost(dailyCost);

  const costCurve = [
    { label: '\u7b2c1\u5929', days: 1, dailyCost: getDailyCost(product.price, 1) },
    { label: '\u7b2c30\u5929', days: 30, dailyCost: getDailyCost(product.price, 30) },
    { label: '\u7b2c100\u5929', days: 100, dailyCost: getDailyCost(product.price, 100) },
    { label: '\u7b2c365\u5929', days: 365, dailyCost: getDailyCost(product.price, 365) },
    { label: '\u5f53\u524d', days: usedDays, dailyCost }
  ];

  return {
    usedDays,
    dailyCost,
    monthlyCost,
    oneYearDailyCost: getDailyCost(product.price, 365),
    threeYearDailyCost: getDailyCost(product.price, 365 * 3),
    costCurve,
    valueSummary: getValueSummary({ dailyCost, usedDays })
  };
}

export function getStatsSummary(products: Product[]): StatsSummary {
  const metrics = products.map((product) => ({
    product,
    metrics: getProductMetrics(product)
  }));

  const totalAmount = products.reduce((sum, product) => sum + product.price, 0);
  const totalUsedDays = metrics.reduce((sum, item) => sum + item.metrics.usedDays, 0);
  const todayTotalCost = metrics.reduce((sum, item) => sum + item.metrics.dailyCost, 0);
  const averageDailyCost = products.length > 0 ? todayTotalCost / products.length : 0;
  const longestUsedProduct = metrics
    .slice()
    .sort((a, b) => b.metrics.usedDays - a.metrics.usedDays)[0]?.product;

  const amountByCategory = products.reduce<Record<string, number>>((result, product) => {
    result[product.categoryId] = (result[product.categoryId] ?? 0) + product.price;
    return result;
  }, {});

  const categoryRatio = Object.entries(amountByCategory).map(([categoryId, amount]) => ({
    categoryId: categoryId as Product['categoryId'],
    amount,
    percentage: totalAmount > 0 ? roundMoney((amount / totalAmount) * 100) : 0
  }));

  return {
    totalAmount: roundMoney(totalAmount),
    totalUsedDays,
    averageDailyCost: roundMoney(averageDailyCost),
    todayTotalCost: roundMoney(todayTotalCost),
    longestUsedProduct,
    categoryRatio
  };
}
