import { Router } from "express";
import {
  adminLogin,
  verifyAdminOtp,
  getDashboardStats,
  getPendingProducts,
  getReviewProducts,
  updateProductStatus,
  getAllVendors,
  toggleVendorStatus,
  getAllGuests,
  toggleGuestStatus,
  getPendingPayments,
  approveGuestPayment,
} from "../controllers/admin.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

// ── Public Routes ───────────────────────────────────────
router.post("/login", adminLogin);
router.post("/verify-otp", verifyAdminOtp);

// ── Protected Routes ────────────────────────────────────
const adminAuth = [requireAuth, requireRole(["admin"])];

// Dashboard
router.get("/stats", ...adminAuth, getDashboardStats);

// Product Management
router.get("/products/pending", ...adminAuth, getPendingProducts);
router.get("/products/review", ...adminAuth, getReviewProducts);
router.patch("/products/:id/status", ...adminAuth, updateProductStatus);

// Vendor Management
router.get("/vendors", ...adminAuth, getAllVendors);
router.patch("/vendors/:user_id/toggle", ...adminAuth, toggleVendorStatus);

// Guest Management
router.get("/guests", ...adminAuth, getAllGuests);
router.patch("/guests/:user_id/toggle", ...adminAuth, toggleGuestStatus);

// Payment Management
router.get("/payments/pending", ...adminAuth, getPendingPayments);
router.patch("/guests/:guest_user_id/approve", ...adminAuth, approveGuestPayment);

export default router;