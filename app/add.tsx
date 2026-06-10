import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  HelperText,
  Menu,
  Text,
  TextInput
} from 'react-native-paper';

import { Screen } from '@/components/layout/Screen';
import { productCategories } from '@/constants/categories';
import { addProduct } from '@/storage/productStorage';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { ProductCategoryId } from '@/types/product';
import { getTodayDateString } from '@/utils/date';

const labels = {
  title: '\u65b0\u589e\u6d88\u8d39\u54c1',
  name: '\u5546\u54c1\u540d\u79f0',
  category: '\u5206\u7c7b',
  price: '\u8d2d\u4e70\u4ef7\u683c',
  purchaseDate: '\u8d2d\u4e70\u65e5\u671f',
  note: '\u5907\u6ce8',
  save: '\u4fdd\u5b58',
  saving: '\u4fdd\u5b58\u4e2d...',
  required: '\u8be5\u9879\u5fc5\u586b',
  invalidPrice: '\u8bf7\u8f93\u5165\u6709\u6548\u7684\u8d2d\u4e70\u4ef7\u683c',
  invalidDate: '\u8bf7\u4f7f\u7528 YYYY-MM-DD \u683c\u5f0f',
  saveFailed: '\u4fdd\u5b58\u5931\u8d25',
  saveFailedHint: '\u8bf7\u7a0d\u540e\u518d\u8bd5'
};

function isValidDateString(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export default function AddProductScreen() {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<ProductCategoryId>('digital');
  const [price, setPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(getTodayDateString());
  const [note, setNote] = useState('');
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedCategoryName = useMemo(() => {
    return (
      productCategories.find((category) => category.id === categoryId)?.name ??
      productCategories[0].name
    );
  }, [categoryId]);

  const normalizedName = name.trim();
  const normalizedPrice = Number(price);
  const hasNameError = submitted && normalizedName.length === 0;
  const hasPriceError =
    submitted && (price.trim().length === 0 || Number.isNaN(normalizedPrice) || normalizedPrice <= 0);
  const hasDateError = submitted && !isValidDateString(purchaseDate);

  async function handleSave() {
    setSubmitted(true);

    if (
      normalizedName.length === 0 ||
      Number.isNaN(normalizedPrice) ||
      normalizedPrice <= 0 ||
      !isValidDateString(purchaseDate)
    ) {
      return;
    }

    try {
      setSaving(true);

      await addProduct({
        name: normalizedName,
        categoryId,
        price: normalizedPrice,
        purchaseDate,
        note: note.trim() || undefined
      });

      router.back();
    } catch {
      Alert.alert(labels.saveFailed, labels.saveFailedHint);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.content}>
          <Text variant="titleLarge" style={styles.title}>
            {labels.title}
          </Text>

          <View>
            <TextInput
              label={labels.name}
              mode="outlined"
              value={name}
              onChangeText={setName}
              error={hasNameError}
              returnKeyType="next"
            />
            <HelperText type="error" visible={hasNameError}>
              {labels.required}
            </HelperText>
          </View>

          <Menu
            visible={categoryMenuVisible}
            onDismiss={() => setCategoryMenuVisible(false)}
            anchor={
              <TextInput
                label={labels.category}
                mode="outlined"
                value={selectedCategoryName}
                editable={false}
                right={<TextInput.Icon icon="menu-down" onPress={() => setCategoryMenuVisible(true)} />}
                onPressIn={() => setCategoryMenuVisible(true)}
              />
            }
          >
            {productCategories.map((category) => (
              <Menu.Item
                key={category.id}
                title={category.name}
                onPress={() => {
                  setCategoryId(category.id);
                  setCategoryMenuVisible(false);
                }}
                leadingIcon={category.id === categoryId ? 'check' : undefined}
              />
            ))}
          </Menu>

          <View>
            <TextInput
              label={labels.price}
              mode="outlined"
              value={price}
              onChangeText={setPrice}
              error={hasPriceError}
              keyboardType="decimal-pad"
              left={<TextInput.Affix text="\uffe5" />}
            />
            <HelperText type="error" visible={hasPriceError}>
              {labels.invalidPrice}
            </HelperText>
          </View>

          <View>
            <TextInput
              label={labels.purchaseDate}
              mode="outlined"
              value={purchaseDate}
              onChangeText={setPurchaseDate}
              error={hasDateError}
              keyboardType="numbers-and-punctuation"
              placeholder="YYYY-MM-DD"
            />
            <HelperText type="error" visible={hasDateError}>
              {labels.invalidDate}
            </HelperText>
          </View>

          <TextInput
            label={labels.note}
            mode="outlined"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
          />

          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
          >
            {saving ? labels.saving : labels.save}
          </Button>
        </Card.Content>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg
  },
  content: {
    gap: spacing.sm
  },
  title: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: spacing.sm
  },
  saveButton: {
    borderRadius: radius.lg,
    marginTop: spacing.sm
  },
  saveButtonContent: {
    height: 48
  }
});
