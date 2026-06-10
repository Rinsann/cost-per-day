import AsyncStorage from '@react-native-async-storage/async-storage';

import { Product } from '@/types/product';

const PRODUCT_STORAGE_KEY = 'cost-per-day:products';

function parseProducts(rawValue: string | null): Product[] {
  if (!rawValue) {
    return [];
  }

  try {
    const value = JSON.parse(rawValue);

    return Array.isArray(value) ? (value as Product[]) : [];
  } catch {
    return [];
  }
}

export async function getProducts() {
  const rawValue = await AsyncStorage.getItem(PRODUCT_STORAGE_KEY);

  return parseProducts(rawValue);
}

export async function saveProducts(products: Product[]) {
  await AsyncStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(products));
}

export async function addProduct(input: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
  const products = await getProducts();
  const now = new Date().toISOString();
  const product: Product = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now
  };

  await saveProducts([product, ...products]);

  return product;
}

export async function getProductById(id: string) {
  const products = await getProducts();

  return products.find((product) => product.id === id);
}

export async function deleteProductById(id: string) {
  const products = await getProducts();
  const nextProducts = products.filter((product) => product.id !== id);

  await saveProducts(nextProducts);
}
