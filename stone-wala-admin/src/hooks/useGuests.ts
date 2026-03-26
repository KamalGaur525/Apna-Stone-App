import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import axiosInstance from '../lib/axios';
import { API } from '../constants/api';
import type { Guest, ApiResponse, HookError, ActionResult } from '../types';

export function useGuests() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefetching, setIsRefetching] = useState<boolean>(false);
  const [error, setError] = useState<HookError | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const hasFetchedRef = useRef(false);

  const fetchGuests = useCallback(async (signal?: AbortSignal) => {
    !hasFetchedRef.current ? setIsLoading(true) : setIsRefetching(true);
    setError(null);
    try {
      const response = await axiosInstance.get<ApiResponse<Guest[]>>(
        API.GUESTS,
        { signal }
      );
      if (response.data.success) {
        setGuests(response.data.data);
        hasFetchedRef.current = true;
      } else {
        setError({ message: response.data.message || 'Failed to fetch guests.' });
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

  const toggleGuestStatus = useCallback(
    async (id: number, isCurrentlyActive: boolean): Promise<ActionResult> => {
      markProcessing(id, true);
      const endpoint = isCurrentlyActive ? API.GUEST_BLOCK(id) : API.GUEST_UNBLOCK(id);
      try {
        const response = await axiosInstance.patch(endpoint);
        if (response.data.success) {
          setGuests((prev) =>
            prev.map((g) => (g.id === id ? { ...g, is_active: !isCurrentlyActive } : g))
          );
          return { success: true };
        }
        return { success: false, message: response.data.message || 'Update failed.' };
      } catch (err) {
        if (axios.isAxiosError(err)) {
          return { success: false, message: err.response?.data?.message || err.message };
        }
        if (err instanceof Error) return { success: false, message: err.message };
        return { success: false, message: 'An unexpected error occurred.' };
      } finally {
        markProcessing(id, false);
      }
    },
    [markProcessing]
  );

  const approvePayment = useCallback(
    async (id: number): Promise<ActionResult> => {
      markProcessing(id, true);
      try {
        const response = await axiosInstance.patch(API.GUEST_PAYMENT_APPROVE(id));
        if (response.data.success) {
          const updatedGuest = response.data.data;
          setGuests((prev) =>
            prev.map((g) =>
              g.id === id
                ? updatedGuest
                  ? { ...g, ...updatedGuest }
                  : { ...g, payment_status: 'completed' }
                : g
            )
          );
          return { success: true };
        }
        return { success: false, message: response.data.message || 'Payment approval failed.' };
      } catch (err) {
        if (axios.isAxiosError(err)) {
          return { success: false, message: err.response?.data?.message || err.message };
        }
        if (err instanceof Error) return { success: false, message: err.message };
        return { success: false, message: 'An unexpected error occurred.' };
      } finally {
        markProcessing(id, false);
      }
    },
    [markProcessing]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchGuests(controller.signal);
    return () => controller.abort();
  }, [fetchGuests]);

  const refetch = useCallback(() => fetchGuests(), [fetchGuests]);
  const isProcessing = useCallback((id: number) => processingIds.has(id), [processingIds]);

  return {
    guests,
    isLoading,
    isRefetching,
    error,
    refetch,
    toggleGuestStatus,
    approvePayment,
    isProcessing,
  };
}