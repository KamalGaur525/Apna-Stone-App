import { GUEST_ENDPOINTS } from "@/constants/api";
import api from "./api";

// ── Home ─────────────────────────────────────────────
export const getGuestHome = async (city?: string) => {
  const res = await api.get(GUEST_ENDPOINTS.HOME, {
    params: city ? { city } : {},
  });
  return res.data;
};
// ── Search ───────────────────────────────────────────
export const searchFirms = async (query: string) => {
  const res = await api.get(GUEST_ENDPOINTS.SEARCH, {
    params: { q: query },
  });
  return res.data;
};

// ── Firm Detail ──────────────────────────────────────
export const getFirmDetail = async (id: number) => {
  const res = await api.get(`${GUEST_ENDPOINTS.FIRM_DETAIL}/${id}`);
  return res.data;
};
 
export const getAllFirms = async (page: number = 1, city?: string) => {
  const res = await api.get("/guest/firms", {
    params: { page, ...(city ? { city } : {}) },
  });
  return res.data;
};
// ── Category Products ────────────────────────────────
export const getCategoryProducts = async (
  id: number,
  page: number = 1
) => {
  const res = await api.get(`${GUEST_ENDPOINTS.CATEGORY_PRODUCTS}/${id}`, {
    params: { page },
  });
  return res.data;
};

// ── All Products (Marketplace) ───────────────────────
export const getMarketplaceProducts = async (params: { 
  page: number; 
  limit: number; 
  search?: string;
  category_id?: number;
  sub_category?: string;
  location?: string;
}) => {
  const res = await api.get("/products", { params });
  return res.data;
};

// ── Single Product Detail ────────────────────────────
export const getProductDetails = async (id: number) => {
  const res = await api.get(`/products/${id}`);
  return res.data;
};