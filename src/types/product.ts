export type ProductCategoryId =
  | 'digital'
  | 'computer'
  | 'phone'
  | 'monitor'
  | 'headphone'
  | 'tablet'
  | 'appliance'
  | 'furniture'
  | 'transport'
  | 'office'
  | 'other';

export type Product = {
  id: string;
  name: string;
  categoryId: ProductCategoryId;
  price: number;
  purchaseDate: string;
  targetDailyCost?: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type CostCurvePoint = {
  label: string;
  days: number;
  dailyCost: number;
};

export type ProductMetrics = {
  usedDays: number;
  dailyCost: number;
  monthlyCost: number;
  oneYearDailyCost: number;
  threeYearDailyCost: number;
  costCurve: CostCurvePoint[];
  valueSummary: string;
};

export type SortKey = 'dailyCost' | 'price' | 'usedDays' | 'purchaseDate';

export type StatsSummary = {
  totalAmount: number;
  totalUsedDays: number;
  averageDailyCost: number;
  todayTotalCost: number;
  longestUsedProduct?: Product;
  categoryRatio: Array<{
    categoryId: ProductCategoryId;
    amount: number;
    percentage: number;
  }>;
};
