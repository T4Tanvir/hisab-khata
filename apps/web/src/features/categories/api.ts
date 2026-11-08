import { api } from '@/lib/api-client';
import type { Category, CreateCategoryInput, UpdateCategoryInput, CategoryType } from '@hisab/shared';

export const getCategories = async (type?: CategoryType): Promise<Category[]> => {
  const query = type ? `?type=${type}` : '';
  const res = await api.get<{ data: Category[] }>(`/categories${query}`);
  return res.data;
};

export const createCategory = async (data: CreateCategoryInput): Promise<Category> => {
  const res = await api.post<{ data: Category }>('/categories', data);
  return res.data;
};

export const updateCategory = async (
  id: string,
  data: UpdateCategoryInput
): Promise<Category> => {
  const res = await api.patch<{ data: Category }>(`/categories/${id}`, data);
  return res.data;
};

export const deleteCategory = async (
  id: string
): Promise<{ success: boolean; archived: boolean; message: string }> => {
  const res = await api.delete<{
    data: { success: boolean; archived: boolean; message: string };
  }>(`/categories/${id}`);
  return res.data;
};
