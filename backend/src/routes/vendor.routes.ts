import { Router } from "express";
import {
  registerVendor,
  updateVendorProfile,
  getSubscriptionPlans,
  getVendorDashboard,
  getVendorProfile,
  uploadVendorLogo,
} from "../controllers/vendor.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { upload } from "../config/multer.config";

const router = Router();
const vendorAuth = [requireAuth, requireRole(["vendor"])];

// ── Public ──────────────────────────────────────────
router.post("/register", registerVendor);
router.get("/subscription/plans", ...vendorAuth, getSubscriptionPlans);

// ── Protected ────────────────────────────────────────
router.get("/dashboard",     ...vendorAuth, getVendorDashboard);
router.get("/profile",       ...vendorAuth, getVendorProfile);
router.patch("/profile",     ...vendorAuth, updateVendorProfile);
router.post("/profile/logo", ...vendorAuth, upload.single("logo"), uploadVendorLogo);

export default router;