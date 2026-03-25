import { Router } from "express";
import { getCategories, addCategory, updateCategory, deleteCategory } from "../controllers/category.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

/**
 * --- Phase 9: Category Management Routes ---
 */

// 1. Get Categories (Public Route)
// Sabhi users (Guest, Vendor, Admin) ko dropdowns ke liye categories chahiye hoti hain.
// Query Params Support: ?parent_id=5
router.get("/", getCategories);

// 2. Add New Category (Protected Route)
// Sirf Admin hi nayi categories ya sub-categories create kar sakta hai.
router.post(
    "/", 
    requireAuth, 
    requireRole(['admin']), 
    addCategory
);

router.patch("/:id", requireAuth, requireRole(['admin']), updateCategory);
router.delete("/:id", requireAuth, requireRole(['admin']), deleteCategory);

export default router;