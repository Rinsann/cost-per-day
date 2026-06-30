import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { useAppTheme } from '@/context/AppThemeContext';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { getDateString, getLocalDateFromString } from '@/utils/formatDate';

type AppDateFieldProps = {
  error?: boolean;
  formatValue?: (value: string) => string;
  helperText?: string;
  label: string;
  maxDate: string;
  minDate?: string;
  onChange: (value: string) => void;
  value: string;
};

const labels = {
  cancel: '取消',
  confirm: '确定',
  selectDate: '选择日期'
};

const DEFAULT_MIN_DATE = '1900-01-01';

function getYearMonthDay(value: string) {
  const date = getLocalDateFromString(value) ?? getLocalDateFromString(DEFAULT_MIN_DATE)!;

  return {
    day: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear()
  };
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function clampDateString(value: string, minDate: string, maxDate: string) {
  if (value < minDate) {
    return minDate;
  }

  if (value > maxDate) {
    return maxDate;
  }

  return value;
}

function getDraftDateString(year: number, month: number, day: number) {
  const safeDay = Math.min(day, getDaysInMonth(year, month));

  return getDateString(new Date(year, month - 1, safeDay));
}

export function AppDateField({
  error = false,
  formatValue,
  helperText,
  label,
  maxDate,
  minDate = DEFAULT_MIN_DATE,
  onChange,
  value
}: AppDateFieldProps) {
  const { colors: themeColors } = useAppTheme();
  const safeMaxDate = getLocalDateFromString(maxDate) ? maxDate : getDateString(new Date());
  const safeMinDate =
    getLocalDateFromString(minDate) && minDate <= safeMaxDate ? minDate : DEFAULT_MIN_DATE;
  const initialValue = clampDateString(
    getLocalDateFromString(value) ? value : safeMaxDate,
    safeMinDate,
    safeMaxDate
  );
  const initialParts = getYearMonthDay(initialValue);
  const [visible, setVisible] = useState(false);
  const [draftYear, setDraftYear] = useState(initialParts.year);
  const [draftMonth, setDraftMonth] = useState(initialParts.month);
  const [draftDay, setDraftDay] = useState(initialParts.day);
  const minYear = getYearMonthDay(safeMinDate).year;
  const maxYear = getYearMonthDay(safeMaxDate).year;
  const displayValue = formatValue ? formatValue(value) : value;

  function setDraftFromDateString(nextDateString: string) {
    const nextParts = getYearMonthDay(clampDateString(nextDateString, safeMinDate, safeMaxDate));

    setDraftYear(nextParts.year);
    setDraftMonth(nextParts.month);
    setDraftDay(nextParts.day);
  }

  function openPicker() {
    setDraftFromDateString(value);
    setVisible(true);
  }

  function changeYear(nextYear: number) {
    setDraftFromDateString(getDraftDateString(nextYear, draftMonth, draftDay));
  }

  function changeMonth(nextMonth: number) {
    setDraftFromDateString(getDraftDateString(draftYear, nextMonth, draftDay));
  }

  function changeDay(nextDay: number) {
    setDraftFromDateString(getDraftDateString(draftYear, draftMonth, nextDay));
  }

  function confirmDate() {
    const nextDateString = clampDateString(
      getDraftDateString(draftYear, draftMonth, draftDay),
      safeMinDate,
      safeMaxDate
    );

    onChange(nextDateString);
    setVisible(false);
  }

  const canGoPreviousYear = draftYear > minYear;
  const canGoNextYear = draftYear < maxYear;

  return (
    <>
      <Pressable
        onPress={openPicker}
        style={[
          styles.field,
          {
            backgroundColor: themeColors.inputBackground,
            borderColor: error ? themeColors.danger : themeColors.inputBorder
          }
        ]}
      >
        <View style={styles.fieldTextWrap}>
          <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>{label}</Text>
          <Text variant="titleSmall" style={[styles.fieldValue, { color: themeColors.text }]} numberOfLines={1}>
            {displayValue}
          </Text>
        </View>
        <MaterialCommunityIcons name="calendar-month-outline" color={themeColors.primary} size={20} />
      </Pressable>
      {helperText ? (
        <Text style={[styles.helperText, { color: error ? themeColors.danger : themeColors.textSecondary }]}>
          {helperText}
        </Text>
      ) : null}

      <Modal animationType="slide" onRequestClose={() => setVisible(false)} transparent visible={visible}>
        <View style={styles.modalOverlay}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setVisible(false)}
            style={[StyleSheet.absoluteFill, { backgroundColor: themeColors.overlay }]}
          />
          <View style={[styles.sheet, { backgroundColor: themeColors.surfaceElevated }]}>
            <View style={[styles.sheetHandle, { backgroundColor: themeColors.textSecondary }]} />
            <Text variant="titleMedium" style={[styles.sheetTitle, { color: themeColors.text }]}>
              {labels.selectDate}
            </Text>
            <View style={styles.yearControl}>
              <Pressable
                disabled={!canGoPreviousYear}
                onPress={() => changeYear(draftYear - 1)}
                style={[
                  styles.yearButton,
                  { backgroundColor: themeColors.card },
                  !canGoPreviousYear && styles.disabledOption
                ]}
              >
                <MaterialCommunityIcons
                  name="chevron-left"
                  color={canGoPreviousYear ? themeColors.text : themeColors.textSecondary}
                  size={22}
                />
              </Pressable>
              <Text variant="headlineSmall" style={[styles.yearText, { color: themeColors.text }]}>
                {draftYear}年
              </Text>
              <Pressable
                disabled={!canGoNextYear}
                onPress={() => changeYear(draftYear + 1)}
                style={[
                  styles.yearButton,
                  { backgroundColor: themeColors.card },
                  !canGoNextYear && styles.disabledOption
                ]}
              >
                <MaterialCommunityIcons
                  name="chevron-right"
                  color={canGoNextYear ? themeColors.text : themeColors.textSecondary}
                  size={22}
                />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetBody}>
              <View style={styles.optionGrid}>
                {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => {
                  const monthStart = getDateString(new Date(draftYear, month - 1, 1));
                  const monthEnd = getDateString(new Date(draftYear, month, 0));
                  const isDisabled = monthEnd < safeMinDate || monthStart > safeMaxDate;

                  return (
                    <ChoiceButton
                      key={month}
                      active={draftMonth === month}
                      disabled={isDisabled}
                      label={`${month}月`}
                      onPress={() => changeMonth(month)}
                    />
                  );
                })}
              </View>

              <View style={styles.dayGrid}>
                {Array.from({ length: getDaysInMonth(draftYear, draftMonth) }, (_, index) => index + 1).map(
                  (day) => {
                    const dayString = getDraftDateString(draftYear, draftMonth, day);
                    const isDisabled = dayString < safeMinDate || dayString > safeMaxDate;

                    return (
                      <ChoiceButton
                        key={day}
                        active={draftDay === day}
                        disabled={isDisabled}
                        label={String(day)}
                        onPress={() => changeDay(day)}
                      />
                    );
                  }
                )}
              </View>
            </ScrollView>

            <View style={styles.sheetActions}>
              <Pressable onPress={() => setVisible(false)} style={[styles.secondaryAction, { backgroundColor: themeColors.card }]}>
                <Text style={[styles.secondaryActionText, { color: themeColors.text }]}>{labels.cancel}</Text>
              </Pressable>
              <Pressable onPress={confirmDate} style={[styles.primaryAction, { backgroundColor: themeColors.primary }]}>
                <Text style={[styles.primaryActionText, { color: themeColors.background }]}>{labels.confirm}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function ChoiceButton({
  active,
  disabled = false,
  label,
  onPress
}: {
  active: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  const { colors: themeColors } = useAppTheme();

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.choiceButton,
        { backgroundColor: active ? themeColors.primary : themeColors.card },
        disabled && styles.disabledOption
      ]}
    >
      <Text
        style={[
          styles.choiceText,
          { color: active ? themeColors.background : themeColors.textSecondary }
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  fieldTextWrap: {
    flex: 1,
    marginRight: spacing.sm
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800'
  },
  fieldValue: {
    fontWeight: '900',
    marginTop: 2
  },
  helperText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '86%',
    padding: spacing.lg
  },
  sheetHandle: {
    alignSelf: 'center',
    borderRadius: radius.full,
    height: 4,
    marginBottom: spacing.lg,
    opacity: 0.45,
    width: 56
  },
  sheetTitle: {
    fontWeight: '900',
    marginBottom: spacing.md
  },
  yearControl: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  yearButton: {
    alignItems: 'center',
    borderRadius: radius.full,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  disabledOption: {
    opacity: 0.38
  },
  yearText: {
    fontWeight: '900'
  },
  sheetBody: {
    flexGrow: 0
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  choiceButton: {
    alignItems: 'center',
    borderRadius: radius.lg,
    flexBasis: '21%',
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: spacing.sm
  },
  choiceText: {
    fontSize: 13,
    fontWeight: '800'
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg
  },
  primaryAction: {
    alignItems: 'center',
    borderRadius: radius.lg,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48
  },
  primaryActionText: {
    fontWeight: '900'
  },
  secondaryAction: {
    alignItems: 'center',
    borderRadius: radius.lg,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48
  },
  secondaryActionText: {
    fontWeight: '900'
  }
});
