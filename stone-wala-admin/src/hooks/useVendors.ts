import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import axiosInstance from '../lib/axios';
import { API } from '../constants/api';
import type { Vendor, ApiResponse, HookError, ActionResult } from '../types';

export function useVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefetching, setIsRefetching] = useState<boolean>(false);
  const [error, setError] = useState<HookError | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const hasFetchedRef = useRef(false);

  const fetchVendors = useCallback(async (signal?: AbortSignal) => {
    !hasFetchedRef.current ? setIsLoading(true) : setIsRefetching(true);
    setError(null);
    try {
      const response = await axiosInstance.get<ApiResponse<Vendor[]>>(
        API.VENDORS,
        { signal }
      );
      if (response.data.success) {
        setVendors(response.data.data);
        hasFetchedRef.current = true;
      } else {
        setError({ message: response.data.message || 'Failed to fetch vendors.' });
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

  const markProcessing = useCallback((id: number, processing: boolean) => {
    setProcessingIds((prev) => {
      const next = new Set(prev);
      processing ? next.add(id) : next.delete(id);
      return next;
    });
  }, []);

  const toggleVendorStatus = useCallback(
    async (id: number, isCurrentlyActive: boolean): Promise<ActionResult> => {
      markProcessing(id, true);
      const endpoint = isCurrentlyActive ? API.VENDOR_BLOCK(id) : API.VENDOR_UNBLOCK(id);
      try {
        const response = await axiosInstance.patch(endpoint);
        if (response.data.success) {
          setVendors((prev) =>
            prev.map((v) => (v.id === id ? { ...v, is_active: !isCurrentlyActive } : v))
          );
          return { success: true };
        }
        return { success: false, message: response.data.message || 'Update failed.' };
      } catch (err) {
        if (axios.isAxiosError(err)) {
          return { success: false, message: err.response?.data?.message || err.message };
        }
        if (err instanceof Error) {
          return { success: false, message: err.message };
        }
        return { success: false, message: 'An unexpected error occurred.' };
      } finally {
        markProcessing(id, false);
      }
    },
    [markProcessing]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchVendors(controller.signal);
    return () => controller.abort();
  }, [fetchVendors]);

  const refetch = useCallback(() => fetchVendors(), [fetchVendors]);
  const isProcessing = useCallback((id: number) => processingIds.has(id), [processingIds]);

  return {
    vendors,
    isLoading,
    isRefetching,
    error,
    refetch,
    toggleVendorStatus,
    isProcessing,
  };
}