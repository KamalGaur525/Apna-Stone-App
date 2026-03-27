import { useState, useCallback, useEffect } from 'react';
import axiosInstance from '../lib/axios';
import { API } from '../constants/api';

export interface ServiceType {
  id: number;
  name: string;
}

export interface ServiceProvider {
  id: number;
  name: string;
  phone: string;
  photo_url: string | null;
  description: string | null;
}

export interface GroupedService {
  type_id: number;
  type_name: string;
  providers: ServiceProvider[];
}

export function useServices() {
  const [types, setTypes] = useState<ServiceType[]>([]);
  const [groupedProviders, setGroupedProviders] = useState<GroupedService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<number | string>>(new Set());

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [typesRes, providersRes] = await Promise.all([
        axiosInstance.get(API.SERVICE_TYPES),
        axiosInstance.get(API.SERVICE_PROVIDERS),
      ]);
      setTypes(typesRes.data.data || []);
      setGroupedProviders(providersRes.data.data || []);
    } catch (err: any) {
      setError(new Error(err.response?.data?.error || 'Failed to fetch services'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Types Actions ---
  const addServiceType = async (name: string) => {
    try {
      const res = await axiosInstance.post(API.SERVICE_TYPE_CREATE, { name });
      await fetchData();
      return { success: true, data: res.data };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.error || 'Failed to add type' };
    }
  };

  const deleteServiceType = async (id: number) => {
    setProcessingIds((prev) => new Set(prev).add(`type-${id}`));
    try {
      const res = await axiosInstance.delete(API.SERVICE_TYPE_DELETE(id));
      await fetchData();
      return { success: true, data: res.data };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.error || 'Failed to delete type' };
    } finally {
      setProcessingIds((prev) => { const next = new Set(prev); next.delete(`type-${id}`); return next; });
    }
  };

  // --- Providers Actions ---
  const addProvider = async (formData: FormData) => {
    try {
      // NOTE: Axios handles multipart/form-data automatically if you pass a FormData object
      const res = await axiosInstance.post(API.SERVICE_PROVIDER_CREATE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchData();
      return { success: true, data: res.data };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.error || 'Failed to add provider' };
    }
  };

  const updateProvider = async (id: number, formData: FormData) => {
    try {
      const res = await axiosInstance.patch(API.SERVICE_PROVIDER_UPDATE(id), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchData();
      return { success: true, data: res.data };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.error || 'Failed to update provider' };
    }
  };

  const deleteProvider = async (id: number) => {
    setProcessingIds((prev) => new Set(prev).add(`prov-${id}`));
    try {
      const res = await axiosInstance.delete(API.SERVICE_PROVIDER_DELETE(id));
      await fetchData();
      return { success: true, data: res.data };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.error || 'Failed to delete provider' };
    } finally {
      setProcessingIds((prev) => { const next = new Set(prev); next.delete(`prov-${id}`); return next; });
    }
  };

  return {
    types,
    groupedProviders,
    isLoading,
    error,
    refetch: fetchData,
    addServiceType,
    deleteServiceType,
    addProvider,
    updateProvider,
    deleteProvider,
    isProcessing: (key: string | number) => processingIds.has(key),
  };
}