const BASE_URL = 'http://localhost:5000/api';

export const API = {
  // ── Auth (Fixed: Removed /auth as your routes are directly under /admin) ──
  ADMIN_LOGIN:       `${BASE_URL}/admin/login`,
  ADMIN_VERIFY_OTP:  `${BASE_URL}/admin/verify-otp`,

  // ── Dashboard (Fixed: Mapped to /stats) ──
  DASHBOARD:         `${BASE_URL}/admin/stats`,

  // ── Products (Fixed: Added Pending & Review separately) ──
  PRODUCTS_PENDING:  `${BASE_URL}/admin/products/pending`,
  PRODUCTS_REVIEW:   `${BASE_URL}/admin/products/review`,
  // Backend expects PATCH /api/admin/products/:id/status
  PRODUCT_UPDATE_STATUS: (id: number) => `${BASE_URL}/admin/products/${id}/status`,

  // ── Vendors (Fixed: Mapped to /toggle) ──
  VENDORS:           `${BASE_URL}/admin/vendors`,
  VENDOR_TOGGLE:     (id: number) => `${BASE_URL}/admin/admin/vendors/${id}/toggle`,

  // ── Guests (Fixed: Mapped to /toggle) ──
  GUESTS:            `${BASE_URL}/admin/guests`,
  GUEST_TOGGLE:      (id: number) => `${BASE_URL}/admin/guests/${id}/toggle`,

  // ── Payments (Fixed: Sync with your backend params) ──
  PAYMENTS_PENDING:      `${BASE_URL}/admin/payments/pending`,
  GUEST_PAYMENT_APPROVE: (id: number) => `${BASE_URL}/admin/guests/${id}/approve`,
} as const;