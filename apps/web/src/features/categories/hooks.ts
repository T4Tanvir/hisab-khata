import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useDefaultNameLocalizer } from '@/lib/default-names';
import { getCategories, createCategory, updateCategory, deleteCategory } from './api';
import type { CreateCategoryInput, UpdateCategoryInput, CategoryType } from '@hisab/shared';

export const CATEGORIES_QUERY_KEY = ['categories'] as const;

export function useCategories(type?: CategoryType) {
  const localize = useDefaultNameLocalizer();
  return useQuery({
    select: localize,
    queryKey: [...CATEGORIES_QUERY_KEY, type],
    queryFn: () => getCategories(type),
  });
}

// Category name/colour is embedded in transactions, budgets, recurring rules and reports
function invalidateCategoryConsumers(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ['transactions'] });
  qc.invalidateQueries({ queryKey: ['budgets'] });
  qc.invalidateQueries({ queryKey: ['recurring'] });
  qc.invalidateQueries({ queryKey: ['reports'] });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryInput) => createCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryInput }) =>
      updateCategory(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      invalidateCategoryConsumers(qc);
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      invalidateCategoryConsumers(qc);
    },
  });
}
