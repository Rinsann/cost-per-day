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

import { AppDateField } from '@/components/ui/AppDateField';
import { expenseCategories, incomeCategories } from '@/constants/expenseCategories';
import { useAppTheme } from '@/context/AppThemeContext';
import { useExpenseRecords } from '@/context/ExpenseRecordsContext';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { ExpenseRecordType } from '@/types/expense';
import { getDateString } from '@/utils/formatDate';

type QuickExpenseSheetProps = {
  visible: boolean;
  onClose: () => void;
};

const labels = {
  expense: '\u652f\u51fa',
  income: '\u6536\u5165',
  date: '日期',
  today: '今天',
  note: '\u5907\u6ce8\uff08\u9009\u586b\uff09',
  save: '\u8bb0\u4e00\u7b14',
  saving: '\u4fdd\u5b58\u4e2d...',
  invalidTitle: '\u91d1\u989d\u65e0\u6548',
  invalidDescription: '\u8bf7\u5148\u8f93\u5165\u5927\u4e8e 0 \u7684\u91d1\u989d\u3002',
  invalidDateTitle: '日期无效',
  futureDateDescription: '记账日期不能晚于今天。',
  saveFailedTitle: '\u4fdd\u5b58\u5931\u8d25',
  saveFailedDescription: '\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002'
};

const keypadItems = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', 'backspace'];

function getAmountValue(amountText: string) {
  const amount = Number(amountText);

  return Number.isFinite(amount) ? amount : 0;
}

function getAmountLabel(amountText: string) {
  return amountText ? `¥${amountText}` : '¥0';
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
  const { colors: themeColors, resolvedTheme } = useAppTheme();
  const { addRecord } = useExpenseRecords();
  const amountFeedback = useRef(new Animated.Value(0)).current;
  const hasMountedAmount = useRef(false);
  const wasVisible = useRef(false);
  const didLongPressBackspace = useRef(false);
  const [recordType, setRecordType] = useState<ExpenseRecordType>('expense');
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState(expenseCategories[0].label);
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState(getDateString(new Date()));
  const [saving, setSaving] = useState(false);

  const categories = recordType === 'expense' ? expenseCategories : incomeCategories;
  const amount = getAmountValue(amountText);
  const isAmountValid = isValidAmountText(amountText) && amount > 0;
  const saveColor = recordType === 'expense' ? themeColors.expense : themeColors.primary;
  const todayString = getDateString(new Date());

  const amountLabel = useMemo(() => {
    return getAmountLabel(amountText);
  }, [amountText]);

  const amountOpacity = amountFeedback.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.94]
  });

  const amountTranslateY = amountFeedback.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1]
  });

  const triggerAmountFeedback = useCallback(() => {
    amountFeedback.stopAnimation();
    amountFeedback.setValue(0);
    Animated.sequence([
      Animated.timing(amountFeedback, {
        duration: 70,
        easing: Easing.out(Easing.quad),
        toValue: 1,
        useNativeDriver: true
      }),
      Animated.timing(amountFeedback, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: 0,
        useNativeDriver: true
      })
    ]).start();
  }, [amountFeedback]);

  useEffect(() => {
    if (!hasMountedAmount.current) {
      hasMountedAmount.current = true;
      return;
    }

    triggerAmountFeedback();
  }, [amountText, triggerAmountFeedback]);

  const resetDraft = useCallback(() => {
    amountFeedback.stopAnimation();
    amountFeedback.setValue(0);
    setRecordType('expense');
    setAmountText('');
    setCategory(expenseCategories[0].label);
    setNote('');
    setSelectedDate(getDateString(new Date()));
    setSaving(false);
  }, [amountFeedback]);

  useEffect(() => {
    if (visible && !wasVisible.current) {
      resetDraft();
    }

    if (!visible && wasVisible.current) {
      resetDraft();
    }

    wasVisible.current = visible;
  }, [resetDraft, visible]);

  function handleClose() {
    resetDraft();
    onClose();
  }

  function selectRecordType(nextType: ExpenseRecordType) {
    setRecordType(nextType);
    setCategory(nextType === 'expense' ? expenseCategories[0].label : incomeCategories[0].label);
  }

  function handleKeyPress(value: string) {
    setAmountText((currentValue) => getNextAmountText(currentValue, value));
  }

  function handleBackspacePress() {
    if (didLongPressBackspace.current) {
      didLongPressBackspace.current = false;
      return;
    }

    handleKeyPress('backspace');
  }

  function clearAmountInput() {
    setAmountText('');
  }

  async function handleSave() {
    if (!isAmountValid) {
      Alert.alert(labels.invalidTitle, labels.invalidDescription);
      return;
    }

    if (selectedDate > todayString) {
      Alert.alert(labels.invalidDateTitle, labels.futureDateDescription);
      return;
    }

    setSaving(true);

    try {
      await addRecord({
        type: recordType,
        amount,
        category,
        note: note.trim() || undefined,
        date: selectedDate
      });

      resetDraft();
      onClose();
    } catch {
      Alert.alert(labels.saveFailedTitle, labels.saveFailedDescription);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.modalRoot}>
        <Pressable style={[styles.backdrop, { backgroundColor: themeColors.overlay }]} onPress={handleClose} />
        <View style={[styles.sheet, { backgroundColor: themeColors.card }]}>
          <View style={[styles.handle, { backgroundColor: themeColors.textSecondary }]} />
          <ScrollView
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.sheetBody}
          >
            <View style={[styles.segment, { backgroundColor: themeColors.chipBackground }]}>
              <Pressable
                onPress={() => selectRecordType('expense')}
                style={[
                  styles.segmentButton,
                  recordType === 'expense' && { backgroundColor: themeColors.expense }
                ]}
              >
                <Text
                  variant="titleSmall"
                  style={[
                    styles.segmentText,
                    { color: recordType === 'expense' ? themeColors.text : themeColors.textSecondary }
                  ]}
                >
                  {labels.expense}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => selectRecordType('income')}
                style={[
                  styles.segmentButton,
                  recordType === 'income' && { backgroundColor: themeColors.primary }
                ]}
              >
                <Text
                  variant="titleSmall"
                  style={[
                    styles.segmentText,
                    { color: recordType === 'income' ? themeColors.background : themeColors.textSecondary }
                  ]}
                >
                  {labels.income}
                </Text>
              </Pressable>
            </View>

            <Animated.View
              style={[
                styles.amountWrap,
                {
                  opacity: amountOpacity,
                  transform: [{ translateY: amountTranslateY }]
                }
              ]}
            >
              <Text
                variant="displaySmall"
                numberOfLines={1}
                style={[styles.amountText, { color: themeColors.text }]}
              >
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
                    style={[
                      styles.categoryItem,
                      { backgroundColor: isSelected ? themeColors.primary : themeColors.chipBackground }
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={24}
                      color={isSelected ? themeColors.background : themeColors.textSecondary}
                    />
                    <Text
                      variant="labelMedium"
                      style={[
                        styles.categoryText,
                        { color: isSelected ? themeColors.background : themeColors.textSecondary }
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.dateWrap}>
              <AppDateField
                label={labels.date}
                value={selectedDate}
                maxDate={todayString}
                onChange={setSelectedDate}
                formatValue={(value) => (value === todayString ? labels.today : value)}
              />
            </View>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={labels.note}
              mode="flat"
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              textColor={themeColors.text}
              placeholderTextColor={themeColors.textSecondary}
              style={[styles.noteInput, { backgroundColor: themeColors.inputBackground }]}
            />

            <View style={styles.keypad}>
              {keypadItems.map((item) => (
                <Pressable
                  key={item}
                  delayLongPress={item === 'backspace' ? 420 : undefined}
                  onLongPress={
                    item === 'backspace'
                      ? () => {
                          didLongPressBackspace.current = true;
                          clearAmountInput();
                        }
                      : undefined
                  }
                  onPress={() => {
                    if (item === 'backspace') {
                      handleBackspacePress();
                      return;
                    }

                    handleKeyPress(item);
                  }}
                  onPressIn={() => {
                    if (item === 'backspace') {
                      didLongPressBackspace.current = false;
                    }
                  }}
                  android_ripple={
                    resolvedTheme === 'dark'
                      ? {
                          borderless: false,
                          color: themeColors.ripple,
                          radius: 18
                        }
                      : undefined
                  }
                  style={({ pressed }) => [
                    styles.keypadButton,
                    { backgroundColor: pressed ? themeColors.surfacePressed : themeColors.inputBackground },
                    pressed && styles.keypadButtonPressed
                  ]}
                >
                  {item === 'backspace' ? (
                    <MaterialCommunityIcons
                      name="backspace-outline"
                      size={22}
                      color={themeColors.textSecondary}
                    />
                  ) : (
                    <Text variant="titleMedium" style={[styles.keypadText, { color: themeColors.text }]}>
                      {item}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>

          </ScrollView>
          <View
            style={[
              styles.footer,
              {
                backgroundColor: themeColors.card,
                paddingBottom: Math.max(insets.bottom, spacing.sm)
              }
            ]}
          >
            <Button
              mode="contained"
              loading={saving}
              disabled={saving || !isAmountValid}
              buttonColor={isAmountValid ? saveColor : themeColors.surfacePressed}
              textColor={
                isAmountValid
                  ? recordType === 'expense'
                    ? themeColors.text
                    : themeColors.background
                  : themeColors.textSecondary
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
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  },
  sheet: {
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
  amountWrap: {
    marginTop: spacing.md,
    overflow: 'visible',
    paddingHorizontal: spacing.sm
  },
  amountText: {
    color: colors.text,
    fontWeight: '800'
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md
  },
  categoryItem: {
    alignItems: 'center',
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
    borderRadius: radius.lg,
    height: 48,
    marginTop: spacing.sm,
    overflow: 'hidden'
  },
  dateWrap: {
    marginTop: spacing.sm
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  keypadButton: {
    alignItems: 'center',
    borderRadius: radius.lg,
    height: 44,
    justifyContent: 'center',
    overflow: 'hidden',
    width: '31.7%'
  },
  keypadButtonPressed: {
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
    paddingTop: spacing.sm
  }
});
