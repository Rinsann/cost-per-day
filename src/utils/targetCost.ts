import { Product } from '@/types/product';

import { getUsedDays } from './date';

export type TargetDailyCostMetrics = {
  targetDailyCost: number;
  targetTotalDays: number;
  usedDays: number;
  remainingDays: number;
  targetDate: string;
  isReached: boolean;
};

function getDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getTargetDailyCostMetrics(product: Product): TargetDailyCostMetrics | null {
  if (!product.targetDailyCost || product.targetDailyCost <= 0) {
    return null;
  }

  const usedDays = getUsedDays(product.purchaseDate);
  const targetTotalDays = Math.ceil(product.price / product.targetDailyCost);
  const remainingDays = Math.max(targetTotalDays - usedDays, 0);
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + remainingDays);

  return {
    targetDailyCost: product.targetDailyCost,
    targetTotalDays,
    usedDays,
    remainingDays,
    targetDate: getDateString(targetDate),
    isReached: remainingDays === 0
  };
}
