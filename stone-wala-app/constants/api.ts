import Constants from "expo-constants";

 
const BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ?? "http://192.168.1.3:5000/api";

export const API_CONFIG = {
  BASE_URL,
  TIMEOUT: 10000,
};

// ── Auth ────────────────────────────────────────────────
export const AUTH_ENDPOINTS = {
  // Vendor
  GST_CHECK: "/auth/vendor/check-gst",
  GST_VERIFY_OTP: "/auth/vendor/verify-otp",
  VENDOR_REGISTER: "/auth/vendor/register",
  VENDOR_REGISTER_VERIFY_OTP: "/auth/vendor/register/verify-otp",

  // Guest
  GUEST_LOGIN: "/auth/guest/send-otp",
  GUEST_VERIFY_OTP: "/auth/guest/verify-otp",
   GUEST_SAVE_PROFILE: "/auth/guest/save-profile",
};

// ── Vendor ──────────────────────────────────────────────
export const VENDOR_ENDPOINTS = {
  DASHBOARD: "/vendor/dashboard",
  PROFILE: "/vendor/profile",
  UPDATE_PROFILE: "/vendor/profile",  
  UPLOAD_PRODUCT: "/products",      
  MY_PRODUCTS: "/products/me",
  UPLOAD_LOGO: "/vendor/profile/logo",
  SUBSCRIPTION_PLANS: "/vendor/subscription/plans",
  BUY_SUBSCRIPTION: "/vendor/subscription/buy",
};

// ── Guest ───────────────────────────────────────────────
export const GUEST_ENDPOINTS = {
  HOME: "/guest/home",
  SEARCH: "/guest/search",
  FIRM_DETAIL: "/guest/firm",
  CATEGORY_PRODUCTS: "/guest/category",
  SERVICES: "/guest/services",
};

// ── Category ────────────────────────────────────────────
export const CATEGORY_ENDPOINTS = {
  ALL: "/categories",
  PARENT: "/categories/parent",
  CHILD: "/categories/child",
};

// ── Admin ───────────────────────────────────────────────
export const ADMIN_ENDPOINTS = {
  LOGIN: "/admin/login",
  DASHBOARD_STATS: "/admin/dashboard",
  REVIEW_PRODUCTS: "/admin/products/review",
  APPROVE_PRODUCT: "/admin/products/approve",
  REJECT_PRODUCT: "/admin/products/reject",
};

// ── Payment (Future) ────────────────────────────────────
export const PAYMENT_ENDPOINTS = {
  CREATE_ORDER: "/payment/create-order",
  VERIFY_PAYMENT: "/payment/verify",
};

// ── Visualizer ──────────────────────────────────────────
export const VISUALIZER_ENDPOINTS = {
  GENERATE: "/visualizer/generate",
};