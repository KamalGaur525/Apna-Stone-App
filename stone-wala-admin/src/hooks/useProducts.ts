import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import axiosInstance from '../lib/axios';
import { API } from '../constants/api';
import type { Product, ApiResponse } from '../types';

interface HookError {
  message: string;
  status?: number;
}

interface ActionResult {
  success: boolean;
  message?: string;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefetching, setIsRefetching] = useState<boolean>(false);
  const [error, setError] = useState<HookError | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const hasFetchedRef = useRef(false);

  const fetchProducts = useCallback(async (signal?: AbortSignal) => {
    !hasFetchedRef.current ? setIsLoading(true) : setIsRefetching(true);
    setError(null);

    try {
      const response = await axiosInstance.get<ApiResponse<Product[]>>(
        API.PRODUCTS_REVIEW,
        { signal }
      );

      if (response.data.success) {
        setProducts(response.data.data);
        hasFetchedRef.current = true;
      } else {
        setError({ message: response.data.message || 'Failed to fetch products.' });
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.code === 'ERR_CANCELED') return;
        setError({
          message: err.response?.data?.message || err.message,
          status: err.response?.status,
        });
      } else {
        setError({ message: 'An unexpected error occurred.' });
      }
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  }, []);

  const markProcessing = (id: number, processing: boolean) => {
    setProcessingIds((prev) => {
      const next = new Set(prev);
      processing ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const approveProduct = useCallback(async (id: number): Promise<ActionResult> => {
    markProcessing(id, true);
    try {
      const response = await axiosInstance.patch(API.PRODUCT_APPROVE(id));
      if (response.data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        return { success: true };
      }
      return { success: false, message: response.data.message || 'Approval failed.' };
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return { success: false, message: err.response?.data?.message || err.message };
      }
      return { success: false, message: 'An unexpected error occurred.' };
    } finally {
      markProcessing(id, false);
    }
  }, []);

  const rejectProduct = useCallback(async (id: number, reason: string): Promise<ActionResult> => {
    markProcessing(id, true);
    try {
      const response = await axiosInstance.patch(API.PRODUCT_REJECT(id), { reason });
      if (response.data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        return { success: true };
      }
      return { success: false, message: response.data.message || 'Rejection failed.' };
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return { success: false, message: err.response?.data?.message || err.message };
      }
      return { success: false, message: 'An unexpected error occurred.' };
    } finally {
      markProcessing(id, false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal);
    return () => controller.abort();
  }, [fetchProducts]);

  const refetch = useCallback(() => fetchProducts(), [fetchProducts]);
  const isProcessing = useCallback((id: number) => processingIds.has(id), [processingIds]);

  return {
    products,
    isLoading,
    isRefetching,
    error,
    refetch,
    approveProduct,
    rejectProduct,
    isProcessing,
  };
}