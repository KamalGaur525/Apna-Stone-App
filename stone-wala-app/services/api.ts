import { API_CONFIG } from "@/constants/api";
import { useAuthStore } from "@/store/authStore";
import { clearStorage } from "@/utils/storage";
import axios, { AxiosInstance } from "axios";

const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request Interceptor ─────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    // getToken import from storage
    const { getToken } = await import("@/utils/storage");
    const token = await getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Network error — no response at all
    if (!error.response) {
      if (__DEV__) console.warn("[API] Network error or server unreachable");
      return Promise.reject(error);
    }

    const status = error.response.status;

    if (status === 401) {
      // Clear both token + role
      await clearStorage();
      // Reset auth store
      useAuthStore.getState().logout();
      if (__DEV__) console.warn("[API] Unauthorized. Cleared storage.");
    }

    if (status === 500) {
      if (__DEV__) console.warn("[API] Server error. Please try again later.");
    }

    return Promise.reject(error);
  }
);

export default api;