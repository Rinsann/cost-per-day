import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppDateField } from '@/components/ui/AppDateField';
import { useAppTheme } from '@/context/AppThemeContext';
import { useExpenseCategories } from '@/context/ExpenseCategoriesContext';
import { useExpenseRecords } from '@/context/ExpenseRecordsContext';
import {
  DEFAULT_RECENT_EXPENSE_CATEGORIES,
  getRecentExpenseCategories,
  RecentExpenseCategories,
  saveRecentExpenseCategory,
  sortCategoriesByRecent
} from '@/storage/recentExpenseCategoryStorage';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { ExpenseRecordType } from '@/types/expense';
import { getDateString } from '@/utils/formatDate';

type QuickExpenseSheetProps = {
  visible: boolean;
  onClose: () => void;
};

type InputMode = 'amount' | 'note';
type NoteInputHandle = {
  blur: () => void;
  focus: () => void;
};

const labels = {
  expense: '\u652f\u51fa',
  income: '\u6536\u5165',
  date: '日期',
  today: '今天',
  note: '\u5907\u6ce8\uff08\u9009\u586b\uff09',
  noteTitle: '\u5907\u6ce8',
  notePlaceholder: '\u8bf7\u8f93\u5165\u5907\u6ce8',
  noteDone: '\u5b8c\u6210',
  noteBack: '\u8fd4\u56de\u91d1\u989d\u8f93\u5165',
  save: '\u8bb0\u4e00\u7b14',
  saving: '\u4fdd\u5b58\u4e2d...',
  invalidTitle: '\u91d1\u989d\u65e0\u6548',
  invalidDescription: '\u8bf7\u5148\u8f93\u5165\u5927\u4e8e 0 \u7684\u91d1\u989d\u3002',
  invalidDateTitle: '日期无效',
  futureDateDescription: '记账日期不能晚于今天。',
  saveFailedTitle: '\u4fdd\u5b58\u5931\u8d25',
  saveFailedDescription: '\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002'
};

const keypadItems = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'];
const categoryGridVisibleHeight = 152;

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
  const { expenseCategories, incomeCategories } = useExpenseCategories();
  const { addRecord } = useExpenseRecords();
  const amountFeedback = useRef(new Animated.Value(0)).current;
  const hasMountedAmount = useRef(false);
  const wasVisible = useRef(false);
  const didLongPressBackspace = useRef(false);
  const noteInputRef = useRef<NoteInputHandle | null>(null);
  const noteFocusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [recordType, setRecordType] = useState<ExpenseRecordType>('expense');
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState(expenseCategories[0].label);
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState(getDateString(new Date()));
  const [saving, setSaving] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>('amount');
  const [recentCategories, setRecentCategories] = useState<RecentExpenseCategories>(
    DEFAULT_RECENT_EXPENSE_CATEGORIES
  );

  const sourceCategories = recordType === 'expense' ? expenseCategories : incomeCategories;
  const categories = useMemo(
    () => sortCategoriesByRecent(sourceCategories, recentCategories[recordType]),
    [recordType, recentCategories, sourceCategories]
  );
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

  const setNoteInputRef = useCallback((ref: NoteInputHandle | null) => {
    noteInputRef.current = ref;
  }, []);

  const clearPendingNoteFocus = useCallback(() => {
    if (noteFocusTimeoutRef.current) {
      clearTimeout(noteFocusTimeoutRef.current);
      noteFocusTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!hasMountedAmount.current) {
      hasMountedAmount.current = true;
      return;
    }

    triggerAmountFeedback();
  }, [amountText, triggerAmountFeedback]);

  const resetDraft = useCallback(() => {
    Keyboard.dismiss();
    clearPendingNoteFocus();
    noteInputRef.current?.blur();
    amountFeedback.stopAnimation();
    amountFeedback.setValue(0);
    setRecordType('expense');
    setAmountText('');
    setCategory('');
    setNote('');
    setSelectedDate(getDateString(new Date()));
    setSaving(false);
    setInputMode('amount');
  }, [amountFeedback, clearPendingNoteFocus]);

  useEffect(() => {
    return () => {
      clearPendingNoteFocus();
    };
  }, [clearPendingNoteFocus]);

  useEffect(() => {
    if (!categories.some((item) => item.label === category)) {
      setCategory(categories[0]?.label ?? '');
    }
  }, [categories, category]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let ignoreResult = false;

    getRecentExpenseCategories().then((nextRecentCategories) => {
      if (!ignoreResult) {
        setRecentCategories(nextRecentCategories);
        setCategory('');
      }
    });

    return () => {
      ignoreResult = true;
    };
  }, [visible]);

  useEffect(() => {
    if (visible && !wasVisible.current) {
      resetDraft();
    }

    if (!visible && wasVisible.current) {
      resetDraft();
    }

    wasVisible.current = visible;
  }, [resetDraft, visible]);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const keyboardHideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setInputMode('amount');
    });

    return () => {
      keyboardHideSubscription.remove();
    };
  }, [visible]);

  function handleClose() {
    Keyboard.dismiss();
    clearPendingNoteFocus();
    noteInputRef.current?.blur();
    resetDraft();
    onClose();
  }

  function enterAmountMode() {
    clearPendingNoteFocus();
    noteInputRef.current?.blur();
    Keyboard.dismiss();
    setInputMode('amount');
  }

  function enterNoteMode() {
    setInputMode('note');
    clearPendingNoteFocus();
    noteFocusTimeoutRef.current = setTimeout(() => {
      noteInputRef.current?.focus();
      noteFocusTimeoutRef.current = null;
    }, 140);
  }

  function selectRecordType(nextType: ExpenseRecordType) {
    enterAmountMode();
    setRecordType(nextType);
    setCategory('');
  }

  function handleKeyPress(value: string) {
    if (inputMode !== 'amount') {
      setInputMode('amount');
    }

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
    enterAmountMode();
    setAmountText('');
  }

  async function handleSave() {
    if (inputMode === 'note') {
      clearPendingNoteFocus();
      Keyboard.dismiss();
    }

    if (!isAmountValid || !category) {
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

      saveRecentExpenseCategory(recordType, category)
        .then((nextRecentCategories) => {
          if (nextRecentCategories) {
            setRecentCategories(nextRecentCategories);
          }
        })
        .catch(() => undefined);
      resetDraft();
      onClose();
    } catch {
      Alert.alert(labels.saveFailedTitle, labels.saveFailedDescription);
    } finally {
      setSaving(false);
    }
  }

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.modalRoot}>
        <Pressable style={[styles.backdrop, { backgroundColor: themeColors.overlay }]} onPress={handleClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : inputMode === 'note' ? 'height' : undefined}
          pointerEvents="box-none"
          style={styles.keyboardAvoidingSheet}
        >
          <View style={[styles.sheet, { backgroundColor: themeColors.card }]}>
            <View style={[styles.handle, { backgroundColor: themeColors.textSecondary }]} />
            {inputMode === 'note' ? (
              <View style={styles.noteMode}>
                <View style={styles.noteHeader}>
                  <View style={styles.noteTitleWrap}>
                    <Text variant="titleLarge" style={[styles.noteTitle, { color: themeColors.text }]}>
                      {labels.noteTitle}
                    </Text>
                    <Text
                      variant="labelMedium"
                      numberOfLines={1}
                      style={[styles.noteSubtitle, { color: themeColors.textSecondary }]}
                    >
                      {labels.noteBack}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    onPress={enterAmountMode}
                    style={({ pressed }) => [
                      styles.noteBackButton,
                      { backgroundColor: pressed ? themeColors.surfacePressed : themeColors.chipBackground }
                    ]}
                  >
                    <MaterialCommunityIcons name="chevron-down" size={22} color={themeColors.textSecondary} />
                  </Pressable>
                </View>

                <View style={[styles.noteContext, { backgroundColor: themeColors.chipBackground }]}>
                  <Text
                    adjustsFontSizeToFit
                    minimumFontScale={0.72}
                    numberOfLines={1}
                    variant="titleMedium"
                    style={[styles.noteContextAmount, { color: themeColors.text }]}
                  >
                    {amountLabel}
                  </Text>
                  <Text
                    numberOfLines={1}
                    variant="labelMedium"
                    style={[styles.noteContextMeta, { color: themeColors.textSecondary }]}
                  >
                    {category || '-'} · {selectedDate === todayString ? labels.today : selectedDate}
                  </Text>
                </View>

                <TextInput
                  ref={setNoteInputRef}
                  value={note}
                  onChangeText={setNote}
                  label={labels.note}
                  placeholder={labels.notePlaceholder}
                  mode="flat"
                  multiline
                  numberOfLines={3}
                  scrollEnabled
                  textAlignVertical="top"
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  textColor={themeColors.text}
                  placeholderTextColor={themeColors.textSecondary}
                  style={[styles.noteEditor, { backgroundColor: themeColors.inputBackground }]}
                />

                <Button
                  mode="contained"
                  buttonColor={themeColors.primary}
                  textColor={themeColors.background}
                  onPress={enterAmountMode}
                  style={styles.noteDoneButton}
                  contentStyle={styles.noteDoneButtonContent}
                >
                  {labels.noteDone}
                </Button>
              </View>
            ) : (
              <>
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
                    onTouchStart={enterAmountMode}
                    style={[
                      styles.amountWrap,
                      {
                        opacity: amountOpacity,
                        transform: [{ translateY: amountTranslateY }]
                      }
                    ]}
                  >
                    <Text
                      adjustsFontSizeToFit
                      minimumFontScale={0.52}
                      variant="displaySmall"
                      numberOfLines={1}
                      style={[styles.amountText, { color: themeColors.text }]}
                    >
                      {amountLabel}
                    </Text>
                  </Animated.View>

                  <ScrollView
                    contentContainerStyle={styles.categoryGrid}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={categories.length > 12}
                    style={styles.categoryScroll}
                  >
                    {categories.map((item) => {
                      const isSelected = category === item.label;

                      return (
                        <Pressable
                          key={item.label}
                          onPress={() => {
                            enterAmountMode();
                            setCategory(item.label);
                          }}
                          style={[
                            styles.categoryItem,
                            { backgroundColor: isSelected ? themeColors.primary : themeColors.chipBackground }
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={item.icon}
                            size={19}
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
                  </ScrollView>

                  <View style={styles.dateWrap}>
                    <AppDateField
                      label={labels.date}
                      value={selectedDate}
                      maxDate={todayString}
                      onChange={(value) => {
                        enterAmountMode();
                        setSelectedDate(value);
                      }}
                      formatValue={(value) => (value === todayString ? labels.today : value)}
                    />
                  </View>

                  <Pressable
                    onPress={enterNoteMode}
                    style={({ pressed }) => [
                      styles.notePreview,
                      { backgroundColor: pressed ? themeColors.surfacePressed : themeColors.inputBackground }
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      variant="bodyLarge"
                      style={[
                        styles.notePreviewText,
                        { color: note.trim() ? themeColors.text : themeColors.textSecondary }
                      ]}
                    >
                      {note.trim() || labels.note}
                    </Text>
                  </Pressable>

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
                    disabled={saving || !isAmountValid || !category}
                    buttonColor={isAmountValid && category ? saveColor : themeColors.surfacePressed}
                    textColor={
                      isAmountValid && category
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
              </>
            )}
          </View>
        </KeyboardAvoidingView>
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
  keyboardAvoidingSheet: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm
  },
  sheetBody: {
    flexGrow: 0,
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
    marginTop: spacing.sm,
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
    gap: spacing.xs,
    paddingBottom: spacing.xs
  },
  categoryScroll: {
    flexGrow: 0,
    height: categoryGridVisibleHeight,
    marginTop: spacing.md,
  },
  categoryItem: {
    alignItems: 'center',
    borderRadius: radius.lg,
    height: 44,
    paddingVertical: 3,
    width: '23%'
  },
  selectedCategoryItem: {
    backgroundColor: colors.primary
  },
  categoryText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 13,
    marginTop: 2
  },
  selectedCategoryText: {
    color: colors.background,
    fontWeight: '800'
  },
  notePreview: {
    borderRadius: radius.lg,
    justifyContent: 'center',
    marginTop: spacing.sm,
    minHeight: 48,
    overflow: 'hidden',
    paddingHorizontal: spacing.md
  },
  notePreviewText: {
    fontWeight: '700'
  },
  noteMode: {
    gap: spacing.sm,
    paddingBottom: spacing.md
  },
  noteHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  noteTitleWrap: {
    flex: 1,
    minWidth: 0
  },
  noteTitle: {
    fontWeight: '900'
  },
  noteSubtitle: {
    fontWeight: '700',
    marginTop: 2
  },
  noteBackButton: {
    alignItems: 'center',
    borderRadius: radius.full,
    height: 40,
    justifyContent: 'center',
    marginLeft: spacing.sm,
    width: 40
  },
  noteContext: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  noteContextAmount: {
    fontWeight: '900'
  },
  noteContextMeta: {
    fontWeight: '700',
    marginTop: 2
  },
  noteEditor: {
    borderRadius: radius.lg,
    maxHeight: 116,
    minHeight: 92,
    overflow: 'hidden'
  },
  noteDoneButton: {
    borderRadius: radius.lg,
    marginTop: 2
  },
  noteDoneButtonContent: {
    minHeight: 46
  },
  dateWrap: {
    marginTop: spacing.sm
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm
  },
  keypadButton: {
    alignItems: 'center',
    borderRadius: radius.lg,
    height: 40,
    justifyContent: 'center',
    overflow: 'hidden',
    width: '32.5%'
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
    minHeight: 48
  },
  footer: {
    paddingTop: spacing.sm
  }
});
