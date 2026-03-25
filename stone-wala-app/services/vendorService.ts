import { VENDOR_ENDPOINTS } from "@/constants/api";
import api from "./api";

// ── Dashboard ────────────────────────────────────────
export const getVendorDashboard = async () => {
  const res = await api.get(VENDOR_ENDPOINTS.DASHBOARD);
  return res.data;
};

// ── Profile ──────────────────────────────────────────
export const getVendorProfile = async () => {
  const res = await api.get(VENDOR_ENDPOINTS.PROFILE);
  return res.data;
};

export const updateVendorProfile = async (data: {
  firm_name: string;
  gst_number: string;
  tier: "Godown" | "Factory" | "Stone Seller";
  logo_url?: string;
  whatsapp?: string;
  email?: string;
  location?: string;
  about?: string;
  facebook?: string;
  instagram?: string;
  website?: string;
}) => {
  const res = await api.patch(VENDOR_ENDPOINTS.UPDATE_PROFILE, data);
  return res.data;
};

// ── Products ─────────────────────────────────────────
export const getMyProducts = async () => {
  const res = await api.get(VENDOR_ENDPOINTS.MY_PRODUCTS);
  return res.data;
};
// ✅ Vendor ka apna endpoint — status sahi aayega
export const getProductById = async (id: number) => {
  const res = await api.get(`/products/vendor/${id}`);
  return res.data;
};
// ── Delete Product ───────────────────────────────────
export const deleteProduct = async (id: number) => {
  const res = await api.delete(`/products/${id}`);
  return res.data;
};