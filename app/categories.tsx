import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';

import { AppScreen } from '@/components/layout/AppScreen';
import { AppCard } from '@/components/ui/AppCard';
import {
  categoryIconOptions,
  ExpenseCategoryIcon,
  ManagedExpenseCategory
} from '@/constants/expenseCategories';
import { useAppTheme } from '@/context/AppThemeContext';
import { useExpenseCategories } from '@/context/ExpenseCategoriesContext';
import { ledgerRepository } from '@/repositories/ledgerRepository';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { ExpenseRecordType } from '@/types/expense';

type CategoryDraft = {
  categoryId?: string;
  icon: ExpenseCategoryIcon;
  label: string;
  mode: 'create' | 'edit';
  originalLabel?: string;
  type: ExpenseRecordType;
};

const labels = {
  title: '分类管理',
  expenseSection: '支出分类',
  incomeSection: '收入分类',
  add: '新增',
  edit: '编辑分类',
  addExpense: '新增支出分类',
  addIncome: '新增收入分类',
  name: '分类名称',
  icon: '分类图标',
  cancel: '取消',
  save: '保存',
  saving: '保存中...',
  emptyNameTitle: '名称不能为空',
  emptyNameDescription: '请输入分类名称。',
  duplicateTitle: '分类已存在',
  duplicateDescription: '同一类型下不能使用重复的分类名称。',
  saveFailedTitle: '保存失败',
  saveFailedDescription: '请稍后再试。'
};

const defaultIconByType: Record<ExpenseRecordType, ExpenseCategoryIcon> = {
  expense: 'ticket-percent-outline',
  income: 'cash'
};

function getAddTitle(type: ExpenseRecordType) {
  return type === 'expense' ? labels.addExpense : labels.addIncome;
}

export default function CategoriesScreen() {
  const { colors: themeColors } = useAppTheme();
  const {
    addCategory,
    categories,
    expenseCategories,
    incomeCategories,
    updateCategory
  } = useExpenseCategories();
  const [draft, setDraft] = useState<CategoryDraft | null>(null);
  const [saving, setSaving] = useState(false);

  const categoryGroups = useMemo(
    () => [
      {
        categories: expenseCategories,
        title: labels.expenseSection,
        type: 'expense' as const
      },
      {
        categories: incomeCategories,
        title: labels.incomeSection,
        type: 'income' as const
      }
    ],
    [expenseCategories, incomeCategories]
  );

  function openCreateSheet(type: ExpenseRecordType) {
    setDraft({
      icon: defaultIconByType[type],
      label: '',
      mode: 'create',
      type
    });
  }

  function openEditSheet(category: ManagedExpenseCategory) {
    setDraft({
      categoryId: category.id,
      icon: category.icon,
      label: category.label,
      mode: 'edit',
      originalLabel: category.label,
      type: category.type
    });
  }

  function closeSheet() {
    if (!saving) {
      setDraft(null);
    }
  }

  function hasDuplicateLabel(type: ExpenseRecordType, label: string, categoryId?: string) {
    return categories.some(
      (category) =>
        category.type === type &&
        category.id !== categoryId &&
        category.label.trim() === label
    );
  }

  async function saveDraft() {
    if (!draft) {
      return;
    }

    const nextLabel = draft.label.trim();

    if (!nextLabel) {
      Alert.alert(labels.emptyNameTitle, labels.emptyNameDescription);
      return;
    }

    if (hasDuplicateLabel(draft.type, nextLabel, draft.categoryId)) {
      Alert.alert(labels.duplicateTitle, labels.duplicateDescription);
      return;
    }

    setSaving(true);

    try {
      if (draft.mode === 'create') {
        await addCategory({
          icon: draft.icon,
          label: nextLabel,
          type: draft.type
        });
      } else if (draft.categoryId) {
        await updateCategory(draft.categoryId, {
          icon: draft.icon,
          label: nextLabel
        });

        if (draft.originalLabel && draft.originalLabel !== nextLabel) {
          await ledgerRepository.renameCategory(draft.type, draft.originalLabel, nextLabel);
        }
      }

      setDraft(null);
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

      {categoryGroups.map((group) => (
        <AppCard key={group.type} style={styles.sectionCard}>
          <Card.Content style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text }]}>
                {group.title}
              </Text>
              <Pressable
                onPress={() => openCreateSheet(group.type)}
                style={({ pressed }) => [
                  styles.addButton,
                  { backgroundColor: pressed ? themeColors.surfacePressed : themeColors.primary }
                ]}
              >
                <MaterialCommunityIcons name="plus" color={themeColors.background} size={18} />
                <Text style={[styles.addButtonText, { color: themeColors.background }]}>
                  {labels.add}
                </Text>
              </Pressable>
            </View>

            <View style={styles.categoryList}>
              {group.categories.map((category) => (
                <Pressable
                  key={category.id}
                  onPress={() => openEditSheet(category)}
                  android_ripple={{ color: themeColors.ripple }}
                  style={({ pressed }) => [
                    styles.categoryRow,
                    { backgroundColor: pressed ? themeColors.surfacePressed : themeColors.cardAlt }
                  ]}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: themeColors.card }]}>
                    <MaterialCommunityIcons
                      name={category.icon}
                      color={group.type === 'expense' ? themeColors.expense : themeColors.income}
                      size={22}
                    />
                  </View>
                  <Text
                    variant="titleSmall"
                    numberOfLines={1}
                    style={[styles.categoryName, { color: themeColors.text }]}
                  >
                    {category.label}
                  </Text>
                  <MaterialCommunityIcons
                    name="pencil-outline"
                    color={themeColors.textSecondary}
                    size={20}
                  />
                </Pressable>
              ))}
            </View>
          </Card.Content>
        </AppCard>
      ))}

      <CategoryDraftSheet
        draft={draft}
        onCancel={closeSheet}
        onChange={setDraft}
        onSave={saveDraft}
        saving={saving}
      />
    </AppScreen>
  );
}

function CategoryDraftSheet({
  draft,
  onCancel,
  onChange,
  onSave,
  saving
}: {
  draft: CategoryDraft | null;
  onCancel: () => void;
  onChange: (draft: CategoryDraft) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const { colors: themeColors } = useAppTheme();

  if (!draft) {
    return null;
  }

  return (
    <Modal animationType="slide" onRequestClose={onCancel} transparent visible>
      <View style={styles.modalOverlay}>
        <Pressable
          accessibilityRole="button"
          onPress={onCancel}
          style={[StyleSheet.absoluteFill, { backgroundColor: themeColors.overlay }]}
        />
        <View style={[styles.sheet, { backgroundColor: themeColors.surfaceElevated }]}>
          <View style={[styles.sheetHandle, { backgroundColor: themeColors.textSecondary }]} />
          <Text variant="titleMedium" style={[styles.sheetTitle, { color: themeColors.text }]}>
            {draft.mode === 'create' ? getAddTitle(draft.type) : labels.edit}
          </Text>

          <TextInput
            label={labels.name}
            mode="outlined"
            value={draft.label}
            onChangeText={(label) => onChange({ ...draft, label })}
            style={[styles.nameInput, { backgroundColor: themeColors.card }]}
            textColor={themeColors.text}
            outlineColor={themeColors.border}
            activeOutlineColor={themeColors.primary}
            left={<TextInput.Icon icon={draft.icon} color={themeColors.primary} />}
          />

          <Text style={[styles.iconLabel, { color: themeColors.textSecondary }]}>
            {labels.icon}
          </Text>
          <ScrollView
            contentContainerStyle={styles.iconGrid}
            horizontal={false}
            showsVerticalScrollIndicator={false}
            style={styles.iconScroll}
          >
            {categoryIconOptions.map((icon) => {
              const active = draft.icon === icon;

              return (
                <Pressable
                  key={icon}
                  onPress={() => onChange({ ...draft, icon })}
                  style={[
                    styles.iconOption,
                    {
                      backgroundColor: active ? themeColors.primary : themeColors.card,
                      borderColor: active ? themeColors.primary : themeColors.border
                    }
                  ]}
                >
                  <MaterialCommunityIcons
                    name={icon}
                    color={active ? themeColors.background : themeColors.textSecondary}
                    size={22}
                  />
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.sheetActions}>
            <Button mode="text" disabled={saving} onPress={onCancel} textColor={themeColors.text}>
              {labels.cancel}
            </Button>
            <Button
              mode="contained"
              loading={saving}
              disabled={saving}
              onPress={onSave}
              buttonColor={themeColors.primary}
              textColor={themeColors.background}
              style={styles.saveButton}
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
  title: {
    color: colors.text,
    fontWeight: '900',
    marginBottom: spacing.lg
  },
  sectionCard: {
    marginBottom: spacing.md
  },
  sectionContent: {
    gap: spacing.md
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between'
  },
  sectionTitle: {
    color: colors.text,
    flex: 1,
    fontWeight: '900'
  },
  addButton: {
    alignItems: 'center',
    borderRadius: radius.full,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 36,
    paddingHorizontal: spacing.md
  },
  addButtonText: {
    color: colors.background,
    fontWeight: '900'
  },
  categoryList: {
    gap: spacing.sm
  },
  categoryRow: {
    alignItems: 'center',
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 58,
    overflow: 'hidden',
    paddingHorizontal: spacing.md
  },
  categoryIcon: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.full,
    height: 38,
    justifyContent: 'center',
    width: 38
  },
  categoryName: {
    color: colors.text,
    flex: 1,
    fontWeight: '900'
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  sheet: {
    backgroundColor: colors.surfaceElevated,
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
    opacity: 0.5,
    width: 56
  },
  sheetTitle: {
    color: colors.text,
    fontWeight: '900',
    marginBottom: spacing.md
  },
  nameInput: {
    backgroundColor: colors.card
  },
  iconLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: spacing.sm,
    marginTop: spacing.md
  },
  iconScroll: {
    flexGrow: 0,
    maxHeight: 188
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingBottom: spacing.xs
  },
  iconOption: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  sheetActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
    marginTop: spacing.lg
  },
  saveButton: {
    borderRadius: radius.lg,
    minWidth: 108
  }
});
