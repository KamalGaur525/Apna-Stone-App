import { Router } from "express";
import {
  sendGuestOtp,
  verifyGuestOtp,
  checkGstAndSendOtp,
  verifyVendorOtp,
  registerVendor,
  saveGuestProfile,
  verifyVendorRegisterOtp,
} from "../controllers/auth.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
const router = Router();

// ================= GUEST ROUTES =================
router.post("/guest/send-otp", sendGuestOtp);
router.post("/guest/verify-otp", verifyGuestOtp);
router.post("/guest/save-profile",requireAuth,requireRole(["guest"]),saveGuestProfile);

// ================= VENDOR LOGIN ROUTES =================
router.post("/vendor/check-gst", checkGstAndSendOtp);
router.post("/vendor/verify-otp", verifyVendorOtp);

// ================= VENDOR REGISTER ROUTES =================
router.post("/vendor/register", registerVendor);
router.post("/vendor/register/verify-otp", verifyVendorRegisterOtp);

export default router;