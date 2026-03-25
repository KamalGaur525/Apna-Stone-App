import { Router } from "express";
import {
  getGuestHome,
  searchGuest,
  getFirmDetail,
  getCategoryProducts,
  getAllFirms,
} from "../controllers/guest.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

const guestAuth = [requireAuth, requireRole(["guest"])];

// ── Home ─────────────────────────────────────────────
router.get("/home", ...guestAuth, getGuestHome);

// ── Search ───────────────────────────────────────────
router.get("/search", ...guestAuth, searchGuest);

// ── Firm Detail ──────────────────────────────────────
router.get("/firm/:id", ...guestAuth, getFirmDetail);

// ── Category Products ────────────────────────────────
router.get("/category/:id", ...guestAuth, getCategoryProducts);
router.get("/firms", ...guestAuth, getAllFirms);

export default router;