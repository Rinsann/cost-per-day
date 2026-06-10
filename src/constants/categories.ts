import { ProductCategoryId } from '@/types/product';

export type ProductCategory = {
  id: ProductCategoryId;
  name: string;
};

export const productCategories: ProductCategory[] = [
  { id: 'digital', name: '\u6570\u7801\u8bbe\u5907' },
  { id: 'computer', name: '\u7535\u8111' },
  { id: 'phone', name: '\u624b\u673a' },
  { id: 'monitor', name: '\u663e\u793a\u5668' },
  { id: 'headphone', name: '\u8033\u673a' },
  { id: 'tablet', name: '\u5e73\u677f' },
  { id: 'appliance', name: '\u5bb6\u7535' },
  { id: 'furniture', name: '\u5bb6\u5177' },
  { id: 'transport', name: '\u4ea4\u901a\u5de5\u5177' },
  { id: 'office', name: '\u529e\u516c\u8bbe\u5907' },
  { id: 'other', name: '\u5176\u4ed6' }
];

export function getCategoryName(categoryId: ProductCategoryId) {
  return productCategories.find((category) => category.id === categoryId)?.name ?? '\u5176\u4ed6';
}
