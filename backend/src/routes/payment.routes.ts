import { Router } from "express";
import { 
    submitPayment, 
    verifyPayment 
} from "../controllers/payment.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

/**
 * --- Phase 10: Payment & Marketplace Unlock Routes ---
 */

// 1. Submit Payment (Guest Only)
// Guest apni ₹500 ki transaction ID yahan bhejega
router.post(
    "/submit", 
    requireAuth, 
    requireRole(['guest']), 
    submitPayment
);

// 2. Verify Payment (Admin Only)
// Admin Transaction ID check karke status 'paid' ya 'rejected' karega
// :guest_id is the primary key (id) from the guests table
router.patch(
    "/verify/:guest_id", 
    requireAuth, 
    requireRole(['admin']), 
    verifyPayment
);

export default router;