import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  ExpenseCategoryIcon,
  getDefaultManagedExpenseCategories,
  getExpenseCategoryIcon,
  ManagedExpenseCategory
} from '@/constants/expenseCategories';
import {
  expenseCategoryRepository,
  ExpenseCategoryInput,
  ExpenseCategoryPatch
} from '@/repositories/expenseCategoryRepository';
import { ExpenseRecordType } from '@/types/expense';

type ExpenseCategoriesContextValue = {
  addCategory: (input: ExpenseCategoryInput) => Promise<ManagedExpenseCategory>;
  categories: ManagedExpenseCategory[];
  expenseCategories: ManagedExpenseCategory[];
  getCategoryIcon: (category: string, type: ExpenseRecordType) => ExpenseCategoryIcon;
  incomeCategories: ManagedExpenseCategory[];
  refreshCategories: () => Promise<void>;
  updateCategory: (
    id: string,
    patch: ExpenseCategoryPatch
  ) => Promise<ManagedExpenseCategory | null>;
};

const ExpenseCategoriesContext = createContext<ExpenseCategoriesContextValue | null>(null);

export function ExpenseCategoriesProvider({ children }: PropsWithChildren) {
  const [categories, setCategories] = useState<ManagedExpenseCategory[]>(
    getDefaultManagedExpenseCategories
  );

  const refreshCategories = useCallback(async () => {
    const storedCategories = await expenseCategoryRepository.getAllCategories();

    setCategories(storedCategories);
  }, []);

  const addCategory = useCallback(async (input: ExpenseCategoryInput) => {
    const category = await expenseCategoryRepository.createCategory(input);

    setCategories((currentCategories) => [...currentCategories, category]);

    return category;
  }, []);

  const updateCategory = useCallback(async (id: string, patch: ExpenseCategoryPatch) => {
    const category = await expenseCategoryRepository.updateCategory(id, patch);

    if (category) {
      setCategories((currentCategories) =>
        currentCategories.map((item) => (item.id === id ? category : item))
      );
    }

    return category;
  }, []);

  useEffect(() => {
    refreshCategories().catch(() => {
      setCategories(getDefaultManagedExpenseCategories());
    });
  }, [refreshCategories]);

  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type === 'expense'),
    [categories]
  );
  const incomeCategories = useMemo(
    () => categories.filter((category) => category.type === 'income'),
    [categories]
  );

  const getCategoryIcon = useCallback(
    (category: string, type: ExpenseRecordType) => {
      return getExpenseCategoryIcon(category, type, categories);
    },
    [categories]
  );

  const value = useMemo(
    () => ({
      addCategory,
      categories,
      expenseCategories,
      getCategoryIcon,
      incomeCategories,
      refreshCategories,
      updateCategory
    }),
    [
      addCategory,
      categories,
      expenseCategories,
      getCategoryIcon,
      incomeCategories,
      refreshCategories,
      updateCategory
    ]
  );

  return (
    <ExpenseCategoriesContext.Provider value={value}>
      {children}
    </ExpenseCategoriesContext.Provider>
  );
}

export function useExpenseCategories() {
  const context = useContext(ExpenseCategoriesContext);

  if (!context) {
    throw new Error('useExpenseCategories must be used inside ExpenseCategoriesProvider.');
  }

  return context;
}
