// backend/src/routes/subscription.routes.ts
import { Router } from "express";
import {
  getPlans,
  initiatePurchase,
  completePurchase,
  getMyPlan,
  getTransactionHistory
} from "../controllers/subscription.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

// GET  /api/subscriptions/plans      — role-based plans (vendor/guest)
router.get("/plans", requireAuth, requireRole(["vendor", "guest"]), getPlans);

// POST /api/subscriptions/initiate   — create Razorpay order
router.post("/initiate", requireAuth, requireRole(["vendor", "guest"]), initiatePurchase);

// POST /api/subscriptions/purchase   — verify + complete payment
router.post("/purchase", requireAuth, requireRole(["vendor", "guest"]), completePurchase);

// GET  /api/subscriptions/my-plan    — current active plan
router.get("/my-plan", requireAuth, requireRole(["vendor", "guest"]), getMyPlan);

router.get("/history", requireAuth, requireRole(["vendor", "guest"]), getTransactionHistory);

export default router;