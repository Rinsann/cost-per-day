import { ExpenseCategoryIcon, ManagedExpenseCategory } from '@/constants/expenseCategories';
import {
  getExpenseCategories,
  saveExpenseCategories
} from '@/storage/expenseCategoryStorage';
import { ExpenseRecordType } from '@/types/expense';

export type ExpenseCategoryInput = {
  icon: ExpenseCategoryIcon;
  label: string;
  type: ExpenseRecordType;
};

export type ExpenseCategoryPatch = Partial<Pick<ExpenseCategoryInput, 'icon' | 'label'>>;

function createCategoryId(type: ExpenseRecordType) {
  return `category-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeLabel(label: string) {
  return label.trim();
}

export const expenseCategoryRepository = {
  async getAllCategories() {
    return getExpenseCategories();
  },

  async createCategory(input: ExpenseCategoryInput) {
    const categories = await getExpenseCategories();
    const category: ManagedExpenseCategory = {
      id: createCategoryId(input.type),
      icon: input.icon,
      label: normalizeLabel(input.label),
      type: input.type
    };
    const nextCategories = [...categories, category];

    await saveExpenseCategories(nextCategories);

    return category;
  },

  async updateCategory(id: string, patch: ExpenseCategoryPatch) {
    const categories = await getExpenseCategories();
    let updatedCategory: ManagedExpenseCategory | null = null;

    const nextCategories = categories.map((category) => {
      if (category.id !== id) {
        return category;
      }

      updatedCategory = {
        ...category,
        ...patch,
        id: category.id,
        label: patch.label === undefined ? category.label : normalizeLabel(patch.label),
        type: category.type
      };

      return updatedCategory;
    });

    if (!updatedCategory) {
      return null;
    }

    await saveExpenseCategories(nextCategories);

    return updatedCategory;
  }
};
