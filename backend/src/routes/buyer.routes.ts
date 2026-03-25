import { Router } from "express";
import { initiateGuestPayment, checkAccessStatus } from "../controllers/buyer.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

/**
 * @route   POST /api/buyer/pay-unlock
 * @desc    Submit QR Payment transaction ID
 * @access  Private (Guest Only)
 */
router.post(
  "/pay-unlock", 
  requireAuth, 
  requireRole(["guest"]), 
  initiateGuestPayment
);

/**
 * @route   GET /api/buyer/status
 * @desc    Check if payment is verified or pending
 * @access  Private (Guest Only)
 */
router.get(
  "/status", 
  requireAuth, 
  requireRole(["guest"]), 
  checkAccessStatus
);

export default router;