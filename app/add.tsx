import { router } from 'expo-router';
import { Alert } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { ProductForm, ProductFormValues } from '@/components/product/ProductForm';
import { addProduct } from '@/storage/productStorage';

const labels = {
  title: '\u65b0\u589e\u6d88\u8d39\u54c1',
  save: '\u4fdd\u5b58',
  saving: '\u4fdd\u5b58\u4e2d...',
  saveFailed: '\u4fdd\u5b58\u5931\u8d25',
  saveFailedHint: '\u8bf7\u7a0d\u540e\u518d\u8bd5'
};

export default function AddProductScreen() {
  async function handleSubmit(values: ProductFormValues) {
    try {
      await addProduct(values);
      router.back();
    } catch {
      Alert.alert(labels.saveFailed, labels.saveFailedHint);
    }
  }

  return (
    <Screen>
      <ProductForm
        title={labels.title}
        submitLabel={labels.save}
        submittingLabel={labels.saving}
        onSubmit={handleSubmit}
      />
    </Screen>
  );
}
