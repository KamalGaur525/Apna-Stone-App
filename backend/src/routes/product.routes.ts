import { Router } from "express";
import { 
  getAllProducts, 
  getProductDetails,
  addProduct,
  getMyProducts,
  updateProduct,
  getVendorProductById,
  deleteProduct
} from "../controllers/product.controller";
import { requireAuth, checkMarketplaceAccess, requireRole } from "../middleware/auth.middleware";
import { upload } from "../config/multer.config"; // Multer import kiya

const router = Router();

// ==============================================================
// 1. VENDOR DASHBOARD ROUTES (Product Management)
// ==============================================================

/**
 * @route   GET /api/products/me
 * @desc    Vendor apne khud ke products dekhega
 * @note    Ye route /:id se pehle aana zaruri hai
 */
router.get(
  "/me",
  requireAuth,
  requireRole(['vendor']),
  getMyProducts
);

/**
 * @route   POST /api/products
 * @desc    Vendor naya product add karega (with image & video)
 */
router.post(
  "/",
  requireAuth,
  requireRole(['vendor']),
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]),
  addProduct
); 
router.get(
  "/vendor/:id",
  requireAuth,
  requireRole(["vendor"]),
  getVendorProductById
);
/**
 * @route   PUT /api/products/:id
 * @desc    Vendor apna product update karega (with optional new image/video)
 */
router.put(
  "/:id",
  requireAuth,
  requireRole(['vendor']),
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]),
  updateProduct
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Vendor apna product delete karega (Soft delete)
 */
router.delete(
  "/:id",
  requireAuth,
  requireRole(['vendor']),
  deleteProduct
);

// ==============================================================
// 2. MARKETPLACE ROUTES (Guests / Buyers)
// ==============================================================

/**
 * @route   GET /api/products
 * @desc    Marketplace list dekhne ke liye (Approved only)
 */
router.get(
  "/", 
  requireAuth,            // 1. Check karo user logged in hai ya nahi
  // checkMarketplaceAccess, // 2. Check karo Guest ne ₹500 diye hain ya nahi
  getAllProducts
);

/**
 * @route   GET /api/products/:id
 * @desc    Ek product ki poori detail dekhne ke liye
 */
router.get(
  "/:id", 
  requireAuth, 
  // checkMarketplaceAccess, 
  getProductDetails
);

export default router;