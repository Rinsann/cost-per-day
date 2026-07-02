import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View
} from 'react-native';
import { Card, Text } from 'react-native-paper';

import { AppScreen } from '@/components/layout/AppScreen';
import { AppCard } from '@/components/ui/AppCard';
import { useAppTheme } from '@/context/AppThemeContext';
import { useExpenseRecords } from '@/context/ExpenseRecordsContext';
import {
  DEFAULT_MONTHLY_BUDGET,
  getMonthlyBudget,
  MonthlyBudget,
  saveMonthlyBudget
} from '@/storage/monthlyBudgetStorage';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { calculateMonthlyBudgetStatus } from '@/utils/budget';
import { getMonthString, getRecordType } from '@/utils/expenseRecords';
import { formatCompactMoney } from '@/utils/formatMoney';

const labels = {
  title: '月度预算',
  status: '当前预算',
  enabled: '已启用',
  disabled: '未启用',
  budgetAmount: '本月预算',
  spent: '已支出',
  remaining: '剩余',
  over: '超出',
  used: '已用',
  settings: '预算设置',
  sheetTitle: '设置本月预算',
  amount: '本月预算金额',
  amountPlaceholder: '例如 3000',
  description: '预算只用于本月支出参考，不会影响账单记录。',
  zeroHint: '设置为 0 即可关闭预算。',
  save: '保存',
  saving: '保存中...',
  cancel: '关闭',
  saveFailedTitle: '保存失败',
  saveFailedDescription: '无法保存月度预算，请稍后再试。',
  loadFailedTitle: '读取失败',
  loadFailedDescription: '无法读取月度预算，已使用默认设置。',
  invalidAmountTitle: '金额无效',
  invalidAmountDescription: '预算金额不能为负数。'
};

function sanitizeMoneyInput(value: string) {
  const normalizedValue = value.replace(/[^\d.]/g, '');
  const [integerPart, ...decimalParts] = normalizedValue.split('.');
  const decimalPart = decimalParts.join('');

  return decimalParts.length > 0 ? `${integerPart}.${decimalPart}` : integerPart;
}

export default function BudgetSettingsScreen() {
  const { colors: themeColors } = useAppTheme();
  const { records, refreshRecords } = useExpenseRecords();
  const [budget, setBudget] = useState<MonthlyBudget>(DEFAULT_MONTHLY_BUDGET);
  const [draftAmountText, setDraftAmountText] = useState('');
  const [saving, setSaving] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const currentMonth = getMonthString(new Date());
  const monthlyExpense = useMemo(
    () =>
      records
        .filter((record) => record.date.startsWith(currentMonth) && getRecordType(record) === 'expense')
        .reduce((total, record) => total + record.amount, 0),
    [currentMonth, records]
  );
  const budgetEnabled = budget.enabled && budget.amount > 0;
  const budgetStatus = useMemo(
    () =>
      calculateMonthlyBudgetStatus({
        budgetAmount: budget.amount,
        monthlyExpense
      }),
    [budget.amount, monthlyExpense]
  );
  const statusColor = budgetStatus.isOverBudget ? themeColors.expense : themeColors.primary;

  const loadBudget = useCallback(async () => {
    try {
      const [nextBudget] = await Promise.all([getMonthlyBudget(), refreshRecords()]);

      setBudget(nextBudget);
    } catch {
      setBudget(DEFAULT_MONTHLY_BUDGET);
      Alert.alert(labels.loadFailedTitle, labels.loadFailedDescription);
    }
  }, [refreshRecords]);

  useFocusEffect(
    useCallback(() => {
      loadBudget();
    }, [loadBudget])
  );

  function openSettingsSheet() {
    setDraftAmountText(budget.amount > 0 ? String(budget.amount) : '');
    setSheetVisible(true);
  }

  function closeSettingsSheet() {
    Keyboard.dismiss();
    setSheetVisible(false);
  }

  async function saveBudget() {
    Keyboard.dismiss();

    const amount = draftAmountText.trim().length > 0 ? Number(draftAmountText) : 0;

    if (!Number.isFinite(amount) || amount < 0) {
      Alert.alert(labels.invalidAmountTitle, labels.invalidAmountDescription);
      return;
    }

    try {
      setSaving(true);
      const nextBudget = await saveMonthlyBudget({
        amount,
        enabled: amount > 0
      });

      setBudget(nextBudget);
      setDraftAmountText(nextBudget.amount > 0 ? String(nextBudget.amount) : '');
      setSheetVisible(false);
    } catch {
      Alert.alert(labels.saveFailedTitle, labels.saveFailedDescription);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppScreen bottomPadding={32}>
      <Stack.Screen options={{ title: labels.title }} />
      <Text variant="headlineSmall" style={[styles.title, { color: themeColors.text }]}>
        {labels.title}
      </Text>

      <AppCard style={styles.sectionCard}>
        <Card.Content style={styles.sectionContent}>
          <View style={styles.statusHeader}>
            <View>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text }]}>
                {labels.status}
              </Text>
              <Text style={[styles.description, { color: themeColors.textSecondary }]}>
                {budgetEnabled ? labels.enabled : labels.disabled}
              </Text>
            </View>
            <View
              style={[
                styles.statusIcon,
                { backgroundColor: budgetEnabled ? themeColors.primary : themeColors.cardAlt }
              ]}
            >
              <MaterialCommunityIcons
                name="wallet-outline"
                color={budgetEnabled ? themeColors.background : themeColors.textSecondary}
                size={22}
              />
            </View>
          </View>

          <View style={styles.mainMetric}>
            <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>
              {budgetStatus.isOverBudget ? labels.over : labels.remaining}
            </Text>
            <Text
              adjustsFontSizeToFit
              ellipsizeMode="tail"
              minimumFontScale={0.58}
              numberOfLines={1}
              variant="displaySmall"
              style={[styles.metricValue, { color: budgetEnabled ? statusColor : themeColors.text }]}
            >
              {budgetEnabled
                ? formatCompactMoney(
                    budgetStatus.isOverBudget
                      ? budgetStatus.overAmount
                      : budgetStatus.remainingAmount
                  )
                : formatCompactMoney(0)}
            </Text>
          </View>

          <View style={[styles.progressTrack, { backgroundColor: themeColors.outline }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: budgetStatus.isOverBudget
                    ? themeColors.expense
                    : themeColors.primary,
                  width: `${budgetEnabled ? Math.min(budgetStatus.usedPercent, 100) : 0}%`
                }
              ]}
            />
          </View>

          <View style={styles.statsGrid}>
            <BudgetInfo label={labels.budgetAmount} value={formatCompactMoney(budget.amount)} />
            <BudgetInfo label={labels.spent} value={formatCompactMoney(budgetStatus.usedAmount)} />
            <BudgetInfo label={labels.used} value={`${Math.round(budgetStatus.usedPercent)}%`} />
          </View>

          <View style={[styles.noteRow, { backgroundColor: themeColors.cardAlt }]}>
            <MaterialCommunityIcons
              name="information-outline"
              color={themeColors.textSecondary}
              size={18}
            />
            <Text style={[styles.noteText, { color: themeColors.textSecondary }]}>
              {labels.description}
            </Text>
          </View>

          <Pressable
            onPress={openSettingsSheet}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: themeColors.primary },
              pressed && styles.pressed
            ]}
          >
            <Text style={[styles.primaryButtonText, { color: themeColors.background }]}>
              {labels.settings}
            </Text>
          </Pressable>
        </Card.Content>
      </AppCard>

      <BudgetSettingsModal
        amountText={draftAmountText}
        onAmountChange={(value) => setDraftAmountText(sanitizeMoneyInput(value))}
        onClose={closeSettingsSheet}
        onSave={saveBudget}
        saving={saving}
        visible={sheetVisible}
      />
    </AppScreen>
  );
}

function BudgetInfo({ label, value }: { label: string; value: string }) {
  const { colors: themeColors } = useAppTheme();

  return (
    <View style={[styles.infoTile, { backgroundColor: themeColors.cardAlt }]}>
      <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
      <Text
        adjustsFontSizeToFit
        ellipsizeMode="tail"
        minimumFontScale={0.72}
        numberOfLines={1}
        style={[styles.infoValue, { color: themeColors.text }]}
      >
        {value}
      </Text>
    </View>
  );
}

function BudgetSettingsModal({
  amountText,
  onAmountChange,
  onClose,
  onSave,
  saving,
  visible
}: {
  amountText: string;
  onAmountChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  visible: boolean;
}) {
  const { colors: themeColors } = useAppTheme();
  const { height: screenHeight } = useWindowDimensions();
  const modalTopOffset = Math.max(84, Math.round(screenHeight * 0.18));
  const modalMaxHeight = Math.round(screenHeight * 0.4);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View
        style={[
          styles.modalOverlay,
          {
            backgroundColor: themeColors.overlay,
            paddingTop: modalTopOffset
          }
        ]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="box-none"
          style={styles.modalAvoiding}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: themeColors.surfaceElevated,
                maxHeight: modalMaxHeight
              }
            ]}
          >
            <ScrollView
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.sheetHeader}>
                <Text variant="titleMedium" style={[styles.sheetTitle, { color: themeColors.text }]}>
                  {labels.sheetTitle}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.closeButton,
                    { backgroundColor: pressed ? themeColors.surfacePressed : themeColors.cardAlt }
                  ]}
                >
                  <MaterialCommunityIcons name="close" color={themeColors.textSecondary} size={20} />
                </Pressable>
              </View>

              <View style={styles.inputBlock}>
                <View
                  style={[
                    styles.inputWrap,
                    { backgroundColor: themeColors.inputBackground, borderColor: themeColors.inputBorder }
                  ]}
                >
                  <Text style={[styles.currencySymbol, { color: themeColors.textSecondary }]}>￥</Text>
                  <TextInput
                    keyboardType="decimal-pad"
                    onChangeText={onAmountChange}
                    placeholder={labels.amountPlaceholder}
                    placeholderTextColor={themeColors.textMuted}
                    style={[styles.input, { color: themeColors.text }]}
                    value={amountText}
                  />
                  {amountText.length > 0 ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => onAmountChange('')}
                      style={styles.clearButton}
                    >
                      <MaterialCommunityIcons
                        name="close-circle"
                        color={themeColors.textSecondary}
                        size={18}
                      />
                    </Pressable>
                  ) : null}
                </View>
              </View>

              <Text style={[styles.sheetHint, { color: themeColors.textSecondary }]}>
                {labels.zeroHint}
              </Text>

              <Pressable
                disabled={saving}
                onPress={onSave}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: themeColors.primary },
                  (pressed || saving) && styles.pressed
                ]}
              >
                <Text style={[styles.primaryButtonText, { color: themeColors.background }]}>
                  {saving ? labels.saving : labels.save}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: '900',
    marginBottom: spacing.lg
  },
  sectionCard: {
    marginBottom: spacing.md
  },
  sectionContent: {
    gap: spacing.md
  },
  statusHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  sectionTitle: {
    fontWeight: '900'
  },
  description: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: spacing.xs
  },
  statusIcon: {
    alignItems: 'center',
    borderRadius: radius.full,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  mainMetric: {
    gap: spacing.xs
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '800'
  },
  metricValue: {
    fontWeight: '900',
    maxWidth: '100%'
  },
  progressTrack: {
    borderRadius: radius.full,
    height: 8,
    overflow: 'hidden'
  },
  progressFill: {
    borderRadius: radius.full,
    height: '100%'
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  infoTile: {
    borderRadius: radius.md,
    flex: 1,
    minWidth: 0,
    padding: spacing.sm
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '800'
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2
  },
  noteRow: {
    alignItems: 'center',
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: radius.lg,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  pressed: {
    opacity: 0.78
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '900'
  },
  modalAvoiding: {
    alignItems: 'center',
    width: '100%'
  },
  modalOverlay: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg
  },
  modalCard: {
    borderRadius: 28,
    maxWidth: 380,
    padding: 22,
    width: '100%'
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginBottom: spacing.xs
  },
  sheetTitle: {
    flex: 1,
    fontWeight: '900'
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: radius.full,
    height: 36,
    justifyContent: 'center',
    width: 36
  },
  sheetContent: {
    gap: spacing.md,
    paddingBottom: 2
  },
  inputBlock: {
    gap: spacing.xs
  },
  inputWrap: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 56,
    paddingHorizontal: spacing.md
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '900',
    marginRight: spacing.sm
  },
  input: {
    flex: 1,
    fontSize: 22,
    fontWeight: '900',
    minWidth: 0,
    paddingVertical: spacing.sm
  },
  clearButton: {
    padding: spacing.xs
  },
  sheetHint: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18
  }
});
