import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { expenseCategories, incomeCategories } from '@/constants/expenseCategories';
import { useExpenseRecords } from '@/context/ExpenseRecordsContext';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { ExpenseRecordType } from '@/types/expense';

type QuickExpenseSheetProps = {
  visible: boolean;
  onClose: () => void;
};

const labels = {
  expense: '\u652f\u51fa',
  income: '\u6536\u5165',
  note: '\u5907\u6ce8\uff08\u9009\u586b\uff09',
  save: '\u8bb0\u4e00\u7b14',
  saving: '\u4fdd\u5b58\u4e2d...',
  invalidTitle: '\u91d1\u989d\u65e0\u6548',
  invalidDescription: '\u8bf7\u5148\u8f93\u5165\u5927\u4e8e 0 \u7684\u91d1\u989d\u3002',
  saveFailedTitle: '\u4fdd\u5b58\u5931\u8d25',
  saveFailedDescription: '\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002'
};

const keypadItems = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', 'backspace'];

function getDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getAmountValue(amountText: string) {
  const amount = Number(amountText);

  return Number.isFinite(amount) ? amount : 0;
}

function getAmountLabel(amountText: string) {
  return amountText ? `\uFFE5${amountText}` : '\uFFE50';
}

function isValidAmountText(amountText: string) {
  return /^\d+(\.\d{0,2})?$/.test(amountText);
}

function getNextAmountText(currentValue: string, key: string) {
  if (key === 'backspace') {
    return currentValue.slice(0, -1);
  }

  if (key === '.') {
    if (currentValue.includes('.')) {
      return currentValue;
    }

    return currentValue.length === 0 ? '0.' : `${currentValue}.`;
  }

  const nextValue = currentValue === '0' ? key : `${currentValue}${key}`;
  const decimalPart = nextValue.split('.')[1];

  if (decimalPart !== undefined && decimalPart.length > 2) {
    return currentValue;
  }

  if (nextValue.length > 10) {
    return currentValue;
  }

  return nextValue;
}

export function QuickExpenseSheet({ visible, onClose }: QuickExpenseSheetProps) {
  const insets = useSafeAreaInsets();
  const { addRecord } = useExpenseRecords();
  const amountScale = useRef(new Animated.Value(1)).current;
  const hasMountedAmount = useRef(false);
  const [recordType, setRecordType] = useState<ExpenseRecordType>('expense');
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState(expenseCategories[0].label);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const categories = recordType === 'expense' ? expenseCategories : incomeCategories;
  const amount = getAmountValue(amountText);
  const isAmountValid = isValidAmountText(amountText) && amount > 0;
  const saveColor = recordType === 'expense' ? colors.expense : colors.primary;

  const amountLabel = useMemo(() => {
    return getAmountLabel(amountText);
  }, [amountText]);

  const triggerAmountFeedback = useCallback(() => {
    amountScale.stopAnimation();
    amountScale.setValue(1);
    Animated.sequence([
      Animated.timing(amountScale, {
        duration: 80,
        easing: Easing.out(Easing.quad),
        toValue: 1.045,
        useNativeDriver: true
      }),
      Animated.timing(amountScale, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: 1,
        useNativeDriver: true
      })
    ]).start();
  }, [amountScale]);

  useEffect(() => {
    if (!hasMountedAmount.current) {
      hasMountedAmount.current = true;
      return;
    }

    triggerAmountFeedback();
  }, [amountText, triggerAmountFeedback]);

  function resetForm() {
    setRecordType('expense');
    setAmountText('');
    setCategory(expenseCategories[0].label);
    setNote('');
  }

  function selectRecordType(nextType: ExpenseRecordType) {
    setRecordType(nextType);
    setCategory(nextType === 'expense' ? expenseCategories[0].label : incomeCategories[0].label);
  }

  function handleKeyPress(value: string) {
    setAmountText((currentValue) => getNextAmountText(currentValue, value));
  }

  async function handleSave() {
    if (!isAmountValid) {
      Alert.alert(labels.invalidTitle, labels.invalidDescription);
      return;
    }

    setSaving(true);

    try {
      await addRecord({
        type: recordType,
        amount,
        category,
        note: note.trim() || undefined,
        date: getDateString(new Date())
      });

      resetForm();
      onClose();
    } catch {
      Alert.alert(labels.saveFailedTitle, labels.saveFailedDescription);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.sheetBody}
          >
            <View style={styles.segment}>
              <Pressable
                onPress={() => selectRecordType('expense')}
                style={[
                  styles.segmentButton,
                  recordType === 'expense' && styles.expenseSegmentButton
                ]}
              >
                <Text
                  variant="titleSmall"
                  style={[
                    styles.segmentText,
                    recordType === 'expense' && styles.activeSegmentText
                  ]}
                >
                  {labels.expense}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => selectRecordType('income')}
                style={[
                  styles.segmentButton,
                  recordType === 'income' && styles.incomeSegmentButton
                ]}
              >
                <Text
                  variant="titleSmall"
                  style={[
                    styles.segmentText,
                    recordType === 'income' && styles.activeSegmentText
                  ]}
                >
                  {labels.income}
                </Text>
              </Pressable>
            </View>

            <Animated.View style={{ transform: [{ scale: amountScale }] }}>
              <Text variant="displaySmall" style={styles.amountText}>
                {amountLabel}
              </Text>
            </Animated.View>

            <View style={styles.categoryGrid}>
              {categories.map((item) => {
                const isSelected = category === item.label;

                return (
                  <Pressable
                    key={item.label}
                    onPress={() => setCategory(item.label)}
                    style={[styles.categoryItem, isSelected && styles.selectedCategoryItem]}
                  >
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={24}
                      color={isSelected ? colors.background : colors.textSecondary}
                    />
                    <Text
                      variant="labelMedium"
                      style={[styles.categoryText, isSelected && styles.selectedCategoryText]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={labels.note}
              mode="flat"
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              textColor={colors.text}
              placeholderTextColor={colors.textSecondary}
              style={styles.noteInput}
            />

            <View style={styles.keypad}>
              {keypadItems.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => handleKeyPress(item)}
                  android_ripple={{
                    borderless: false,
                    color: 'rgba(255, 255, 255, 0.08)'
                  }}
                  style={({ pressed }) => [
                    styles.keypadButton,
                    pressed && styles.keypadButtonPressed
                  ]}
                >
                  {item === 'backspace' ? (
                    <MaterialCommunityIcons
                      name="backspace-outline"
                      size={22}
                      color={colors.textSecondary}
                    />
                  ) : (
                    <Text variant="titleMedium" style={styles.keypadText}>
                      {item}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>

          </ScrollView>
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
            <Button
              mode="contained"
              loading={saving}
              disabled={saving || !isAmountValid}
              buttonColor={isAmountValid ? saveColor : colors.surfaceElevated}
              textColor={
                isAmountValid
                  ? recordType === 'expense'
                    ? colors.text
                    : colors.background
                  : colors.textSecondary
              }
              onPress={handleSave}
              style={[styles.saveButton, !isAmountValid && styles.disabledSaveButton]}
              contentStyle={styles.saveButtonContent}
            >
              {saving ? labels.saving : labels.save}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm
  },
  sheetBody: {
    flexShrink: 1
  },
  sheetContent: {
    paddingBottom: spacing.sm
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#46465C',
    borderRadius: radius.full,
    height: 4,
    marginBottom: spacing.sm,
    width: 48
  },
  segment: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.full,
    flexDirection: 'row',
    padding: spacing.xs
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: radius.full,
    flex: 1,
    paddingVertical: 6
  },
  expenseSegmentButton: {
    backgroundColor: colors.expense
  },
  incomeSegmentButton: {
    backgroundColor: colors.primary
  },
  segmentText: {
    color: colors.textSecondary,
    fontWeight: '800'
  },
  activeSegmentText: {
    color: colors.text
  },
  amountText: {
    color: colors.text,
    fontWeight: '800',
    marginTop: spacing.md
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md
  },
  categoryItem: {
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: radius.lg,
    minHeight: 58,
    paddingVertical: 6,
    width: '23%'
  },
  selectedCategoryItem: {
    backgroundColor: colors.primary
  },
  categoryText: {
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  selectedCategoryText: {
    color: colors.background,
    fontWeight: '800'
  },
  noteInput: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.lg,
    color: colors.text,
    height: 48,
    marginTop: spacing.sm,
    overflow: 'hidden'
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  keypadButton: {
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: radius.lg,
    height: 44,
    justifyContent: 'center',
    overflow: 'hidden',
    width: '31.7%'
  },
  keypadButtonPressed: {
    backgroundColor: '#24243A',
    transform: [{ scale: 0.96 }]
  },
  keypadText: {
    color: colors.text,
    fontWeight: '800'
  },
  saveButton: {
    borderRadius: radius.lg
  },
  disabledSaveButton: {
    opacity: 0.72
  },
  saveButtonContent: {
    minHeight: 52
  },
  footer: {
    backgroundColor: colors.card,
    paddingTop: spacing.sm
  }
});
