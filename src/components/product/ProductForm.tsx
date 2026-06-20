import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Card, HelperText, Menu, Text, TextInput } from 'react-native-paper';

import { AppCard } from '@/components/ui/AppCard';
import { productCategories } from '@/constants/categories';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { Product, ProductCategoryId } from '@/types/product';
import { getTodayDateString } from '@/utils/date';
import { isFutureDateString } from '@/utils/formatDate';

export type ProductFormValues = {
  name: string;
  categoryId: ProductCategoryId;
  price: number;
  purchaseDate: string;
  targetDailyCost?: number;
  note?: string;
};

type ProductFormProps = {
  initialProduct?: Product;
  title: string;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (values: ProductFormValues) => Promise<void>;
};

const labels = {
  name: '\u5546\u54c1\u540d\u79f0',
  category: '\u5206\u7c7b',
  price: '\u8d2d\u4e70\u4ef7\u683c',
  purchaseDate: '购买日期',
  targetDailyCost: '\u76ee\u6807\u65e5\u5747\u6210\u672c',
  targetDailyCostPlaceholder: '\u4f8b\u5982 2',
  targetDailyCostHint:
    '\u8bbe\u7f6e\u540e\u53ef\u8ba1\u7b97\u8fd8\u9700\u8981\u4f7f\u7528\u591a\u4e45\u624d\u80fd\u8fbe\u5230\u76ee\u6807\u6210\u672c\u3002',
  note: '\u5907\u6ce8',
  required: '\u8be5\u9879\u5fc5\u586b',
  invalidPrice: '\u8bf7\u8f93\u5165\u6709\u6548\u7684\u8d2d\u4e70\u4ef7\u683c',
  invalidTargetDailyCost: '\u8bf7\u8f93\u5165\u5927\u4e8e 0 \u7684\u6570\u5b57',
  invalidDate: '\u8bf7\u4f7f\u7528 YYYY-MM-DD \u683c\u5f0f',
  futurePurchaseDate: '购买日期不能晚于今天。'
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

export function ProductForm({
  initialProduct,
  title,
  submitLabel,
  submittingLabel,
  onSubmit
}: ProductFormProps) {
  const [name, setName] = useState(initialProduct?.name ?? '');
  const [categoryId, setCategoryId] = useState<ProductCategoryId>(
    initialProduct?.categoryId ?? 'digital'
  );
  const [price, setPrice] = useState(initialProduct ? String(initialProduct.price) : '');
  const [targetDailyCost, setTargetDailyCost] = useState(
    initialProduct?.targetDailyCost ? String(initialProduct.targetDailyCost) : ''
  );
  const [purchaseDate, setPurchaseDate] = useState(
    initialProduct?.purchaseDate ?? getTodayDateString()
  );
  const [note, setNote] = useState(initialProduct?.note ?? '');
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const openCategoryMenu = () => {
    setCategoryMenuVisible(true);
  };

  const selectedCategoryName = useMemo(() => {
    return (
      productCategories.find((category) => category.id === categoryId)?.name ??
      productCategories[0].name
    );
  }, [categoryId]);

  const normalizedName = name.trim();
  const normalizedPrice = Number(price);
  const normalizedTargetDailyCost = Number(targetDailyCost);
  const hasTargetDailyCostValue = targetDailyCost.trim().length > 0;
  const hasNameError = submitted && normalizedName.length === 0;
  const hasPriceError =
    submitted &&
    (price.trim().length === 0 || Number.isNaN(normalizedPrice) || normalizedPrice <= 0);
  const hasTargetDailyCostError =
    submitted &&
    hasTargetDailyCostValue &&
    (Number.isNaN(normalizedTargetDailyCost) || normalizedTargetDailyCost <= 0);
  const hasPurchaseDateFormatError = submitted && !isValidDateString(purchaseDate);
  const hasFuturePurchaseDateError = submitted && isFutureDateString(purchaseDate);
  const hasDateError = hasPurchaseDateFormatError || hasFuturePurchaseDateError;

  async function handleSubmit() {
    setSubmitted(true);

    if (
      normalizedName.length === 0 ||
      Number.isNaN(normalizedPrice) ||
      normalizedPrice <= 0 ||
      (hasTargetDailyCostValue &&
        (Number.isNaN(normalizedTargetDailyCost) || normalizedTargetDailyCost <= 0)) ||
      !isValidDateString(purchaseDate) ||
      isFutureDateString(purchaseDate)
    ) {
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit({
        name: normalizedName,
        categoryId,
        price: normalizedPrice,
        purchaseDate,
        targetDailyCost: hasTargetDailyCostValue ? normalizedTargetDailyCost : undefined,
        note: note.trim() || undefined
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppCard style={styles.card}>
      <Card.Content style={styles.content}>
        <Text variant="titleLarge" style={styles.title}>
          {title}
        </Text>

        <View>
          <TextInput
            label={labels.name}
            mode="outlined"
            value={name}
            onChangeText={setName}
            error={hasNameError}
            returnKeyType="next"
            style={styles.input}
          />
          <HelperText type="error" visible={hasNameError}>
            {labels.required}
          </HelperText>
        </View>

        <Menu
          visible={categoryMenuVisible}
          onDismiss={() => setCategoryMenuVisible(false)}
          anchor={
            <View>
              <TextInput
                label={labels.category}
                mode="outlined"
                value={selectedCategoryName}
                editable={false}
                style={styles.input}
                right={
                  <TextInput.Icon
                    icon="menu-down"
                    onPress={openCategoryMenu}
                    forceTextInputFocus={false}
                  />
                }
              />
              <Pressable
                accessibilityRole="button"
                onPress={openCategoryMenu}
                style={styles.categoryPressable}
              />
            </View>
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
            style={styles.input}
            left={<TextInput.Affix text="¥" />}
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
            style={styles.input}
          />
          <HelperText type="error" visible={hasDateError}>
            {hasFuturePurchaseDateError ? labels.futurePurchaseDate : labels.invalidDate}
          </HelperText>
        </View>

        <View>
          <TextInput
            label={labels.targetDailyCost}
            mode="outlined"
            value={targetDailyCost}
            onChangeText={setTargetDailyCost}
            error={hasTargetDailyCostError}
            keyboardType="decimal-pad"
            placeholder={labels.targetDailyCostPlaceholder}
            style={styles.input}
            left={<TextInput.Affix text="¥" />}
          />
          <HelperText type={hasTargetDailyCostError ? 'error' : 'info'} visible>
            {hasTargetDailyCostError
              ? labels.invalidTargetDailyCost
              : labels.targetDailyCostHint}
          </HelperText>
        </View>

        <TextInput
          label={labels.note}
          mode="outlined"
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={4}
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
          style={styles.saveButton}
          contentStyle={styles.saveButtonContent}
        >
          {submitting ? submittingLabel : submitLabel}
        </Button>
      </Card.Content>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 24
  },
  content: {
    gap: spacing.sm
  },
  title: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: spacing.sm
  },
  input: {
    backgroundColor: colors.cardAlt
  },
  categoryPressable: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 56,
    top: 0
  },
  saveButton: {
    borderRadius: radius.lg,
    marginTop: spacing.sm
  },
  saveButtonContent: {
    height: 48
  }
});
