import { useState, useCallback, useEffect } from 'react';
import axiosInstance from '../lib/axios';
import { API } from '../constants/api';
import type { Category } from '../pages/Categories';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetching all categories (Main + Sub) together
      const res = await axiosInstance.get(API.CATEGORIES);
      setCategories(res.data.data || []);
    } catch (err: any) {
      setError(new Error(err.response?.data?.error || 'Failed to fetch categories'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Add: takes name and optional parent_id
  const addCategory = async (payload: { name: string; parent_id?: number | null }) => {
    try {
      const res = await axiosInstance.post(API.CATEGORY_CREATE, payload);
      await fetchCategories();
      return { success: true, data: res.data };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.error || 'Failed to add category' };
    }
  };

  // Update: only takes name (as per your backend PATCH controller)
  const updateCategory = async (id: number, payload: { name: string }) => {
    try {
      const res = await axiosInstance.patch(API.CATEGORY_UPDATE(id), payload);
      await fetchCategories();
      return { success: true, data: res.data };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.error || 'Failed to update category' };
    }
  };

  const deleteCategory = async (id: number) => {
    setProcessingIds((prev) => new Set(prev).add(id));
    try {
      const res = await axiosInstance.delete(API.CATEGORY_DELETE(id));
      await fetchCategories();
      return { success: true, data: res.data };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.error || 'Failed to delete category' };
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return { categories, isLoading, error, refetch: fetchCategories, addCategory, updateCategory, deleteCategory, isProcessing: (id: number) => processingIds.has(id) };
}