import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import axiosInstance from '../lib/axios';
import { API } from '../constants/api';
import type { DashboardStats, ApiResponse } from '../types';

interface HookError {
  message: string;
  status?: number;
}

export function useDashboard() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefetching, setIsRefetching] = useState<boolean>(false);
  const [error, setError] = useState<HookError | null>(null);

  const fetchStats = useCallback(async (signal?: AbortSignal) => {
    data === null ? setIsLoading(true) : setIsRefetching(true);
    setError(null);

    try {
      const response = await axiosInstance.get<ApiResponse<DashboardStats>>(
        API.DASHBOARD,
        { signal }
      );

      if (response.data.success) {
        setData(response.data.data);
      } else {
        setError({ message: response.data.message || 'Failed to load dashboard stats.' });
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.code === 'ERR_CANCELED') return;
        setError({
          message: err.response?.data?.message || err.message,
          status: err.response?.status,
        });
      } else if (err instanceof Error) {
        setError({ message: err.message });
      } else {
        setError({ message: 'An unexpected error occurred.' });
      }
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  }, [data]);

  useEffect(() => {
    const controller = new AbortController();
    fetchStats(controller.signal);
    return () => controller.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = useCallback(() => fetchStats(), [fetchStats]);

  return { data, isLoading, isRefetching, error, refetch };
}