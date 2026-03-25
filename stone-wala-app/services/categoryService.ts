import { CATEGORY_ENDPOINTS } from "@/constants/api";
import api from "./api";

// ── All Categories ───────────────────────────────────
export const getAllCategories = async () => {
  const res = await api.get(CATEGORY_ENDPOINTS.ALL);
  return res.data;
};

// ── Parent Categories only ───────────────────────────
export const getParentCategories = async () => {
  const res = await api.get(CATEGORY_ENDPOINTS.ALL, {
    params: { parent_id: null },
  });
  return res.data;
};

// ── Child Categories by parent_id ────────────────────
export const getChildCategories = async (parentId: number) => {
  const res = await api.get(CATEGORY_ENDPOINTS.ALL, {
    params: { parent_id: parentId },
  });
  return res.data;
};