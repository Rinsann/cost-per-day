import { SortKey } from '@/types/product';

export type SortOption = {
  key: SortKey;
  label: string;
};

export const sortOptions: SortOption[] = [
  { key: 'dailyCost', label: '日均成本' },
  { key: 'usedDays', label: '使用天数' },
  { key: 'price', label: '购买价格' },
  { key: 'purchaseDate', label: '购买日期' }
];
