import { Router } from "express";
import { 
  addServiceType, getAllTypes, deleteServiceType,
  addServiceProvider, getGroupedProviders, updateProvider, deleteProvider
} from "../controllers/service.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { upload } from "../config/multer.config";

const router = Router();

// --- TYPE ROUTES ---
router.post("/types", requireAuth, requireRole(['admin']), addServiceType);
router.get("/types", getAllTypes); // Public
router.delete("/types/:id", requireAuth, requireRole(['admin']), deleteServiceType);

// --- PROVIDER ROUTES ---
router.post("/providers", requireAuth, requireRole(['admin']), upload.single('image'), addServiceProvider);
router.get("/providers", getGroupedProviders); // Public & Grouped
router.patch("/providers/:id", requireAuth, requireRole(['admin']), upload.single('image'), updateProvider);
router.delete("/providers/:id", requireAuth, requireRole(['admin']), deleteProvider);

export default router;