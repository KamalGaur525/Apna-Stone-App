import { Router } from "express";
import { getActivePlans, updatePlanPrice } from "../controllers/plan.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();
 
router.get("/", getActivePlans);
 
router.patch("/:plan_type", requireAuth, requireRole(['admin']), updatePlanPrice);

export default router;